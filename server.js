const express = require('express');
const mongoose = require('mongoose');
const userModel = require('./models/userModel');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

mongoose.connect(process.env.MLAB_URI, {"useNewUrlParser": true, "useUnifiedTopology": true});

app.use(cors());

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json())


app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/exercise/users', function(req, res, done) {
  userModel.find({}, function(err, users) {
    if (err) throw err;
    done(null, res.send(users));
  })
});

app.get('/api/exercise/log', function(req, res, done) {
  const { userId, from, to, limit } = req.query;
  userModel.find({_id: userId})
  .select('-log._id -__v')
  .slice('log', parseInt(limit))
  .exec(function(err, eLog) {
    if (err) throw err;
    eLog[0].log = eLog[0].log.filter(function(o) {
      let min = from ? new Date(from) : undefined;
      let max = to ? new Date(to) : undefined;
      if (min && max) {
        return o.date >= min && o.date <= max;
      } else if (min) {
        return o.date >= min;
      } else if (max) {
        return o.date <= max;
      } else {
        return o.date;
      }
    });
    res.send(eLog);
  });
});

app.post('/api/exercise/new-user', function(req, res) {  
  userModel.create({username: req.body.username}, function(err, user) {
    if (err) throw err;
    const { _id, username } = user;
    res.json({_id, username});
    console.log('User has been saved.')
  });
});

app.post('/api/exercise/add', function(req, res, done) {
  userModel.findById(req.body.userId, function(err, data) {
    
    if (err) throw err;  
    const { description, duration, date } = req.body;
      
    var obj = {
      description,
      duration,
      date: date || Date.now()
    };
    
    data.log.push(obj);
    data.count = data.log.length;
    data.save();
      
    obj._id = data._id;
    obj.username = data.username;
    obj.date = new Date(obj.date).toDateString();
      
    res.send(obj);
    console.log('Exercise has been added.')
  });
});

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
})
