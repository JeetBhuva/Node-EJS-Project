var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var bcrypt = require("bcrypt");
const storage = require("node-persist");
var nodemailer = require("nodemailer");

const sign_up_model = require("../models/sign-up");
const seats_booking_model = require("../models/seat_booking");

/* GET home page. */
// ************************       Landing Page
router.get("/", async function (req, res, next) {
  await storage.init();
  var data = await storage.getItem("User_email");
  res.redirect("index");
});

router.get("/index", async function (req, res, next) {
  await storage.init();
  var data = await storage.getItem("User_email");

  res.render("index",{data});
});

// ************************       View All Page

router.get("/movie-grid", async function (req, res, next) {
  await storage.init();
  var data = await storage.getItem("User_email");
  res.render("movie-grid", { data });
});

// ************************       Sign-up Page
router.get("/sign-up", async function (req, res, next) {
  res.render("sign-up");
});

router.post("/sign-up", async function (req, res, next) {
  await storage.init();
  var User_email = req.body.User_email;
  console.log("*********************User Email : " + User_email);

  var No_repeat = await sign_up_model.findOne({
    User_email: req.body.User_email,
  });

  if (No_repeat) {
    console.log(No_repeat);
    return res.send("Email Already Existing!");
  } else {
    var obj = {
      User_email: req.body.User_email,
      Mobile_number: req.body.Mobile_number,
      Password: req.body.Password,
    };

    await sign_up_model.create(obj);
    var store = await sign_up_model.findOne({
      User_email: req.body.User_email,
    });
    // ****************************************************************************************************************************
    //           Email Sending Code START Here     ********************************************************************************
    // ****************************************************************************************************************************
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "divubhai36@gmail.com",
        pass: "awmwhsuldczyflys",
      },
    });

    var mailOptions = {
      from: "divubhai36@gmail.com",
      // ONLY CHANGE EMAIL ADDRESS HERE AND SENDING CONTENT
      to: req.body.User_email,
      subject: "BOLETO-Online Tickets Booking ",
      text: "BOLETO-Online Tickets Booking",
      html: `
      <div style="background-color: blue; text-align: center; padding:5px; color: white; border-radius: 10px;"><h1>WEL-COME TO BOLETO</h1></div>
      <h3>Registration Details :-</h3>
      <h4>Email         :${req.body.User_email}</h4>
      <h4>Mobile Number :${req.body.Mobile_number}</h4>
      <h4>Password      :${req.body.Password}</h4>
      <p>Thank you,</p>
      <p>The Admin Team</p>
      `,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
    // **************************************************************************************************************************
    //           Email Sending Code END Here       ******************************************************************************
    // **************************************************************************************************************************

    // res.redirect("sign-in");
    await storage.setItem("user_id", store._id);
    await storage.setItem("User_email", User_email);
    const newuser = await storage.getItem("user_id");
    console.log("NewUser ====> " + newuser);
    res.redirect("index");
  }
});

// ************************       Sign-in Page
router.get("/sign-in", async function (req, res, next) {
  res.render("sign-in", { title: "Express" });
});

router.post("/sign-in", async function (req, res, next) {
  await storage.init();

  var check_mail = req.body.User_email;

  var hash = await sign_up_model.find({ User_email: check_mail });

  if (hash != "") {
    var password = req.body.Password;

    if (hash[0].Password == password) {
      await storage.setItem("user_id", hash[0]._id);
      await storage.setItem("User_email", hash);
      res.redirect("/index");
    } else {
      res.send("please Enter Correct password");
    }
  } else {
    res.send("Email Can't Found, Please Register");
  }
});

// ************************       Log Out Page
router.post("/logout", async function (req, res) {
  await storage.init();
  await storage.clear();
  res.redirect("index");
});

// ************************       Forget Password Page
router.get("/forget-password", function (req, res, next) {
  res.render("forget-password", { title: "Express" });
});

router.post("/forgot-password", async function (req, res) {
  await storage.init();

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::       CHANGE       ::::: SCHEMA EMAIL  => User_email
  var send_mailid = req.body.user_email;

  // const otp = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });
  var gen_otp = Math.floor(1000 + Math.random() * 9000);
  var otp = gen_otp.toString();
  await storage.setItem("otp", otp);
  await storage.setItem("mail", send_mailid);

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::       CHANGE       ::::: SCHEMA EMAIL   => User_email
  var find_mail = await sign_up_model.find({ User_email: send_mailid });

  if (find_mail != "") {
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "divubhai36@gmail.com",
        pass: "awmwhsuldczyflys",
      },
    });

    var mailOptions = {
      from: "divubhai36@gmail.com",
      to: send_mailid,
      subject: "BOLETO-Online Tickets Booking , Forgot Password OTP",
      text: "Please Verify And Do Not share this otp",
      html: `<h1>${otp}</h1>
          <p>Please Verify And Do Not share this otp</p>
           `,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
        res.redirect("otp");
      }
    });
  } else {
    res.send("please check your mail id");
  }
});

router.get("/otp", function (req, res) {
  res.render("otp");
});

