const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");
const jwt = require("jsonwebtoken");

const optModel = require("../model/otpModel");
const adminModel = require("../model/adminModel");

const dotenv = require("dotenv"); // Import dotenv
dotenv.config();

const otpVerification = async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    try {
      let data = req.body;
      let { email, otp } = data;
  
      // Find user by email
      let customerData = await adminModel.findOne({ email: email });
      if (!customerData) {
        return res.status(404).send({
          status: false,
          message: "User not found",
        });
      }
  
      // Find OTP by email
      let otpData = await optModel.findOne({ email: email });
      if (!otpData) {
        return res.status(400).send({ status: false, message: "Incorrect Email" });
      }
  
      // Check if OTP has expired
      const currentTimestamp = new Date();
      if (currentTimestamp > otpData.expiry) {
        return res.status(400).send({ status: false, message: "OTP has expired" });
      }
  
      // Verify OTP
      if (otp == otpData.otp) {
        // Create JWT token
        const token = jwt.sign(
          { userID: customerData._id.toString() },
          process.env.Secret,
          { expiresIn: "1hr" }
        );
  
        // Return successful login response
        const responseData = {
          userID: customerData._id.toString(),
          token: token,
        };
  
        return res.status(200).send({
          status: true,
          message: "Login successful",
          data: responseData,
        });
      } else {
        return res.status(400).send({ status: false, message: "Incorrect OTP" });
      }
    } catch (error) {
      return res.status(500).send({ status: false, message: error.message });
    }
  };
  
//==============================================================================================================
const resendOtp = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    let data = req.body;
    let { email } = data;
    if (!email) {
      return res.status(400).json({ message: "Please provide a valid email" });
    }
    // // if (!validator.isValidEmail(email.trim()))
    //   return res.status(400).send({
    //     status: false,
    //     message: "Please Enter a valid Email-id",
    //   });
    let digits = "1234567890";
    let limit = 6;
    let otp = "";
    for (i = 1; i < limit; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    let checkdata = await adminModel.findOne({ email: email });
    if (!checkdata) {
      return res.status(400).send({
        status: false,
        message: "email is not register",
      });
    }
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 3); // Adjust the duration as needed
    // let name = checkdata.name;
    let updateotp = await optModel.findOneAndUpdate(
      { email: email },
      { $set: { otp: otp, expiry:expiry } }
    );
    let config = {
      service: "gmail",
      auth: {
        user: "saboomarutisuzukiservice@gmail.com",
        pass: process.env.Password,
      },
    };
    let transporter = nodemailer.createTransport(config);

    let MailGenerator = new Mailgen({
        theme: 'default',
        color: '#2d65ae',
        product: {
          logo: 'https://images-saboomaruti-in.s3.ap-south-1.amazonaws.com/logo.png',
          logoHeight: '70px',
          name: 'Saboo RKs Service',
          link: 'https://service-feedback-dashboard.netlify.app/login',
        },
    });
    let response = {
      body: {
        greeting: "Dear",
        intro: [
          `We have resent your OTP. Please use the following code for verification: ${otp}`,
        ],
        //intro: [`resended OTP:${otp}`],
        // action: {
        //   instructions: "",
        //   button: {
        //     color: "#2d65ae", // Optional action button color
        //     text: `${otp}`,
        //     link: 'https://service-feedback-dashboard.netlify.app/login',
        //   },
        // },
        //outro: ,
        signature: "Best regards",
      },
    };
    let mail = MailGenerator.generate(response);

    if(email == "admin@gmail.com"){
        email = "saboomarutisuzukiservice@gmail.com"
      }
    let message = {
      from: process.env.EMAIL,
      to: email, // Ensure that the 'email' field is set
      subject: `${otp} is the resent OTP`,
      html: mail,
    };
    transporter.sendMail(message);

    return res.status(201).json({
      message: `OTP send successfully`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ status: false, message: error.message });
  }
};

///=============================================================================================================

const forgetPassword = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    let data = req.body;
    let { email, password } = data;
    if (!password)
      return res.status(400).send({
        status: false,
        message: "Password is required",
      });
    //validating user password
    if (!validator.isValidPassword(password))
      return res.status(400).send({
        status: false,
        message:
          "Password should be between 8 and 15 character and it should be alpha numeric",
      });
    if (validator.isValid(password))
      return res.status(400).send({
        status: false,
        message: "Password should not be an empty string",
      });
    data.password = await bcrypt.hash(password, 10);
    let getCustomerData = await adminModel.findOneAndUpdate(
      { email: email },
      data,
      { new: true }
    );
    res.status(200).send({ status: true, data: getCustomerData });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

module.exports = { otpVerification, resendOtp, forgetPassword };
