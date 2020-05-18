const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const HttpError = require('../models/http-error');
const User = require('../models/user');
const Constants = require('../util/Constants');

const getUsers = async(req, res, next) => {
  try {
    // return all properties but password - exclude it!
    const users = await User.find({}, '-password');
    return res.status(200).json({ users: users.map(u => u.toObject({ getters: true })) });
  } catch (error) {
    return next(new HttpError('Something went wrong, please try it again later.', 500));
  }
};

const signup = async(req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const { name, email, password } = req.body;
  const places = [];

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    return next(
      new HttpError('Signing up failed, please try it again later.', 500)
    );
  }

  if (existingUser) {
    return next(
      new HttpError('User exists already, please login instead.', 422)
    );
  }

  let hashedPassword;
  try {
    // the 2nd argument is the level how much the strength is, here it means 12
    // salting rounds
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    console.error(err);
    return next(new HttpError('Could not create user, please try again.', 500));
  }

  try {
    const createdUser = new User({
      name: name,
      email: email,
      password: hashedPassword,
      // image: req.file.path,   // stored on the same server as where source codes stay
      image: req.userData.image, // stored on Cloudinary
      places: places,
    });
    await createdUser.save();

    let token;
    try {
      // the 2nd argument secretOrPrivateKey is a string which only the server knows
      // so which you should never ever share with anyone! Of course it ought to only
      // stay in your server side code. Certainly you can give it any string you like
      token = jwt.sign(
        { userId: createdUser.id, email: createdUser.email },
        Constants.PRIVATE_KEY,
        { expiresIn: Constants.EXPIRATION }
      );
    } catch (err) {
      console.error(err);
      return next(new HttpError('Signing up failed, please try again later.', 500));
    }

    return res.status(201).json({ userId: createdUser.id, email: createdUser.email, token: token });
  } catch (err) {
    return next(
      new HttpError('Signing up failed, please try it again later.', 500)
    );
  } finally {
    // eslint-disable-next-line no-sync
    fs.unlinkSync(req.file.path);
    console.log(`${req.file.path} is deleted.`);
  }
};

const login = async(req, res, next) => {
  const { email, password } = req.body;

  try {
    const identifiedUser = await User.findOne({ email: email });
    if (!identifiedUser) {
      return next(new HttpError('Invalid credentials, could not log you in.', 403));
    }

    try {
      const isValidPassword = await bcrypt.compare(password, identifiedUser.password);
      if (!isValidPassword) {
        return next(new HttpError('Invalid credentials, could not log you in.', 403));
      }
    } catch (err) {
      return next(new HttpError('Could not log you in, please check your credentials and try it again.'), 500);
    }

    let token;
    try {
      token = jwt.sign(
        { userId: identifiedUser.id, email: identifiedUser.email },
        Constants.PRIVATE_KEY,
        { expiresIn: Constants.EXPIRATION }
      );
    } catch (err) {
      console.error(err);
      return next(new HttpError('Logging in failed, please try again later.', 500));
    }

    return res.status(200).json({ userId: identifiedUser.id, email: identifiedUser.email, token: token });
  } catch(err) {
    return next(new HttpError('Something went wrong, please try it again later.', 401));
  }
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
