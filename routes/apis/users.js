const express = require('express');
const router = express.Router();
const User = require('../../data_models/User'); // Adjust path if needed

// ------------------------------
// Endpoints for the entire Users collection
// ------------------------------
router.route('/')
  // GET /api/users - Retrieve all users
  .get(async (req, res) => {
    try {
      const users = await User.find().lean();
      res.status(200).json(users);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error fetching users.' });
    }
  })
  // POST /api/users - Create a new user (regular or guest)
  .post(async (req, res) => {
    try {
      const { username, password, isGuest } = req.body;
      if (!username || (isGuest !== true && !password)) {
        return res.status(400).json({ error: 'For regular accounts, username and password are required. For guest accounts, only username is required.' });
      }
      // Check if user already exists
      const existingUser = await User.findOne({ username: username.trim() });
      if (existingUser) {
        return res.status(409).json({ error: 'Username already exists.' });
      }
      // Create new user with isGuest flag. If isGuest is true, password can be empty.
      const newUser = new User({ 
        username: username.trim(), 
        password: password || '', 
        isGuest: Boolean(isGuest) 
      });
      await newUser.save();
      res.status(201).json(newUser);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error creating user.' });
    }
  });

// ------------------------------
// Endpoints for a specific user resource: /api/users/:userId
// ------------------------------
router.route('/:userId')
  // GET /api/users/:userId - Retrieve a single user
  .get(async (req, res) => {
    try {
      const user = await User.findById(req.params.userId).lean();
      if (!user) return res.status(404).json({ error: 'User not found.' });
      res.status(200).json(user);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error fetching user.' });
    }
  })
  // PUT /api/users/:userId - Replace a user's data entirely
  .put(async (req, res) => {
    try {
      const { username, password, isGuest } = req.body;
      if (!username || (isGuest !== true && !password)) {
        return res.status(400).json({ error: 'For regular accounts, username and password are required. For guest accounts, only username is required.' });
      }
      const user = await User.findById(req.params.userId);
      if (!user) return res.status(404).json({ error: 'User not found.' });
      // Replace fields entirely
      user.username = username.trim();
      user.password = password || '';
      user.isGuest = Boolean(isGuest);
      await user.save();
      res.status(200).json(user);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error updating user.' });
    }
  })
  // PATCH /api/users/:userId - Partially update a user's data
  .patch(async (req, res) => {
    try {
      const updateData = {};
      if (req.body.username) updateData.username = req.body.username.trim();
      // Only update password if the user is not a guest
      if (req.body.password) {
        const currentUser = await User.findById(req.params.userId);
        if (!currentUser) return res.status(404).json({ error: 'User not found.' });
        if (!currentUser.isGuest) {
          updateData.password = req.body.password;
        }
      }
      const updatedUser = await User.findByIdAndUpdate(
        req.params.userId,
        { $set: updateData },
        { new: true, runValidators: true }
      );
      if (!updatedUser) return res.status(404).json({ error: 'User not found.' });
      res.status(200).json(updatedUser);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error updating user.' });
    }
  })
  // DELETE /api/users/:userId - Delete a user
  .delete(async (req, res) => {
    try {
      const deletedUser = await User.findByIdAndDelete(req.params.userId);
      if (!deletedUser) return res.status(404).json({ error: 'User not found.' });
      res.status(200).json({ message: 'User deleted successfully.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error deleting user.' });
    }
  });

module.exports = router;