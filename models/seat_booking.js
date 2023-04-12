const mongoose = require('mongoose');


const seatsBooking_Schema = new mongoose.Schema({
    User_email:{
        type:String
    },
    showdate:{
        type:String
    },
    showtime:{
        type:String
    },
    seats_no:{
        type:String
    },
    total_amount:{
        type:String
    }
  });

const seatsBooking_model = mongoose.model('seats_booked', seatsBooking_Schema);

module.exports = seatsBooking_model;