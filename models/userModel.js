var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var userSchema = new Schema({
  username: String,
  count: Number,
  log: [{
    description: String,
    duration: Number,
    date: Date
  }]
});
var User = mongoose.model('User', userSchema);

module.exports = User;

