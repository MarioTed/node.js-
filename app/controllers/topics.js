//MongoDB连接后，修改为真实的用户模型
/* const jsonwebtoken = require('jsonwebtoken'); */
const Topic = require('../models/topics');
const User = require('../models/users');
const Question = require('../models/questions');

class TopicsCtl {
    async find(ctx) {
        //数学计算，页数从1起，每页有>=1个项
        const { per_page = 2 } = ctx.query;    //每页默认有2项
        const page = Math.max(ctx.query.page * 1, 1) - 1;
        const perPage = Math.max(per_page * 1, 1); //js函数，选最大，防止per_page<=0
        ctx.body = await Topic
            .find({ name: new RegExp(ctx.query.q) })  //模糊搜索，mongoose提供的方法——正则表达式
            .limit(perPage).skip(page * perPage);
    }
    async checkTopicExist(ctx, next) {
        const topic = await Topic.findById(ctx.params.id);
        if (!topic) { ctx.throw(404, '话题不存在'); }
        await next();
    }
    //用于查询特定话题
    async findById(ctx) {
        //默认为空字符串
        const { fields = '' } = ctx.query;
        const selectFields = fields.split(';').filter(f => f).map(f => ' +' + f).join('');
        const topic = await Topic.findById(ctx.params.id).select(selectFields);
        ctx.body = topic;
    }
    //创建话题
    async create(ctx) {
        ctx.verifyParams({
            name: { type: 'string', required: true },
            avatar_url: { type: 'string', required: false },
            introduction: { type: 'string', required: false },
        })
        const topic = await new Topic(ctx.request.body).save();
        ctx.body = topic;
    }
    async update(ctx) {
        ctx.verifyParams({
            name: { type: 'string', required: false },
            avatar_url: { type: 'string', required: false },
            introduction: { type: 'string', required: false },
        });
        //mongoose有个缺点：下面的topic好像返回的是更新之前的topic内容
        const topic = await Topic.findByIdAndUpdate(ctx.params.id, ctx.request.body);
        ctx.body = topic;
    }
    //获取A话题的关注者的列表及其信息
    async listTopicFollowers(ctx) {
        //find()里是限定条件，即获取的用户的关注列表必须有A用户的ID（mongoose方法）
        const users = await User.find({ followingTopics: ctx.params.id });
        ctx.body = users;
    }
    //列出话题下的所有问题
    async listQuestions(ctx) {
        const questions = await Question.find({ topics: ctx.params.id });
        ctx.body = questions;
    }
}

module.exports = new TopicsCtl();