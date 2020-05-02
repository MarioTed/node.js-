//MongoDB连接后，修改为真实的用户模型
const jsonwebtoken = require('jsonwebtoken');
const User = require('../models/users');
const Question = require('../models/questions');
const Answer = require('../models/answers');    //赞踩时，修改答案模型里的投票数
const { secret } = require('../config');
class UsersCtl {
    async find(ctx) {
        const { per_page = 2 } = ctx.query;
        const page = Math.max(ctx.query.page * 1, 1) - 1;
        const perPage = Math.max(per_page * 1, 1);
        ctx.body = await User
            .find({ name: new RegExp(ctx.query.q) })
            .limit(perPage).skip(perPage * page);/* .select('+password') */
    }
    async findById(ctx) {
        const { fields = '' } = ctx.query;   //获取查询字符串里面的参数
        const selectFields = fields.split(';').filter(f => f)
            .map(f => ' +' + f).join('');  //filter过滤掉了空字符串
        const populateStr = fields.split(';').filter(f => f).map(f => {
            if (f === 'employments') {
                return 'employments.company employments.job';
            }
            if (f === 'educations') {
                return 'educations.school educations.major';
            }
            return f;
        }).join(' ');
        const user = await User.findById(ctx.params.id).select(selectFields)
            .populate(populateStr);
        //populate()方法有select的作用，且优先级大于select；因此，populate()需要动态生成
        if (!user) { ctx.throw(404, '用户不存在'); }    //请求特定用户不存在的情况
        ctx.body = user;    //正常情况，返回用户

    }
    async create(ctx) {
        //koa-paramter校验
        //校验请求体的name为字符串类型
        //required:true提示此校验必选，当然默认也是true
        ctx.verifyParams({
            name: { type: 'string', required: true }, //必选
            age: { type: 'number', required: false },  //非必选
            password: { type: 'string', required: true },
        });
        const { name } = ctx.request.body;  //获取创建用户的name
        const repeatedUser = await User.findOne({ name });  //在数据库中查询是否已有该用户
        if (repeatedUser) { ctx.throw(409, '该用户已存在'); };  //409:冲突
        //new User:新建的对象;
        const user = await new User(ctx.request.body).save();
        ctx.body = user;
    }
    //授权中间件
    async checkOwner(ctx, next) {
        if (ctx.params.id !== ctx.state.user._id) { ctx.throw(403, '没有权限'); }
        await next();
    }
    async update(ctx) {
        //koa-paramter校验
        //校验请求体的name为字符串类型
        //required:true提示此校验必选，当然默认也是true
        //更新用户接口没有哪个字段是必选的，必选的字段一般放在路由参数上
        ctx.verifyParams({
            name: { type: 'string', required: false }, //必选
            age: { type: 'number', required: false },  //非必选
            password: { type: 'string', required: false },
            avatar_url: { type: 'string', required: false },
            gender: { type: 'string', required: false },
            headlin: { type: 'string', required: false },
            locations: { type: 'array', itemType: 'string', required: false },
            headlin: { type: 'string', required: false },
            employments: { type: 'array', itemType: 'object', required: false },
            educations: { type: 'array', itemType: 'object', required: false },
        });
        const user = await User.findByIdAndUpdate(ctx.params.id, ctx.request.body);
        if (!user) { ctx.throw(404, '用户不存在'); }
        ctx.body = user;
    }
    async delete(ctx) {
        const user = await User.findByIdAndRemove(ctx.params.id);
        if (!user) { ctx.throw(404, '用户不存在') }
        ctx.status = 204;
    }
    async login(ctx) {
        ctx.verifyParams({
            name: { type: 'string', required: true },
            password: { type: 'string', required: true },
        });
        const user = await User.findOne(ctx.request.body);
        if (!user) { ctx.throw(401, '用户名或密码不正确'); }
        const { _id, name } = user;
        const token = jsonwebtoken.sign({ _id, name }, secret, { expiresIn: '1d' });    //expiresIn过期时间
        ctx.body = { token };
    }
    //获取关注的人的列表及其信息
    async listFollowing(ctx) {
        const user = await User.findById(ctx.params.id).select('+following').populate('following');
        if (!user) { ctx.throw(404, '用户不存在'); }
        ctx.body = user.following;
    }
    //获取A用户的粉丝的列表及其信息
    async listFollowers(ctx) {
        //find()里是限定条件，即获取的用户的关注列表必须有A用户的ID（mongoose方法）
        const users = await User.find({ following: ctx.params.id });
        ctx.body = users;
    }
    //检查用户存在与否
    async checkOwnerExist(ctx, next) {
        const user = await User.findById(ctx.params.id);
        if (!user) { ctx.throw(404, '用户不存在'); }
        await next();
    }
    async follow(ctx) {
        //获取请求的Id
        const me = await User.findById(ctx.state.user._id).select('+following');
        //判断要添加的ID是否已经存在于关注列表；me.following的数据类型并非字符串，是mongoose自带的数据类型
        //map()，批量转
        if (!me.following.map(id => id.toString()).includes(ctx.params.id)) {
            me.following.push(ctx.params.id);   //将路由上的ID添加到用户的关注列表
            me.save();  //保存到数据库
        }
        ctx.status = 204;    //代表成功，但无内容返回
    }
    async unfollow(ctx) {
        //获取请求的Id
        const me = await User.findById(ctx.state.user._id).select('+following');
        //判断要添加的ID是否已经存在于关注列表；me.following的数据类型并非字符串，是mongoose自带的数据类型
        //map()，批量转
        //获取index：路由参数的ID
        const index = me.following.map(id => id.toString()).indexOf(ctx.params.id);
        //索引从0开始，
        if (index > -1) {
            me.following.splice(index, 1);   //删除索引，删除的个数为1
            me.save();
        }
        ctx.status = 204;    //代表成功，但无内容返回
    }
    async listFollowingTopics(ctx) {
        const user = await User.findById(ctx.params.id).select('+followingTopics').populate('followingTopics');
        if (!user) { ctx.throw(404); }
        ctx.body = user.followingTopics;
    }
    async followTopic(ctx) {
        //获取请求的Id
        const me = await User.findById(ctx.state.user._id).select('+followingTopics');
        //判断要添加的ID是否已经存在于关注列表；me.following的数据类型并非字符串，是mongoose自带的数据类型
        //map()，批量转
        if (!me.followingTopics.map(id => id.toString()).includes(ctx.params.id)) {
            me.followingTopics.push(ctx.params.id);   //将路由上的ID添加到用户的关注列表
            me.save();  //保存到数据库
        }
        ctx.status = 204;    //代表成功，但无内容返回
    }
    async unfollowTopic(ctx) {
        //获取请求的Id
        const me = await User.findById(ctx.state.user._id).select('+followingTopics');
        //判断要添加的ID是否已经存在于关注列表；me.following的数据类型并非字符串，是mongoose自带的数据类型
        //map()，批量转
        //获取index：路由参数的ID
        const index = me.followingTopics.map(id => id.toString()).indexOf(ctx.params.id);
        //索引从0开始，
        if (index > -1) {
            me.followingTopics.splice(index, 1);   //删除索引，删除的个数为1
            me.save();
        }
        ctx.status = 204;    //代表成功，但无内容返回
    }
    async listQuestions(ctx) {
        const questions = await Question.find({ questioner: ctx.params.id });  //提问者是路由上的ID，即指定的用户ID
        ctx.body = questions;
    }
    //接下三个是关于赞的控制器
    //列出喜欢的答案列表
    async listLikingAnswers(ctx) {
        const user = await User.findById(ctx.params.id).select('+likingAnswers').populate('likingAnswers');
        //populate()拿到具体数据
        if (!user) { ctx.throw(404); }
        ctx.body = user.likingAnswers;
    }
    async likeAnswer(ctx,next) {
        //获取请求的Id
        const me = await User.findById(ctx.state.user._id).select('+likingAnswers');
        //判断要添加的ID是否已经存在于关注列表；me.following的数据类型并非字符串，是mongoose自带的数据类型
        //map()，批量转
        //if一下，防止赞的列表出现重复数据
        if (!me.likingAnswers.map(id => id.toString()).includes(ctx.params.id)) {
            me.likingAnswers.push(ctx.params.id);   //将路由上的ID添加到用户的关注列表
            me.save();  //保存到数据库
            //修改答案的投票数,$inc increment;加一
            await Answer.findByIdAndUpdate(ctx.params.id, { $inc: { voteCount: 1 } });
        }
        ctx.status = 204;    //代表成功，但无内容返回
        await next();
    }
    async unlikeAnswer(ctx) {
        //获取请求的Id
        const me = await User.findById(ctx.state.user._id).select('+likingAnswers');
        //判断要添加的ID是否已经存在于关注列表；me.following的数据类型并非字符串，是mongoose自带的数据类型
        //map()，批量转
        //获取index：路由参数的ID
        const index = me.likingAnswers.map(id => id.toString()).indexOf(ctx.params.id);
        //索引从0开始，
        if (index > -1) {
            me.likingAnswers.splice(index, 1);   //删除索引，删除的个数为1
            me.save();
            //修改答案的投票数,$inc increment;减一
            await Answer.findByIdAndUpdate(ctx.params.id, { $inc: { voteCount: -1 } });
        }
        ctx.status = 204;    //代表成功，但无内容返回
    }
    //接下三个是关于踩的控制器
    //列出不喜欢的答案列表
    async listDislikingAnswers(ctx) {
        const user = await User.findById(ctx.params.id).select('+dislikingAnswers').populate('dislikingAnswers');
        //populate()拿到具体数据
        if (!user) { ctx.throw(404); }
        ctx.body = user.dislikingAnswers;
    }
    async dislikeAnswer(ctx,next) {
        //获取请求的Id
        const me = await User.findById(ctx.state.user._id).select('+dislikingAnswers');
        //判断要添加的ID是否已经存在于关注列表；me.following的数据类型并非字符串，是mongoose自带的数据类型
        //map()，批量转
        //if一下，防止赞的列表出现重复数据
        if (!me.dislikingAnswers.map(id => id.toString()).includes(ctx.params.id)) {
            me.dislikingAnswers.push(ctx.params.id);   //将路由上的ID添加到用户的关注列表
            me.save();  //保存到数据库
        }
        ctx.status = 204;    //代表成功，但无内容返回
        await next();
    }
    async undislikeAnswer(ctx) {
        //获取请求的Id
        const me = await User.findById(ctx.state.user._id).select('+dislikingAnswers');
        //判断要添加的ID是否已经存在于关注列表；me.following的数据类型并非字符串，是mongoose自带的数据类型
        //map()，批量转
        //获取index：路由参数的ID
        const index = me.dislikingAnswers.map(id => id.toString()).indexOf(ctx.params.id);
        //索引从0开始，
        if (index > -1) {
            me.dislikingAnswers.splice(index, 1);   //删除索引，删除的个数为1
            me.save();
        }
        ctx.status = 204;    //代表成功，但无内容返回
    }
    //接下三个是关于用户收藏答案的控制器
    //列出收藏的答案的列表
    async listCollectingAnswers(ctx) {
        const user = await User.findById(ctx.params.id).select('+collectingAnswers').populate('collectingAnswers');
        //populate()拿到具体数据
        if (!user) { ctx.throw(404); }
        ctx.body = user.collectingAnswers;
    }
    async collectAnswer(ctx,next) {
        //获取请求的Id
        const me = await User.findById(ctx.state.user._id).select('+collectingAnswers');
        //判断要添加的ID是否已经存在于收藏列表；me.following的数据类型并非字符串，是mongoose自带的数据类型
        //map()，批量转
        //if一下，防止收藏的列表出现重复数据
        if (!me.collectingAnswers.map(id => id.toString()).includes(ctx.params.id)) {
            me.collectingAnswers.push(ctx.params.id);   //将路由上的ID添加到用户的收藏列表
            me.save();  //保存到数据库
        }
        ctx.status = 204;    //代表成功，但无内容返回
        await next();
    }
    async uncollectAnswer(ctx) {
        //获取请求的Id
        const me = await User.findById(ctx.state.user._id).select('+collectingAnswers');
        //判断要添加的ID是否已经存在于收藏列表；me.following的数据类型并非字符串，是mongoose自带的数据类型
        //map()，批量转
        //获取index：路由参数的ID
        const index = me.collectingAnswers.map(id => id.toString()).indexOf(ctx.params.id);
        //索引从0开始，
        if (index > -1) {
            me.collectingAnswers.splice(index, 1);   //删除索引，删除的个数为1
            me.save();
        }
        ctx.status = 204;    //代表成功，但无内容返回
    }
}

module.exports = new UsersCtl();