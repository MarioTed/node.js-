//MongoDB连接后，修改为真实的用户模型
/* const jsonwebtoken = require('jsonwebtoken'); */
const Comment = require('../models/comments');

class CommentsCtl {
    async find(ctx) {
        //数学计算，页数从1起，每页有>=1个项
        const { per_page = 2 } = ctx.query;    //每页默认有2项
        const page = Math.max(ctx.query.page * 1, 1) - 1;
        const perPage = Math.max(per_page * 1, 1); //js函数，选最大，防止per_page<=0
        const q = new RegExp(ctx.query.q);  //模糊搜索，mongoose提供的方法——正则表达式
        const { questionId, answerId } = ctx.params;    //从路由获取
        const { rootCommentId } = ctx.query;    //可选参数通常放到query;rootCommentID二级评论ID;公用一个接口
        ctx.body = await Comment
            .find({ content: q, questionId, answerId, rootCommentId })
            .limit(perPage).skip(page * perPage)
            .populate('commentator replyTo');   //获取评论者、回复者的详细信息，头像、名称等
    }
    async checkCommentExist(ctx, next) {
        const comment = await Comment.findById(ctx.params.id).select('+commentator');  //加上了评论者
        if (!comment) { ctx.throw(404, '评论不存在'); }
        //关于questionID的判断；对答案进行评论的时候，路由里没有questionID，就会一直报错
        //if (ctx.params.questionId &&:只有路由里包含questionID（删改查答案）时才检查此逻辑
        if (ctx.params.questionId && comment.questionId.toString() !== ctx.params.questionId) {
            ctx.throw(404, '该问题下没有此评论');
        }
        if (ctx.params.answerId && comment.answerId.toString() !== ctx.params.answerId) {
            ctx.throw(404, '该答案下没有此评论');
        }
        ctx.state.comment = comment;  //把上面的comment传到ctx.state.comment,以供update()使用
        await next();
    }
    //用于查询特定评论
    async findById(ctx) {
        //默认为空字符串
        const { fields = '' } = ctx.query;
        const selectFields = fields.split(';').filter(f => f).map(f => ' +' + f).join('');
        const comment = await Comment.findById(ctx.params.id).select(selectFields).populate('commentator');
        ctx.body = comment;
    }
    //创建问题
    async create(ctx) {
        ctx.verifyParams({
            content: { type: 'string', required: true },
            //创建二级评论，多加俩属性
            rootCommentId: { type: 'string', required: false },
            replyTo: { type: 'string', required: false },
        })
        //const comment = await new Comment({ ...ctx.request.body, commenter: ctx.state.user._id,questionId:ctx.params.questionId }).save();
        //重构上面一行
        const commentator = ctx.state.user._id;
        const { questionId, answerId } = ctx.params;  //从路由参数上获取
        const comment = await new Comment({ ...ctx.request.body, commentator, questionId, answerId }).save();
        ctx.body = comment;
    }
    //验证是否是用户本人
    async checkCommentator(ctx, next) {
        const { comment } = ctx.state;
        //comment.commenter类型是ObjectID
        if (comment.commentator.toString() !== ctx.state.user._id) { ctx.throw(403, '没有权限'); }
        await next();
    }
    async update(ctx) {
        ctx.verifyParams({
            content: { type: 'string', required: false },
        });
        //mongoose有个缺点：下面的comment好像返回的是更新之前的comment内容
        //const comment = await Comment.findByIdAndUpdate(ctx.params.id, ctx.request.body);
        const { content } = ctx.request.body;   //只允许更新content属性
        await ctx.state.comment.update({ content });
        ctx.body = ctx.state.comment;
    }
    async delete(ctx) {
        await Comment.findByIdAndRemove(ctx.params.id);
        ctx.status = ctx.throw(204, '已删除');
    }
}

module.exports = new CommentsCtl();