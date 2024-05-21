const userModel = require("../model/adminModel");
const optModel = require("../model/otpModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");

const register = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    let data = req.body;
    let password = data.password;
    data.password = await bcrypt.hash(password, 10);

    let saveData = await userModel.create(data);
    res.status(201).send({ status: true, data: saveData });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await userModel.findOne({ email :email });
    if (!user)
      return res.status(401).send({ status: false, message: "User not found." });

    // Verify password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch)
      return res.status(401).send({ status: false, message: "Incorrect password." });

    // Generate OTP
    const otp = generateOTP();

    // Send OTP to user's email
    await sendOTP(email, otp);

    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 3); // Adjust the duration as needed
    // Save OTP in database
    await optModel.findOneAndUpdate(
      { email: email }, // Filter by email
      { otp, email, expiry }, // Update the OTP and expiry fields
      { upsert: true, new: true } // Create a new document if none exists
    );

    // // Verify OTP
    // const otpRecord = await optModel.findOne({ email, otp });
    // if (!otpRecord)
    //   return res.status(401).send({ status: false, message: "Invalid OTP." });

    // // Check OTP expiry
    // const currentTimestamp = new Date();
    // if (otpRecord.expiry < currentTimestamp)
    //   return res.status(401).send({ status: false, message: "OTP has expired." });

    // Create JWT token
    // const token = jwt.sign(
    //   { userID: user._id?.toString() },
    //   process.env.Secret,
    //   { expiresIn: "1hr" }
    // );

    // // Return successful login response
    // const responseData = {
    //   userID: user._id.toString(),
    //   token: token,
    // };

    res.status(200).send({ status: true, message: "Otp has sent", 
    // data: responseData 
  });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

// Function to generate OTP
const generateOTP = () => {
  let digits = '1234567890';
  let limit = 6;
  let otp = '';
  for (i = 1; i < limit; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

// Function to send OTP to user's email
const sendOTP = async (email, otp) => {
  // console.log(email)
  if(email == "admin@gmail.com"){
    email = "saboomarutisuzukiservice@gmail.com"
  }
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: "saboomarutisuzukiservice@gmail.com",
        pass: process.env.Password,
      },
    });

    const mailGenerator = new Mailgen({
      theme: 'default',
      color: '#2d65ae',
      product: {
        logo: 'https://images-saboomaruti-in.s3.ap-south-1.amazonaws.com/logo.png',
        logoHeight: '70px',
        name: 'Saboo RKS Service',
        link: 'https://service-feedback-dashboard.netlify.app/login',
      },
    });

    const emailContent = {
      body: {
        greeting: 'Dear',
        intro: [`Your One-Time Password (OTP) has been generated.`,
          `Your OTP is ${otp}`],
        // action: {
        //   button: {
        //     color: '#2d65ae',
        //     text: `Verify`,
        //     link: 'https://service-feedback-dashboard.netlify.app/login'
        //   }
        // },
        signature: 'Best regards'
      },
    };

    const emailBody = mailGenerator.generate(emailContent);

    const message = {
      from: process.env.EMAIL,
      to:  email,
      subject: `Service Feedback - OTP is ${otp}`,
      html: emailBody,
    };

    await transporter.sendMail(message);
  } catch (error) {
    throw new Error("Failed to send OTP email.");
  }
};

module.exports = { register, login };
