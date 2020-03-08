const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const passport = require('passport');

const User = require('../../models/User');

const { checkObjectId } = require('../../utils/checkObjectId');
const { MyError } = require('../../utils/myError');

router.get('/user', passport.authenticate('jwt', {session: false}), (req, res) => {
  async function getAllUsers(idUser) {
    if (!idUser) {
      throw new MyError('Chưa đăng nhập', 400);
  }
  const { friends } = await User.findById(idUser, { friends: 1 }).populate('friends', { name: 'name', avatar: 'avatar' });
  const { sentRequests } = await User.findById(idUser, { sentRequests: 1 }).populate('sentRequests', { name: 'name', avatar: 'avatar' });
  const { incommingRequests } = await User.findById(idUser, { incommingRequests: 1 }).populate('incommingRequests', { name: 'name', avatar: 'avatar' });
  const knownUsers = friends.concat(sentRequests).concat(incommingRequests);
  const _idKnownUsers = knownUsers.map(u => u._id).concat(idUser);
  const otherUsers = await User.find({ _id: { $nin: _idKnownUsers } }, { name: 1, avatar: 1 })
  return { friends, sentRequests, incommingRequests, otherUsers };
}
  getAllUsers(req.user.id)
  .then(data => res.json({
    statusCode: 1,
    message: 'Lấy danh sách thành công',
    data: data
  }))
  .catch(err => res.json({
    statusCode: -1,
    message: err.message,
    data: 0
  }));
});

router.get('/', passport.authenticate('jwt', {session: false}), (req, res) => {
  async function getAllFriends(idUser) {
    if (!idUser) {
      throw new MyError('Chưa đăng nhập', 400);
    }
    const options = {
        new: true,
        fields: { friends: 1}
    }
    const { friends } = await User.findById(idUser, { friends: 1 }).populate('friends', { name: 'name', avatar: 'avatar' });
    return {friends};
  }
  getAllFriends(req.user.id)
  .then(data => res.json({
    statusCode: 1,
    message: 'Danh sách bạn',
    data: data
  }));
});

router.post('/add/:idReceiver', passport.authenticate('jwt', {session: false}), (req, res) => {
  async function addFriend(idSender, idReceiver) {
    checkObjectId(idSender, idReceiver);
    const queryObject = {
        _id: { $eq: idSender, $ne: idReceiver },
        friends: { $ne: idReceiver },
        sentRequests: { $ne: idReceiver },
        incommingRequests: { $ne: idReceiver },
    }
    const sender = await User.findOneAndUpdate(queryObject, { $push: { sentRequests: idReceiver } });
    if (!sender) throw new MyError('Không tìm thấy người dùng', 404);
    const options = {
        new: true,
        fields: { name: 1 }
    };
    const updateObject = { $push: { incommingRequests: idSender } };
    const receiver = await User.findByIdAndUpdate(idReceiver, updateObject, options);
    if (!receiver) throw new MyError('Không tìm thấy người dùng', 404);
    return receiver;
  }
  addFriend(req.user.id, req.params.idReceiver)
    .then(data => res.json({
      statusCode: 1,
      message: 'Gửi lời mời thành công',
      data: data
    }))
    .catch(err => res.json({
      statusCode: -1,
      message: err.message,
      data: 0
    }));
});

router.post('/accept/:idSender', passport.authenticate('jwt', {session: false}), (req, res) => {
  async function acceptFriendRequest(idReceiver, idSender) {
    checkObjectId(idSender, idReceiver);
    const queryObjectReceiver = {
        _id: idReceiver,
        incommingRequests: idSender
    };
    const updateObjectReceiver = {
        $pull: { incommingRequests: idSender },
        $push: { friends: idSender }
    };
    const receiver = await User.findOneAndUpdate(queryObjectReceiver, updateObjectReceiver);
    if (!receiver) throw new MyError('Không tìm thấy người dùng', 404);
    const queryObjectSender = {
        _id: idSender,
        sentRequests: idReceiver
    };
    const updateObjectSender = {
        $pull: { sentRequests: idReceiver },
        $push: { friends: idReceiver }
    };
    const options = {
        new: true,
        fields: { name: 1 }
    };
    const sender = await User.findOneAndUpdate(queryObjectSender, updateObjectSender, options);
    if (!sender) throw new MyError('Không tìm thấy người dùng', 404);
    return sender;
}
  acceptFriendRequest(req.user.id, req.params.idSender)
      .then(data => res.send({
        statusCode: 1,
        message: 'Đã đồng ý lời mời kết bạn',
        data: data
      }))
      .catch(err => res.json({
        statusCode: -1,
        message: err.message,
        data: 0
      }));
});

router.post('/deny/:idSender', passport.authenticate('jwt', {session: false}), (req, res) => {
  async function denyFriendRequest(idReceiver, idSender) {
    checkObjectId(idSender, idReceiver);
    const queryObjectReceiver = {
        _id: idReceiver,
        incommingRequests: idSender
    };
    const updateObjectReceiver = {
        $pull: { incommingRequests: idSender }
    };
    const receiver = await User.findOneAndUpdate(queryObjectReceiver, updateObjectReceiver);
    if (!receiver) throw new MyError('Không tìm thấy người dùng', 404);
    const queryObjectSender = {
        _id: idSender,
        sentRequests: idReceiver
    };
    const updateObjectSender = {
        $pull: { sentRequests: idReceiver }
    };
    const options = {
        new: true,
        fields: { name: 1 }
    };
    const sender = await User.findOneAndUpdate(queryObjectSender, updateObjectSender, options);
    if (!sender) throw new MyError('Không tìm thấy người dùng', 404);
    return sender;
}
  denyFriendRequest(req.user.id, req.params.idSender)
      .then(data => res.send({
        statusCode: 1,
        message:'Đã từ chối lời mời kết bạn',
        data: data
      }))
      .catch(err => res.json({
        statusCode: -1,
        message: err.message,
        data: 0
      }));
});

router.post('/delete/:idFr', passport.authenticate('jwt', {session: false}), (req, res) => {
  async function deleteFriend(idUser, idFr) {
    checkObjectId(idUser, idFr);
    const queryObjectUser = {
        _id: idUser,
        friends: idFr
    };
    const updateObjectUser = {
        $pull: { friends: idFr }
    };
    const user = await User.findOneAndUpdate(queryObjectUser, updateObjectUser);
    if (!user) throw new MyError('Không tìm thấy người dùng', 404);
    const queryObjectFriend = {
        _id: idFr,
        friends: idUser
    };
    const updateObjectFriend = {
        $pull: { friends: idUser }
    };
    const options = {
        new: true,
        fields: { name: 1 }
    };
    const friend = await User.findOneAndUpdate(queryObjectFriend, updateObjectFriend, options);
    if (!friend) throw new MyError('Không tìm thấy người dùng', 404);
    return friend;
}
  deleteFriend(req.user.id, req.params.idFr)
      .then(data => res.send({
        statusCode: 1,
        message: 'Hủy kết bạn thành công',
        data: data
      }))
      .catch(err => res.json({
        statusCode: -1,
        message: err.message,
        data: 0
      }));
});

module.exports = router; 