const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const StatsSchema = new Schema({
    onsite:{
      type: Number,
      required:true
    },
    offsite:{
      type: Number,
      required:true
    },
    totalpots:{
      type: Number,
      required:true
    },
    profit:{
      type: Number,
      required:true
    },
    totalusers:{
      type:Number,
      required:true
    }
  });
  
  module.exports = Stats = mongoose.model("stats", StatsSchema);