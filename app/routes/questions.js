//const jsonwebtoken = require('jsonwebtoken');
const jwt = require('koa-jwt');
const Router = require('koa-router');
const router = new Router({ prefix: '/questions' });
const { find, findById, create, update, delete: del, checkQuestionExist, checkQuestioner,
} = require('../controllers/questions');

//引入秘钥，验证是否被篡改过
const { secret } = require('../config');

//认证中间件:解析token（），并从中获取用户信息
//认证中间件通过koa-jwt生成
const auth = jwt({ secret });

router.get('/', find);

router.post('/', auth, create); //创建问题需要权限

router.get('/:id', checkQuestionExist, findById);

router.patch('/:id', auth, checkQuestionExist, checkQuestioner, update);   //patch是更改所需更改的
router.delete('/:id', auth, checkQuestionExist, checkQuestioner, del);

module.exports = router;