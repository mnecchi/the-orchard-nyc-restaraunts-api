require('dotenv').config();

const express = require('express');
const api = require('./src/api');
const PORT = process.env.PORT || 5000;

express()
  .get('/restaurants', api.getRestaurants)
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));
