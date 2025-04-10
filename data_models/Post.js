const mongoose = require('../mongoose-config');

const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
}, { timestamps: true });

// Virtual for comments (does not store data in the Post document)
postSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post',
  justOne: false
});

// Ensure virtuals are included in toObject/toJSON output
postSchema.set('toObject', { virtuals: true });
postSchema.set('toJSON', { virtuals: true });

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
