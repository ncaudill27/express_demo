require('dotenv').config();
const fetch = require('node-fetch');

const express = require('express');
const app = express();
const port = 3000;

const helloWorld = (req, res) => res.send('Hello World!');
app.get('/', helloWorld);

app.get('/user', (req, res) => {
  console.log(process.env.REDIRECT_URI);
  res.send(process.env.REDIRECT_URI);
} );

app.get('/authorize', function(req, res) {
  var scopes = 'user-read-private user-read-email';
  // cookie needs to be set up
  // req.session.state
  res.redirect('https://accounts.spotify.com/authorize' +
    '?response_type=code' +
    '&client_id=' + process.env.SPOTIFY_ID +
    (scopes ? '&scope=' + encodeURIComponent(scopes) : '') +
    '&redirect_uri=' + encodeURIComponent(process.env.REDIRECT_URI));
});

app.get('/callback', function(req, res) {
  const state = req.query.state;
  console.log(state);
});


app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));