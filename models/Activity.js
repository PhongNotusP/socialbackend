const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const activitySchema = new Schema({
  likes: [
    {
      linkstory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Story'
      },
      linkpage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Page'
      },
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  ],
  comments: [
    {
      link: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Story'
      },
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'User'
      },
      text:
      {
        type: mongoose.Schema.Types.ObjectId,
        ref:'Comment'
      }
    }
  ],
  share : [
    {
      link: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Story'
      },
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'User'
      },
    }
  ]
})
module.exports = Activity = mongoose.model('Activity', activitySchema);