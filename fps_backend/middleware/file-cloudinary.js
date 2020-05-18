const cloudinary = require('cloudinary').v2;
const Constants = require('../util/Constants');

const fileUpload = require('./file-upload');
const HttpError = require('../models/http-error');

const fileCloudinary = (req, res, next) => {
  const upload = fileUpload.single('image');
  upload(req, res, (err) => {
    if (err) {
      console.error(`error in fileCloudinary: ${err}`);
      return new HttpError('Failed to save this file!', 408);
    }
    console.log(`file uploaded to server: ${JSON.stringify(req.file)}`);

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
    // console.log(`imagePath in file-cloudinary.js: ${req.file.path}`);

    const uniqueFilename = new Date().toISOString();

    cloudinary.uploader.upload(
      req.file.path,
      { public_id: `${Constants.DIR_TAG}/${uniqueFilename}`, tags: Constants.DIR_TAG },
      (er, image) => {
        if (er) {
          console.error(`err in clodingary.uploader.upload: ${er}`);
          return new HttpError('Failed to upload the image to Cloudinary', 503);
        }
        // console.log(`file uploaded to Cloudinary: ${JSON.stringify(image)}`);
        req.userData = { ...req.userData, image: image.url };
        return next();
      }
    );
  });
};

module.exports = fileCloudinary;
