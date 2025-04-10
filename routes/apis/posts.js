// routes/apis/posts.js
const express = require('express');
const router = express.Router();
const Post = require('../../data_models/Post');

// Routes for the posts collection (GET all posts, POST new post)
router.route('/')
  // GET /api/posts - Retrieve all posts (JSON)
  .get(async (req, res) => {
    try {
      const posts = await Post.find()
        .populate('author', 'username')  // Populate only the username field of the author
        .sort({ createdAt: -1 })
        .lean();
      res.status(200).json(posts);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error fetching posts.' });
    }
  })
  // POST /api/posts - Create a new post (requires logged-in user)
  .post(async (req, res) => {
    if (!req.session.userId)
      return res.status(401).json({ error: 'Unauthorized' });
    try {
      const { title, content } = req.body;
      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required.' });
      }
      const newPost = new Post({
        title: title.trim(),
        content: content.trim(),
        author: req.session.userId
      });
      await newPost.save();
      res.status(201).json(newPost);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error creating post.' });
    }
  });

// Routes for an individual post (GET, PATCH, DELETE)
router.route('/:postId')
  // GET /api/posts/:postId - Retrieve a specific post
  .get(async (req, res) => {
    try {
      const post = await Post.findById(req.params.postId)
        .populate('author', 'username')
        .lean();
      if (!post)
        return res.status(404).json({ error: 'Post not found.' });
      res.status(200).json(post);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error fetching post.' });
    }
  })
  // PATCH /api/posts/:postId - Partially update a post (only if the user is the author)
  .patch(async (req, res) => {
    if (!req.session.userId)
      return res.status(401).json({ error: 'Unauthorized' });
    try {
      const post = await Post.findById(req.params.postId);
      if (!post)
        return res.status(404).json({ error: 'Post not found.' });
      if (post.author.toString() !== req.session.userId) {
        return res.status(403).json({ error: 'Not authorized to update this post.' });
      }
      const updateData = {};
      if (req.body.title) updateData.title = req.body.title.trim();
      if (req.body.content) updateData.content = req.body.content.trim();
      const updatedPost = await Post.findByIdAndUpdate(
        req.params.postId,
        { $set: updateData },
        { new: true, runValidators: true }
      );
      res.status(200).json(updatedPost);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error updating post.' });
    }
  })
  // DELETE /api/posts/:postId - Delete a post (only if the user is the author) and its associated comments
  .delete(async (req, res) => {
    if (!req.session.userId)
      return res.status(401).json({ error: 'Unauthorized' });
    try {
      const post = await Post.findById(req.params.postId);
      if (!post)
        return res.status(404).json({ error: 'Post not found.' });
      if (post.author.toString() !== req.session.userId) {
        return res.status(403).json({ error: 'Not authorized to delete this post.' });
      }
      await Post.findByIdAndDelete(req.params.postId);
      // Also delete all comments associated with this post
      const Comment = require('../../data_models/Comment');
      await Comment.deleteMany({ post: req.params.postId });
      res.status(200).json({ message: 'Post deleted successfully.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error deleting post.' });
    }
  });

module.exports = router;
