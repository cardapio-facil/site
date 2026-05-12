const express = require('express');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const privateKey = process.env.PRIVATE_KEY || '';

app.post('/sign-message', function(req, res) {
    const toSign = req.body.request;

    const signature = crypto
        .createSign('SHA512')
        .update(toSign)
        .sign(privateKey, 'base64');

    res.send(signature);
});

app.get('/', function(req, res) {
    res.send('QZ Sign Server OK');
});

module.exports = app;
