const express = require('express');
const { check } = require('express-validator');

const router = express.Router();

// placeController is the module name of place-controller.js - a naming convention
const placeController = require('../controllers/places-controller');
const checkAuth = require('../middleware/check-auth');
const fileCloudinary = require('../middleware/file-cloudinary');

// the '/' is a must to be appended on the '/api/places' in app.js, furthermore
// if it's a Dynamic Route Segment, then we need append a semicolon :, i.e. '/:'
router.get('/:pid', placeController.getPlaceById);
router.get('/user/:uid', placeController.getPlacesByUserId);

router.use(checkAuth); // below it, all routes are protected by the valid token

router.post(
  '/',
  // fileUpload.single('image'), // uploaded image to be stored on local server
  fileCloudinary, // middleware for uploaded image to be stored on Cloudinary
  [
    check('title').not().isEmpty(),
    check('description').isLength({ min: 5 }),
    check('address').not().isEmpty(),
  ],
  placeController.createPlace
);
router.patch(
  '/:pid',
  [
    check('title').not().isEmpty(),
    check('description').isLength({ min: 5 })
  ],
  placeController.updatePlace
);
router.delete('/:pid', placeController.deletePlace);

module.exports = router;
