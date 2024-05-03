const feedbackModel = require("../model/feedbackModel");
const userDataModel = require("../model/userDataModel");
const moment = require("moment");
require("moment-timezone");

const feedback = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    let data = req.body;
    let phoneNo = req.query.phone;
    let arr = ["Excellent", "Very Good", "Good", "Average", "Poor", ""];
    moment.tz.setDefault("Asia/Kolkata"); // Default India time zone
    let currentDate = moment().format("YYYY-MM-DD");
    let times = moment().format("HH:mm:ss");
    // Check if there is existing data in the database for the provided vehicle number and created on the same date
    let existingData = await feedbackModel.findOne({
      // vehicleNumber: data.vehicleNumber,
      phone: phoneNo,
      date: currentDate,
    });

    if (existingData) {
      // Update the existing document with new data
      let userData = await userDataModel.find({ phone: phoneNo });
      const keyValuesMap = {
        overAllPerformance: arr,
        preferingSabooRKS: arr, //["Strongly",	"Not Much",	"Don’t Visit Again",""],
        advisorsUnderstandingWorkingRequirement: arr,
        advisorsListenAbility: arr,
        advisorsBehavior: arr,
        advisorsRecommendationOnWorkRequirement: arr,
        advancePerformingWork: arr,
        workPerformedOnTheCar: arr,
        qualityOfWork: arr,
        postServiceWashingAndCleaning: arr,
        waitTime: arr, //["Below 5","Below 10","Below 20","Below 30","More than 30",""],
        advisorTimeAndAttention: arr,
        billExplanation: arr,
        transparencyPrice: arr,
      };

      // Validate data values against the defined keys and their corresponding valid values
      for (const key in data) {
        if (
          keyValuesMap[key] !== undefined &&
          !keyValuesMap[key].includes(data[key])
        ) {
          return res.status(400).send({
            status: false,
            message: `Invalid value "${
              data[key]
            }" provided for key "${key}". Valid values are: ${keyValuesMap[
              key
            ].join(", ")}.`,
          });
        }
      }

      if (data.recommendation) {
        if (data.recommendation == 10 || data.recommendation == 9) {
          data.recommendation = ` ${data.recommendation} Extremely Likely`;
        }
        if (data.recommendation == 8 || data.recommendation == 7) {
          data.recommendation = `${data.recommendation}Likely`;
        }
        if (data.recommendation <= 6 && data.recommendation >= 0) {
          data.recommendation = `${data.recommendation} Not Likely at all`;
        }
      }
      if (userData.length !== 0 && data.location) {
        if (userData && data.location !== userData[0].location) {
          let finduserData = await userDataModel.find({ phone: phoneNo });
          if (!finduserData) {
            return res
              .status(404)
              .send({ status: false, message: "phone number is not found" });
          }
          await userDataModel.findOneAndUpdate(
            { phone: phoneNo },
            { location: data.location },
            { new: true }
          );
        }
      } 
      
      existingData = Object.assign(existingData, data);
      await existingData.save();
      return res.status(200).send({ status: true, data: existingData });
    } else {
      // Define keys and their corresponding valid values in an object
      let userData = await userDataModel.find({ phone: phoneNo });
      const keyValuesMap = {
        overAllPerformance: arr,
        preferingSabooRKS: arr, //["Strongly",	"Not Much",	"Don’t Visit Again",""],
        advisorsUnderstandingWorkingRequirement: arr,
        advisorsListenAbility: arr,
        advisorsBehavior: arr,
        advisorsRecommendationOnWorkRequirement: arr,
        advancePerformingWork: arr,
        workPerformedOnTheCar: arr,
        qualityOfWork: arr,
        postServiceWashingAndCleaning: arr,
        waitTime: arr, //["Below 5","Below 10","Below 20","Below 30","More than 30",""],
        advisorTimeAndAttention: arr,
        billExplanation: arr,
        transparencyPrice: arr,
        //   name:u,
        //  phone:userData.phone,
        //  vehicleNumber:userData.vehicleNumber
        //  location:
      };
      // Validate data against the defined keys and their corresponding valid values
      for (const key in keyValuesMap) {
        if (data[key] !== undefined && !keyValuesMap[key].includes(data[key])) {
          return res.status(400).send({
            status: false,
            message: `Invalid value "${
              data[key]
            }" provided for key "${key}". Valid values are: ${keyValuesMap[
              key
            ].join(", ")}.`,
          });
        }
      }
      if (data.recommendation) {
        if (data.recommendation == 10 || data.recommendation == 9) {
          data.recommendation = ` ${data.recommendation} Extremely Likely`;
        }
        if (data.recommendation == 8 || data.recommendation == 7) {
          data.recommendation = `${data.recommendation}Likely`;
        }
        if (data.recommendation <= 6 && data.recommendation >= 0) {
          data.recommendation = `${data.recommendation} Not Likely at all`;
        }
      }
      // console.log(userData)
      if (userData.length !== 0) {
        data.name = userData[0].name;
        data.phone = userData[0].phone;
        data.vehicleNumber = userData[0].vehicleNumber;
        data.location = userData[0].location;
      }
      data.phone = phoneNo;
      // Create a new document
      let newData = {
        ...data,
        date: currentDate,
        time: times,
      };
      let saveData = await feedbackModel.create(newData);
      return res.status(201).send({ status: true, data: saveData });
    }
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

