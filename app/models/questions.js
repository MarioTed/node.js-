const mongoose = require('mongoose');
//提供了mongoose里边的一个类/方法Schema；用这个类可以生成各种各样的json/文档Schema
const { Schema, model } = mongoose;
//用类实例化出问题Schema
//问题-用户是多对一的关系
const questionSchema = new Schema({
    //_V是默认的
    __v: { type: Number, select: false },
    title: { type: String, required: true },
    description: { type: String },
    //提问者本质上是一个问题的引用
    questioner: { type: Schema.Types.ObjectId, ref: 'User', required: true, select: false },
    //在问题下建话题：一个问题所属的话题正常情况下为个位数；而话题下面有N个问题
    topics:{
        type:[{type:Schema.Types.ObjectId,ref:'Topic'}],
        select:false,
    }
}, { timestamps: true });

//用上面的Schema生成话题模型;使用mongoose的方法——model
module.exports = model('Question', questionSchema); //topic集合的名称