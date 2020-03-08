const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//tạo Schema
const permSchema = new Schema({
    name: {
      type: String,
      required: true
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
})
module.exports = Perm = mongoose.model('Perm', permSchema);