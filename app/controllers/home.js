const path = require('path');   //调用path模块的basename方法

class HomeCtl {
    index(ctx) {
        ctx.body = '<h1>这是主页</h1>';
    }
    upload(ctx) {
        const file = ctx.request.files.file;    //获取上传文件
        const basename = path.basename(file.path);    //接受绝对路径，返回basename
        ctx.body = { url:`${ctx.origin}/uploads/${basename}` }; //返回路径
    }
}

module.exports = new HomeCtl();