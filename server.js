const express = require('express');
const request = require('request');
const session = require('express-session');
const app = express();
const port = process.env.PORT || 3000;

// Использование переменных окружения для ключей и секрета Tumblr
const tumblrConsumerKey = process.env.TUMBLR_CONSUMER_KEY;
const tumblrConsumerSecret = process.env.TUMBLR_CONSUMER_SECRET;
const callbackUrl = 'https://saltivkatype-f4fdffdf2e85.herokuapp.com/callback';

app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));

// Обработчик для корневого URL
app.get('/', (req, res) => {
  res.send('Welcome to the Tumblr OAuth App!');
});

// Маршрут для инициализации OAuth авторизации
app.get('/auth', (req, res) => {
  const oauth = {
    consumer_key: tumblrConsumerKey,
    consumer_secret: tumblrConsumerSecret,
    callback: callbackUrl
  };

  const url = 'https://www.tumblr.com/oauth/request_token';
  request.post({ url: url, oauth: oauth }, (error, response, body) => {
    if (error) {
      console.error('Error getting OAuth request token:', error);
      res.send('Error getting OAuth request token: ' + JSON.stringify(error));
    } else {
      console.log('OAuth request token response body:', body);
      const temp1 = body.split("&");
      const oauthToken = temp1[0].split("=")[1];
      const oauthTokenSecret = temp1[1].split("=")[1];

      req.session.oauthToken = oauthToken;
      req.session.oauthTokenSecret = oauthTokenSecret;
      res.redirect('https://www.tumblr.com/oauth/authorize?oauth_token=' + oauthToken);
    }
  });
});

// Маршрут обратного вызова после авторизации пользователя
app.get('/callback', (req, res) => {
  const oauthToken = req.session.oauthToken;
  const oauthTokenSecret = req.session.oauthTokenSecret;
  const oauthVerifier = req.query.oauth_verifier;

  if (!oauthToken || !oauthTokenSecret || !oauthVerifier) {
    res.send('Error: Missing OAuth token, secret, or verifier.');
    return;
  }

  const oauth = {
    consumer_key: tumblrConsumerKey,
    consumer_secret: tumblrConsumerSecret,
    token: oauthToken,
    token_secret: oauthTokenSecret,
    verifier: oauthVerifier
  };

  const url = 'https://www.tumblr.com/oauth/access_token';
  request.post({ url: url, oauth: oauth }, (error, response, body) => {
    if (error) {
      console.error('Error getting OAuth access token:', error);
      res.send('Error getting OAuth access token: ' + JSON.stringify(error));
    } else {
      console.log('OAuth access token response body:', body);
      const temp1 = body.split("&");
      const oauthAccessToken = temp1[0].split("=")[1];
      const oauthAccessTokenSecret = temp1[1].split("=")[1];

      req.session.oauthAccessToken = oauthAccessToken;
      req.session.oauthAccessTokenSecret = oauthAccessTokenSecret;
      res.redirect('/posts');
    }
  });
});

// Маршрут для получения постов блога
app.get('/posts', (req, res) => {
  const oauthAccessToken = req.session.oauthAccessToken;
  const oauthAccessTokenSecret = req.session.oauthAccessTokenSecret;

  if (!oauthAccessToken || !oauthAccessTokenSecret) {
    res.send('Error: Missing OAuth access token or secret.');
    return;
  }

  const oauth = {
    consumer_key: tumblrConsumerKey,
    consumer_secret: tumblrConsumerSecret,
    token: oauthAccessToken,
    token_secret: oauthAccessTokenSecret
  };

  const blogName = 'saltivkatype.tumblr.com';  // Замените на ваш блог
  const url = `https://api.tumblr.com/v2/blog/saltivkatype/posts`;

  request.get({ url: url, oauth: oauth, json: true }, (error, response, body) => {
    if (error) {
      console.error('Error getting Tumblr posts:', error);
      res.send('Error getting Tumblr posts: ' + JSON.stringify(error));
    } else {
      res.json(body.response.posts);
    }
  });
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
