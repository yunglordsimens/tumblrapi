const express = require('express');
const OAuth = require('oauth').OAuth;
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const redis = require('redis');

const app = express();
const port = process.env.PORT || 3000;

// Добавьте эту строку для включения CORS
app.use(cors());

// Использование переменных окружения для ключей и секрета Tumblr
const tumblrConsumerKey = process.env.TUMBLR_CONSUMER_KEY;
const tumblrConsumerSecret = process.env.TUMBLR_CONSUMER_SECRET;
const callbackUrl = 'https://saltivkatype-f4fdffdf2e85.herokuapp.com/callback';

// Создание клиента Redis
const redisClient = redis.createClient(process.env.REDIS_URL);

redisClient.on('error', (err) => {
  console.log('Redis Client Error', err);
});

// Настройка хранилища сессий с использованием Redis
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: 'secret',
  resave: false,
  saveUninitialized: true
}));

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
    return res.send('Missing OAuth token, secret, or verifier.');
  }

  oa.getOAuthAccessToken(oauthToken, oauthTokenSecret, oauthVerifier, (error, oauthAccessToken, oauthAccessTokenSecret) => {
    if (error) {
      res.send('Error getting OAuth access token: ' + JSON.stringify(error));
    } else {
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

  const blogName = 'saltivkatype.tumblr.com';  // Замените на ваш блог
  oa.get(`https://api.tumblr.com/v2/blog/${blogName}/posts?api_key=` + tumblrConsumerKey, oauthAccessToken, oauthAccessTokenSecret, (error, data) => {
    if (error) {
      res.send('Error getting Tumblr posts: ' + JSON.stringify(error));
    } else {
      const posts = JSON.parse(data).response.posts;
      res.json(posts);
    }
  });
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
