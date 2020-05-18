const axios = require('axios');
const HttpError = require('../models/http-error');

// const API_KEY = 'AIzaSyBnie9djsgGBSCpYlJ47D1p5HyiwwoxdkY';
const API_KEY = process.env.GOOGLE_API_KEY;

const getCoordsForAddress = async address => {
  // const urlAddress = address.replace(/[ \t]\+/, '+');
  const urlAddress = encodeURIComponent(address);
  const requestString = `https://maps.googleapis.com/maps/api/geocode/json?address=${urlAddress}&key=${API_KEY}`;

  // console.log(`requestString: ${requestString}`);
  const response = await axios.get(requestString);
  const data = response.data;
  // console.log(`locationResponseData: ${JSON.stringify(data)}, and data.status: ${data.status}`);

  if (!data || data.status === 'ZERO_RESULTS') {
    throw new HttpError('Could not find location for the specified address.', 422);
  }

  return data.results[0].geometry.location;
};

module.exports = getCoordsForAddress;