router.post("/otp", async function (req, res) {
  await storage.init();

  var user_otp = req.body.user_otp;

  var store_otp = await storage.getItem("otp");

  if (store_otp == user_otp) {
    res.redirect("set-password");
  } else {
    res.send("please enter otp");
  }
});

router.get("/set-password", async function (req, res) {
  res.render("set-password");
});

router.post("/set-password", async function (req, res) {
  await storage.init();

  var new_pass = req.body.user_new_password;
  var con_pass = req.body.user_confirm_password;
  console.log(new_pass, con_pass);

  var mailid = await storage.getItem("mail");
  console.log(mailid);

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::       CHANGE       ::::: SCHEMA EMAIL   => User_email
  const filter = { User_email: mailid };

  if (new_pass == con_pass) {
    // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::       CHANGE       ::::: SCHEMA PASSWORD   => Password
    const update = { Password: new_pass };

    let doc = await sign_up_model.findOneAndUpdate(filter, update);

    if (typeof doc === undefined) {
      await storage.setItem("update_password", "fail");
      res.redirect("set-password");
    } else {
      res.redirect("sign-in");
    }
  } else {
    res.send("Please Enter Correct Password");
  }
});

router.get("/movie-details", async function (req, res) {
  await storage.init();
  var data = await storage.getItem("User_email");
  res.render("movie-details",{data});
});

router.get("/movie-seat-plan", async function (req, res, next) {
  await storage.init();
  var data = await storage.getItem("User_email");
  res.render("movie-seat-plan", { data });
});

router.post("/movie-seat-plan", async function (req, res, next) {
  await storage.init();

  const userEmail = await storage.getItem("User_email");
  const showdate = await storage.setItem("showdate", req.body.showdate);
  const showtime = await storage.setItem("showtime", req.body.showtime);
  const seats_no = await storage.setItem("seats_no", req.body.seats_no);
  const total_amount = await storage.setItem("total_amount",req.body.total_amount);
console.log("::::"+userEmail);
var em =JSON.stringify(userEmail,null,"   ");
console.log("::::"+em);


  var obj = {
    // User_email: em,
    showdate: req.body.showdate,
    showtime: req.body.showtime,
    seats_no: req.body.seats_no,
    total_amount: req.body.total_amount
  };

  console.log(obj);
  await seats_booking_model.create(obj);

  res.redirect("movie-checkout");
});

router.get("/movie-checkout", async function (req, res, next) {
  await storage.init();
  var data = await storage.getItem("User_email");

  if (typeof data == "undefined") {
    res.send("Please Login First!");
  } else {
    const showdate = await storage.getItem("showdate");
    const showtime = await storage.getItem("showtime");
    const seats_no = await storage.getItem("seats_no");
    const total_amount = await storage.getItem("total_amount");

    // Contact Info
    const checkout_fullname = await storage.getItem("checkout_fullname");
    const checkout_email = await storage.getItem("checkout_email");
    const checkout_phone = await storage.getItem("checkout_phone");

    // console.log("******************************************************************  movie chackout GET method");
    // console.log("****************"+showdate);
    // console.log("****************"+seats_no);
    // console.log("****************"+total_amount);

    const show_info = {
      showdate: showdate,
      showtime: showtime,
      seats_no: seats_no,
      total_amount: total_amount,

      checkout_fullname: checkout_fullname,
      checkout_email: checkout_email,
      checkout_phone: checkout_phone,
    };
    res.render("movie-checkout",{show_info,data} );
  }
});

router.post("/checkout-contact-form", async function (req, res, next) {
  await storage.init();

  const checkout_fullname = await storage.setItem("checkout_fullname",req.body.checkout_fullname);
  const checkout_email = await storage.setItem("checkout_email",req.body.checkout_email);
  const checkout_phone = await storage.setItem("checkout_phone",req.body.checkout_phone);

  // const checkout_fullname1 = await storage.getItem("checkout_fullname");
  // const checkout_email1 = await storage.getItem("checkout_email");
  // const checkout_phone1 = await storage.getItem("checkout_phone");
  // console.log("******************************************************************  checkout-contact-form");
  // console.log("****************"+checkout_fullname1);
  // console.log("****************"+checkout_email1);
  // console.log("****************"+checkout_phone1);

  res.redirect("movie-checkout");
});

router.post("/movie-checkout", async function (req, res, next) {
  await storage.init();

  const Payable_Amount = await storage.setItem("Payable_Amount",req.body.checkout_fullname);

  // const checkout_fullname1 = await storage.getItem("checkout_fullname");
  // const checkout_email1 = await storage.getItem("checkout_email");
  // const checkout_phone1 = await storage.getItem("checkout_phone");
  // console.log("******************************************************************  checkout-contact-form");
  // console.log("****************"+checkout_fullname1);
  // console.log("****************"+checkout_email1);
  // console.log("****************"+checkout_phone1);
  res.redirect("order")

});

router.get("/pages/payment/order", async function (req, res, next) {

  res.render('pages/payment/order')
});

module.exports = router;
