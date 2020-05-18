const fs = require('fs');
const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const placeRoutes = require('./routes/places-routes');
const userRoutes = require('./routes/users-routes');
const HttpError = require('./models/http-error');

const app = express();

app.use(bodyParser.json());

app.use('/uploads/images', express.static(path.join('uploads', 'images')));

app.use((req, res, next) => {
  // '*' means we instruct browsers to allow all other sites/domains to access
  // our resource, but the safer measure is to set some specific domains, e.g.
  // 'localhost:3000', but don't make such a fuss, it's OK. Even if you set
  // these limitations, it's only effective to browsers, others like POSTMAN
  // never care about these headers :-)
  res.setHeader('Access-Control-Allow-Origin', '*');

  // This controls which headers incoming request may have so that they are
  // handled. The second argument shows we set green light to these three, the
  // first two and the 4th are normally set automatically, but the 3rd and 5th
  // headers are not automatically set by the browsers.
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  // This controls which HTTP methods may be used on the frontend or may be
  // attached to incoming requests.
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
  next();
});

// a filter - only those that start with it are valid
// then it is appended by the '/' in places-routes.js
// the c# equivalent is the attr [Route("api/places")]
app.use('/api/places', placeRoutes); // as a middleware
app.use('/api/users', userRoutes);

app.use((req, res, next) => {
  throw new HttpError('Could not find this route.', 404);
});

// deal with the errors thrown by those controllers
app.use((err, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, error => {
      console.error(error);
    });
  }

  if (res.headerSent) {
    // return next and forward the error which means we won't send a response
    // because we did send a response and we can ONLY send ONE response in total
    return next(err);
  }
  res.status(err.code || 500);
  return res.json({ message: err.message || 'An unknown error occurred!' });
});

// places is the DB name, if it exists just open it otherwise crete then open it
mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0-hiwha.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`)
        .then(() => {
          app.listen(process.env.PORT || 5000);
        })
        .catch(err => {
          console.error(err);
        });
