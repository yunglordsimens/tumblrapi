const express = require('express');
const OAuth = require('oauth').OAuth;
const app = express();
const port = 3000;

const tumblrConsumerKey = '4t7uUNbPNa5nZnZxaICHOe9O1WXfeL4J2lN0UosLNv0PLhEsXZ';
const tumblrConsumerSecret = 'show';
const callbackUrl = 'http://localhost:3000/callback';

const express = require('express');
const OAuth = require('oauth').OAuth;
const session = require('express-session');
const app = express();
const port = process.env.PORT || 3000;  // Использование порта, предоставленного Heroku

const tumblrConsumerKey = process.env.4t7uUNbPNa5nZnZxaICHOe9O1WXfeL4J2lN0UosLNv0PLhEsXZ;
const tumblrConsumerSecret = process.env.show;
const callbackUrl = 'https://saltivkatype.com/callback';

app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));

const oa = new OAuth(
  'https://www.tumblr.com/oauth/request_token',
  'https://www.tumblr.com/oauth/access_token',
  tumblrConsumerKey,
  tumblrConsumerSecret,
  '1.0A',
  callbackUrl,
  'HMAC-SHA1'
);

app.get('/auth', (req, res) => {
  oa.getOAuthRequestToken((error, oauthToken, oauthTokenSecret) => {
    if (error) {
      res.send('Error getting OAuth request token: ' + error);
    } else {
      req.session.oauthToken = oauthToken;
      req.session.oauthTokenSecret = oauthTokenSecret;
      res.redirect('https://www.tumblr.com/oauth/authorize?oauth_token=' + oauthToken);
    }
  });
});

app.get('/callback', (req, res) => {
  const oauthToken = req.session.oauthToken;
  const oauthTokenSecret = req.session.oauthTokenSecret;
  const oauthVerifier = req.query.oauth_verifier;

  oa.getOAuthAccessToken(oauthToken, oauthTokenSecret, oauthVerifier, (error, oauthAccessToken, oauthAccessTokenSecret) => {
    if (error) {
      res.send('Error getting OAuth access token: ' + error);
    } else {
      req.session.oauthAccessToken = oauthAccessToken;
      req.session.oauthAccessTokenSecret = oauthAccessTokenSecret;
      res.redirect('/posts');
    }
  });
});

app.get('/posts', (req, res) => {
  const oauthAccessToken = req.session.oauthAccessToken;
  const oauthAccessTokenSecret = req.session.oauthAccessTokenSecret;

  oa.get('https://api.tumblr.com/v2/blog/anime--irl.tumblr.com/posts?api_key=' + tumblrConsumerKey, oauthAccessToken, oauthAccessTokenSecret, (error, data) => {
    if (error) {
      res.send('Error getting Tumblr posts: ' + error);
    } else {
      const posts = JSON.parse(data).response.posts;
      res.json(posts);
    }
  });
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});

const oa = new OAuth(
  'https://www.tumblr.com/oauth/request_token',
  'https://www.tumblr.com/oauth/access_token',
  tumblrConsumerKey,
  tumblrConsumerSecret,
  '1.0A',
  callbackUrl,
  'HMAC-SHA1'
);

app.get('/auth', (req, res) => {
  oa.getOAuthRequestToken((error, oauthToken, oauthTokenSecret, results) => {
    if (error) {
      res.send('Error getting OAuth request token: ' + error);
    } else {
      req.session.oauthToken = oauthToken;
      req.session.oauthTokenSecret = oauthTokenSecret;
      res.redirect('https://www.tumblr.com/oauth/authorize?oauth_token=' + oauthToken);
    }
  });
});

app.get('/callback', (req, res) => {
  const oauthToken = req.session.oauthToken;
  const oauthTokenSecret = req.session.oauthTokenSecret;
  const oauthVerifier = req.query.oauth_verifier;

  oa.getOAuthAccessToken(oauthToken, oauthTokenSecret, oauthVerifier, (error, oauthAccessToken, oauthAccessTokenSecret, results) => {
    if (error) {
      res.send('Error getting OAuth access token: ' + error);
    } else {
      req.session.oauthAccessToken = oauthAccessToken;
      req.session.oauthAccessTokenSecret = oauthAccessTokenSecret;
      res.redirect('/posts');
    }
  });
});

app.get('/posts', (req, res) => {
  const oauthAccessToken = req.session.oauthAccessToken;
  const oauthAccessTokenSecret = req.session.oauthAccessTokenSecret;

  oa.get('https://api.tumblr.com/v2/blog/anime--irl.tumblr.com/posts?api_key=' + tumblrConsumerKey, oauthAccessToken, oauthAccessTokenSecret, (error, data, response) => {
    if (error) {
      res.send('Error getting Tumblr posts: ' + error);
    } else {
      const posts = JSON.parse(data).response.posts;
      res.json(posts);
    }
  });
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
