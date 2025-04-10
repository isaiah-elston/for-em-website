const express = require('express');
const router = express.Router();
const Comment = require('../data_models/Comment');

// Create a new comment for a given post
// POST /posts/:postId/comments
router.post('/posts/:postId/comments', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  try {
    const { content } = req.body;
    if (!content || content.trim() === "") {
      // Redirect back if no content is provided
      return res.status(400).redirect('back');
    }
    const newComment = new Comment({
      post: req.params.postId,
      author: req.session.userId,
      content: content.trim()
    });
    await newComment.save();
    // Redirect back to the home page so updated comments are shown
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).render('500', { error: `Error creating comment: ${err}` });
  }
});

// Update or Delete an existing comment (inline editing)
// These endpoints assume that inline editing of comments is done on the home page.
router.route('/comments/:commentId')
  // PATCH /comments/:commentId - Update a comment
  .patch(async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    try {
      const comment = await Comment.findById(req.params.commentId);
      if (!comment) return res.status(404).render('404', { error: 'Comment not found.' });
      // Ensure the logged-in user is the comment's author
      if (comment.author.toString() !== req.session.userId) {
        return res.status(403).render('403', { error: 'Not authorized to update this comment.' });
      }
      const updateData = {};
      if (req.body.content) updateData.content = req.body.content.trim();
      await Comment.findByIdAndUpdate(req.params.commentId, { $set: updateData }, { new: true, runValidators: true });
      res.redirect('/');
    } catch (err) {
      console.error(err);
      res.status(500).render('500', { error: `Error updating comment: ${err}` });
    }
  })
  // DELETE /comments/:commentId - Delete a comment
  .delete(async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    try {
      const comment = await Comment.findById(req.params.commentId);
      if (!comment) return res.status(404).render('404', { error: 'Comment not found.' });
      if (comment.author.toString() !== req.session.userId) {
        return res.status(403).render('403', { error: 'Not authorized to delete this comment.' });
      }
      await Comment.findByIdAndDelete(req.params.commentId);
      res.redirect('/');
    } catch (err) {
      console.error(err);
      res.status(500).render('500', { error: `Error deleting comment: ${err}` });
    }
  });

module.exports = router;