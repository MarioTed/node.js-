//MongoDB连接后，修改为真实的用户模型
/* const jsonwebtoken = require('jsonwebtoken'); */
const Question = require('../models/questions');

class QuestionsCtl {
    async find(ctx) {
        //数学计算，页数从1起，每页有>=1个项
        const { per_page = 2 } = ctx.query;    //每页默认有2项
        const page = Math.max(ctx.query.page * 1, 1) - 1;
        const perPage = Math.max(per_page * 1, 1); //js函数，选最大，防止per_page<=0
        const q = new RegExp(ctx.query.q);  //模糊搜索，mongoose提供的方法——正则表达式
        ctx.body = await Question
            .find({ $or: [{ title: q }, { description: q }] })  //mongoose的or语法，接受数组并匹配其中的项
            .limit(perPage).skip(page * perPage);
    }
    async checkQuestionExist(ctx, next) {
        const question = await Question.findById(ctx.params.id).select('+questioner');  //加上了提问者
        if (!question) { ctx.throw(404, '问题不存在'); }
        ctx.state.question = question;  //把上面的question传到ctx.state.question,以供update()使用
        await next();
    }
    //用于查询特定问题
    async findById(ctx) {
        //默认为空字符串
        const { fields = '' } = ctx.query;
        const selectFields = fields.split(';').filter(f => f).map(f => ' +' + f).join('');
        const question = await Question.findById(ctx.params.id).select(selectFields).populate('questioner topics');
        ctx.body = question;
    }
    //创建问题
    async create(ctx) {
        ctx.verifyParams({
            title: { type: 'string', required: true },
            description: { type: 'string', required: false },
        })
        const question = await new Question({ ...ctx.request.body, questioner: ctx.state.user._id }).save();
        ctx.body = question;
    }
    //验证是否是用户本人
    async checkQuestioner(ctx, next) {
        const { question } = ctx.state;
        //question.questioner类型是ObjectID
        if (question.questioner.toString() !== ctx.state.user._id) { ctx.throw(403, '没有权限'); }
        await next();
    }
    async update(ctx) {
        ctx.verifyParams({
            title: { type: 'string', required: false },
            description: { type: 'string', required: false },
        });
        //mongoose有个缺点：下面的question好像返回的是更新之前的question内容
        //const question = await Question.findByIdAndUpdate(ctx.params.id, ctx.request.body);
        await ctx.state.question.update(ctx.request.body);
        ctx.body = ctx.state.question;
    }
    //获取A话题的关注者的列表及其信息
    async delete(ctx) {
        //find()里是限定条件，即获取的用户的关注列表必须有A用户的ID（mongoose方法）
        await Question.findByIdAndRemove(ctx.params.id);
        ctx.status = 204;
    }
}

module.exports = new QuestionsCtl();