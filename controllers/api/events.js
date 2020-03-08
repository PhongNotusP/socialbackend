const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const passport = require('passport');

const Event = require('../../models/Event');
const User = require('../../models/User');
const Profile = require('../../models/Profile');
const Story = require('../../models/Story');

const validateCreateEvent = require('../../validation/event');
const validateStoryInput = require('../../validation/story');

const { checkObjectId } = require('../../utils/checkObjectId');
const { MyError } = require('../../utils/myError');

router.get('/', (req, res) => {
  let result = []
  Event.find()
    .sort({_id: -1})
    .then(events => {
      for(const event of events) {
        result.push({
          id: event._id,
          name: event.name,
          owner: event.owner,
          introduction: event.introduction,
          startTime: event.startTime
        })
      }
      return res.json({
        statusCode: 1,
        message: 'Thành công',
        data: result
      })
    })
    .catch(err => res.status(404).json({
      statusCode: -1,
      message: 'Không có sự kiện nào',
      data: 0
    }));
});

router.get('/:eventId', (req, res) => {
  let result = []
  return Story.find({ event: req.params.eventId })
    .sort({ _id: -1 })
    .then(stories => {
      for(const story of stories) {
        result.push({
          _id: story._id,
          event: story.event,
          author: story.author,
          text: story.text,
          likes: story.likes,
          comments: story.comments
        });
      }
      return res.json({
        statusCode: 1,
        message: 'Thành công',
        data: result
      })
    })
    .catch(err => res.json({
      statusCode: -1,
      message: 'Không tìm thấy bài viết nào',
      data: 0
    }));
});

