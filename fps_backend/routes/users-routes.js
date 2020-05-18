const express = require('express');
const { check } = require('express-validator');
const router = express.Router();

const usersController = require('../controllers/users-controller');
const fileCloudinary = require('../middleware/file-cloudinary');

router.get('/', usersController.getUsers);
router.post(
  '/signup',
  // fileUpload.single('image'), // uploaded image to be stored on local server
  fileCloudinary, // middleware for uploaded image to be stored on Cloudinary
  [
    check('name').not().isEmpty(),
    check('email').normalizeEmail().isEmail(),
    check('password').isLength({ min: 6 }),
  ],
  usersController.signup
);
router.post('/login', usersController.login);

module.exports = router;
