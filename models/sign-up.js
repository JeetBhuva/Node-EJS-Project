const mongoose = require('mongoose');


const sign_up_Schema = new mongoose.Schema({
    User_email:{
        type:String
    },
    Mobile_number:{
        type:String
    },
    Password:{
        type:String
    }

  });

  const sign_up_model = mongoose.model('sign_up_user', sign_up_Schema);

  module.exports = sign_up_model;