router.post('/create', passport.authenticate('jwt', { session: false}), (req, res) => {
  const { errors, isValid } = validateCreateEvent(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const newEvent = new Event({
    name: req.body.name,
    owner: req.user.name,
    participants: req.user.id,
    introduction: req.body.introduction
    })
  newEvent.save().then(event => res.json({
    statusCode: 1,
    message: 'Tạo mới sự kiện thành công',
    data: {
      _id: event._id,
      name: event.name,
      owner: event.owner,
      introduction: event.introduction,
      startTime: event.startTime
    }
  }));
});

router.post('/:eventId/invite/:idUser', passport.authenticate('jwt', { session: false }), (req, res) => {
  async function eventInvite(idEvent, idReceiver, idSender) {
    checkObjectId(idSender, idReceiver, idEvent)
    const queryObjectReceiver = {
      _id: idReceiver,
      // userInviteEvent: { $ne: idSender },
      incommingEventRequests: { $ne: idEvent}
    };
    const updateObjectReceiver = { 
      $push: { incommingEventRequests: idEvent /*, userInviteEvent: idSender*/ },  
    };
    const options = {
      new: true,
      fields: { invited: 1 }
    };
    const sender = await User.findOneAndUpdate(queryObjectReceiver, updateObjectReceiver);
    if (!sender) throw new MyError('Người này đã được mời', 404);

    const queryObjectEvent = {
      _id: idEvent,
      invited: { $ne: idReceiver},
      care: { $ne: idReceiver},
      participants: { $ne: idReceiver},
      //nonParticipants: { $ne: idReceiver} 
    }
    const updateObjectEvent = { $push: { invited: idReceiver } };
    const event = await Event.findOneAndUpdate(queryObjectEvent, updateObjectEvent, options);
    if (!event) throw new MyError('Người này đã tham gia', 404);
    return event;
  }
  eventInvite(req.params.eventId, req.params.idUser, req.user.id)
    .then(data => res.json({
      statusCode: 1,
      message: 'Mời thành công',
      data: data
    }))
    .catch(err => res.json({
      statusCode: -1,
      message: err.message,
      data: 0
    }));
});

router.post('/:eventId/care', passport.authenticate('jwt', {session: false}), (req, res) => {
  async function careEvent(idEvent, idUser) {
    checkObjectId(idEvent, idUser)
    const queryObjectEvent= {
      _id: idEvent,
      care: { $ne: idUser}
    };
    const updateObjectEvent = {
      $pull: {invited: idUser, participants: idUser/*, nonParticipants: idUser*/},
      $push: {care: idUser}
    };
    // const updateObjectUser = {
    //   $push: {eventHasJoined: idUser}
    // };
    const options = {
      new: true,
      fields: { care: 1 , name: 1}
    };
    // const user = await User.findByIdAndUpdate(idUser, updateObjectUser);
    // if (!user) throw new MyError('User not found', 404);
    const event = await Event.findOneAndUpdate(queryObjectEvent, updateObjectEvent, options);
    if (!event) throw new MyError('Không tìm thấy', 404);
    return event;
  }

  async function careEvent1(idEvent, idUser) {
    checkObjectId(idEvent, idUser)
    const queryObjectEvent= {
      _id: idEvent,
      care: { $ne: idUser}
    };
    const updateObjectEvent = {
      $pull: {invited: idUser, participants: idUser/*, nonParticipants: idUser*/},
      $push: {care: idUser}
    };
    const updateObjectUser = {
      $pull: {incommingEventRequests: idEvent},
      // $push: {eventHasJoined: idEvent}
    };
    const options = {
      new: true,
      fields: { care: 1, name: 1 }
    };

    const user = await User.findByIdAndUpdate(req.user.id, updateObjectUser)
    if(!user) throw new MyError('Không tìm thấy', 404);
    const event = await Event.findOneAndUpdate(queryObjectEvent, updateObjectEvent, options);
    if (!event) throw new MyError('Không tìm thấy', 404);
    return event;
  }

  User.findById(req.user.id).then(user => {
    if(user.incommingEventRequests.indexOf(req.params.eventId) == -1){
      return careEvent(req.params.eventId, req.user.id)
      .then(data => res.json({
        statusCode: 1,
        message: 'Quan tâm sự kiện',
        data: data
      }))
      .catch(err => res.json({
        statusCode: -1,
        message: err.message,
        data: 0
      }));
    }
    return careEvent1(req.params.eventId, req.user.id)
    .then(data => res.json({
      statusCode: 1,
      message: 'Quan tâm sự kiện',
      data: data
    }))
    .catch(err => res.json({
      statusCode: -1,
      message: err.message,
      data:err.message
    }));
  })  
});

router.post('/:eventId/join', passport.authenticate('jwt', {session: false}), (req, res) => {
  async function joinEvent(idEvent, idUser) {
    checkObjectId(idEvent, idUser)
    const queryObjectEvent= {
      _id: idEvent,
      participants: { $ne: idUser}
    };
    const updateObjectEvent = {
      $pull: {invited: idUser, care: idUser/*, nonParticipants: idUser*/},
      $push: {participants: idUser}
    };
    // const updateObjectUser = {
    //   $push: {eventHasJoined: idUser}
    // };
    const options = {
      new: true,
      fields: { participants: 1, name: 1 }
    };
    // const user = await User.findByIdAndUpdate(idUser, updateObjectUser);
    // if (!user) throw new MyError('User not fonud', 404);
    const event = await Event.findOneAndUpdate(queryObjectEvent, updateObjectEvent, options);
    if (!event) throw new MyError('Không tìm thấy', 404);
    return event;
  }

  async function joinEvent1(idEvent, idUser) {
    checkObjectId(idEvent, idUser)
    const queryObjectEvent= {
      _id: idEvent,
      participants: { $ne: idUser}
    };
    const updateObjectEvent = {
      $pull: {invited: idUser, care: idUser/*, nonParticipants: idUser*/},
      $push: {participants: idUser}
    };
    const updateObjectUser = {
      $pull: {incommingEventRequests: idEvent},
      // $push: {eventHasJoined: idEvent}
    };
    const options = {
      new: true,
      fields: { participants: 1, name: 1 }
    };

    const user = await User.findByIdAndUpdate(req.user.id, updateObjectUser)
    if(!user) throw new MyError('Không tìm thấy', 404);
    const event = await Event.findOneAndUpdate(queryObjectEvent, updateObjectEvent, options);
    if (!event) throw new MyError('Không tìm thấy', 404);
    return event;
  }

  User.findById(req.user.id).then(user => {
    if(user.incommingEventRequests.indexOf(req.params.eventId) == -1){
      return joinEvent(req.params.eventId, req.user.id)
      .then(data => res.json({
        statusCode: -1,
        message: 'Tham gia sự kiện',
        data: data
      }))
      .catch(err => res.json({
        statusCode: -1,
        message: err.message,
        data: 0
      }));
    }
    return joinEvent1(req.params.eventId, req.user.id)
    .then(data => res.json({
      statusCode: -1,
      message: 'Tham gia sự kiện',
      data: data
    }))
    .catch(err => res.json({
      statusCode: -1,
      message: err.message,
      data: 0
    }));
  })  
});

router.post('/:eventId/notjoin', passport.authenticate('jwt', {session: false}), (req, res) => {
  async function notJoinEvent(idEvent, idUser) {
    checkObjectId(idEvent, idUser)
    const queryObjectEvent= {
      _id: idEvent,
      // nonParticipants: { $ne: idUser}
    };
    const updateObjectEvent = {
      $pull: {invited: idUser, care: idUser, participants: idUser},
      // $push: {nonParticipants: idUser}
    };
    const options = {
      new: true,
      fields: {name: 1}
    };
    const event = await Event.findOneAndUpdate(queryObjectEvent, updateObjectEvent, options);
    if (!event) throw new MyError('Không tìm thấy', 404);
    return event;
  }

  async function notJoinEvent1(idEvent, idUser) {
    checkObjectId(idEvent, idUser)
    const queryObjectEvent= {
      _id: idEvent,
      // nonParticipants: { $ne: idUser}
    };
    const updateObjectEvent = {
      $pull: {invited: idUser, care: idUser, participants: idUser},
      // $push: {nonParticipants: idUser}
    };
    const updateObjectUser = {
      $pull: {incommingEventRequests: idEvent/*,eventHasJoined: idEvent*/}
    };
    const options = {
      new: true,
      fields: { care: 1 }
    };

    const user = await User.findByIdAndUpdate(req.user.id, updateObjectUser)
    if(!user) throw new MyError('Không tìm thấy', 404);
    const event = await Event.findOneAndUpdate(queryObjectEvent, updateObjectEvent, options);
    if (!event) throw new MyError('Không tìm thấy', 404);
    return event;
  }

  User.findById(req.user.id).then(user => {
    if(user.incommingEventRequests.indexOf(req.params.eventId) == -1){
      return notJoinEvent(req.params.eventId, req.user.id)
      .then(data => res.json({
        statusCode: -1,
        message: 'Không tham gia sự kiện',
        data: data
      }))
      .catch(err => res.json({
        statusCode: -1,
        message: err.message,
        data: 0
      }));
    }
    return notJoinEvent1(req.params.eventId, req.user.id)
    .then(data => res.json({
      statusCode: -1,
      message: 'Không tham gia sự kiện',
      data: data
    }))
    .catch(err => res.json({
      statusCode: -1,
      message: err.message,
      data: 0
    }));
  })  
});

router.post('/:eventId', passport.authenticate('jwt', { session: false }), (req, res) => {
  async function createStory(userId, text, author, event) {
    const newStory = new Story({ text, userId: userId, author: author, event: event });
    await Event.findByIdAndUpdate(event, { $push: { stories: newStory._id } });
    return newStory.save();
  }
  const { errors, isValid } = validateStoryInput(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }
  Event.findById(req.params.eventId).then(event => {
    const { text } = req.body;
    createStory(req.user.id, text, req.user.name, req.params.eventId)
      .then(story => res.json({
        statusCode: 1,
        message: 'Đăng bài thành công',
        data: {
          _id: story._id,
          event: story.event,
          author: story.author,
          text: story.text,
          likes: story.likes,
          comments: story.comments
        }
      }))
      .catch(err => res.json({
        statusCode: -1,
        message: 'Không tìm được event',
        data: 0
      }));
  })
});

router.post('/:eventId/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { errors, isValid } = validateStoryInput(req.body);
  //Kiem tra
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const storyUpdate = {};
  if (req.body.text) {
    storyUpdate.text = req.body.text,
    storyUpdate.event = req.params.eventId
  };
  Profile.findOne({ user: req.user.id })
    .then(profile => {
      Story.findById(req.params.id)
        .then(story => {
          //Kiểm tra quyền         
          if (story.userId.toString() !== req.user.id) {
            return res.status(401).json({
              statusCode: -1,
              message: 'Bạn không có quyền sửa bài của người khác',
              data: 0
            });
          } else
            //update
            Story.findOneAndUpdate({ _id: req.params.id }, { $set: storyUpdate }, { new: true })
            .then(story => res.json({
              statusCode: 1,
              message: 'Cập nhật thành công',
              data: {
                _id: story._id,
                event: story.event,
                author: story.author,
                text: story.text,
                likes: story.likes,
                comments: story.comments
              }
            }));
        })
        .catch(err => res.status(404).json({ 
          statusCode: -1,
          message: 'Không tìm thấy bài viết',
          data: 0
         }));
    });
});

