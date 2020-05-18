const fs = require('fs');
const cloudinary = require('cloudinary').v2;

const mongoose = require('mongoose');
const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');
const Place = require('../models/place');
const User = require('../models/user');
const Constants = require('../util/Constants');

const getPlaceById = async(req, res, next) => {
  const placeId = req.params.pid; // {pid: 'p1'}

  try {
    const place = await Place.findById(placeId);
    if (!place) {
      return next(new HttpError('Could not find the place for a provided ID', 404));
    }

    return res.status(200).json({ place: place.toObject({ getters: true }) });
  } catch (err) {
    return next(new HttpError('Something went wrong, could not find a place', 500));
  }
};

/* const getPlacesByUserId = async(req, res, next) => {
  const userId = req.params.uid;

  try {
    const places = await Place.find({ creator: userId });
    if (places.length <= 0) {
      return next(new HttpError('Could not find any place with this user id', 404));
    }

    return res.status(200).json({ places: places.map(p => p.toObject({ getters: true })) });
  } catch (err) {
    return next(new HttpError('Something went wrong, please try it again later', 500));
  }
}; */

const getPlacesByUserId = async(req, res, next) => {
  const userId = req.params.uid;

  try {
    const userWithPlaces = await User.findById(userId).populate('places');
    if (!userWithPlaces) {
      return next(new HttpError('This user does not exist', 404));
    }
    return res.status(200).json({ places: userWithPlaces.places.map(p => p.toObject({ getters: true })) });
  } catch (err) {
    console.error(`err: ${err}`);
    return next(new HttpError('Something went wrong, please try it again later', 500));
  }
};

const createPlace = async(req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(`erros in createPlace: ${JSON.stringify(errors)}`);
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  // object destructuring syntax in modern JS
  const { title, description, address } = req.body;
  let coordinates = {};

  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    console.error(`coordinates error in createPlace: ${JSON.stringify(error)}`);
    return next(error);
  }

  // console.log(`req.userData.image inside createPlace: ${req.userData.image}`);
  const createdPlace = new Place({
    title: title,
    description: description,
    address: address,
    location: coordinates,
    // image: req.file.path,   // stored on the same server as where source codes stay
    image: req.userData.image, // stored on Cloudinary
    creator: req.userData.userId
  });

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch(err) {
     // console.error(`user in createPlace: ${user}`);
    return next(new HttpError('Could not find user for the provided id', 404));
  }

  let sess;
  try {
    sess = await mongoose.startSession();
    sess.startTransaction();
    const result = await createdPlace.save({ session: sess });

    // Actually mongoose grabs the createdPlace id and add it to places property,
    // this trick is attributed to the ref property in model file, ref is FK,
    // ORM guys like EF(Entity Framework) does the same: map an id to an object,
    // vice versa.
    user.places.push(createdPlace);
    await user.save({ session: sess });

    // if only if this operation succeeds, all data will be stored in DB, otherwise
    // all relevant data in DB will be rolled back to the status before
    // sess.startTransaction();
    await sess.commitTransaction();

    return res.status(201).json({ place: result.toObject({ getters: true }) });
  } catch (err) {
    console.error(JSON.stringify(err));
    return next(new HttpError('Creating place failed, please try it again.', 500));
  } finally {
    // eslint-disable-next-line no-sync
    fs.unlinkSync(req.file.path);
    console.log(`${req.file.path} is deleted.`);
    sess.endSession();
  }
};

const updatePlace = async(req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError('Invalid inputs passed, please check your data.', 422));
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;

  try {
    const userId = req.userData.userId;
    const place = await Place.findById(placeId);
    if (!place || userId !== place.creator.toString()) { // mongoose id object to a string
      throw new Error('Token failed.');
    }
  } catch (err) {
    return next(new HttpError('You are not allowed to edit this place', 401));
  }

  await Place.findByIdAndUpdate(
    placeId, {
      title: title,
      description: description,
    },
    { new: true }, // indicates to return the UPDATED value, thus true
    (err, result) => { // callback is a must, otherwise it won't be executed
      if (err) {
        // res.send(err);
        return next(new HttpError('Could not update data for this id, please try it again later', 500));
      }
      return res.send(result.toObject({ getters: true }));
    }
  );
};

const deletePlace = async(req, res, next) => {
  const placeId = req.params.pid;

  try {
    const userId = req.userData.userId;
    const place = await Place.findById(placeId);
    if (!place || place.creator.toString() !== userId) {
      throw new Error('Token failed!');
    }
  } catch(err) {
    return next(new HttpError('You are not allowed to delete this place.', 401));
  }

  let place;
  try {
    // populate() makes the creator property in place object grow to a User
    // object, we call it subdocument, refer to this in placeSchema:
    // creator: {type: mongoose.Types.ObjectId, required: true, ref: 'User'}
    place = await Place.findById(placeId).populate('creator');
  } catch (err) {
    console.error(JSON.stringify(err));
    return next(new HttpError('Something went wrong during finding the place', 500));
  }

  if (!place) {
    return next(new HttpError('Could not find place for the provided id', 404));
  }

  let sess;
  try {
    sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({ session: sess });
    place.creator.places.pull(place);// Mongoose converts place to an ObjectId automatically; pull is opposite to push
    await place.creator.save({ session: sess });
    await sess.commitTransaction();

    // console.log(`place.image: ${place.image}`);
    const indexTag = place.image.indexOf(Constants.DIR_TAG);
    const indexLastPeriod = place.image.lastIndexOf('.');
    const publicId = place.image.substring(indexTag, indexLastPeriod);
    // console.log(`publicId: ${publicId}`);

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });

    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        console.error(`error when destroying a cloudinary file: ${error}`);
        throw new Error('error when destroying a cloudinary file');
      }
      console.log(`result of destroying a cloudinary file: ${JSON.stringify(result)}`);
    });

    return res.status(200).json({ message: `${placeId} is deleted!` });
  } catch (err) {
    console.error(`Caught an error when destroying a cloudianry file: ${err}`);
    return next(new HttpError('Something went wrong, could not delete place', 500));
  } finally {
    sess.endSession();
  }

  /* let deletedPlace;
  await Place.findByIdAndDelete(placeId, (err, result) => {
    if (err) {
      return next(
        new HttpError('Something went wrong, could not delete place', 500)
      );
    }
    deletedPlace = result;
  });

  try {
    const index = user.places.findIndex((oid) => oid.toString() === placeId);
    if (index !== -1) {
      user.places.splice(index, 1);
      await user.save();
    }
    return res.status(200).json({ message: `${deletedPlace.id} is deleted!` });
  } catch (err) {
    return next(new HttpError('Deleting operation failed, please try it again.'));
  } */
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