//===================================================================

let getfeedback = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    const sortOptions = {};
    let data;
    // No query parameters provided
    sortOptions.createdAt = -1;
    data = await feedbackModel
      .find({
        isDeleted: false,
      })
      .sort(sortOptions);

    return res.status(200).send({ status: true, data: data });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

const filtersfeedbacks = async (req, res) => {
  try {
    let data = req.body;
    if (data.filter == "Between") {
      const { startDate, endDate } = req.body; // Assuming startDate and endDate are provided in the request body

      let data = await feedbackModel.aggregate([
        {
          $match: {
            isDeleted: false,
            $expr: {
              $and: [
                { $gte: ["$date", startDate] },
                { $lte: ["$date", endDate] },
              ],
            },
          },
        },
        { $sort: { createdAt: -1 } },
      ]);

      return res.status(200).send({ status: true, data: data });
    }
    if (data.filter == "Today") {
      let currentDate = moment().format("YYYY-MM-DD");
      // const { startDate, endDate } = req.body; // Assuming startDate and endDate are provided in the request body

      let data = await feedbackModel.aggregate([
        {
          $match: {
            isDeleted: false,
            $expr: {
              $and: [
                { $eq: ["$date", currentDate] },
                //   { $lte: ["$date", endDate] }
              ],
            },
          },
        },
        { $sort: { createdAt: -1 } },
      ]);

      return res.status(200).send({ status: true, data: data });
    }
    if (data.filter == "Yesterday") {
      let yesterdayDate = moment().subtract(1, "days").format("YYYY-MM-DD");

      let data = await feedbackModel.aggregate([
        {
          $match: {
            isDeleted: false,
            $expr: {
              $and: [
                { $eq: ["$date", yesterdayDate] },
                //   { $lte: ["$date", endDate] }
              ],
            },
          },
        },
        { $sort: { createdAt: -1 } },
      ]);

      return res.status(200).send({ status: true, data: data });
    }

    if (data.filter == "Current Month") {
      let startOfMonth = moment().startOf("month").format("YYYY-MM-DD");
      let currentDate = moment().format("YYYY-MM-DD");
      let data = await feedbackModel.aggregate([
        {
          $match: {
            isDeleted: false,
            $expr: {
              $and: [
                { $gte: ["$date", startOfMonth] },
                { $lte: ["$date", currentDate] },
              ],
            },
          },
        },
        { $sort: { createdAt: -1 } },
      ]);

      return res.status(200).send({ status: true, data: data });
    }
    if (data.filter == "Last Month") {
      let lastMonthStartDate = moment()
        .subtract(1, "months")
        .startOf("month")
        .format("YYYY-MM-DD");

      // Get the last day of the last month
      let lastMonthEndDate = moment()
        .subtract(1, "months")
        .endOf("month")
        .format("YYYY-MM-DD");

      let data = await feedbackModel.aggregate([
        {
          $match: {
            isDeleted: false,
            $expr: {
              $and: [
                { $gte: ["$date", lastMonthStartDate] },
                { $lte: ["$date", lastMonthEndDate] },
              ],
            },
          },
        },
        { $sort: { createdAt: -1 } },
      ]);

      return res.status(200).send({ status: true, data: data });
    }
    if (data.filter == "Last Week") {
      // Get the start of the last week (Sunday)
      let lastWeekStartDate = moment()
        .subtract(1, "weeks")
        .startOf("isoWeek")
        .subtract(1, "days")
        .format("YYYY-MM-DD");
      // console.log("Last week's start date (Sunday):", lastWeekStartDate);

      // Get the end of the last week (Saturday)
      // Get the end of the last week (Saturday)
      let lastWeekEndDate = moment()
        .subtract(1, "weeks")
        .endOf("isoWeek")
        .subtract(1, "days")
        .format("YYYY-MM-DD");
      // console.log("Last week's end date (Saturday):", lastWeekEndDate);

      let data = await feedbackModel.aggregate([
        {
          $match: {
            isDeleted: false,
            $expr: {
              $and: [
                { $gte: ["$date", lastWeekStartDate] },
                { $lte: ["$date", lastWeekEndDate] },
              ],
            },
          },
        },
        { $sort: { createdAt: -1 } },
      ]);

      return res.status(200).send({ status: true, data: data });
    }
    if (data.filter == "Last 3 Month") {
      // Get the start of the last week (Sunday)
      let last3MonthStartDate = moment()
        .subtract(3, "months")
        .startOf("month")
        .format("YYYY-MM-DD");

      // Get the last day of the last month
      let last3MonthEndDate = moment().endOf("month").format("YYYY-MM-DD");

      let data = await feedbackModel.aggregate([
        {
          $match: {
            isDeleted: false,
            $expr: {
              $and: [
                { $gte: ["$date", last3MonthStartDate] },
                { $lte: ["$date", last3MonthEndDate] },
              ],
            },
          },
        },
        { $sort: { createdAt: -1 } },
      ]);

      return res.status(200).send({ status: true, data: data });
    }
    if (data.filter == "Last 6 Month") {
      // Get the start of the last week (Sunday)
      let last6MonthStartDate = moment()
        .subtract(6, "months")
        .startOf("month")
        .format("YYYY-MM-DD");

      // Get the last day of the last month
      let last6MonthEndDate = moment().endOf("month").format("YYYY-MM-DD");

      let data = await feedbackModel.aggregate([
        {
          $match: {
            isDeleted: false,
            $expr: {
              $and: [
                { $gte: ["$date", last6MonthStartDate] },
                { $lte: ["$date", last6MonthEndDate] },
              ],
            },
          },
        },
        { $sort: { createdAt: -1 } },
      ]);

      return res.status(200).send({ status: true, data: data });
    }
    if (data.filter == "Last 12 Month") {
      // Get the start of the last week (Sunday)
      let last12MonthStartDate = moment()
        .subtract(12, "months")
        .startOf("month")
        .format("YYYY-MM-DD");

      // Get the last day of the last month
      let last12MonthEndDate = moment().endOf("month").format("YYYY-MM-DD");

      let data = await feedbackModel.aggregate([
        {
          $match: {
            isDeleted: false,
            $expr: {
              $and: [
                { $gte: ["$date", last12MonthStartDate] },
                { $lte: ["$date", last12MonthEndDate] },
              ],
            },
          },
        },
        { $sort: { createdAt: -1 } },
      ]);

      return res.status(200).send({ status: true, data: data });
    }
    if (data.filter == "Previous Year") {
      // Get the start of the last week (Sunday)
      // Get the start of the previous year
      let previousYearStartDate = moment()
        .subtract(1, "years")
        .startOf("year")
        .format("YYYY-MM-DD");
      // console.log("Previous year's start date:", previousYearStartDate);

      // Get the end of the previous year
      let previousYearEndDate = moment()
        .subtract(1, "years")
        .endOf("year")
        .format("YYYY-MM-DD");
      // console.log("Previous year's end date:", previousYearEndDate);

      let data = await feedbackModel.aggregate([
        {
          $match: {
            isDeleted: false,
            $expr: {
              $and: [
                { $gte: ["$date", previousYearStartDate] },
                { $lte: ["$date", previousYearEndDate] },
              ],
            },
          },
        },
        { $sort: { createdAt: -1 } },
      ]);

      return res.status(200).send({ status: true, data: data });
    }
  } catch (error) {
    res.status(500).send({ status: false, message: error.message });
  }
};

module.exports = { feedback, getfeedback, filtersfeedbacks };
