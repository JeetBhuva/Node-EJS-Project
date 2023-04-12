// Imports
var express = require("express");
const { data, getItem } = require("node-persist");
var router = express.Router();
const Razorpay = require("razorpay");
const PaymentDetail = require("../models/payment-detail");
// const { nanoid } = require("nanoid");
const storage = require("node-persist");

// Create an instance of Razorpay
let razorPayInstance = new Razorpay({
  key_id: "rzp_test_3SzHNlYtTfwblW",
  key_secret: "CCmiBiyXdV7YfOXayLTv1Wrz",
});

/**
 * Make Donation Page
 *
 */
router.get("/", async function (req, res, next) {
  await storage.init();

  const total_amount = await storage.getItem("total_amount");
  console.log(total_amount);

  // Render form for accepting amount
  res.render("pages/payment/order", { total_amount });
});

/**
 * Checkout Page
 *
 */
router.post("/order",async function (req, res, next) {

  params = {
    amount: req.body.amount * 100,
    currency: "INR",
    // receipt: nanoid(),
    payment_capture: "1",
  };
  razorPayInstance.orders
    .create(params)
    .then(async (response) => {
      const razorpayKeyId = "rzp_test_3SzHNlYtTfwblW";
      // Save orderId and other payment details
      const paymentDetail = new PaymentDetail({
        orderId: response.id,
        receiptId: response.receipt,
        amount: response.amount,
        currency: response.currency,
        createdAt: response.created_at,
        status: response.status,
      });
      try {
        // Render Order Confirmation page if saved succesfully
        await paymentDetail.save();
        res.render("pages/payment/checkout", {
          title: "Confirm Order",
          razorpayKeyId: razorpayKeyId,
          paymentDetail: paymentDetail,
        });
      } catch (err) {
        // Throw err if failed to save
        if (err) throw err;
      }
    })
    .catch((err) => {
      // Throw err if failed to create order
      if (err) throw err;
    });
});

/**
 * Verify Payment
 *
 */

router.post("/verify", async function (req, res, next) {
  body = req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id;
  let crypto = require("crypto");
  let expectedSignature = crypto
    .createHmac("sha256", "4OTBvf8BXRjhoGipGWnHhIhr")
    .update(body.toString())
    .digest("hex");

  // Compare the signatures

  const filter = { orderId: req.body.razorpay_order_id };

  if (expectedSignature === req.body.razorpay_signature) {
    const update = {
      paymentId: req.body.razorpay_payment_id,
      signature: req.body.razorpay_signature,
      status: "paid",
      __v:1
    };

    let doc = await PaymentDetail.findOneAndUpdate(filter, update);
    // console.log("DOC :::::"+doc);




                              //  Email Send

  //   var find_mail = await sign_up_model.find({ User_email: send_mailid });

  // if (find_mail != "") {
  //   var transporter = nodemailer.createTransport({
  //     service: "gmail",
  //     auth: {
  //       user: "divubhai36@gmail.com",
  //       pass: "awmwhsuldczyflys",
  //     },
  //   });

  //   var mailOptions = {
  //     from: "divubhai36@gmail.com",
  //     to: send_mailid,
  //     subject: "BOLETO-Online Tickets Booking , Forgot Password OTP",
  //     text: "Please Verify And Do Not share this otp",
  //     html: `<h1>${otp}</h1>
  //         <p>Please Verify And Do Not share this otp</p>
  //          `,
  //   };

  //   transporter.sendMail(mailOptions, function (error, info) {
  //     if (error) {
  //       console.log(error);
  //     } else {
  //       console.log("Email sent: " + info.response);
  //       res.redirect("otp");
  //     }
  //   });
  // } else {
  //   res.send("please check your mail id");
  // }





    res.render("pages/payment/success", { paymentDetail: doc });
  } else {
    res.render("pages/payment/fail");
  }

});

module.exports = router;
