const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

const { MyError } = require('../../utils/myError');
const { checkObjectId } = require('../../utils/checkObjectId');

const Comment = require('../../models/Comment');
const Story = require('../../models/Story');
const User = require('../../models/User');

const validateCommentInput = require('../../validation/story');

//post api/stories/comments
router.post('/', passport.authenticate('jwt', {session:false}), (req,res) => {
  async function createComment(nameUser, idUser, idStory, text) {
    checkObjectId(idStory, idUser);
    if (!text) throw new MyError('Vui lòng nhập comment', 400);
    const comment = new Comment({ author: nameUser, userId: idUser, text, story: idStory });
    const updateObj = { $push: { comments: comment._id } };
    const story = await Story.findByIdAndUpdate(idStory, updateObj);
    if (!story) throw new MyError('Không tìm được bài viết', 404);
    await comment.save();
    const populateObject = {
      path: 'comments',
      populate: { path: 'userId', select: ['name','avatar'] }
    };
    return Story.findById(idStory)
      .populate('userId', { name: 'name', avatar: 'avatar' })
      .populate({
        path: 'comments',
        populate: {path: 'userId', select: ['name', 'avatar'] }});
    }
  const {errors, isValid} = validateCommentInput(req.body);
  if(!isValid){
    return res.status(400).json(errors);
  }
  const { text, idStory } = req.body;
  createComment(req.user.name, req.user.id, idStory, text)
    .then(data => res.json({
      statusCode: 1,
      message: 'Bình luận thành công',
      data: data
    }))
    .catch(err => res.json({
      statusCode: -1,
      message: err.message,
      data: 0
    }));
});

//delete api/comments/:_id
router.delete('/:_id', passport.authenticate('jwt', {session:false}), (req,res) => {
  async function removeComment(idUser, _id) {
    checkObjectId(_id, idUser);
    const query = { _id, userId: idUser };
    const comment = await Comment.findOneAndRemove(query);
    if (!comment) throw new MyError('Không tìm thấy bình luận', 404);
    await Story.findByIdAndUpdate(comment.story, { $pull: { comments: _id } });
    return comment;
  }
  removeComment(req.user.id, req.params._id)
    .then(data => res.send({
      statusCode: 1,
      message: 'Xóa comment thành công',
      data: null
    }))
    .catch(err => res.json({
      statusCode: -1,
      message: err.message,
      data: 0
    }))
});

router.post('/like/:id', passport.authenticate('jwt', {session:false}), (req,res) => {
  async function likeComment(idUser, _id) {
    checkObjectId(idUser, _id);
    const queryObject = { _id, likes: { $ne: idUser } };
    const comment = await Comment.findOneAndUpdate(queryObject, { $addToSet: { likes: idUser } }, { new: true });
    if (!comment) throw new MyError('Không tìm thấy bình luận', 404);
    return comment;
  }
  likeComment(req.user.id, req.params.id)
    .then(data => res.send({
      statusCode: 1,
      message: 'Thích bình luận thành công',
      data: data
    }))
    .catch(err => res.json({
      statusCode: -1,
      message: err.message,
      data: 0
    }));
});

router.post('/dislike/:_id', passport.authenticate('jwt', {session: false}), (req,res) => {
  async function dislikeComment(idUser, _id) {
    checkObjectId(idUser, _id);
    const queryObject = { _id, likes: { $eq: idUser } };
    const comment = await Comment.findOneAndUpdate(queryObject, { $pull: { likes: idUser } }, { new: true });
    if (!comment) throw new MyError('Không tìm thấy bình luận', 404);
    return comment;
  }
  dislikeComment(req.user.id, req.params._id)
    .then(data => res.send({
      statusCode: 1,
      message: 'Bỏ thích bình luận thành công',
      data: data
    }))
    .catch(err => res.json({
      statusCode: -1,
      message: err.message,
      data: 0
    }));
});
module.exports = router;