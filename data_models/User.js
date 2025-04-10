const mongoose = require('../mongoose-config');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  // For non-guest accounts, password is required.
  // For guest accounts, password can be empty.
  password: { 
    type: String, 
    required: function() { return !this.isGuest; } 
  },
  isGuest: { type: Boolean, default: false }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
module.exports = User;