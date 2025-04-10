const express = require('express');
const router = express.Router();
const Post = require('../data_models/Post');
const Comment = require('../data_models/Comment');

// NEW ROUTE: GET /posts/:postId/edit - Render the edit form for a specific post.
router.get('/posts/:postId/edit', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  try {
    const post = await Post.findById(req.params.postId).lean();
    if (!post) return res.status(404).render('404', { error: 'Post not found.' });
    // Check if the logged-in user is the author.
    if (post.author.toString() !== req.session.userId) {
      return res.status(403).render('403', { error: 'Not authorized to edit this post.' });
    }
    // Render the edit form view (create a new view file: views/editPost.handlebars)
    res.render('editPost', { post, username: req.session.username });
  } catch (error) {
    console.error(error);
    res.status(500).render('500', { error: `Error loading edit form: ${error}` });
  }
});

// ------------------------------
// Routes for Posts Collection: /posts
// ------------------------------
router.route('/posts')
  // GET /posts - Retrieve and render all posts.
  .get(async (req, res) => {
    try {
      const posts = await Post.find()
        .populate('author', 'username')
        .sort({ createdAt: -1 })
        .lean();
      // Render the home view with posts and the current user's username.
      res.render('home', { posts, username: req.session.username });
    } catch (error) {
      console.error(error);
      res.status(500).render('500', { error: `Error fetching posts: ${error}` });
    }
  })
  // POST /posts - Create a new post.
  .post(async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    try {
      const { title, content } = req.body;
      if (!title || !content) {
        return res.status(400).render('home', { error: 'Title and content are required.', username: req.session.username });
      }
      const newPost = new Post({
        title: title.trim(),
        content: content.trim(),
        author: req.session.userId
      });
      await newPost.save();
      res.status(201).redirect('/');
    } catch (error) {
      console.error(error);
      res.status(500).render('500', { error: `Error creating post: ${error}` });
    }
  });

// -------------------------------------
// Routes for Individual Post: /posts/:postId
// -------------------------------------
router.route('/posts/:postId')
  // GET /posts/:postId - Retrieve and render a single post.
  .get(async (req, res) => {
    try {
      const post = await Post.findById(req.params.postId)
        .populate('author', 'username')
        .lean();
      if (!post) return res.status(404).render('404', { error: 'Post not found.' });
      res.render('post', { post });
    } catch (error) {
      console.error(error);
      res.status(500).render('500', { error: `Error fetching post: ${error}` });
    }
  })
  // PATCH /posts/:postId - Update a post.
// PATCH /posts/:postId - Update a post
.patch(async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    try {
      const post = await Post.findById(req.params.postId);
      if (!post) return res.status(404).render('404', { error: 'Post not found.' });
      if (post.author.toString() !== req.session.userId) {
        return res.status(403).render('403', { error: 'Not authorized to update this post.' });
      }
      const updateData = {};
      if (req.body.title) updateData.title = req.body.title.trim();
      if (req.body.content) updateData.content = req.body.content.trim();
      await Post.findByIdAndUpdate(
        req.params.postId,
        { $set: updateData },
        { new: true, runValidators: true }
      );
      // Redirect back to the home page to re-fetch and display updated posts.
      res.status(200).redirect('/');
    } catch (error) {
      console.error(error);
      res.status(500).render('500', { error: `Error updating post: ${error}` });
    }
  })  
// DELETE /posts/:postId - Delete a post (only if the logged-in user is the author) and its associated comments.
.delete(async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    try {
      const post = await Post.findById(req.params.postId);
      if (!post) return res.status(404).render('404', { error: 'Post not found.' });
      if (post.author.toString() !== req.session.userId) {
        return res.status(403).render('403', { error: 'Not authorized to delete this post.' });
      }
      // Delete the post
      await Post.findByIdAndDelete(req.params.postId);
      // Delete all comments associated with this post
      await Comment.deleteMany({ post: req.params.postId });
      res.status(200).redirect('/');
    } catch (error) {
      console.error(error);
      res.status(500).render('500', { error: `Error deleting post: ${error}` });
    }
  });

module.exports = router;