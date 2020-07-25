require('dotenv').config();
const cookieSession = require('cookie-session');
const { v4: uuid } = require('uuid');
const fetch = require('node-fetch');

const express = require('express');
const app = express();
const port = 3000;

app.use(cookieSession({
  name: 'session',
  keys: [process.env.KEY_1, process.env.KEY_2],
  cookie: {
    // secure: true,
    httpOnly: true,
  }
}));
app.disable('x-powered-by');

app.get('/', (req, res) => {

  // refresh uuid
  const id = uuid();

  // set state
  req.session.state = id;

  console.log('New session state set: ', id); //! DELETE IN PRODUCTION
  res.send('Hello World!')
});

//? useless route?
app.get('/user', (req, res) => {
  console.log(process.env.REDIRECT_URI); //! DELETE IN PRODUCTION
  res.send(process.env.REDIRECT_URI);
} );

app.get('/authorize', function(req, res) {
  const scopes = 'user-read-private user-read-email';
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
  const code = decodeURIComponent(req.query.code); // success parameter
  const buffer = new Buffer(process.env.SPOTIFY_ID + ':' + process.env.SPOTIFY_SECRET);
  const encodedAuthorization = buffer.toString('base64');
  console.log('Authorization code: ', code);
  console.log('Encoded authorization: ', encodedAuthorization);

  // deny any responses with altered state parameter
  if (state !== req.session.state) res.end('ACCESS DENIED!!!'); //? secure way to handle code parameter

  // show error message if any
  if (err) res.end(err);

  fetch('https://accounts.spotify.com/api/token', {
    'method': 'POST',
    'headers': {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic `
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect: process.env.REDIRECT_URI
    })
  })
  .then( res => res.json() )
  .then( data => console.log("Success: ", data) )
  .catch( err => console.log("Error: ", err) );
});


app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));