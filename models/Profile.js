const mongoose = require('mongoose');
const  Schema  = mongoose.Schema;
const profileSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref:'User'
  },
  name: {
    type: mongoose.Schema.Types.String,
    ref: 'User'
  },
  fullname: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  birthday: {
    type: Date
  },
  status: {
    type: String
  },
  //các liên kết đến mạng xã hội
  social: {
    facebook: {
      type: String
    },
    zalo: {
      type: Number
    },
    twitter: {
      type: String
    },
    instagram: {
      type: String
    }
  },
  //học vấn
  education: [
    {
      school: {
        type: String,
        required: true
      },
      degree: {
        type: String,
        required: true
      },
      fieldofstudy: {
        type: String,
        required: true
      },
      from: {
        type: Date,
        required: true
      },
      to: {
        type: Date,
      },
      current: {
        type: String,
      },
      description: {
        type: String
      }
    }
  ]
});
module.exports = Profile = mongoose.model('Profile', profileSchema);