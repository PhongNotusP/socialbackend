const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

const Group = require('../../models/Group');
const User = require('../../models/User');
const Story = require('../../models/Story');
const Profile = require('../../models/Profile');

const validateCreateGroup = require('../../validation/group');
const validateStoryInput = require('../../validation/story');

const { checkObjectId } = require('../../utils/checkObjectId');
const { MyError } = require('../../utils/myError');

router.get('/', (req, res) => {
  let result = [];
  Group.find()
    .sort({ date: -1 })
    .then(groups => {
      for(const group of groups) {
        result.push({
          id: group._id,
          name: group.name,
          owner: group.owner,
          description: group.description,
          type: group.type
        })
      }
      return res.json({
        statusCode: 1,
        message: 'Thành công',
        data: result
      })
    })
    .catch(err => res.status(404).json({ nostory: 'Không tìm thấy nhóm nào' }));
});

router.get('/:grId', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Group.findById(req.params.grId).then(group => {
    if (group.type.toString() !== '0') {
      if (group.members.indexOf(req.user.id) == -1) {
        return res.status(402).json({
          statusCode: -1,
          message: 'Bạn không ở trong nhóm này, hãy tham gia nhóm để xem các bài viết',
          data: 0
        });
      }
      let result = []
      return Story.find({ group: req.params.grId })
        .sort({ _id: -1 })
        .then(stories => {
          for(const story of stories) {
            if(group.censoringStory.indexOf(story._id) == -1){
              result.push({
                _id: story._id,
                group: story.group,
                author: story.author,
                text: story.text,
                likes: story.likes,
                comments: story.comments
              })
            }
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
    }
    return Story.find({ group:req.params.grId })
      .sort({date: -1})
      .then(stories => res.json(stories))
      .catch(err => res.json({
        statusCode: -1,
        message: 'Không tìm thấy bài viết nào',
        data: 0
      }));
  })
    .catch(err => res.json({
      statusCode: -1,
      message: err.message,
      data: 0
    }))
});

router.post('/create', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const { errors, isValid } = validateCreateGroup(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }

  const newGroup = new Group({
    name: req.body.name,
    owner: req.user.name,
    members: req.user.id,
    description: req.body.description,
    type: req.body.type
  })
  await newGroup.save().then(async group => {
    await User.findByIdAndUpdate(req.user.id, { $push: {groups: group._id}})
    return res.json({
    statusCode: -1,
    message: 'Tạo nhóm thành công',
    data: {
      _id: group._id,
      name: group.name,
      description: group.description,
      owner: group.owner,
      type:group.type,
      members: group.members
    }
  })
  });
});

//request

router.post('/request/:grId', passport.authenticate('jwt', { session: false }), (req, res) => {
  async function groupRequest(idSender, idReceiver) {
    checkObjectId(idSender, idReceiver)
    const queryObject = {
      _id: idSender,
      groups: { $ne: idReceiver },
      groupSentRequests: { $ne: idReceiver },
    }
    const sender = await User.findOneAndUpdate(queryObject, { $push: { groupSentRequests: idReceiver } });
    if (!sender) throw new MyError('Bạn đã yêu cầu tham gia nhóm này', 404);

    const options = {
      new: true,
      fields: { name: 1 }
    };
    const updateObject = { $push: { incommingRequests: idSender } };
    const receiver = await Group.findByIdAndUpdate(idReceiver, updateObject, options);
    if (!receiver) throw new MyError('Không tìm thấy nhóm', 404);
    return receiver;
  }
  groupRequest(req.user.id, req.params.grId)
    .then(data => res.json({
      statusCode: 1,
      message: 'Yêu cầu tham gia nhóm thành công',
      data: data
    }))
    .catch(err => res.json({
      statusCode: -1,
      message: err.message,
      data: 0
    }));
});

//get requests
router.get('/:grId/requests', passport.authenticate('jwt', { session: false }), (req, res) => {
  Group.findById(req.params.grId).then(group => {
    if (group.owner.toString() !== req.user.name) {
      return res.status(401).json({ notAuthorized: 'Bạn không Phải quản trị viên' });
    }
    return res.json({ Requests: group.incommingRequests })
  }).catch(err => res.json({ notfound: 'Không tìm thấy nhóm' }));
})

//post accept request
router.post('/:grId/accept/:idSender', passport.authenticate('jwt', { session: false }), (req, res) => {
  async function acceptGroupRequest(idReceiver, idSender) {
    checkObjectId(idSender, idReceiver);
    const queryObjectSender = {
      _id: idSender,
      groupSentRequests: idReceiver
    };
    const updateObjectSender = {
      $pull: { groupSentRequests: idReceiver },
      $push: { groups: idReceiver }
    };
    const options = {
      new: true,
      fields: {}
    };
    const sender = await User.findOneAndUpdate(queryObjectSender, updateObjectSender, options);
    if (!sender) throw new MyError('Không tìm thấy người dùng này', 404);

    const queryObjectReceiver = {
      _id: idReceiver,
      incommingRequests: idSender
    };
    const updateObjectReceiver = {
      $pull: { incommingRequests: idSender },
      $push: { members: idSender }
    };
    
    const receiver = await Group.findOneAndUpdate(queryObjectReceiver, updateObjectReceiver, options);
    if (!receiver) throw new MyError('Not found', 404);
    return receiver;
  }
  Group.findById(req.params.grId).then(group => {
    if (group.owner.toString() == req.user.name || group.censor.indexOf(req.user.id) != -1) {
      acceptGroupRequest(req.params.grId, req.params.idSender)
      .then(data => res.json({
        statusCode: 1,
        message: 'Đã phê duyệt yêu cầu',
        data: {
          name: data.name,
          members: data.members,
          incommingRequests: data.incommingRequests
        }
      }))
      .catch(err => res.json({
        statusCode: -1,
        message: err.message,
        data: 0
      }));
    } else {
      return res.status(404).json({
        statusCode: 1,
        message: 'Chỉ chủ group được duyệt',
        data: 0
      });
    }
  })
  // .catch(err => res.status(404).json({notowner: 'Chỉ chủ group được duyệt'}));
});

router.post('/:grId/deny/:idSender', passport.authenticate('jwt', { session: false }), (req, res) => {
  async function denyGroupRequest(idReceiver, idSender) {
    checkObjectId(idSender, idReceiver);
    const queryObjectSender = {
      _id: idSender,
      groupSentRequests: idReceiver
    };
    const updateObjectSender = {
      $pull: { groupSentRequests: idReceiver },
    };
    const options = {
      new: true,
      fields: {}
    };
    const sender = await User.findOneAndUpdate(queryObjectSender, updateObjectSender, options);
    if (!sender) throw new MyError('Không tìm thấy người dùng này', 404);

    const queryObjectReceiver = {
      _id: idReceiver,
      incommingRequests: idSender
    };
    const updateObjectReceiver = {
      $pull: { incommingRequests: idSender }
    };
    
    const receiver = await Group.findOneAndUpdate(queryObjectReceiver, updateObjectReceiver, options);
    if (!receiver) {
      throw new MyError('Not found', 404);
    }
    return receiver;
  }
  Group.findById(req.params.grId).then(group => {
    if (group.owner.toString() == req.user.name || group.censor.indexOf(req.user.id) != -1) {
      denyGroupRequest(req.params.grId, req.params.idSender)
      .then(data => res.json({
        statusCode: -1,
        message: 'Từ chối thành công',
        data: {
          name: data.name,
          members: data.members,
          incommingRequests: data.incommingRequests
        }
      }))
      .catch(err => res.json({
        statusCode: -1,
        message: err.message,
        data: 0
      }));
    } else {
      return res.status(404).json({
        statusCode: -1,
        message: 'Chỉ chủ group được từ chối',
        data: 0
      });
    }
  })
  // .catch(err => res.status(404).json({notowner: 'Chỉ chủ group được duyệt'}));
});

router.post('/:grId/delete/:memberId', passport.authenticate('jwt', { session: false }), (req, res) => {
  async function removeMember(idGroup, memberId) {
    checkObjectId(idGroup, memberId);
    const queryObjectGroup = {
      _id: memberId,
      groups: idGroup
    };
    const updateObjectGroup = {
      $pull: { groups: idGroup }
    };
    const options = {
      new: true,
      fields: {members: 1}
    };
    const group = await User.findByIdAndUpdate(queryObjectGroup, updateObjectGroup);
    if(!group) throw new MyError('Không tìm thấy người này', 404);

    const queryObjectUser = {
      _id: idGroup,
      members: memberId
    };
    const updateObjectUser = {
      $pull: { members: memberId }
    };
    
    const member = await Group.findOneAndUpdate(queryObjectUser, updateObjectUser, options);
    if (!member) throw new MyError('Không tìm thấy thành viên này', 404);

    return member;
  }
  Group.findById(req.params.grId).then(group => {
    if (group.owner.toString() !== req.user.name) {
      return res.status(404).json({
        statusCode: -1,
        notowner: 'Chỉ chủ group có quyền xóa thành viên',
        data: 0
      });
    }
    removeMember(req.params.grId, req.params.memberId)
      .then(data => res.json({
        statusCode: -1,
        message: 'Xóa thành viên thành công',
        data: {
          name: data.name,
          members: data.members,
        }
      }))
      .catch(err => res.json({
        statusCode: -1,
        message: err.message,
        data: 0
      }));
  })
});

//get members
router.get('/:grId/members', passport.authenticate('jwt', { session: false }), (req, res) => {
  Group.findById(req.params.grId).then(group => {
    if (group.type.toString() !== '0') {
      if (group.members.indexOf(req.user.id) == -1)
        return res.status(401).json({ notAuthorized: 'Bạn chưa tham gia nhóm' });
    }
    return res.json({
      statusCode: 1,
      message: 'Lấy danh sách thành viên thành công',
      data: group.members
    })
  }).catch(err => res.json({ 
    statusCode: -1,
    message: 'Không tìm được nhóm',
    data: 0  
  }));
});

//set censor
router.post('/:grId/setcensor/:memberId', passport.authenticate('jwt', { session: false }), (req, res) => {
  async function setCensor(grId, memberid) {
    checkObjectId(grId, memberid);
    const queryObjectUser = {
      _id: grId,
      members: memberid
    };
    const updateObjectUser = {
      $push: { censor: memberid }
    };
    const options = {
      new: true,
      fields: {}
    };
    const censor = await Group.findOneAndUpdate(queryObjectUser, updateObjectUser, options);
    if (!censor) throw new MyError('Không tìm thấy thành viên này', 404);
    return censor;
  }
  Group.findById(req.params.grId).then(group => {
    if (group.owner.toString() !== req.user.name) {
      return res.status(404).json({ 
        statusCode: 1,
        message: 'Chỉ chủ group có quyền',
        data: 0
      });
    }
    setCensor(req.params.grId, req.params.memberId)
      .then(data => res.json({
        statusCode: 1,
        message: 'Xét quyền thành công',
        data: {
          name: data.name,
          censor: data.censor,
          members: data.members
        }
      }))
      .catch(err => res.json({ 
        statusCode: -1,
        notfonud: err.message,
        data: 0
      }));
  })
});

//post groups/:grId (story)
router.post('/:grId', passport.authenticate('jwt', { session: false }), (req, res) => {
  async function createStory(userId, text, author, group) {
    // if (!text) return res.status(401).res.json({ textError: 'Nội dung không được để trống' });
    const newStory = new Story({ text, userId: userId, author: author, group: group });
    await Group.findByIdAndUpdate(group, { $push: { censoringStory: newStory._id } });
    return newStory.save();
  }
  async function createStory1(userId, text, author, group) {
    // if (!text) return res.status(401).res.json({ textError: 'Nội dung không được để trống' });
    const newStory = new Story({ text, userId: userId, author: author, group: group });
    await Group.findByIdAndUpdate(group, { $push: { stories: newStory._id } });
    return newStory.save();
  }
  const { errors, isValid } = validateStoryInput(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }
  Group.findById(req.params.grId).then(group => {
    if (group.members.indexOf(req.user.id) == -1) {
      return res.status(402).json({
        statusCode: -1,
        notingroup: 'Bạn không ở trong nhóm này, hãy tham gia nhóm để có thể đăng bài viết',
        data: 0
      })
    } else if (group.owner.toString() == req.user.name || group.censor.indexOf(req.user.id) != -1){
      createStory1(req.user.id, req.body.text, req.user.name, req.params.grId)
      .then(story => res.json({
        statusCode: 1,
        message: 'Đăng bài thành công',
        data: {
          author: story.author,
          text: story.text
        }
      }))
      .catch(err => res.json({
        statusCode: -1,
        message: err.message,
        data: 0
      }));
    } else {
      createStory(req.user.id, req.body.text, req.user.name, req.params.grId)
      .then(story => res.json({
        statusCode: 1,
        message: 'Đăng bài thành công, đăng đợi duyệt',
        data: {
          author: story.author,
          text: story.text
        }
      }))
      .catch(err => res.json({ 
        statusCode: -1,
        message: err.message,
        data: 0
      }));
    }    
  })
  .catch(err => res.json({
    statusCode: -1,
    message: 'Không tìm được nhóm',
    data: 0
  }));
});

router.get('/:grId/pending', passport.authenticate('jwt', { session: false }), (req, res) => {
  Group.findById(req.params.grId).then(group => {
    if (group.owner.toString() == req.user.name || group.censor.indexOf(req.user.id) != -1) {
      return res.json({
        statusCode: 1,
        message:'Lấy bài viết thành công',
        data: group.censoringStory,
        })
    } else {
      return res.json({
        statusCode: -1,
        message: 'Bạn không phải quản trị viên',
        data: 0
      })
    }
  })
    .catch(err => res.json({
      statusCode: -1,
      message: 'Không tìm được nhóm',
      data: 0
    }));
})

//censor story
router.post('/:grId/censor/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  async function censorStory(grId, storyId) {
    checkObjectId(grId, storyId);
    const queryObjectStory = {
      _id: grId,
      censoringStory: storyId
    };
    const updateObjectStory = {
      $pull: { censoringStory: storyId }
    };
    const options = {
      new: true,
      fields: { censoringStory: 1 }
    };
    const censoredStory = Group.findByIdAndUpdate(queryObjectStory, updateObjectStory, options)
    if (!censoredStory) throw new MyError('Không có bài viết này',404)
    return censoredStory;
  }
  Group.findById(req.params.grId).then(group => {
    if (group.owner.toString() === req.user.name || group.censor.indexOf(req.user.id) != -1) {
      censorStory(req.params.grId, req.params.id)
      .then(data => res.json({
        statusCode: 1,
        message: 'Duyệt bài thành công',
        data: data
      }))
      .catch(err => res.json({
        statusCode: -1,
        message: 'Không tìm được',
        data: 0
      }));
    } else {
      return res.json({
        statusCode: -1,
        message: 'Bạn không có quyền',
        data: 0
      })
    }
  })
});

