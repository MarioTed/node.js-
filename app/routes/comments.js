//const jsonwebtoken = require('jsonwebtoken');
const jwt = require('koa-jwt');
const Router = require('koa-router');
//三级嵌套
const router = new Router({ prefix: '/questions/:questionId/answers/:answerId/comments' });
const { find, findById, create, update, delete: del, checkCommentExist, checkCommentator,
} = require('../controllers/comments');

//引入秘钥，验证是否被篡改过
const { secret } = require('../config');

//认证中间件:解析token（），并从中获取用户信息
//认证中间件通过koa-jwt生成
const auth = jwt({ secret });

router.get('/', find);

router.post('/', auth, create); //创建问题需要权限

router.get('/:id', checkCommentExist, findById);

router.patch('/:id', auth, checkCommentExist, checkCommentator, update);   //patch是更改所需更改的
router.delete('/:id', auth, checkCommentExist, checkCommentator, del);

module.exports = router;