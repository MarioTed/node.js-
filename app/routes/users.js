//const jsonwebtoken = require('jsonwebtoken');
const jwt = require('koa-jwt');
const Router = require('koa-router');
const router = new Router({ prefix: '/users' });
const { find, findById, create, update,
    delete: del, login, checkOwner, listFollowing,
    checkOwnerExist, follow, unfollow, listFollowers, followTopic,
    unfollowTopic, listFollowingTopics, listQuestions,
    listLikingAnswers, likeAnswer, unlikeAnswer,
    listDislikingAnswers, dislikeAnswer, undislikeAnswer,
    listCollectingAnswers, collectAnswer, uncollectAnswer,
} = require('../controllers/users');

const { checkTopicExist } = require('../controllers/topics');
const { checkAnswerExist } = require('../controllers/answers');

//引入秘钥，验证是否被篡改过
const { secret } = require('../config');

//认证中间件:解析token（），并从中获取用户信息
//认证中间件通过koa-jwt生成
const auth = jwt({ secret });
/* const auth = async (ctx, next) => {
    const { authorization = '' } = ctx.request.header;
    const token = authorization.replace('Bearer ', '');
    //利用try...catch...将所有报错定为401错误:未认证
    try {
        const user = jsonwebtoken.verify(token, secret);
        ctx.state.user = user;  //约定俗成，通常放用户信息
    } catch (err) {
        ctx.throw(401, err.message);
    }
    await next();

}
 */

router.get('/', find);

router.post('/', create);

router.get('/:id', findById);

router.patch('/:id', auth, checkOwner, update);   //patch是更改所需更改的

router.delete('/:id', auth, checkOwner, del);   //先认证，后授权

router.post('/login', login);

router.get('/:id/following', listFollowing);
router.get('/:id/followers', listFollowers);

//auth:要知道你是谁，然后才能在你的following下面添加id
router.put('/following/:id', auth, checkOwnerExist, follow);    //判断是否登录、ID存在，然后执行正常逻辑
router.delete('/following/:id', auth, checkOwnerExist, unfollow);
//关于话题
router.get('/:id/followingTopics', listFollowingTopics);
router.put('/followingTopics/:id', auth, checkTopicExist, followTopic);
router.delete('/followingTopics/:id', auth, checkTopicExist, unfollowTopic);

router.get('/:id/questions', listQuestions);
//关于赞
router.get('/:id/likingAnswers', listLikingAnswers);
router.put('/likingAnswers/:id', auth, checkAnswerExist, likeAnswer, undislikeAnswer);//undislikeAnswer,赞之后取消踩
router.delete('/likingAnswers/:id', auth, checkAnswerExist, unlikeAnswer);
//关于踩
router.get('/:id/dislikingAnswers', listDislikingAnswers);
router.put('/dislikingAnswers/:id', auth, checkAnswerExist, dislikeAnswer, unlikeAnswer);//踩之后取消赞，保证赞、踩互斥
router.delete('/dislikingAnswers/:id', auth, checkAnswerExist, undislikeAnswer);
//关于收藏答案
router.get('/:id/collectingAnswers', listCollectingAnswers);
router.put('/collectingAnswers/:id', auth, checkAnswerExist, collectAnswer);
router.delete('/collectingAnswers/:id', auth, checkAnswerExist, uncollectAnswer);


module.exports = router;