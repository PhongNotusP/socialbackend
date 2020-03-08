const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const messageSchema = new Schema({
  room: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Room' 
  },
  user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
  },
  message: {
      type: String,
      required: true
  }
});

module.exports = Message = mongoose.model('Message', messageSchema);