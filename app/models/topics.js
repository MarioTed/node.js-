const mongoose = require('mongoose');
//提供了mongoose里边的一个类/方法Schema；用这个类可以生成各种各样的json/文档Schema
const { Schema, model } = mongoose;
//用类实例化出话题Schema
const topicSchema = new Schema({
    //_V是默认的
    __v: { type: Number, select: false },
    name: { type: String, required: true },
    avatar_url: { type: String, required: false },
    introduction: { type: String, select: false },
}, { timestamps: true });

//用上面的Schema生成话题模型;使用mongoose的方法——model
module.exports = model('Topic', topicSchema); //topic集合的名称