const express = require("express");
let router = express.Router();

let {feedback, getfeedback, 
    filtersfeedbacks
  } = require("../controller/feedbackcontroller")

  const { register, login } = require("../controller/adminController");

let {authentication} = require("../middleware/auth")
  
////////////////////////////////////////////////////////////////////////////
router.post("/register", register);
router.post("/login", login);

/////////////////////////////////////////////////////////////////
router.post('/feedback',feedback)
router.get("/getfeedback",authentication,getfeedback)
router.post("/filtersfeedbacks",authentication,filtersfeedbacks)
module.exports = router;