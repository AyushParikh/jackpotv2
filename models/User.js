const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const UserSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  balance: {
    type: Number,
    default: 0
  },
  private_key: {
    type: String,
    required:true
  },
  address: {
    type: String,
    required:true
  },
  public_key: {
    type: String,
    required:true
  },
  wif: {
    type: String,
    required:true
  }
});

module.exports = User = mongoose.model("users", UserSchema);
