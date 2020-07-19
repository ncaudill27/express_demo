const express = require('express');
const app = express();
const port = 3000;

const helloWorld = (req, res) => res.send('Hello World!');
app.get( '/', helloWorld);


app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));