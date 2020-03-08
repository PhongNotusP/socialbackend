const mongoose = require('mongoose');
//Khai báo hàm Schema của mongoose ở trên
const Schema = mongoose.Schema;
//Khởi tạo userSchema 
const inforSchema = new Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    email: {
        type: mongoose.Schema.Types.String,
        ref: 'User'
    },
    name: {
        type: mongoose.Schema.Types.String,
        ref: 'User'
    },
    avatar: {
        type:String
    },
    //đăng bài viết, 1 người nhiều bài viết 
    stories: [
        {
            type: mongoose.Schema.Types.ObjectId,
            //Kết nối với model Story
            ref: 'Story'
        }
    ],
    //Những người có danh sách bạn bè
    friends: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    //Những người đã gửi lời mời kết bạn
    sentRequests: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    //Tin nhắn đang chờ chấp nhận
    incommingRequests: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    groups: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Group'
        }
    ],
    permission: [
        {
            type: mongoose.Schema.Types.String,
            ref: 'Permission'
        }
    ]
});
//Khởi tạo model User qua userSchema và gán biến const User
module.exports = Infor = mongoose.model('Infor', inforSchema);