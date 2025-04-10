const express = require('express');
const router = express.Router();
const Comment = require('../../data_models/Comment');

// Endpoints for the entire Comments collection
router.route('/')
  // GET /api/comments - Retrieve all comments
  .get(async (req, res) => {
    try {
      const comments = await Comment.find().lean();
      res.status(200).json(comments);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error fetching comments.' });
    }
  })
  // POST /api/comments - Create a new comment (expects post, author, content in body)
  .post(async (req, res) => {
    try {
      const { post, author, content } = req.body;
      if (!post || !author || !content) {
        return res.status(400).json({ error: 'Post, author, and content are required.' });
      }
      const newComment = new Comment({ post, author, content: content.trim() });
      await newComment.save();
      res.status(201).json(newComment);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error creating comment.' });
    }
  });

// Endpoints for a specific comment resource: /api/comments/:commentId
router.route('/:commentId')
  // GET /api/comments/:commentId - Retrieve a single comment
  .get(async (req, res) => {
    try {
      const comment = await Comment.findById(req.params.commentId).lean();
      if (!comment) return res.status(404).json({ error: 'Comment not found.' });
      res.status(200).json(comment);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error fetching comment.' });
    }
  })
  // PATCH /api/comments/:commentId - Partially update a comment
  .patch(async (req, res) => {
    try {
      const updateData = {};
      if (req.body.content) updateData.content = req.body.content.trim();
      const updatedComment = await Comment.findByIdAndUpdate(
        req.params.commentId,
        { $set: updateData },
        { new: true, runValidators: true }
      );
      if (!updatedComment) return res.status(404).json({ error: 'Comment not found.' });
      res.status(200).json(updatedComment);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error updating comment.' });
    }
  })
  // DELETE /api/comments/:commentId - Delete a comment
  .delete(async (req, res) => {
    try {
      const deletedComment = await Comment.findByIdAndDelete(req.params.commentId);
      if (!deletedComment) return res.status(404).json({ error: 'Comment not found.' });
      res.status(200).json({ message: 'Comment deleted successfully.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error deleting comment.' });
    }
  });

module.exports = router;