router.post('/:eventId/like/:id', passport.authenticate('jwt', {session:false}), (req,res) => {
  async function likeStory(idUser, _id) {
    checkObjectId(idUser, _id);
    const queryObject = { _id, likes: { $ne: idUser } };
    const story = await Story.findOneAndUpdate(queryObject, { $addToSet: { likes: idUser } }, { new: true });
    if (!story) throw new MyError('Story not found', 404);
    return story;
  }
  likeStory(req.user.id, req.params.id)
    .then(storyInfo => res.send({
      statusCode: 1,
      message: 'Thích bài viết thành công',
      data: storyInfo }))
    .catch(err => res.json({
      statusCode: -1,
      message: err.message,
      data: 0
    }));
});

router.post('/:eventId/dislike/:id', passport.authenticate('jwt', {session:false}), (req,res) => {
  async function dislikeStory(idUser, _id) {
    checkObjectId(idUser, _id);
    //$eq: So sánh bằng với value được chỉ định.
    const queryObject = { _id, likes: { $eq: idUser } };
    const story = await Story.findOneAndUpdate(queryObject, { $pull: { likes: idUser } }, { new: true });
    if (!story) throw new MyError('Story not found', 404);
    return story;
  }
  dislikeStory(req.user.id, req.params.id)
    .then(storyInfo => res.send({
      statusCode: 1,
      message: 'Bỏ thích bài viết thành công',
      data: storyInfo }))
    .catch(err => res.json({
      statusCode: -1,
      message: err.message,
      data: 0
    }));
});

router.delete('/:eventId', passport.authenticate('jwt', {session: false}), (req,res) => {
  async function deleteEvent(_id, User) {
    checkObjectId(_id);
    const queryObject = {_id, owner: {$eq: User}};
    const event = Event.findByIdAndRemove(queryObject)
    if(!event) throw new MyError('Không tìm thấy sự kiện',404);
    return event;
  }
  deleteEvent(req.params.eventId,req.user.name)
  .then(event => res.send({
    statusCode: 1,
    message:'Xóa thành công',
    data: event
  }))
  .catch(err => res.json({
    statusCode: -1,
    message: err.message,
    data: 0
  }));
});

module.exports = router;