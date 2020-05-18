const jwt = require('jsonwebtoken');
const HttpError = require('../models/http-error');
const Constants = require('../util/Constants');

module.exports = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }
  try {
    const token = req.headers.authorization.split(' ')[1]; // format is 'Bearer TOKEN'
    if (!token) {
     throw new HttpError('Authentication failed!', 401);
    }

    const decodedToken = jwt.verify(token, Constants.PRIVATE_KEY);
    // when creating token, userId is used as the part of argument of jwt.sign()
    req.userData = { userId: decodedToken.userId };
    return next();// if till here there's no error, go to the next in middleware pipe
  } catch (err) {
    return next(new HttpError('Authentication failed!', 401));
  }
};
