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
  const code = req.query.code; // success parameter
  const err = req.query.error; // failed parameter

  // deny any responses with altered state parameter
  if (state !== req.session.state) res.end('ACCESS DENIED!!!'); //? secure way to handle code parameter


  console.log(state);
});


app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));