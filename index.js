require('dotenv').config();

const express = require('express');
const app = express();
const port = 3000;

const helloWorld = (req, res) => res.send('Hello World!');
app.get('/', helloWorld);

app.get('/user', (req, res) => {
  console.log(process.env.REDIRECT_URI);
  res.send(process.env.REDIRECT_URI);
} );

app.get('/login', function(req, res) {
  var scopes = 'user-read-private user-read-email';
  res.redirect('https://accounts.spotify.com/authorize' +
    '?response_type=code' +
    '&client_id=' + process.env.SPOTIFY_ID +
    (scopes ? '&scope=' + encodeURIComponent(scopes) : '') +
    '&redirect_uri=' + encodeURIComponent(process.env.REDIRECT_URI));
  });

app.get('/playlists', function(req, res) {
  playlists = fetch('https://api.spotify.com/v1/users/thatfeoguy/playlists')
  .then( res => res.json() )
  .then( data => data )
  res.send(playlists);
})

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));