const mongoose = require("mongoose");
const feedbackSchema = new mongoose.Schema({
    overAllPerformance: {
    type: String,
    enum:["Excellent", "Very Good", "Good",	"Average", "Poor", ""],
    default: ""
  },
  preferingSabooRKS: {
    type: String,
   //  enum:["Strongly",	"Not Much",	"Don’t Visit Again",""],
   enum:["Excellent", "Very Good", "Good",	"Average", "Poor", ""],
    default: ""
  },
  waitTime:{
    type: String,
   //   enum:["Below 5","Below 10","Below 20","Below 30","More than 30",""],
   enum:["Excellent", "Very Good", "Good",	"Average", "Poor", ""],
     default: "",
     trim:true
 },
 advisorTimeAndAttention:{
    type: String,
    enum:["Excellent", "Very Good", "Good",	"Average", "Poor", ""],
    default: ""
 },
 advisorsUnderstandingWorkingRequirement:{
    type: String,
    enum:["Excellent", "Very Good", "Good",	"Average", "Poor", ""],
    default: ""
 },
 advisorsListenAbility :{
    type: String,
    enum:["Excellent", "Very Good", "Good",	"Average", "Poor", ""],
    default: ""
 },
 advisorsBehavior :{
    type: String,
    enum:["Excellent", "Very Good", "Good",	"Average", "Poor", ""],
    default: ""
 },
 advisorsRecommendationOnWorkRequirement :{
    type: String,
    enum:["Excellent", "Very Good", "Good",	"Average", "Poor", ""],
    default: ""
 },
 advancePerformingWork :{
    type: String,
    enum:["Excellent", "Very Good", "Good",	"Average", "Poor", ""],
    default: ""
 },
 workPerformedOnTheCar  :{
    type: String,
    enum:["Excellent", "Very Good", "Good",	"Average", "Poor", ""],
    default: ""
 },
 qualityOfWork  :{
    type: String,
    enum:["Excellent", "Very Good", "Good",	"Average", "Poor", ""],
    default: ""
 },
 postServiceWashingAndCleaning :{
    type: String,
    enum:["Excellent", "Very Good", "Good",	"Average", "Poor", ""],
    default: ""
 },
 billExplanation:{
   //  type: Boolean,
   //  default: null
   type: String,
    enum:["Excellent", "Very Good", "Good",	"Average", "Poor", ""],
    default: ""
 },
 transparencyPrice :{
   //  type: Boolean,
   //  default: null
   type: String,
    enum:["Excellent", "Very Good", "Good",	"Average", "Poor", ""],
    default: ""
 },
 recommendation :{
    type: String,
     default: ""
 },
 vehicleNumber:{
    type: String,
    default: ""
   //  require: true,
    // require: true,
 },
 name:{
    type: String,
    default: ""
 },
//  lastName:{
//     type: String,
//     require: true,
//  },
 phone:{
    type: String,
    default: ""
 },
 location:{
    type: String,
    default: ""
 },
 feedback:{
   type: String,
   // require: true,
   default: ""
},
verifiedCustomer:{
   type:Boolean,
   default :true
},
 leadFrom: {
    type: String,
    default: "feedback",
  },
 date: {
    type: String,
  },
  time: {
    type: String,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
  },
},{timestamps:true}
);

module.exports = mongoose.model("feedback",feedbackSchema)

// overAllPerformance [Excellent, Very Good, Good,	Average	Poor]
// preferingSabooRKS [Strongly,	Not Much,	Don’t Visit Again]
//waitTime [boolean]
// advisorTimeAndAttention[boolean]
//advisorsUnderstandingWorkingRequirement [Excellent, Very Good, Good,	Average	Poor]
//advisorsListenAbility [Excellent, Very Good, Good,	Average	Poor]
// advisorsBehavior[Excellent, Very Good, Good,	Average	Poor]
// advisorsRecommendationOnWorkRequirement[Excellent, Very Good, Good,	Average	Poor]
// advancePerformingWork [Excellent, Very Good, Good,	Average	Poor]
//workPerformedOnTheCar [Excellent, Very Good, Good,	Average	Poor]
//qualityOfWork [Excellent, Very Good, Good,	Average	Poor]
//postServiceWashingAndCleaning [Excellent, Very Good, Good,	Average	Poor]
//billExplanation [boolean]
// transparencyPrice [boolean]
// recommendation [Extremely Likely, Likely	Not, Likely at all] based on the rated numbers
// VehicleNumber
// Name
//phone
//Location

