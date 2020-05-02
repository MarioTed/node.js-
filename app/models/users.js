const mongoose = require('mongoose');
//提供了mongoose里边的一个类/方法Schema；用这个类可以生成各种各样的json/文档Schema
const { Schema, model } = mongoose;
//用类实例化出用户Schema
const userSchema = new Schema({
    //_V是默认的
    __v: { type: Number, select: false },
    name: { type: String, required: true },    //type为string后，会自动转换成str，required：true——必选
    age: { type: Number, required: false, default: 0 },
    password: { type: String, required: true, select: false },
    avatar_url: { type: String },
    gender: { type: String, enum: ['male', 'female'], default: 'male', required: true },    //性别用枚举数组来表示
    headline: { String },  //一句话介绍
    locations: { type: [{ type: Schema.Types.ObjectId, ref: 'Topic' }], select: false },
    business: { type: Schema.Types.ObjectId, ref: 'Topic', select: false }, //行业：暂且用string代替
    employments: {
        //数组里面是一个对象,直接写对象的字段
        type: [{
            company: { type: Schema.Types.ObjectId, ref: 'Topic' },
            job: { type: Schema.Types.ObjectId, ref: "Topic" },
        }],
        select: false,
    },
    educations: {
        type: [{
            school: { type: Schema.Types.ObjectId, ref: "Topic" },
            major: { type: Schema.Types.ObjectId, ref: "Topic" },
            diploma: { type: Number, enum: [1, 2, 3, 4, 5] },
            entrance_year: { type: Number },
            graduation_year: { type: Number },
        }],
        select: false,
    },
    following: {
        //Schema是从mongoose引入的一个对象;ref:引用，User和ObjectI'd一一对应；Id在以后还可以获取相应用户的信息
        type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        select: false,
    },
    followingTopics:{
        type:[{type:Schema.Types.ObjectId,ref:'Topic'}],
        select:false,
    },
    likingAnswers:{
        type:[{type:Schema.Types.ObjectId,ref:'Answer'}],
        select:false,
    },
    dislikingAnswers:{
        type:[{type:Schema.Types.ObjectId,ref:'Answer'}],
        select:false,
    },
    //收藏答案
    collectingAnswers:{
        type:[{type:Schema.Types.ObjectId,ref:'Answer'}],
        select:false,
    },
}, { timestamps: true });

//用上面的Schema生成用户模型;使用mongoose的方法——model
module.exports = model('User', userSchema); //User集合的名称