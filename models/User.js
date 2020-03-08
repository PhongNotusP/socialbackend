const mongoose = require('mongoose');
//Khai báo hàm Schema của mongoose ở trên
const  Schema  = mongoose.Schema;
//Khởi tạo userSchema 
const userSchema = new Schema({
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    permission: {
        type: Schema.Types.String,
        ref :'Permission',
        default: 'null'
    },
    avatar: {
        type:String
    },
    stories: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Story'
        }
    ],
    //Những người có danh sách bạn bè
    friends: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    //Những người đã gửi lời mời kết bạn
    sentRequests: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    //Lời kết bạn đang chờ chấp nhận
    incommingRequests: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    groups: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Group'
        }
    ],
    groupSentRequests: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Group'
        }
    ],
    incommingGroupRequests :[
        {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    incommingEventRequests : [
        {
            type: Schema.Types.ObjectId,
            ref: 'Event'
        }
    ],
    userInviteEvent: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    // eventHasJoined: [
    //     {
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: 'Event'
    //     }
    // ],
    rooms: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Room'
        }
    ]
});
//Khởi tạo model User qua userSchema và gán biến const User
module.exports = User = mongoose.model('User', userSchema);