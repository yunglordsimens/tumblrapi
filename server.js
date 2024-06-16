const express = require('express');
const OAuth = require('oauth').OAuth;
const session = require('express-session');
const app = express();
const port = process.env.PORT || 3000;

// Использование переменных окружения для ключей и секрета Tumblr
const tumblrConsumerKey = process.env.TUMBLR_CONSUMER_KEY;
const tumblrConsumerSecret = process.env.TUMBLR_CONSUMER_SECRET;
const callbackUrl = 'https://saltivkatype-f4fdffdf2e85.herokuapp.com/callback';

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

// Обработчик для корневого URL
app.get('/', (req, res) => {
  res.send('Welcome to the Tumblr OAuth App!');
});

// Маршрут для инициализации OAuth авторизации
app.get('/auth', (req, res) => {
  oa.getOAuthRequestToken((error, oauthToken, oauthTokenSecret) => {
    if (error) {
      console.error('Error getting OAuth request token:', error);
      res.send('Error getting OAuth request token: ' + JSON.stringify(error));
    } else {
      console.log('OAuth Request Token:', oauthToken);
      console.log('OAuth Request Token Secret:', oauthTokenSecret);
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

  // Дополнительная отладка
  console.log('Session OAuth Token:', req.session.oauthToken);
  console.log('Session OAuth Token Secret:', req.session.oauthTokenSecret);
  console.log('Query OAuth Verifier:', req.query.oauth_verifier);

  if (!oauthToken || !oauthTokenSecret || !oauthVerifier) {
    console.error('Missing OAuth token, secret, or verifier.');
    res.send('Error: Missing OAuth token, secret, or verifier.');
    return;
  }

  console.log('OAuth Verifier:', oauthVerifier);
  console.log('OAuth Token:', oauthToken);
  console.log('OAuth Token Secret:', oauthTokenSecret);

  oa.getOAuthAccessToken(oauthToken, oauthTokenSecret, oauthVerifier, (error, oauthAccessToken, oauthAccessTokenSecret) => {
    if (error) {
      console.error('Error getting OAuth access token:', error);
      res.send('Error getting OAuth access token: ' + JSON.stringify(error));
    } else {
      console.log('OAuth Access Token:', oauthAccessToken);
      console.log('OAuth Access Token Secret:', oauthAccessTokenSecret);
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

  const blogName = 'saltivkatype.tumblr.com';  // Замените на ваш блог
  const url = `https://api.tumblr.com/v2/blog/saltivkatype/posts?api_key=${tumblrConsumerKey}`;

  oa.get(url, oauthAccessToken, oauthAccessTokenSecret, (error, data) => {
    if (error) {
      console.error('Error getting Tumblr posts:', error);
      res.send('Error getting Tumblr posts: ' + JSON.stringify(error));
    } else {
      const posts = JSON.parse(data).response.posts;
      res.json(posts);
    }
  });
});

// Маршрут для проверки времени на сервере
app.get('/time', (req, res) => {
  const now = new Date();
  res.send(`Current server time: ${now.toISOString()}`);
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
