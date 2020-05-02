//MongoDB连接后，修改为真实的用户模型
/* const jsonwebtoken = require('jsonwebtoken'); */
const Answer = require('../models/answers');

class AnswersCtl {
    async find(ctx) {
        //数学计算，页数从1起，每页有>=1个项
        const { per_page = 2 } = ctx.query;    //每页默认有2项
        const page = Math.max(ctx.query.page * 1, 1) - 1;
        const perPage = Math.max(per_page * 1, 1); //js函数，选最大，防止per_page<=0
        const q = new RegExp(ctx.query.q);  //模糊搜索，mongoose提供的方法——正则表达式
        ctx.body = await Answer
            .find({ content: q, questionId: ctx.params.questionId })  //mongoose的or语法，接受数组并匹配其中的项
            .limit(perPage).skip(page * perPage);
    }
    async checkAnswerExist(ctx, next) {
        const answer = await Answer.findById(ctx.params.id).select('+answerer');  //加上了提问者
        if (!answer) { ctx.throw(404, '答案、回答不存在'); }
        //关于questionID的判断；对答案进行赞和踩的时候，路由里没有questionID，就会一直报错
        //if (ctx.params.questionId &&:只有路由里包含questionID（删改查答案）时才检查此逻辑
        if (ctx.params.questionId && answer.questionId !== ctx.params.questionId) {
            ctx.throw(404, '该问题下没有此答案');
        }
        ctx.state.answer = answer;  //把上面的answer传到ctx.state.answer,以供update()使用
        await next();
    }
    //用于查询特定问题
    async findById(ctx) {
        //默认为空字符串
        const { fields = '' } = ctx.query;
        const selectFields = fields.split(';').filter(f => f).map(f => ' +' + f).join('');
        const answer = await Answer.findById(ctx.params.id).select(selectFields).populate('answerer');
        ctx.body = answer;
    }
    //创建问题
    async create(ctx) {
        ctx.verifyParams({
            content: { type: 'string', required: true },
        })
        //const answer = await new Answer({ ...ctx.request.body, answerer: ctx.state.user._id,questionId:ctx.params.questionId }).save();
        //重构上面两行
        const answerer = ctx.state.user._id;
        const { questionId } = ctx.params;  //从路由参数上获取
        const answer = await new Answer({ ...ctx.request.body, answerer, questionId }).save();
        ctx.body = answer;
    }
    //验证是否是用户本人
    async checkAnswerer(ctx, next) {
        const { answer } = ctx.state;
        //answer.answerer类型是ObjectID
        if (answer.answerer.toString() !== ctx.state.user._id) { ctx.throw(403, '没有权限'); }
        await next();
    }
    async update(ctx) {
        ctx.verifyParams({
            content: { type: 'string', required: false },
        });
        //mongoose有个缺点：下面的answer好像返回的是更新之前的answer内容
        //const answer = await Answer.findByIdAndUpdate(ctx.params.id, ctx.request.body);
        await ctx.state.answer.update(ctx.request.body);
        ctx.body = ctx.state.answer;
    }
    async delete(ctx) {
        //find()里是限定条件，即获取的用户的关注列表必须有A用户的ID（mongoose方法）
        await Answer.findByIdAndRemove(ctx.params.id);
        ctx.status = ctx.throw(204,'已删除');
    }
}

module.exports = new AnswersCtl();