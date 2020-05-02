const mongoose = require('mongoose');
//提供了mongoose里边的一个类/方法Schema；用这个类可以生成各种各样的json/文档Schema
const { Schema, model } = mongoose;
//用类实例化出答案Schema
const commentSchema = new Schema({
    //_V是默认的
    __v: { type: Number, select: false },
    content: { type: String, required: true },
    //评论者，引用User
    commentator: { type: Schema.Types.ObjectId, ref: 'User', required: true, select: false },
    questionId: { type: String, required: true },   //评论属于哪个问题
    answerId: { type: String, required: true },     //评论属于哪个答案
    rootCommentId: { type: String, required: false },   //非必选，一级评论没有该属性
    replyTo: { type: Schema.Types.ObjectId, ref: 'User', required: false }, //同非必选

}, { timestamps: true });   //传统情况下在创建和更新添加日期；mongoose提供了时间戳这个参数，很方便的解决了此问题

//用上面的Schema生成话题模型;使用mongoose的方法——model
module.exports = model('Comment', commentSchema); //topic集合的名称