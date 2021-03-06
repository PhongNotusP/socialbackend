const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');
//Gọi model
const Story = require('../../models/Story');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const Group = require('../../models/Group');

var cloudinary = require('cloudinary').v2;

const { checkObjectId } = require('../../utils/checkObjectId');
const { MyError } = require('../../utils/myError');

//Validation
const validateStoryInput = require('../../validation/story');

cloudinary.config({
  cloud_name: 'dyogxjwr7',
  api_key: '896695667759637',
  api_secret: '3-QzrryJm5KkNQ9246umTrYkxdE'
});
//get api/stories
router.get('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
  let result = []
  await Story.find({ group: null, event: null })
    .sort({ _id: -1 })
    .then(stories => {
      for (const story of stories) {
        result.push({
          _id: story._id,
          author: story.author,
          text: story.text,
          likes: story.likes,
          comments: story.comments,
          image: story.image
        });
      }
      return res.json({
        statusCode: 1,
        message: 'Thành công',
        data: result
      })
    })
    .catch(err => res.status(404).json({
      statusCode: -1,
      message: 'Không tìm thấy bài viết nào',
      data: 0
    }));
});

//get api/stories/author
router.get('/:author', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Story.find({ author: req.params.author, group: null, event: null })
    .then(stories => res.json({
      statusCode: 1,
      message: 'Lấy bài viết thành công',
      data: stories
    }))
    .catch(err => res.status(404).json({
      statusCode: -1,
      message: 'Không tìm thấy bài viết nào',
      data: 0
    }));
});

//stories api/stories
router.post('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const { errors, isValid } = validateStoryInput(req.body);
  let story;
  //Kiem tra
  if (!isValid) {
    return res.status(400).json(errors);
  }
 
  else {
    ///////////////
    if (req.body.image) {
      console.log(req.body.image)
      await cloudinary.uploader.upload(req.body.image, { tags: 'basic_sample' }, async function (err, image) {
        story = new Story({
          text: req.body.text,
          author: req.user.name,
          userId: req.user.id,
          image: image.url
        })
      });
    } else {
      story = new Story({
        text: req.body.text,
        author: req.user.name,
        userId: req.user.id
      })
    }
/////////////////
    story.save().then(story => res.json({
      statusCode: 1,
      message: 'Đăng bài thành công',
      data: {
        _id: story._id,
        author: story.author,
        text: story.text,
        likes: story.likes,
        image: story.image,
        comments: story.comments
      }
    }));
  }
});
//update story
router.post('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const { errors, isValid } = validateStoryInput(req.body);
  checkObjectId(req.params.id);

  //Kiem tra
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const storyUpdate = {};
  if (req.body.text) storyUpdate.text = req.body.text;
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
          } else
            //update
            Story.findOneAndUpdate({ _id: req.params.id }, { $set: storyUpdate }, { new: true }).then(story => res.json({
              statusCode: 1,
              message: 'Cập nhật bài viết thành công',
              data: {
                _id: story._id,
                author: story.author,
                text: story.text,
                likes: story.likes,
                comments: story.comments
              }
            }));
        })
        .catch(err => res.status(404).json({
          statusCode: -1,
          message: err.message,
          data: 0
        }));
    });
});

//delete api/stories/:id
router.delete('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
  async function removeStory(idUser, _id) {
    checkObjectId(_id, idUser);
    const query = { _id };
    const story = await Story.findOneAndRemove(query);
    if (!story) throw new MyError('Không tìm thấy bài viết', 404);
    await Comment.deleteOne({ _id: { $in: story.comments } });
    await User.findByIdAndUpdate(idUser, { $pull: { stories: _id } });
    return story;
  }
  await Story.findById(req.params.id).then(async story => {
    if (req.user.permission.toString() == 'Admin' || req.user.id == story.userId.toString()) {
      removeStory(req.user.id, req.params.id)
        .then(data => res.json({
          statusCode: 1,
          message: 'Xóa bài viết thành công',
          data: null
        }))
        .catch(err => res.json({
          statusCode: -1,
          message: err.message,
          data: 0
        }));
    } else {
      return res.json({
        statusCode: -1,
        message: 'Bạn không có quyền xóa bài của người khác',
        data: 0
      })
    }
  })
});

//post api/stories/like/:id
router.post('/like/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  async function likeStory(idUser, _id) {
    checkObjectId(idUser, _id);
    //$ne: So khớp tất cả giá trị ko bằng với value được chỉ định.
    const queryObject = { _id, likes: { $ne: idUser } };
    const story = await Story.findOneAndUpdate(queryObject, { $push: { likes: idUser } }, { new: true });
    if (!story) throw new MyError('Không tìm thấy bài viết', 404);
    return story;
  }
  likeStory(req.user.id, req.params.id)
    .then(story => res.json({
      statusCode: 1,
      message: 'Thích bài viết thành công',
      data: {
        _id: story._id,
        author: story.author,
        text: story.text,
        likes: story.likes,
        comments: story.comments
      }
    }))
    .catch(err => res.json({
      statusCode: -1,
      message: err.message,
      data: 0
    })
    );
});
//post api/stories/dislike/:id
router.post('/dislike/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  async function dislikeStory(idUser, _id) {
    checkObjectId(idUser, _id);
    //$eq: So sánh bằng với value được chỉ định.
    const queryObject = { _id, likes: { $eq: idUser } };
    const story = await Story.findOneAndUpdate(queryObject, { $pull: { likes: idUser } }, { new: true });
    if (!story) throw new MyError('Không tìm thấy bài viết', 404);
    return story;
  }
  dislikeStory(req.user.id, req.params.id)
    .then(story => res.json({
      statusCode: 1,
      message: 'Đã bỏ thích bài viết thành công',
      data: {
        _id: story._id,
        author: story.author,
        text: story.text,
        likes: story.likes,
        comments: story.comments
      }
    }))
    .catch(err => res.json({
      statusCode: -1,
      message: err.message,
      data: 0
    }));
});
// router.post('/comment/:id', passport.authenticate('jwt', {session:false}), (req,res) => {
//   const {errors, isValid} = validateStoryInput(req.body);
// //Kiem tra
//   if(!isValid){
//     return res.status(400).json(errors);
//   }
//   Story.findById(req.params.id)
//     .then(story => {
//       const newComment = {
//         text: req.body.text,
//         name: req.body.name,
//         avatar: req.body.avatar,
//         user: req.body.user
//       }
//       //thêm comment
//       story.comments.unshift(newComment);
//       //lưu
//       story.save().then(res.json(story))
//     })
//     .catch(err => res.status(404).json({storynotfound:'Không tìm thấy bài viết này'}))
// });

// //delete api/stories/comment/:id/comment_id
// router.delete('/comment/:id/:comment_id', passport.authenticate('jwt', {session:false}), (req,res) => {
//   Story.findById(req.params.id)
//     .then(story => {
//       //Kiểm tra comment có tồn tại?
//       if(story.comments.filter(comment => comment._id.toString() === req.params.comment_id).lenght === 0)
//       {
//         return res.status(404).json({commentnotexists: 'Comment không tồn tại'})
//       }

//       //Tạo removeindex
//       const removeIndex = story.comments
//         .map(item => item._id.toString())
//         .indexOf(req.params.comment_id);

//       //splice comment
//       story.comments.splice(removeIndex, 1);

//       story.save().then(story => res.json(story));
//     })
//     .catch(err => res.status(404).json({storynotfound:'Không tìm thấy bài viết này'}))
// });

module.exports = router;