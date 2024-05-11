const express = require("express");
let router = express.Router();

let {
  feedback,
  getfeedback,
  filtersfeedbacks,
} = require("../controller/feedbackcontroller");

const { register, login } = require("../controller/adminController");

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
var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const directory = "src/public/uploads";
    fs.mkdirSync(directory, { recursive: true }); // Create the directory if it doesn't exist
    cb(null, directory);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
var upload = multer({ storage: storage });
router.post(
  "/importUser",
  upload.single("file"),
  userDataController.importUser
);
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
module.exports = router;
