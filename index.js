require('dotenv').config();
const cookieSession = require('cookie-session');
const { v4: uuid } = require('uuid');
const fetch = require('node-fetch');

const express = require('express');
const app = express();
const port = 3000;

app.set('trust proxy', 1);

app.use(cookieSession({
  name: 'session',
  keys: [process.env.KEY_1, process.env.KEY_2],
  cookie: {
    // secure: true,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
app.disable('x-powered-by');

const encodedAuthorization = new Buffer.from(process.env.SPOTIFY_ID + ':' + process.env.SPOTIFY_SECRET).toString('base64');
const refreshTokens = {};


app.get('/', (req, res) => {

  // refresh uuid
  const id = uuid();

  // set state
  req.session.state = id;
  console.log('New session state set: ', id); //! DELETE IN PRODUCTION

  console.log('Cookie: ', req.session);
  console.log('Username in cookie: ', req.session.username);
  if (req.session.username) res.send(`Hello ${req.session.username}`)
  else res.send('Hello World!');
});

app.get('/:user', (req, res) => {
  
  console.log(refreshTokens[req.params.user]);
  res.send(`${req.params.user} logged in`);
});

app.get('/authorize', function(req, res) {
  const scopes = 'user-read-private user-modify-playback-state playlist-read-private';
  console.log('Sending state: ', req.session.state); //! DELETE IN PRODUCTION
  res.redirect('https://accounts.spotify.com/authorize' +
    '?response_type=code' +
    '&client_id=' + process.env.SPOTIFY_ID +
    (scopes ? '&scope=' + encodeURIComponent(scopes) : '') +
    // grab state from session
    '&state=' + req.session.state +
    '&redirect_uri=' + encodeURIComponent(process.env.REDIRECT_URI));
});


app.get('/callback', function(req, res) {
  const state = req.query.state;
  const err = decodeURIComponent(req.query.error); // failed parameter

  // deny any responses with altered state parameter
  if (state !== req.session.state) res.end('ACCESS DENIED!!!'); //? secure way to handle code parameter

  // show error message if any
  if (err) res.end(err);

  authorizeUser(req, res)
  .then( ({ userData, refreshToken, accessToken, accessExpiration }) => {
    refreshTokens[userData.id] = {
      refreshToken,
      accessToken,
      accessExpiration
    };

    res.redirect('http://localhost:3000/' + user.id);
  })
  .catch( err => res.end('/callback err: ', err) );
});

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));

function authorizeUser(req, res) {
  const code = req.query.code; // success parameter

  console.log('Authorization code: ', code); //! DELETE IN PRODUCTION
  console.log('Encoded authorization: ', encodedAuthorization); //! DELETE IN PRODUCTION

  return fetch('https://accounts.spotify.com/api/token' + 
    '?grant_type=authorization_code' +
    '&code=' + code +
    '&redirect_uri=' + process.env.REDIRECT_URI,
    {
      'method': 'POST',
      'headers': {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${encodedAuthorization}`,
        'Accept': 'application/json'
      }
    }
  )
  .then( res => res.json() )
  .then( data => {
    console.log("Data: ", data) //! DELETE IN PRODUCTION
    // return error message
    if (data.error) res.end(data.error_description)

    const { access_token, token_type, expires_in, refresh_token, scope } = data;
    const tokenAuthorizationHeader = token_type + ' ' + access_token;
    req.session.refreshToken = refresh_token;

    console.log('Authorization Header: ', tokenAuthorizationHeader);
    return fetch('https://api.spotify.com/v1/me', {
      'method': 'GET',
      'headers': {
        'Authorization': tokenAuthorizationHeader,
        'Accept': 'application/json'
      }
    })
    .then( res => res.json() )
    .then( data => {
      return { userData: data, refreshToken: refresh_token, accessToken: access_token, accessExpiration: expires_in }
    } )
  } );
}

function refreshToken(req, res) {

  //! temp implementation 
  const refreshToken = localStorage.getItem('refreshToken');
  // desired implementation
  // const refeshToken = refreshTokens[username];

  return fetch('https://accounts.spotify.com/api/token' + 
    '?grant_type=refresh_token' + refreshToken,
    {
      'method': 'POST',
      'headers': {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': tokenAuthorizationHeader
      }
    }
  )
  .then( res => res.json() )
  .then( data => data );
}