// update story
router.post('/:grId/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const { errors, isValid } = validateStoryInput(req.body);
  //Kiem tra
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const storyUpdate = {};
  if (req.body.text) {
    storyUpdate.text = req.body.text,
    storyUpdate.group = req.params.grId
  };
  await Profile.findOne({ user: req.user.id })
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
          } else {
            //update
            Story.findOneAndUpdate({ _id: req.params.id }, { $set: storyUpdate }, { new: true })
              .then(story => res.json({
                statusCode: 1,
                message: 'Cập nhật bài viết thành công',
                data: {
                  _id: story._id,
                  author: story.author,
                  group: story.group,
                  text: story.text
                }
              }));
            }
        })
        .catch(err => res.status(404).json({
          statusCode: -1,
          message: err.message,
          data: 0
        }));
    });
});

//delete api/groups/:grid/:id
router.delete('/:grId/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
  async function removeStory(idUser, _id) {
    checkObjectId(_id, idUser);
    const query = { _id};
    const story = await Story.findOneAndRemove(query);
    if (!story) throw new MyError('Không tìm thấy bài viết', 404);
    await Comment.deleteOne({ _id: { $in: story.comments } });
    await User.findByIdAndUpdate(idUser, { $pull: { stories: _id } });
    return story;
  }
  await Group.findById(req.params.grId).then(async group => {
    await Story.findById(req.params.id).then(async story => {
      if(group.owner.toString() == req.user.name || req.user.id == story.userId.toString()){
        removeStory(req.user.id, req.params.id)
          .then(data => res.json({
            statusCode: 1,
            message: 'Xóa bài viết thành công',
            data: data
          }))
          .catch(err => res.json({
            statusCode: -1,
            message: err.message,
            data: 0
          }));
      } else {
        return res.json({
          statusCode: -1,
          message:'Bạn không có quyền xóa bài của người khác',
          data: 0
        })
      }
    })
    .catch(err => res.json({
      statusCode: -1,
      message: 'Không tìm thấy bài viết',
      data: 0
    }))
    
  })
  
});
//post api/groups/like/:id
router.post('/:grid/like/:id', passport.authenticate('jwt', {session:false}), (req,res) => {
  async function likeStory(idUser, _id) {
    checkObjectId(idUser, _id);
    //$ne: So khớp tất cả giá trị ko bằng với value được chỉ định.
    const queryObject = { _id, likes: { $ne: idUser } };
    const story = await Story.findOneAndUpdate(queryObject, { $push: { likes: idUser } }, { new: true });
    if (!story) throw new MyError('Không tìm thấy bài viết', 404);
    return story;
  }
  likeStory(req.user.id, req.params.id)
    .then(storyInfo => res.json({
      statusCode: 1,
      message: 'Thích bài viết thành công',
      data: storyInfo
    }))
    .catch(err => res.json({
      statusCode: -1,
      message: err.message,
      data: 0
    })
  );
});
//post api/stories/dislike/:id
router.post('/dislike/:id', passport.authenticate('jwt', {session:false}), (req,res) => {
  async function dislikeStory(idUser, _id) {
    checkObjectId(idUser, _id);
    //$eq: So sánh bằng với value được chỉ định.
    const queryObject = { _id, likes: { $eq: idUser } };
    const story = await Story.findOneAndUpdate(queryObject, { $pull: { likes: idUser } }, { new: true });
    if (!story) throw new MyError('Không tìm thấy bài viết', 404);
    return story;
  }
  dislikeStory(req.user.id, req.params.id)
  .then(storyInfo => res.json({
    statusCode: 1,
    message: 'Đã bỏ thích bài viết thành công',
    data: storyInfo
  }))
  .catch(err => res.json({
    statusCode: -1,
    message: err.message,
    data: 0
  }));
});
//comments

//settings

module.exports = router;