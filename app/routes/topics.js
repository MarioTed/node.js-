//const jsonwebtoken = require('jsonwebtoken');
const jwt = require('koa-jwt');
const Router = require('koa-router');
const router = new Router({ prefix: '/topics' });
const { find, findById, create, update, checkTopicExist,
    listTopicFollowers, listQuestions,
} = require('../controllers/topics');

//引入秘钥，验证是否被篡改过
const { secret } = require('../config');

//认证中间件:解析token（），并从中获取用户信息
//认证中间件通过koa-jwt生成
const auth = jwt({ secret });

router.get('/', find);

router.post('/', auth, create); //创建话题需要权限

router.get('/:id', checkTopicExist, findById);

router.patch('/:id', auth, checkTopicExist, update);   //patch是更改所需更改的

router.get('/:id/followers', checkTopicExist, listTopicFollowers);
router.get('/:id/questions', checkTopicExist, listQuestions);

module.exports = router;