const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.uri; // Your MongoDB Atlas connection string
const dbName = process.env.DB_NAME || 'myforumapp';

mongoose.connect(uri, {
  dbName,
})
.then(() => {
  console.log(`Connected to MongoDB Atlas using Mongoose!`);
})
.catch(err => {
  console.error('Mongoose connection error:', err);
});

module.exports = mongoose;