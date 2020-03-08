const mongoose = require('mongoose');
const Schema  = mongoose.Schema;

const groupSchema = new Schema({
  members: [
    { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    }
  ],
  owner:{ 
    type: mongoose.Schema.Types.String, 
    ref: 'User' 
  },
  stories: [
    {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Story' 
    }
  ],
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  },
  type: {
    type: Number,
    default: 0
  },
  incommingRequests: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  censoringStory: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Story'
    }
  ],
  censor: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
})

module.exports = Group = mongoose.model('Group', groupSchema);