const mongoose = require('mongoose');
const Schema  = mongoose.Schema;

const pageSchema = new Schema({
  likes: [
      { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
      }
  ],
  liketimes: {
    type: Number
  },
  owner: [
    { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    }
  ],
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = Page = mongoose.module('Page', pageSchema);