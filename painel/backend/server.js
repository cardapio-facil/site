const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const privateKey = fs.readFileSync('./private-key.pem', 'utf8');

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, function() {
    console.log('Servidor rodando na porta ' + PORT);
});