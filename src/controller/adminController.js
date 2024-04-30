const userModel = require("../model/adminModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const register = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    let data = req.body;
    let password = data.password;
    //   moment.tz.setDefault('Asia/Kolkata');

    //   // Get the current date and time
    //   let date = moment().format('DD/MM/YYYY');
    //   let time = moment().format('HH:mm:ss');
    //   data.date = date;
    //   data.time = time;
    data.password = await bcrypt.hash(password, 10);

    let saveData = await userModel.create(data);
    res.status(201).send({ status: true, data: saveData });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

const login = async (req, res) => {
  try {
    Data = req.body;
    const { email, password } = Data;

    const isEmailExists = await userModel.findOne({ email: email });
    if (!isEmailExists)
      return res.status(401).send({
        status: false,
        message: "User not found.",
      });
    const isPasswordMatch = await bcrypt.compare(
      password,
      isEmailExists.password
    );
    if (!isPasswordMatch)
      return res
        .status(401)
        .send({ status: false, message: "Password is Incorrect" });
    // > Create Jwt Token
    const token = jwt.sign(
      { userID: isEmailExists._id?.toString() },
      process.env.Secret,
      { expiresIn: "12hr" }
    );

    //  Make Respoense
    let result = {
      userID: isEmailExists._id?.toString(),
      token: token,
    };
    // console.log('Login done');
    res
      .status(200)
      .send({ status: true, message: "Login Successful", data: result });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

module.exports = { register, login };
