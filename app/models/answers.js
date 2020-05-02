const mongoose = require('mongoose');
//提供了mongoose里边的一个类/方法Schema；用这个类可以生成各种各样的json/文档Schema
const { Schema, model } = mongoose;
//用类实例化出答案Schema
const answerSchema = new Schema({
    //_V是默认的
    __v: { type: Number, select: false },
    content: { type: String, required: true },
    /* answerer: { type: Schema.Types.ObjectId, ref: 'User', required: true }, */
    //回答者，引用User
    answerer: { type: Schema.Types.ObjectId, ref: 'User', required: true, select: false },
    questionId: { type: String, required: true },   //答案-问题是多对一的关系
    voteCount: { type: Number, required: true, default: 0 },    //记录赞的人数
}, { timestamps: true });

//用上面的Schema生成话题模型;使用mongoose的方法——model
module.exports = model('Answer', answerSchema); //topic集合的名称