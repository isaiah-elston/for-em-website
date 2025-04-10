const express = require('express');
const router = express.Router();
const Post = require('../data_models/Post');

router.get('/', async (req, res) => {
  if (req.session.username) {
    try {
      // Retrieve all posts, populate the author's username and virtual comments,
      // sort posts by newest first, and convert to plain JavaScript objects.
      const posts = await Post.find()
        .populate('author', 'username')
        .populate({
          path: 'comments',
          populate: { path: 'author', select: 'username' }
        })
        .sort({ createdAt: -1 })
        .lean();

      // Render the home view with the user's username and the retrieved posts (with comments)
      res.status(200).render('home', { username: req.session.username, posts });
    } catch (err) {
      console.error(err);
      res.status(500).render('500', { error: `Error loading posts: ${err}` });
    }
  } else {
    res.status(401).redirect('/login');
  }
});

module.exports = router;
