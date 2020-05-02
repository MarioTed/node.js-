const Koa = require('koa');
const KoaBody = require('koa-body');
const KoaStatic = require('koa-static');
const error = require('koa-json-error');    //引用koa-json-error,错误处理
const parameter = require('koa-parameter');
const mongoose = require('mongoose');
const path = require('path');
const app = new Koa();
const routing = require('./routes');
//导入连接字符串
const { connectionStr } = require('./config');

//mongoose提供了一个方法来连接MongoDB;
mongoose.connect(connectionStr, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}, () => console.log('MongoDB 连接成功了！'));
//出错时，打印错误信息；connection.on监听错误方法
mongoose.connection.on('error', console.error);
//编写错误处理的中间件,写在最前面
//参数ctx：上下文，设置状态码、返回体；next:后面的中间件
//404错误不用走中间件
//自定义中间件会捕获运行、手动抛出的信息，
//NODE_ENV环境变量名
//引入KOa-static，生成图片的链接
app.use(KoaStatic(path.join(__dirname,'public')));
app.use(error({
    postFormat: (e, { stack, ...rest }) => process.env.NODE_ENV === 'production' ? rest : { stack, ...rest }
}));   //error()是koa-json-error的方法
//koa-body中间件
app.use(KoaBody({
    multipart: true,  //启用文件，支持文件格式
    //node的npm包，koabody引用此包
    formidable: {
        uploadDir: path.join(__dirname, '/public/uploads'),
        keepExtensions: true,  //保留拓展名
    }
}));
app.use(parameter(app));    //此中间件可在上下文中加上方法校验
routing(app);

app.listen(3000, () => console.log('程序启动在3000端口了'));