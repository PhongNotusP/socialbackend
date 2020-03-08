const mongoose = require('mongoose');
const Schema  = mongoose.Schema;

const eventSchema = new Schema({
  invited: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  care: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  participants: [
    { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    }
  ],
  // nonParticipants: [
  //   {
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: 'User'
  //   }
  // ],
  owner:
    { 
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
  introduction: {
    type: String
  },
  location: {
    type: String
  },
  // IsGroupEvent: {
  //   type: Number,
  //   default: 0
  // },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  }
})

module.exports = Event = mongoose.model('Event', eventSchema);