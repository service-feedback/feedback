const express = require("express");
let router = express.Router();

let {
  feedback,
  getfeedback,
  filtersfeedbacks,
  feedbackStatistics,
} = require("../controller/feedbackcontroller");

const { register, login } = require("../controller/adminController");

const { otpVerification, resendOtp, forgetPassword } = require("../controller/otpController")

let { authentication } = require("../middleware/auth");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const app = express();
const userDataController = require("../controller/userDataController");
app.use(express.static(path.resolve(__dirname, "src/public")));

//=============================================================================
router.get("/test-me", function (req, res) {
  res.send("this is successfully created");
});

//==================================================================================================
app.use(express.static(path.resolve(__dirname, "../public")));
// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const directory = path.resolve(__dirname, "../public/uploads");
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
    cb(null, directory);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

// Improved error logging
router.post("/importUser", upload.single("file"), (req, res, next) => {
  try {
    userDataController.importUser(req, res);
  } catch (error) {
    console.error("Error during importUser:", error);
    res.status(500).send("A server error has occurred: " + error.message);
  }
});
// router.post(
//   "/importVendor",
//   upload.single("file"),
//   userDataController.importVendor
// );
router.get("/getUserData",userDataController.getUserData)
router.put("/markAllUsersAsDeleted",authentication,userDataController.markAllUsersAsDeleted)
////////////////==================================////////////////////
router.post("/register", register);
router.post("/login", login);

//////////////////================================////////////////////////
router.post("/feedback", feedback);
router.get("/getfeedback", authentication, getfeedback);
router.post("/filtersfeedbacks", authentication, filtersfeedbacks);
router.post("/feedbackStatistics",feedbackStatistics)
//======================================================================

router.post("/otpVerification",otpVerification)
router.post("/resendOtp",resendOtp)

module.exports = router;
