"use strict";
// Imports
const bodyParser = require("body-parser");
require("dotenv").config();
const express = require("express");
const {engine : expressHandlebars} = require("express-handlebars");
const session = require("express-session");
const methodOverride = require('method-override');
const path = require("path");


// Global Values
const app = express();
const PORT = process.env.PORT || 3000;
// const router = express.Router();

// Configuring Handlebars
app.engine('handlebars', expressHandlebars({
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views', 'layouts'),
  helpers: {
    eq: function(a, b) { return a === b; }
  }
}));

app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

// Configuring Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: process.env.session_key || 'the_default_key',
  resave: false,
  saveUninitialized: true
}));
app.use(methodOverride('_method'));

// Expose session to templates
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// Ensuring the navbar can never show up before user authentication
const hideNavPaths = ['/login*', '/register*', '/guest*'];
app.use((req, res, next) => {
  res.locals.hideNav = hideNavPaths.includes(req.path);
  next();
});

// Configuring Routes
const homeRoutes = require("./routes/home");
app.use("/", homeRoutes);

const userAuthRoutes = require("./routes/user_auth");
app.use("/", userAuthRoutes);

const userApiRoutes = require('./routes/apis/users');
app.use('/api/users', userApiRoutes);

const postsRoutes = require("./routes/posts");
app.use("/", postsRoutes);

const postsApiRoutes = require("./routes/apis/posts");
app.use("/api/posts", postsApiRoutes);

const commentRoutes = require('./routes/comments');
app.use("/", commentRoutes);

const commentsApiRoutes = require('./routes/apis/comments');
app.use('/api/comments', commentsApiRoutes)

app.use((req, res, next) => {
  res.status(404).render('404', { hideNav: true });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('500', { error: 'Server Error! ${err}' });
});

// Listener to Verify Correct Server Setup
const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = server;