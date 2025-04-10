const request = require('supertest');
const chai = require('chai');
chai.should();
const app = require('../index');

describe('Users API', function() {
  this.timeout(5000);
  let userId;

  it('should create a new user', async function() {
    const res = await request(app)
      .post('/api/users')
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .send({ username: 'testuser', password: 'testpass', isGuest: false });
    res.status.should.equal(201);
    res.body.should.have.property('_id');
    res.body.should.have.property('username', 'testuser');
    userId = res.body._id;
  });

  it('should retrieve all users', async function() {
    const res = await request(app)
      .get('/api/users')
      .set('Accept', 'application/json');
    res.status.should.equal(200);
    res.body.should.be.an('array');
  });

  it('should retrieve the created user by id', async function() {
    const res = await request(app)
      .get(`/api/users/${userId}`)
      .set('Accept', 'application/json');
    res.status.should.equal(200);
    res.body.should.have.property('_id', userId);
  });

  it('should update the user using PATCH', async function() {
    const res = await request(app)
      .patch(`/api/users/${userId}`)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .send({ username: 'updateduser' });
    res.status.should.equal(200);
    res.body.should.have.property('username', 'updateduser');
  });

  it('should delete the user', async function() {
    const res = await request(app)
      .delete(`/api/users/${userId}`)
      .set('Accept', 'application/json');
    res.status.should.equal(200);
    res.body.should.have.property('message');
  });
});

describe('Posts API', function() {
  this.timeout(5000);
  let postId;
  let testUserId;
  const agent = request.agent(app); // Use agent to maintain session

  before(async function() {
    // Create a test user for posts
    const res = await agent
      .post('/api/users')
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .send({ username: 'postAuthor', password: 'postpass', isGuest: false });
    testUserId = res.body._id;
    // Log in via the web login route (which sets session cookies)
    const loginRes = await agent
      .post('/login')
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .send({ username: 'postAuthor', password: 'postpass' });
    // Expect a redirect (302) upon successful login
    loginRes.status.should.equal(302);
  });

  it('should create a new post', async function() {
    const res = await agent
      .post('/api/posts')
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .send({ title: 'Test Post', content: 'This is test content' });
    res.status.should.equal(201);
    res.body.should.have.property('_id');
    res.body.should.have.property('title', 'Test Post');
    postId = res.body._id;
  });

  it('should retrieve all posts', async function() {
    const res = await agent
      .get('/api/posts')
      .set('Accept', 'application/json');
    res.status.should.equal(200);
    res.body.should.be.an('array');
  });

  it('should retrieve the created post', async function() {
    const res = await agent
      .get(`/api/posts/${postId}`)
      .set('Accept', 'application/json');
    res.status.should.equal(200);
    res.body.should.have.property('_id', postId);
  });

  it('should update the post using PATCH', async function() {
    const res = await agent
      .patch(`/api/posts/${postId}`)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .send({ title: 'Updated Test Post' });
    res.status.should.equal(200);
    res.body.should.have.property('title', 'Updated Test Post');
  });

  it('should delete a post and its associated comments', async function() {
    // Create a new post for deletion test.
    const createPostRes = await agent
      .post('/api/posts')
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .send({ title: 'Post for Deletion', content: 'Content to be deleted' });
    createPostRes.status.should.equal(201);
    const newPostId = createPostRes.body._id;
    
    // Create a comment for this post
    const createCommentRes = await agent
      .post('/api/comments')
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .send({ post: newPostId, author: testUserId, content: 'Comment to be deleted' });
    createCommentRes.status.should.equal(201);
    const commentId = createCommentRes.body._id;
    
    // Delete the post (which should also delete the associated comment)
    const deletePostRes = await agent
      .delete(`/api/posts/${newPostId}`)
      .set('Accept', 'application/json');
    deletePostRes.status.should.equal(200);
    deletePostRes.body.should.have.property('message');
    
    // Try to retrieve the comment and expect a 404 error
    const getCommentRes = await agent
      .get(`/api/comments/${commentId}`)
      .set('Accept', 'application/json');
    getCommentRes.status.should.equal(404);
  });
});

describe('Comments API', function() {
  this.timeout(5000);
  let commentId, postIdForComments, userIdForComments;
  const agent = request.agent(app);

  before(async function() {
    // Create a test user for comments
    const userRes = await agent
      .post('/api/users')
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .send({ username: 'commentAuthor', password: 'commentpass', isGuest: false });
    userIdForComments = userRes.body._id;
    // Log in as this user via the web login route
    const loginRes = await agent
      .post('/login')
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .send({ username: 'commentAuthor', password: 'commentpass' });
    loginRes.status.should.equal(302);
    // Create a post for comments
    const postRes = await agent
      .post('/api/posts')
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .send({ title: 'Post for Comments', content: 'Content for comment testing' });
    postRes.status.should.equal(201);
    postIdForComments = postRes.body._id;
  });

  it('should create a new comment', async function() {
    const res = await agent
      .post('/api/comments')
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .send({ post: postIdForComments, author: userIdForComments, content: 'This is a test comment' });
    res.status.should.equal(201);
    res.body.should.have.property('_id');
    res.body.should.have.property('content', 'This is a test comment');
    commentId = res.body._id;
  });

  it('should retrieve all comments', async function() {
    const res = await agent
      .get('/api/comments')
      .set('Accept', 'application/json');
    res.status.should.equal(200);
    res.body.should.be.an('array');
  });

  it('should retrieve the created comment', async function() {
    const res = await agent
      .get(`/api/comments/${commentId}`)
      .set('Accept', 'application/json');
    res.status.should.equal(200);
    res.body.should.have.property('_id', commentId);
  });

  it('should update the comment using PATCH', async function() {
    const res = await agent
      .patch(`/api/comments/${commentId}`)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .send({ content: 'Updated comment content' });
    res.status.should.equal(200);
    res.body.should.have.property('content', 'Updated comment content');
  });

  it('should delete the comment', async function() {
    const res = await agent
      .delete(`/api/comments/${commentId}`)
      .set('Accept', 'application/json');
    res.status.should.equal(200);
    res.body.should.have.property('message');
  });
});
