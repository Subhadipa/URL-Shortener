const express = require('express');
var bodyParser = require('body-parser');
require('dotenv').config()
const route = require('./routes/route.js');
const cors=require("cors")
const PORT=process.env.PORT || 3000
const DATABASE=process.env.DATABASE
const app = express();



app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors())
const mongoose = require('mongoose')


let connection_uri =DATABASE
mongoose.connect(connection_uri, { useNewUrlParser: true })
    .then(() => console.log(`Mongodb running on port ${PORT}`))
    .catch(err => console.log(err))


app.use('/', route);


app.listen(PORT, function () {
    console.log(`Express app running on port ${PORT}`)
});