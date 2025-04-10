const express = require('express');
const router = express.Router();
const User = require('../data_models/User');

// -------------------------
// LOGIN ENDPOINT: /login
// -------------------------
router.route('/login')
  .get((req, res) => {
    res.render('login', { hideNav: true });
  })
  .post(async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username) {
        return res.status(400).render('login', { error: 'Please enter a valid username.', hideNav: true });
      }
      const user = await User.findOne({ username: username.trim() });
      if (!user) {
        return res.status(401).render('login', { error: 'User not found. Please register first.', hideNav: true });
      }
      // If the user is a guest, they should not have a password.
      if (user.isGuest) {
        if (password && password.trim() !== '') {
          return res.status(400).render('login', { 
            error: 'Guest accounts do not have a password. Leave the password field empty.', 
            hideNav: true 
          });
        }
      } else {
        // Regular user: require and check password.
        if (!password) {
          return res.status(400).render('login', { error: 'Please enter a valid password.', hideNav: true });
        }
        if (user.password !== password) {  // In production, use bcrypt.compare()
          return res.status(401).render('login', { error: 'Incorrect password.', hideNav: true });
        }
      }
      req.session.userId = user._id;
      req.session.username = user.username;
      req.session.isGuest = user.isGuest;
      res.status(200).redirect('/account');
    } catch (err) {
      console.error(err);
      res.status(500).render('500', { error: 'Error logging in.' });
    }
  });

// ----------------------------
// REGISTER ENDPOINT: /register
// ----------------------------
router.route('/register')
  .get((req, res) => {
    res.render('register', { hideNav: true });
  })
  .post(async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).render('register', { error: 'Please enter a valid username and password.', hideNav: true });
      }
      const existingUser = await User.findOne({ username: username.trim() });
      if (existingUser) {
        return res.status(409).render('register', { error: 'Username already exists. Please choose another.', hideNav: true });
      }
      // Create a regular account (isGuest: false)
      const newUser = new User({ username: username.trim(), password, isGuest: false });
      await newUser.save();
      req.session.userId = newUser._id;
      req.session.username = newUser.username;
      req.session.isGuest = false;
      res.status(201).redirect('/account');
    } catch (err) {
      console.error(err);
      res.status(500).render('500', { error: 'Error creating account.' });
    }
  });

// --------------------------------------
// ACCOUNT MANAGEMENT ENDPOINT: /account
// (GET, PATCH, DELETE using router.route())
// --------------------------------------
router.route('/account')
  .get(async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    try {
      // Convert the Mongoose document to a plain object for Handlebars.
      const user = await User.findById(req.session.userId).lean();
      if (!user) return res.redirect('/login');
      res.render('account', { user });
    } catch (err) {
      console.error(err);
      res.status(500).redirect('/500');
    }
  })
  .patch(async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    try {
      const updateData = {};
      if (req.body.username) updateData.username = req.body.username.trim();
      // Only update password if the account is NOT a guest.
      if (!req.session.isGuest && req.body.password) {
        updateData.password = req.body.password; // In production, hash the password!
      }
      const updatedUser = await User.findByIdAndUpdate(
        req.session.userId,
        { $set: updateData },
        { new: true, runValidators: true }
      );
      req.session.username = updatedUser.username;
      res.status(200).redirect('/account');
    } catch (err) {
      console.error(err);
      res.status(500).redirect('/500');
    }
  })
  .delete(async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    try {
      await User.findByIdAndDelete(req.session.userId);
      req.session.destroy(err => {
        if (err) {
          console.error(err);
          return res.status(500).redirect('/500');
        }
        res.clearCookie('connect.sid');
        res.status(200).redirect('/login');
      });
    } catch (err) {
      console.error(err);
      res.status(500).redirect('/500');
    }
  });

// ----------------------------
// GUEST ENDPOINT: /guest
// ----------------------------
router.route('/guest')
  .get((req, res) => {
    res.render('guest', { hideNav: true });
  })
  .post(async (req, res) => {
    try {
      const { username } = req.body;
      if (!username || username.trim() === "") {
        return res.status(422).render('guest', { error: 'Please enter a valid username.', hideNav: true });
      }
      // Create a guest account (isGuest: true) with no password.
      const guestUser = new User({ username: username.trim(), password: '', isGuest: true });
      await guestUser.save();
      req.session.userId = guestUser._id;
      req.session.username = guestUser.username;
      req.session.isGuest = true;
      res.status(200).redirect('/account');
    } catch (err) {
      console.error(err);
      res.status(500).render('guest', { error: 'Error logging in as guest.', hideNav: true });
    }
  });

// ----------------------------
// LOGOUT ENDPOINT: /logout
// ----------------------------
router.route('/logout')
  .get((req, res) => {
    req.session.destroy(err => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.status(500).redirect('/500');
      }
      res.clearCookie('connect.sid');
      res.status(200).redirect('/login');
    });
  });

module.exports = router;