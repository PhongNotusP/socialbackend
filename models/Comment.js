const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//tạo Schema
const commentSchema = new Schema({
//bình luận
    author: {
      type: Schema.Types.String,
      ref:'User'
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    text: {
      type: String,
      require: true
    },
    story: {
      type: Schema.Types.ObjectId,
      ref: 'Story'
    },
    likes: [
      { 
        type: Schema.Types.ObjectId, 
        ref: 'User' 
      }
    ],
    date: {
      type: Date,
      default: Date.now
    }
  })
  module.exports = Comment = mongoose.model('Comment', commentSchema);