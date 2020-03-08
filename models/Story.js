const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const storySchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  author: {
    type: Schema.Types.String,
    ref: "User"
  },
  group: {
    type: Schema.Types.ObjectId,
    ref: "Group",
    default: null
  },
  event: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
    default: null
  },
  text: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  image: {
    type: String,
    required: false
  },
  extension: {
    type: Boolean,
    default: false
  },
  fileName: {
    type: String,
    default: 'No name'
  },
  likes: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  comments: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Comment'
    }
  ]
})
module.exports = Story = mongoose.model('Story', storySchema);