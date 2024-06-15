const feedbackModel = require("../model/feedbackModel");
const userDataModel = require("../model/userDataModel");
// const customerModel = require("../model/userDataModel");
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
        //  phone:userData.phone,ˀ
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
//==========================================================================================
const filtersfeedbacks = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
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

//=====================================================================

const feedbackStatistics = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    // Fetch all relevant records
    // let data = await feedbackModel.find();

    let filters = req.body;
    if (filters.filter == "Between") {
      const { startDate, endDate } = req.body; // Assuming startDate and endDate are provided in the request body
    
      // Fetch feedback data
      let feedbackData = await feedbackModel.aggregate([
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
      console.log(`Total feedback records fetched: ${feedbackData.length}`);
    
      // Fetch user data
      let userData = await userDataModel.aggregate([
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
      // console.log(`Total user records fetched: ${userData.length}`);
    
      // Initialize counts for ratings
      const countsOfEmojis = [0, 0, 0, 0, 0]; // Indexes: 0 - Excellent, 1 - Very Good, 2 - Good, 3 - Average, 4 - Poor
    
      // Array of valid ratings corresponding to their positions in the counts array
      const ratingIndexMap = ["excellent", "very good", "good", "average", "poor"];
    
      // Object to store feedback counts per month
      const monthlyFeedbackCountsForLinearChart = {};
      const monthlyUserCountsForLinearChart = {};
      let persentageOfemojis = [0, 0, 0, 0, 0];
    
      // Array of month names
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
  
      // Initialize counts for recommendations
      const recommendationCounts = {
        "0 Not Likely at all": 0,
        "1 Not Likely at all": 0,
        "2 Not Likely at all": 0,
        "3 Not Likely at all": 0,
        "4 Not Likely at all": 0,
        "5 Not Likely at all": 0,
        "6 Not Likely at all": 0,
        "7Likely": 0,
        "8Likely": 0,
        "9 Extremely Likely": 0,
        "10 Extremely Likely": 0,
      };
      let TotalcountOfRecommendation = 0;
    
      // Process each feedback record
      feedbackData.forEach((item) => {
        // Extract month and year from the date
        const date = new Date(item.date);
        const monthYear = `${monthNames[date.getMonth()]}-${date.getFullYear()}`; // e.g., "May-2024"
    
        // Increment the count for the corresponding month
        if (monthlyFeedbackCountsForLinearChart[monthYear]) {
          monthlyFeedbackCountsForLinearChart[monthYear]++;
        } else {
          monthlyFeedbackCountsForLinearChart[monthYear] = 1;
        }
    
        // Array of keys containing ratings
        const ratingKeys = [
          "overAllPerformance",
          "preferingSabooRKS",
          "waitTime",
          "advisorTimeAndAttention",
          "advisorsUnderstandingWorkingRequirement",
          "advisorsListenAbility",
          "advisorsBehavior",
          "advisorsRecommendationOnWorkRequirement",
          "advancePerformingWork",
          "workPerformedOnTheCar",
          "qualityOfWork",
          "postServiceWashingAndCleaning",
          "billExplanation",
          "transparencyPrice",
        ];
  
        // Iterate over rating keys and count occurrences of each rating category
        ratingKeys.forEach((key) => {
          const rating = item[key];
          // Normalize rating by converting to lowercase and trimming spaces
          const normalizedRating = rating?.toString().toLowerCase().trim();
  
          // Find the index of the normalized rating in the ratingIndexMap array
          const index = ratingIndexMap.indexOf(normalizedRating);
          if (index !== -1) {
            countsOfEmojis[index]++;
          }
        });
  
        // Process recommendation key
        const recommendation = item.recommendation?.toString().trim();
        if (recommendationCounts.hasOwnProperty(recommendation)) {
          TotalcountOfRecommendation++;
          recommendationCounts[recommendation]++;
        }
      });
    
      // Initialize all month-year combinations in the user counts chart to zero
      const allMonthYearKeys = Object.keys(monthlyFeedbackCountsForLinearChart);
      allMonthYearKeys.forEach((monthYear) => {
        monthlyUserCountsForLinearChart[monthYear] = 0;
      });
    
      // Process each user record
      userData.forEach((item) => {
        // Extract month and year from the date
        const date = new Date(item.date);
        const monthYear = `${monthNames[date.getMonth()]}-${date.getFullYear()}`; // e.g., "May-2024"
    
        // Increment the count for the corresponding month
        if (monthlyUserCountsForLinearChart[monthYear] !== undefined) {
          monthlyUserCountsForLinearChart[monthYear]++;
        }
      });
    
      // Separate keys and values into two arrays
      const monthlyFeedbackKeys = Object.keys(monthlyFeedbackCountsForLinearChart);
      const monthlyFeedbackValues = Object.values(monthlyFeedbackCountsForLinearChart);

      const monthlyUserCountsValues = Object.values(monthlyUserCountsForLinearChart);
    
      let totalEmojis =
        countsOfEmojis[0] +
        countsOfEmojis[1] +
        countsOfEmojis[2] +
        countsOfEmojis[3] +
        countsOfEmojis[4];
      let Average = countsOfEmojis[3];
      let Poor = countsOfEmojis[4];
      let OverAllGood = countsOfEmojis[0] + countsOfEmojis[1] + countsOfEmojis[2];
    
      let OverAllGoodPercentage = Math.round((OverAllGood / totalEmojis) * 100);
      let AveragePercentage = Math.round((Average / totalEmojis) * 100);
      let PoorPercentage = Math.round((Poor / totalEmojis) * 100);
      persentageOfemojis[0] = countsOfEmojis[0] != 0 ? Math.round((countsOfEmojis[0] / totalEmojis) * 100) : 0;  // Excellent percentage
      persentageOfemojis[1] = countsOfEmojis[1] != 0 ? Math.round((countsOfEmojis[1] / totalEmojis) * 100) : 0;  // Very Good percentage
      persentageOfemojis[2] = countsOfEmojis[2] != 0 ? Math.round((countsOfEmojis[2] / totalEmojis) * 100) : 0;  // Good percentage
      persentageOfemojis[3] = countsOfEmojis[3] != 0 ? Math.round((countsOfEmojis[3] / totalEmojis) * 100) : 0;  // Average percentage
      persentageOfemojis[4] = countsOfEmojis[4] != 0 ? Math.round((countsOfEmojis[4] / totalEmojis) * 100) : 0;  // Poor percentage
    
      let NotLikelyAtAll =
        recommendationCounts["0 Not Likely at all"] +
        recommendationCounts["1 Not Likely at all"] +
        recommendationCounts["2 Not Likely at all"] +
        recommendationCounts["3 Not Likely at all"] +
        recommendationCounts["4 Not Likely at all"] +
        recommendationCounts["5 Not Likely at all"] +
        recommendationCounts["6 Not Likely at all"];
    
      let Likely =
        recommendationCounts["7Likely"] + recommendationCounts["8Likely"];
    
      let ExtremelyLikely =
        recommendationCounts["9 Extremely Likely"] +
        recommendationCounts["10 Extremely Likely"];
    
      let ExtremelyLikelyPercentage = Math.round((ExtremelyLikely / TotalcountOfRecommendation) * 100);
      let LikelyPercentage = Math.round((Likely / TotalcountOfRecommendation) * 100);
      let NotLikelyAtAllPercentage = Math.round((NotLikelyAtAll / TotalcountOfRecommendation) * 100);
    
      return res.status(200).send({
        status: true,
        data: {
          persentageOfemojis,
          totalFeedbacks: feedbackData.length,
          totalUsers: userData.length,

          monthly_Feedback_Counts_LinearChart: {
            keys: monthlyFeedbackKeys,
            values: monthlyFeedbackValues,
          },
          monthly_User_Counts_LinearChart: {
            keys: monthlyFeedbackKeys,
            values: monthlyUserCountsValues,
          },
          recommendation_Counts_bar_chart: {
            keys: Object.keys(recommendationCounts),
            values: Object.values(recommendationCounts),
            countOfRecommendation: TotalcountOfRecommendation,
          },
          satisfactionPieChart: [
            OverAllGoodPercentage,
            AveragePercentage,
            PoorPercentage,
          ],
          recommendationPieChart: [
            ExtremelyLikelyPercentage,
            LikelyPercentage,
            NotLikelyAtAllPercentage,
          ],
        },
      });
    }
    if (filters.filter == "Today") {
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

      let userData = await userDataModel.aggregate([
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
      // console.log(`Total user records fetched: ${userData.length}`);
    
      // Initialize counts for ratings
      const countsOfEmojis = [0, 0, 0, 0, 0]; // Indexes: 0 - Excellent, 1 - Very Good, 2 - Good, 3 - Average, 4 - Poor
    
      // Array of valid ratings corresponding to their positions in the counts array
      const ratingIndexMap = ["excellent", "very good", "good", "average", "poor"];
    
      // Object to store feedback counts per month
      const monthlyFeedbackCountsForLinearChart = {};
      const monthlyUserCountsForLinearChart = {};
      let persentageOfemojis = [0, 0, 0, 0, 0];
    
      // Array of month names
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
    
      // Initialize counts for recommendations
      const recommendationCounts = {
        "0 Not Likely at all": 0,
        "1 Not Likely at all": 0,
        "2 Not Likely at all": 0,
        "3 Not Likely at all": 0,
        "4 Not Likely at all": 0,
        "5 Not Likely at all": 0,
        "6 Not Likely at all": 0,
        "7Likely": 0,
        "8Likely": 0,
        "9 Extremely Likely": 0,
        "10 Extremely Likely": 0,
      };
      let TotalcountOfRecommendation = 0;
    
      // Process each feedback record
      data.forEach((item) => {
        // Extract month and year from the date
        const date = new Date(item.date);
        const monthYear = `${monthNames[date.getMonth()]}-${date.getFullYear()}`; // e.g., "May-2024"
    
        // Increment the count for the corresponding month
        if (monthlyFeedbackCountsForLinearChart[monthYear]) {
          monthlyFeedbackCountsForLinearChart[monthYear]++;
        } else {
          monthlyFeedbackCountsForLinearChart[monthYear] = 1;
        }
    
        // Array of keys containing ratings
        const ratingKeys = [
          "overAllPerformance",
          "preferingSabooRKS",
          "waitTime",
          "advisorTimeAndAttention",
          "advisorsUnderstandingWorkingRequirement",
          "advisorsListenAbility",
          "advisorsBehavior",
          "advisorsRecommendationOnWorkRequirement",
          "advancePerformingWork",
          "workPerformedOnTheCar",
          "qualityOfWork",
          "postServiceWashingAndCleaning",
          "billExplanation",
          "transparencyPrice",
        ];
    
        // Iterate over rating keys and count occurrences of each rating category
        ratingKeys.forEach((key) => {
          const rating = item[key];
          // Normalize rating by converting to lowercase and trimming spaces
          const normalizedRating = rating?.toString().toLowerCase().trim();
    
          // Find the index of the normalized rating in the ratingIndexMap array
          const index = ratingIndexMap.indexOf(normalizedRating);
          if (index !== -1) {
            countsOfEmojis[index]++;
          }
        });
    
        // Process recommendation key
        const recommendation = item.recommendation?.toString().trim();
        if (recommendationCounts.hasOwnProperty(recommendation)) {
          TotalcountOfRecommendation++;
          recommendationCounts[recommendation]++;
        }
      });
    
      // Initialize all month-year combinations in the user counts chart to zero
      const allMonthYearKeys = Object.keys(monthlyFeedbackCountsForLinearChart);
      allMonthYearKeys.forEach((monthYear) => {
        monthlyUserCountsForLinearChart[monthYear] = 0;
      });
    
      // Process each user record
      userData.forEach((item) => {
        // Extract month and year from the date
        const date = new Date(item.date);
        const monthYear = `${monthNames[date.getMonth()]}-${date.getFullYear()}`; // e.g., "May-2024"
    
        // Increment the count for the corresponding month
        if (monthlyUserCountsForLinearChart[monthYear] !== undefined) {
          monthlyUserCountsForLinearChart[monthYear]++;
        }
      });
    
      // Separate keys and values into two arrays
      const monthlyFeedbackKeys = Object.keys(monthlyFeedbackCountsForLinearChart);
      const monthlyFeedbackValues = Object.values(monthlyFeedbackCountsForLinearChart);

      const monthlyUserCountsValues = Object.values(monthlyUserCountsForLinearChart);
    
      let totalEmojis =
        countsOfEmojis[0] +
        countsOfEmojis[1] +
        countsOfEmojis[2] +
        countsOfEmojis[3] +
        countsOfEmojis[4];
      let Average = countsOfEmojis[3];
      let Poor = countsOfEmojis[4];
      let OverAllGood = countsOfEmojis[0] + countsOfEmojis[1] + countsOfEmojis[2];
    
      let OverAllGoodPercentage = Math.round((OverAllGood / totalEmojis) * 100);
      let AveragePercentage = Math.round((Average / totalEmojis) * 100);
      let PoorPercentage = Math.round((Poor / totalEmojis) * 100);
      persentageOfemojis[0] = countsOfEmojis[0] != 0 ? Math.round((countsOfEmojis[0] / totalEmojis) * 100) : 0;  // Excellent percentage
      persentageOfemojis[1] = countsOfEmojis[1] != 0 ? Math.round((countsOfEmojis[1] / totalEmojis) * 100) : 0;  // Very Good percentage
      persentageOfemojis[2] = countsOfEmojis[2] != 0 ? Math.round((countsOfEmojis[2] / totalEmojis) * 100) : 0;  // Good percentage
      persentageOfemojis[3] = countsOfEmojis[3] != 0 ? Math.round((countsOfEmojis[3] / totalEmojis) * 100) : 0;  // Average percentage
      persentageOfemojis[4] = countsOfEmojis[4] != 0 ? Math.round((countsOfEmojis[4] / totalEmojis) * 100) : 0;  // Poor percentage
    
      let NotLikelyAtAll =
        recommendationCounts["0 Not Likely at all"] +
        recommendationCounts["1 Not Likely at all"] +
        recommendationCounts["2 Not Likely at all"] +
        recommendationCounts["3 Not Likely at all"] +
        recommendationCounts["4 Not Likely at all"] +
        recommendationCounts["5 Not Likely at all"] +
        recommendationCounts["6 Not Likely at all"];
    
      let Likely =
        recommendationCounts["7Likely"] + recommendationCounts["8Likely"];
    
      let ExtremelyLikely =
        recommendationCounts["9 Extremely Likely"] +
        recommendationCounts["10 Extremely Likely"];
    
      let ExtremelyLikelyPercentage = Math.round((ExtremelyLikely / TotalcountOfRecommendation) * 100);
      let LikelyPercentage = Math.round((Likely / TotalcountOfRecommendation) * 100);
      let NotLikelyAtAllPercentage = Math.round((NotLikelyAtAll / TotalcountOfRecommendation) * 100);
    
      return res.status(200).send({
        status: true,
        data: {
          persentageOfemojis,
          totalFeedbacks: data.length,
          totalUsers: userData.length,
          monthly_Feedback_Counts_LinearChart: {
            keys: monthlyFeedbackKeys,
            values: monthlyFeedbackValues,
          },
          monthly_User_Counts_LinearChart: {
            keys: monthlyFeedbackKeys,
            values: monthlyUserCountsValues,
          },
          recommendation_Counts_bar_chart: {
            keys: Object.keys(recommendationCounts),
            values: Object.values(recommendationCounts),
            countOfRecommendation: TotalcountOfRecommendation,
          },
          satisfactionPieChart: [
            OverAllGoodPercentage,
            AveragePercentage,
            PoorPercentage,
          ],
          recommendationPieChart: [
            ExtremelyLikelyPercentage,
            LikelyPercentage,
            NotLikelyAtAllPercentage,
          ],
        },
      });
    }



    if (filters.filter == "Yesterday") {
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

      
      // console.log(`Total records fetched: ${data.length}`);

      let userData = await userDataModel.aggregate([
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

      // console.log(`Total user records fetched: ${userData.length}`);
    
      // Initialize counts for ratings
      const countsOfEmojis = [0, 0, 0, 0, 0]; // Indexes: 0 - Excellent, 1 - Very Good, 2 - Good, 3 - Average, 4 - Poor
    
      // Array of valid ratings corresponding to their positions in the counts array
      const ratingIndexMap = ["excellent", "very good", "good", "average", "poor"];
    
      // Object to store feedback counts per month
      const monthlyFeedbackCountsForLinearChart = {};
      const monthlyUserCountsForLinearChart = {};
      let persentageOfemojis = [0, 0, 0, 0, 0];
    
      // Array of month names
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
    
      // Initialize counts for recommendations
      const recommendationCounts = {
        "0 Not Likely at all": 0,
        "1 Not Likely at all": 0,
        "2 Not Likely at all": 0,
        "3 Not Likely at all": 0,
        "4 Not Likely at all": 0,
        "5 Not Likely at all": 0,
        "6 Not Likely at all": 0,
        "7Likely": 0,
        "8Likely": 0,
        "9 Extremely Likely": 0,
        "10 Extremely Likely": 0,
      };
      let TotalcountOfRecommendation = 0;
    
      // Process each feedback record
      data.forEach((item) => {
        // Extract month and year from the date
        const date = new Date(item.date);
        const monthYear = `${monthNames[date.getMonth()]}-${date.getFullYear()}`; // e.g., "May-2024"
    
        // Increment the count for the corresponding month
        if (monthlyFeedbackCountsForLinearChart[monthYear]) {
          monthlyFeedbackCountsForLinearChart[monthYear]++;
        } else {
          monthlyFeedbackCountsForLinearChart[monthYear] = 1;
        }
    
        // Array of keys containing ratings
        const ratingKeys = [
          "overAllPerformance",
          "preferingSabooRKS",
          "waitTime",
          "advisorTimeAndAttention",
          "advisorsUnderstandingWorkingRequirement",
          "advisorsListenAbility",
          "advisorsBehavior",
          "advisorsRecommendationOnWorkRequirement",
          "advancePerformingWork",
          "workPerformedOnTheCar",
          "qualityOfWork",
          "postServiceWashingAndCleaning",
          "billExplanation",
          "transparencyPrice",
        ];
    
        // Iterate over rating keys and count occurrences of each rating category
        ratingKeys.forEach((key) => {
          const rating = item[key];
          // Normalize rating by converting to lowercase and trimming spaces
          const normalizedRating = rating?.toString().toLowerCase().trim();
    
          // Find the index of the normalized rating in the ratingIndexMap array
          const index = ratingIndexMap.indexOf(normalizedRating);
          if (index !== -1) {
            countsOfEmojis[index]++;
          }
        });
    
        // Process recommendation key
        const recommendation = item.recommendation?.toString().trim();
        if (recommendationCounts.hasOwnProperty(recommendation)) {
          TotalcountOfRecommendation++;
          recommendationCounts[recommendation]++;
        }
      });
    
      // Initialize all month-year combinations in the user counts chart to zero
      const allMonthYearKeys = Object.keys(monthlyFeedbackCountsForLinearChart);
      allMonthYearKeys.forEach((monthYear) => {
        monthlyUserCountsForLinearChart[monthYear] = 0;
      });
    
      // Process each user record
      userData.forEach((item) => {
        // Extract month and year from the date
        const date = new Date(item.date);
        const monthYear = `${monthNames[date.getMonth()]}-${date.getFullYear()}`; // e.g., "May-2024"
    
        // Increment the count for the corresponding month
        if (monthlyUserCountsForLinearChart[monthYear] !== undefined) {
          monthlyUserCountsForLinearChart[monthYear]++;
        }
      });
    
      // Separate keys and values into two arrays
      const monthlyFeedbackKeys = Object.keys(monthlyFeedbackCountsForLinearChart);
      const monthlyFeedbackValues = Object.values(monthlyFeedbackCountsForLinearChart);
      const monthlyUserCountsValues = Object.values(monthlyUserCountsForLinearChart);
    
      let totalEmojis =
        countsOfEmojis[0] +
        countsOfEmojis[1] +
        countsOfEmojis[2] +
        countsOfEmojis[3] +
        countsOfEmojis[4];
      let Average = countsOfEmojis[3];
      let Poor = countsOfEmojis[4];
      let OverAllGood = countsOfEmojis[0] + countsOfEmojis[1] + countsOfEmojis[2];
    
      let OverAllGoodPercentage = Math.round((OverAllGood / totalEmojis) * 100);
      let AveragePercentage = Math.round((Average / totalEmojis) * 100);
      let PoorPercentage = Math.round((Poor / totalEmojis) * 100);
      persentageOfemojis[0] = countsOfEmojis[0] != 0 ? Math.round((countsOfEmojis[0] / totalEmojis) * 100) : 0;  // Excellent percentage
      persentageOfemojis[1] = countsOfEmojis[1] != 0 ? Math.round((countsOfEmojis[1] / totalEmojis) * 100) : 0;  // Very Good percentage
      persentageOfemojis[2] = countsOfEmojis[2] != 0 ? Math.round((countsOfEmojis[2] / totalEmojis) * 100) : 0;  // Good percentage
      persentageOfemojis[3] = countsOfEmojis[3] != 0 ? Math.round((countsOfEmojis[3] / totalEmojis) * 100) : 0;  // Average percentage
      persentageOfemojis[4] = countsOfEmojis[4] != 0 ? Math.round((countsOfEmojis[4] / totalEmojis) * 100) : 0;  // Poor percentage
    
      let NotLikelyAtAll =
        recommendationCounts["0 Not Likely at all"] +
        recommendationCounts["1 Not Likely at all"] +
        recommendationCounts["2 Not Likely at all"] +
        recommendationCounts["3 Not Likely at all"] +
        recommendationCounts["4 Not Likely at all"] +
        recommendationCounts["5 Not Likely at all"] +
        recommendationCounts["6 Not Likely at all"];
    
      let Likely =
        recommendationCounts["7Likely"] + recommendationCounts["8Likely"];
    
      let ExtremelyLikely =
        recommendationCounts["9 Extremely Likely"] +
        recommendationCounts["10 Extremely Likely"];
    
      let ExtremelyLikelyPercentage = Math.round((ExtremelyLikely / TotalcountOfRecommendation) * 100);
      let LikelyPercentage = Math.round((Likely / TotalcountOfRecommendation) * 100);
      let NotLikelyAtAllPercentage = Math.round((NotLikelyAtAll / TotalcountOfRecommendation) * 100);
    
      return res.status(200).send({
        status: true,
        data: {
          persentageOfemojis,
          totalFeedbacks: data.length,
          totalUsers: userData.length,
          
          monthly_Feedback_Counts_LinearChart: {
            keys: monthlyFeedbackKeys,
            values: monthlyFeedbackValues,
          },
          monthly_User_Counts_LinearChart: {
            keys: monthlyFeedbackKeys,
            values: monthlyUserCountsValues,
          },
          recommendation_Counts_bar_chart: {
            keys: Object.keys(recommendationCounts),
            values: Object.values(recommendationCounts),
            countOfRecommendation: TotalcountOfRecommendation,
          },
          satisfactionPieChart: [
            OverAllGoodPercentage,
            AveragePercentage,
            PoorPercentage,
          ],
          recommendationPieChart: [
            ExtremelyLikelyPercentage,
            LikelyPercentage,
            NotLikelyAtAllPercentage,
          ],
        },
      });
    }

    if (filters.filter == "Current Month") {

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

      let userData = await userDataModel.aggregate([
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

      // console.log(`Total records fetched: ${data.length}`);

      // Initialize counts for ratings
      const countsOfEmojis = [0, 0, 0, 0, 0]; // Indexes: 0 - Excellent, 1 - Very Good, 2 - Good, 3 - Average, 4 - Poor
  
      // Array of valid ratings corresponding to their positions in the counts array
      const ratingIndexMap = [
        "excellent",
        "very good",
        "good",
        "average",
        "poor",
      ];
  
      // Object to store feedback counts per month
      const monthlyFeedbackCountsForLinearChart = {};
      const monthlyUserCountsForLinearChart = {};
      let persentageOfemojis = [0,0,0,0,0]
      // Array of month names
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
  
      // Initialize counts for recommendations
      const recommendationCounts = {
        "0 Not Likely at all": 0,
        "1 Not Likely at all": 0,
        "2 Not Likely at all": 0,
        "3 Not Likely at all": 0,
        "4 Not Likely at all": 0,
        "5 Not Likely at all": 0,
        "6 Not Likely at all": 0,
        "7Likely": 0,
        "8Likely": 0,
        "9 Extremely Likely": 0,
        "10 Extremely Likely": 0,
      };
      let TotalcountOfRecommendation = 0;
      // Process each record
      data.forEach((item) => {
        // Extract month and year from the date
        const date = new Date(item.date);
        const monthYear = `${monthNames[date.getMonth()]}-${date.getFullYear()}`; // e.g., "May-2024"
  
        // Increment the count for the corresponding month
        if (monthlyFeedbackCountsForLinearChart[monthYear]) {
          monthlyFeedbackCountsForLinearChart[monthYear]++;
        } else {
          monthlyFeedbackCountsForLinearChart[monthYear] = 1;
        }
  
        // Array of keys containing ratings
        const ratingKeys = [
          "overAllPerformance",
          "preferingSabooRKS",
          "waitTime",
          "advisorTimeAndAttention",
          "advisorsUnderstandingWorkingRequirement",
          "advisorsListenAbility",
          "advisorsBehavior",
          "advisorsRecommendationOnWorkRequirement",
          "advancePerformingWork",
          "workPerformedOnTheCar",
          "qualityOfWork",
          "postServiceWashingAndCleaning",
          "billExplanation",
          "transparencyPrice",
        ];
  
        // Iterate over rating keys and count occurrences of each rating category
        ratingKeys.forEach((key) => {
          const rating = item[key];
          // Normalize rating by converting to lowercase and trimming spaces
          const normalizedRating = rating?.toString().toLowerCase().trim();
  
          // Find the index of the normalized rating in the ratingIndexMap array
          const index = ratingIndexMap.indexOf(normalizedRating);
          if (index !== -1) {
            countsOfEmojis[index]++;
          }
        });
  
        // // Process recommendation key
        // let countOfRecommendation = 0
        const recommendation = item.recommendation?.toString().trim();
        if (recommendationCounts.hasOwnProperty(recommendation)) {
          TotalcountOfRecommendation++;
          recommendationCounts[recommendation]++;
        }
      });

      const allMonthYearKeys = Object.keys(monthlyFeedbackCountsForLinearChart);
      allMonthYearKeys.forEach((monthYear) => {
        monthlyUserCountsForLinearChart[monthYear] = 0;
      });
    
      // Process each user record
      userData.forEach((item) => {
        // Extract month and year from the date
        const date = new Date(item.date);
        const monthYear = `${monthNames[date.getMonth()]}-${date.getFullYear()}`; // e.g., "May-2024"
    
        // Increment the count for the corresponding month
        if (monthlyUserCountsForLinearChart[monthYear] !== undefined) {
          monthlyUserCountsForLinearChart[monthYear]++;
        }
      });

      // Separate keys and values into two arrays
      const monthlyFeedbackKeys = Object.keys(
        monthlyFeedbackCountsForLinearChart
      );
      const monthlyFeedbackValues = Object.values(
        monthlyFeedbackCountsForLinearChart
      );
        const monthlyUserCountsValues = Object.values(monthlyUserCountsForLinearChart);
    
      // Separate keys and values for recommendation counts
      const recommendationKeys = Object.keys(recommendationCounts);
      const recommendationValues = Object.values(recommendationCounts);
      // console.log("countOfRecommendation")
  
      let totalEmojis =
        countsOfEmojis[0] +
        countsOfEmojis[1] +
        countsOfEmojis[2] +
        countsOfEmojis[3] +
        countsOfEmojis[4];
      let Average = countsOfEmojis[3];
      let Poor = countsOfEmojis[4];
      let OverAllGood = countsOfEmojis[0] + countsOfEmojis[1] + countsOfEmojis[2];
  
      let OverAllGoodPercentage = Math.round((OverAllGood / totalEmojis) * 100);
      let AveragePercentage = Math.round((Average / totalEmojis) * 100);
      let PoorPercentage = Math.round((Poor / totalEmojis) * 100);
  
      persentageOfemojis[0] = countsOfEmojis[0] != 0 ? Math.round((countsOfEmojis[0] / totalEmojis) * 100) : 0;  // Excellent percentage
      persentageOfemojis[1] = countsOfEmojis[1] != 0 ? Math.round((countsOfEmojis[1] / totalEmojis) * 100) : 0;  // Very Good percentage
      persentageOfemojis[2] = countsOfEmojis[2] != 0 ? Math.round((countsOfEmojis[2] / totalEmojis) * 100) : 0;  // Good percentage
      persentageOfemojis[3] = countsOfEmojis[3] != 0 ? Math.round((countsOfEmojis[3] / totalEmojis) * 100) : 0;  // Average percentage
      persentageOfemojis[4] = countsOfEmojis[4] != 0 ? Math.round((countsOfEmojis[4] / totalEmojis) * 100) : 0;  // Poor percentage
      // console.log("OverAllGood Percentage: " + OverAllGoodPercentage);
      // console.log("Average Percentage: " + AveragePercentage);
      // console.log("Poor Percentage: " + PoorPercentage);
  
      let NotLikelyAtAll =
        recommendationCounts["0 Not Likely at all"] +
        recommendationCounts["1 Not Likely at all"] +
        recommendationCounts["2 Not Likely at all"] +
        recommendationCounts["3 Not Likely at all"] +
        recommendationCounts["4 Not Likely at all"] +
        recommendationCounts["5 Not Likely at all"] +
        recommendationCounts["6 Not Likely at all"];
  
      let Likely =
        recommendationCounts["7Likely"] + recommendationCounts["8Likely"];
  
      let ExtremelyLikely =
        recommendationCounts["9 Extremely Likely"] +
        recommendationCounts["10 Extremely Likely"];
      // console.log(ExtremelyLikely, Likely, NotLikelyAtAll);
  
      let ExtremelyLikelyPercentage = Math.round((ExtremelyLikely / TotalcountOfRecommendation) * 100);
      let LikelyPercentage = Math.round((Likely / TotalcountOfRecommendation) * 100);
      let NotLikelyAtAllPercentage = Math.round((NotLikelyAtAll / TotalcountOfRecommendation) * 100);
      // console.log(ExtremelyLikelyPercentage,LikelyPercentage,NotLikelyAtAllPercentage)
      return res.status(200).send({
        status: true,
        data: {
          persentageOfemojis,
          totalFeedbacks: data.length,

          monthly_Feedback_Counts_LinearChart: {
            keys: monthlyFeedbackKeys,
            values: monthlyFeedbackValues,
          },
          monthly_User_Counts_LinearChart: {
            keys: monthlyFeedbackKeys,
            values: monthlyUserCountsValues,
          },
          recommendation_Counts_bar_chart: {
            keys: recommendationKeys,
            values: recommendationValues,
            countOfRecommendation: TotalcountOfRecommendation,
          },
          
          satisfactionPieChart: [
            OverAllGoodPercentage,
            AveragePercentage,
            PoorPercentage,
          ],
         recommendationPieChart:[ExtremelyLikelyPercentage,LikelyPercentage,NotLikelyAtAllPercentage]
        },
      });
    }
    if (filters.filter == "Last Month") {
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

  let userData = await userDataModel.aggregate([
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
      // console.log(`Total records fetched: ${data.length}`);

      // Initialize counts for ratings
      const countsOfEmojis = [0, 0, 0, 0, 0]; // Indexes: 0 - Excellent, 1 - Very Good, 2 - Good, 3 - Average, 4 - Poor
  
      // Array of valid ratings corresponding to their positions in the counts array
      const ratingIndexMap = [
        "excellent",
        "very good",
        "good",
        "average",
        "poor",
      ];
  
      // Object to store feedback counts per month
      const monthlyFeedbackCountsForLinearChart = {};
      const monthlyUserCountsForLinearChart = {};
      let persentageOfemojis = [0,0,0,0,0]
      // Array of month names
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
  
      // Initialize counts for recommendations
      const recommendationCounts = {
        "0 Not Likely at all": 0,
        "1 Not Likely at all": 0,
        "2 Not Likely at all": 0,
        "3 Not Likely at all": 0,
        "4 Not Likely at all": 0,
        "5 Not Likely at all": 0,
        "6 Not Likely at all": 0,
        "7Likely": 0,
        "8Likely": 0,
        "9 Extremely Likely": 0,
        "10 Extremely Likely": 0,
      };
      let TotalcountOfRecommendation = 0;
      // Process each record
      data.forEach((item) => {
        // Extract month and year from the date
        const date = new Date(item.date);
        const monthYear = `${monthNames[date.getMonth()]}-${date.getFullYear()}`; // e.g., "May-2024"
  
        // Increment the count for the corresponding month
        if (monthlyFeedbackCountsForLinearChart[monthYear]) {
          monthlyFeedbackCountsForLinearChart[monthYear]++;
        } else {
          monthlyFeedbackCountsForLinearChart[monthYear] = 1;
        }
  
        // Array of keys containing ratings
        const ratingKeys = [
          "overAllPerformance",
          "preferingSabooRKS",
          "waitTime",
          "advisorTimeAndAttention",
          "advisorsUnderstandingWorkingRequirement",
          "advisorsListenAbility",
          "advisorsBehavior",
          "advisorsRecommendationOnWorkRequirement",
          "advancePerformingWork",
          "workPerformedOnTheCar",
          "qualityOfWork",
          "postServiceWashingAndCleaning",
          "billExplanation",
          "transparencyPrice",
        ];
  
        // Iterate over rating keys and count occurrences of each rating category
        ratingKeys.forEach((key) => {
          const rating = item[key];
          // Normalize rating by converting to lowercase and trimming spaces
          const normalizedRating = rating?.toString().toLowerCase().trim();
  
          // Find the index of the normalized rating in the ratingIndexMap array
          const index = ratingIndexMap.indexOf(normalizedRating);
          if (index !== -1) {
            countsOfEmojis[index]++;
          }
        });
  
        // // Process recommendation key
        // let countOfRecommendation = 0
        const recommendation = item.recommendation?.toString().trim();
        if (recommendationCounts.hasOwnProperty(recommendation)) {
          TotalcountOfRecommendation++;
          recommendationCounts[recommendation]++;
        }
      });
  
      const allMonthYearKeys = Object.keys(monthlyFeedbackCountsForLinearChart);
      allMonthYearKeys.forEach((monthYear) => {
        monthlyUserCountsForLinearChart[monthYear] = 0;
      });
    
      // Process each user record
      userData.forEach((item) => {
        // Extract month and year from the date
        const date = new Date(item.date);
        const monthYear = `${monthNames[date.getMonth()]}-${date.getFullYear()}`; // e.g., "May-2024"
    
        // Increment the count for the corresponding month
        if (monthlyUserCountsForLinearChart[monthYear] !== undefined) {
          monthlyUserCountsForLinearChart[monthYear]++;
        }
      });
    
      // Separate keys and values into two arrays
      const monthlyFeedbackKeys = Object.keys(
        monthlyFeedbackCountsForLinearChart
      );
      const monthlyFeedbackValues = Object.values(
        monthlyFeedbackCountsForLinearChart
      );
  
      // Separate keys and values for recommendation counts
      const recommendationKeys = Object.keys(recommendationCounts);
      const recommendationValues = Object.values(recommendationCounts);
      const monthlyUserCountsValues = Object.values(monthlyUserCountsForLinearChart);
      // console.log("countOfRecommendation")
  
      let totalEmojis =
        countsOfEmojis[0] +
        countsOfEmojis[1] +
        countsOfEmojis[2] +
        countsOfEmojis[3] +
        countsOfEmojis[4];
      let Average = countsOfEmojis[3];
      let Poor = countsOfEmojis[4];
      let OverAllGood = countsOfEmojis[0] + countsOfEmojis[1] + countsOfEmojis[2];
  
      let OverAllGoodPercentage = Math.round((OverAllGood / totalEmojis) * 100);
      let AveragePercentage = Math.round((Average / totalEmojis) * 100);
      let PoorPercentage = Math.round((Poor / totalEmojis) * 100);
  
      persentageOfemojis[0] = countsOfEmojis[0] != 0 ? Math.round((countsOfEmojis[0] / totalEmojis) * 100) : 0;  // Excellent percentage
      persentageOfemojis[1] = countsOfEmojis[1] != 0 ? Math.round((countsOfEmojis[1] / totalEmojis) * 100) : 0;  // Very Good percentage
      persentageOfemojis[2] = countsOfEmojis[2] != 0 ? Math.round((countsOfEmojis[2] / totalEmojis) * 100) : 0;  // Good percentage
      persentageOfemojis[3] = countsOfEmojis[3] != 0 ? Math.round((countsOfEmojis[3] / totalEmojis) * 100) : 0;  // Average percentage
      persentageOfemojis[4] = countsOfEmojis[4] != 0 ? Math.round((countsOfEmojis[4] / totalEmojis) * 100) : 0;  // Poor percentage
      // console.log("OverAllGood Percentage: " + OverAllGoodPercentage);
      // console.log("Average Percentage: " + AveragePercentage);
      // console.log("Poor Percentage: " + PoorPercentage);
  
      let NotLikelyAtAll =
        recommendationCounts["0 Not Likely at all"] +
        recommendationCounts["1 Not Likely at all"] +
        recommendationCounts["2 Not Likely at all"] +
        recommendationCounts["3 Not Likely at all"] +
        recommendationCounts["4 Not Likely at all"] +
        recommendationCounts["5 Not Likely at all"] +
        recommendationCounts["6 Not Likely at all"];
  
      let Likely =
        recommendationCounts["7Likely"] + recommendationCounts["8Likely"];
  
      let ExtremelyLikely =
        recommendationCounts["9 Extremely Likely"] +
        recommendationCounts["10 Extremely Likely"];
      // console.log(ExtremelyLikely, Likely, NotLikelyAtAll);
  
      let ExtremelyLikelyPercentage = Math.round((ExtremelyLikely / TotalcountOfRecommendation) * 100);
      let LikelyPercentage = Math.round((Likely / TotalcountOfRecommendation) * 100);
      let NotLikelyAtAllPercentage = Math.round((NotLikelyAtAll / TotalcountOfRecommendation) * 100);
      // console.log(ExtremelyLikelyPercentage,LikelyPercentage,NotLikelyAtAllPercentage)
      return res.status(200).send({
        status: true,
        data: {
          persentageOfemojis,
          totalFeedbacks: data.length,
          monthly_Feedback_Counts_LinearChart: {
            keys: monthlyFeedbackKeys,
            values: monthlyFeedbackValues,
          },
          monthly_User_Counts_LinearChart: {
            keys: monthlyFeedbackKeys,
            values: monthlyUserCountsValues,
          }, 

          recommendation_Counts_bar_chart: {
            keys: recommendationKeys,
            values: recommendationValues,
            countOfRecommendation: TotalcountOfRecommendation,
          },
          satisfactionPieChart: [
            OverAllGoodPercentage,
            AveragePercentage,
            PoorPercentage,
          ],
         recommendationPieChart:[ExtremelyLikelyPercentage,LikelyPercentage,NotLikelyAtAllPercentage]
        },
      });
    }
    if (filters.filter == "Last Week") {
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
      // console.log(`Total records fetched: ${data.length}`);

       // Fetch user data
       let userData = await userDataModel.aggregate([
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

      // console.log(`Total user records fetched: ${userData.length}`);
      // Initialize counts for ratings
      const countsOfEmojis = [0, 0, 0, 0, 0]; // Indexes: 0 - Excellent, 1 - Very Good, 2 - Good, 3 - Average, 4 - Poor
  
      // Array of valid ratings corresponding to their positions in the counts array
      const ratingIndexMap = [
        "excellent",
        "very good",
        "good",
        "average",
        "poor",
      ];
  
      // Object to store feedback counts per month
      const monthlyFeedbackCountsForLinearChart = {};
      const monthlyUserCountsForLinearChart = {};
      let persentageOfemojis = [0,0,0,0,0]
      // Array of month names
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
  
      // Initialize counts for recommendations
      const recommendationCounts = {
        "0 Not Likely at all": 0,
        "1 Not Likely at all": 0,
        "2 Not Likely at all": 0,
        "3 Not Likely at all": 0,
        "4 Not Likely at all": 0,
        "5 Not Likely at all": 0,
        "6 Not Likely at all": 0,
        "7Likely": 0,
        "8Likely": 0,
        "9 Extremely Likely": 0,
        "10 Extremely Likely": 0,
      };
      let TotalcountOfRecommendation = 0;
      // Process each record
      data.forEach((item) => {
        // Extract month and year from the date
        const date = new Date(item.date);
        const monthYear = `${monthNames[date.getMonth()]}-${date.getFullYear()}`; // e.g., "May-2024"
  
        // Increment the count for the corresponding month
        if (monthlyFeedbackCountsForLinearChart[monthYear]) {
          monthlyFeedbackCountsForLinearChart[monthYear]++;
        } else {
          monthlyFeedbackCountsForLinearChart[monthYear] = 1;
        }
  
        // Array of keys containing ratings
        const ratingKeys = [
          "overAllPerformance",
          "preferingSabooRKS",
          "waitTime",
          "advisorTimeAndAttention",
          "advisorsUnderstandingWorkingRequirement",
          "advisorsListenAbility",
          "advisorsBehavior",
          "advisorsRecommendationOnWorkRequirement",
          "advancePerformingWork",
          "workPerformedOnTheCar",
          "qualityOfWork",
          "postServiceWashingAndCleaning",
          "billExplanation",
          "transparencyPrice",
        ];
  
        // Iterate over rating keys and count occurrences of each rating category
        ratingKeys.forEach((key) => {
          const rating = item[key];
          // Normalize rating by converting to lowercase and trimming spaces
          const normalizedRating = rating?.toString().toLowerCase().trim();
  
          // Find the index of the normalized rating in the ratingIndexMap array
          const index = ratingIndexMap.indexOf(normalizedRating);
          if (index !== -1) {
            countsOfEmojis[index]++;
          }
        });
  
        // // Process recommendation key
        // let countOfRecommendation = 0
        const recommendation = item.recommendation?.toString().trim();
        if (recommendationCounts.hasOwnProperty(recommendation)) {
          TotalcountOfRecommendation++;
          recommendationCounts[recommendation]++;
        }
      });
  
      const allMonthYearKeys = Object.keys(monthlyFeedbackCountsForLinearChart);
      allMonthYearKeys.forEach((monthYear) => {
        monthlyUserCountsForLinearChart[monthYear] = 0;
      });
    
      // Process each user record
      userData.forEach((item) => {
        // Extract month and year from the date
        const date = new Date(item.date);
        const monthYear = `${monthNames[date.getMonth()]}-${date.getFullYear()}`; // e.g., "May-2024"
    
        // Increment the count for the corresponding month
        if (monthlyUserCountsForLinearChart[monthYear] !== undefined) {
          monthlyUserCountsForLinearChart[monthYear]++;
        }
      });
      // Separate keys and values into two arrays
      const monthlyFeedbackKeys = Object.keys(
        monthlyFeedbackCountsForLinearChart
      );
      const monthlyFeedbackValues = Object.values(
        monthlyFeedbackCountsForLinearChart
      );
      const monthlyUserCountsValues = Object.values(monthlyUserCountsForLinearChart);
  
      // Separate keys and values for recommendation counts
      const recommendationKeys = Object.keys(recommendationCounts);
      const recommendationValues = Object.values(recommendationCounts);
      // console.log("countOfRecommendation")
  
      let totalEmojis =
        countsOfEmojis[0] +
        countsOfEmojis[1] +
        countsOfEmojis[2] +
        countsOfEmojis[3] +
        countsOfEmojis[4];
      let Average = countsOfEmojis[3];
      let Poor = countsOfEmojis[4];
      let OverAllGood = countsOfEmojis[0] + countsOfEmojis[1] + countsOfEmojis[2];
  
      let OverAllGoodPercentage = Math.round((OverAllGood / totalEmojis) * 100);
      let AveragePercentage = Math.round((Average / totalEmojis) * 100);
      let PoorPercentage = Math.round((Poor / totalEmojis) * 100);
  
      persentageOfemojis[0] = countsOfEmojis[0] != 0 ? Math.round((countsOfEmojis[0] / totalEmojis) * 100) : 0;  // Excellent percentage
      persentageOfemojis[1] = countsOfEmojis[1] != 0 ? Math.round((countsOfEmojis[1] / totalEmojis) * 100) : 0;  // Very Good percentage
      persentageOfemojis[2] = countsOfEmojis[2] != 0 ? Math.round((countsOfEmojis[2] / totalEmojis) * 100) : 0;  // Good percentage
      persentageOfemojis[3] = countsOfEmojis[3] != 0 ? Math.round((countsOfEmojis[3] / totalEmojis) * 100) : 0;  // Average percentage
      persentageOfemojis[4] = countsOfEmojis[4] != 0 ? Math.round((countsOfEmojis[4] / totalEmojis) * 100) : 0;  // Poor percentage
      // console.log("OverAllGood Percentage: " + OverAllGoodPercentage);
      // console.log("Average Percentage: " + AveragePercentage);
      // console.log("Poor Percentage: " + PoorPercentage);
  
      let NotLikelyAtAll =
        recommendationCounts["0 Not Likely at all"] +
        recommendationCounts["1 Not Likely at all"] +
        recommendationCounts["2 Not Likely at all"] +
        recommendationCounts["3 Not Likely at all"] +
        recommendationCounts["4 Not Likely at all"] +
        recommendationCounts["5 Not Likely at all"] +
        recommendationCounts["6 Not Likely at all"];
  
      let Likely =
        recommendationCounts["7Likely"] + recommendationCounts["8Likely"];
  
      let ExtremelyLikely =
        recommendationCounts["9 Extremely Likely"] +
        recommendationCounts["10 Extremely Likely"];
      // console.log(ExtremelyLikely, Likely, NotLikelyAtAll);
  
      let ExtremelyLikelyPercentage = Math.round((ExtremelyLikely / TotalcountOfRecommendation) * 100);
      let LikelyPercentage = Math.round((Likely / TotalcountOfRecommendation) * 100);
      let NotLikelyAtAllPercentage = Math.round((NotLikelyAtAll / TotalcountOfRecommendation) * 100);
      // console.log(ExtremelyLikelyPercentage,LikelyPercentage,NotLikelyAtAllPercentage)
      return res.status(200).send({
        status: true,
        data: {
          persentageOfemojis,
          totalFeedbacks: data.length,
          monthly_Feedback_Counts_LinearChart: {
            keys: monthlyFeedbackKeys,
            values: monthlyFeedbackValues,
          },
          monthly_User_Counts_LinearChart: {
            keys: monthlyFeedbackKeys,
            values: monthlyUserCountsValues,
          },
          recommendation_Counts_bar_chart: {
            keys: recommendationKeys,
            values: recommendationValues,
            countOfRecommendation: TotalcountOfRecommendation,
          },
          satisfactionPieChart: [
            OverAllGoodPercentage,
            AveragePercentage,
            PoorPercentage,
          ],
         recommendationPieChart:[ExtremelyLikelyPercentage,LikelyPercentage,NotLikelyAtAllPercentage]
        },
      });
    }

    if (filters.filter == "Last 3 Month") {
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

      // console.log(`Total records fetched: ${data.length}`);

       // Fetch user data
       let userData = await userDataModel.aggregate([
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

      // console.log(`Total user records fetched: ${userData.length}`);
      // Initialize counts for ratings
      const countsOfEmojis = [0, 0, 0, 0, 0]; // Indexes: 0 - Excellent, 1 - Very Good, 2 - Good, 3 - Average, 4 - Poor
  
      // Array of valid ratings corresponding to their positions in the counts array
      const ratingIndexMap = [
        "excellent",
        "very good",
        "good",
        "average",
        "poor",
      ];
  
      // Object to store feedback counts per month
      const monthlyFeedbackCountsForLinearChart = {};
      const monthlyUserCountsForLinearChart = {};
      let persentageOfemojis = [0,0,0,0,0]
      // Array of month names
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
  
      // Initialize counts for recommendations
      const recommendationCounts = {
        "0 Not Likely at all": 0,
        "1 Not Likely at all": 0,
        "2 Not Likely at all": 0,
        "3 Not Likely at all": 0,
        "4 Not Likely at all": 0,
        "5 Not Likely at all": 0,
        "6 Not Likely at all": 0,
        "7Likely": 0,
        "8Likely": 0,
        "9 Extremely Likely": 0,
        "10 Extremely Likely": 0,
      };
      let TotalcountOfRecommendation = 0;
      // Process each record
      data.forEach((item) => {
        // Extract month and year from the date
        const date = new Date(item.date);
        const monthYear = `${monthNames[date.getMonth()]}-${date.getFullYear()}`; // e.g., "May-2024"
  
        // Increment the count for the corresponding month
        if (monthlyFeedbackCountsForLinearChart[monthYear]) {
          monthlyFeedbackCountsForLinearChart[monthYear]++;
        } else {
          monthlyFeedbackCountsForLinearChart[monthYear] = 1;
        }
  
        // Array of keys containing ratings
        const ratingKeys = [
          "overAllPerformance",
          "preferingSabooRKS",
          "waitTime",
          "advisorTimeAndAttention",
          "advisorsUnderstandingWorkingRequirement",
          "advisorsListenAbility",
          "advisorsBehavior",
          "advisorsRecommendationOnWorkRequirement",
          "advancePerformingWork",
          "workPerformedOnTheCar",
          "qualityOfWork",
          "postServiceWashingAndCleaning",
          "billExplanation",
          "transparencyPrice",
        ];
  
        // Iterate over rating keys and count occurrences of each rating category
        ratingKeys.forEach((key) => {
          const rating = item[key];
          // Normalize rating by converting to lowercase and trimming spaces
          const normalizedRating = rating?.toString().toLowerCase().trim();
  
          // Find the index of the normalized rating in the ratingIndexMap array
          const index = ratingIndexMap.indexOf(normalizedRating);
          if (index !== -1) {
            countsOfEmojis[index]++;
          }
        });
  
        // // Process recommendation key
        // let countOfRecommendation = 0
        const recommendation = item.recommendation?.toString().trim();
        if (recommendationCounts.hasOwnProperty(recommendation)) {
          TotalcountOfRecommendation++;
          recommendationCounts[recommendation]++;
        }
      });
  
      const allMonthYearKeys = Object.keys(monthlyFeedbackCountsForLinearChart);
      allMonthYearKeys.forEach((monthYear) => {
        monthlyUserCountsForLinearChart[monthYear] = 0;
      });
    
      // Process each user record
      userData.forEach((item) => {
        // Extract month and year from the date
        const date = new Date(item.date);
        const monthYear = `${monthNames[date.getMonth()]}-${date.getFullYear()}`; // e.g., "May-2024"
    
        // Increment the count for the corresponding month
        if (monthlyUserCountsForLinearChart[monthYear] !== undefined) {
          monthlyUserCountsForLinearChart[monthYear]++;
        }
      });

      // Separate keys and values into two arrays
      const monthlyFeedbackKeys = Object.keys(
        monthlyFeedbackCountsForLinearChart
      );
      const monthlyFeedbackValues = Object.values(
        monthlyFeedbackCountsForLinearChart
      );
   const monthlyUserCountsValues = Object.values(monthlyUserCountsForLinearChart);
    
      // Separate keys and values for recommendation counts
      const recommendationKeys = Object.keys(recommendationCounts);
      const recommendationValues = Object.values(recommendationCounts);
      // console.log("countOfRecommendation")
  
      let totalEmojis =
        countsOfEmojis[0] +
        countsOfEmojis[1] +
        countsOfEmojis[2] +
        countsOfEmojis[3] +
        countsOfEmojis[4];
      let Average = countsOfEmojis[3];
      let Poor = countsOfEmojis[4];
      let OverAllGood = countsOfEmojis[0] + countsOfEmojis[1] + countsOfEmojis[2];
  
      let OverAllGoodPercentage = Math.round((OverAllGood / totalEmojis) * 100);
      let AveragePercentage = Math.round((Average / totalEmojis) * 100);
      let PoorPercentage = Math.round((Poor / totalEmojis) * 100);
  

      persentageOfemojis[0] = countsOfEmojis[0] != 0 ? Math.round((countsOfEmojis[0] / totalEmojis) * 100) : 0;  // Excellent percentage
      persentageOfemojis[1] = countsOfEmojis[1] != 0 ? Math.round((countsOfEmojis[1] / totalEmojis) * 100) : 0;  // Very Good percentage
      persentageOfemojis[2] = countsOfEmojis[2] != 0 ? Math.round((countsOfEmojis[2] / totalEmojis) * 100) : 0;  // Good percentage
      persentageOfemojis[3] = countsOfEmojis[3] != 0 ? Math.round((countsOfEmojis[3] / totalEmojis) * 100) : 0;  // Average percentage
      persentageOfemojis[4] = countsOfEmojis[4] != 0 ? Math.round((countsOfEmojis[4] / totalEmojis) * 100) : 0;  // Poor percentage

      // console.log("OverAllGood Percentage: " + OverAllGoodPercentage);
      // console.log("Average Percentage: " + AveragePercentage);
      // console.log("Poor Percentage: " + PoorPercentage);
  
      let NotLikelyAtAll =
        recommendationCounts["0 Not Likely at all"] +
        recommendationCounts["1 Not Likely at all"] +
        recommendationCounts["2 Not Likely at all"] +
        recommendationCounts["3 Not Likely at all"] +
        recommendationCounts["4 Not Likely at all"] +
        recommendationCounts["5 Not Likely at all"] +
        recommendationCounts["6 Not Likely at all"];
  
      let Likely =
        recommendationCounts["7Likely"] + recommendationCounts["8Likely"];
  
      let ExtremelyLikely =
        recommendationCounts["9 Extremely Likely"] +
        recommendationCounts["10 Extremely Likely"];
      // console.log(ExtremelyLikely, Likely, NotLikelyAtAll);
  
      let ExtremelyLikelyPercentage = Math.round((ExtremelyLikely / TotalcountOfRecommendation) * 100);
      let LikelyPercentage = Math.round((Likely / TotalcountOfRecommendation) * 100);
      let NotLikelyAtAllPercentage = Math.round((NotLikelyAtAll / TotalcountOfRecommendation) * 100);
      // console.log(ExtremelyLikelyPercentage,LikelyPercentage,NotLikelyAtAllPercentage)
      return res.status(200).send({
        status: true,
        data: {
          persentageOfemojis,
          totalFeedbacks: data.length,
          monthly_Feedback_Counts_LinearChart: {
            keys: monthlyFeedbackKeys,
            values: monthlyFeedbackValues,
          },
          monthly_User_Counts_LinearChart: {
            keys: monthlyFeedbackKeys,
            values: monthlyUserCountsValues,
          },
          recommendation_Counts_bar_chart: {
            keys: recommendationKeys,
            values: recommendationValues,
            countOfRecommendation: TotalcountOfRecommendation,
          },
          satisfactionPieChart: [
            OverAllGoodPercentage,
            AveragePercentage,
            PoorPercentage,
          ],
         recommendationPieChart:[ExtremelyLikelyPercentage,LikelyPercentage,NotLikelyAtAllPercentage]
        },
      });
    }
    if (filters.filter == "Last 6 Month") {
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

      let userData = await userDataModel.aggregate([
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
      // console.log(`Total user records fetched: ${userData.length}`);
      // console.log(`Total records fetched: ${data.length}`);

      // Initialize counts for ratings
      const countsOfEmojis = [0, 0, 0, 0, 0]; // Indexes: 0 - Excellent, 1 - Very Good, 2 - Good, 3 - Average, 4 - Poor
  
      // Array of valid ratings corresponding to their positions in the counts array
      const ratingIndexMap = [
        "excellent",
        "very good",
        "good",
        "average",
        "poor",
      ];
  
      // Object to store feedback counts per month
      const monthlyFeedbackCountsForLinearChart = {};
      const monthlyUserCountsForLinearChart = {};
      let persentageOfemojis = [0,0,0,0,0]
      // Array of month names
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
  
      // Initialize counts for recommendations
      const recommendationCounts = {
        "0 Not Likely at all": 0,
        "1 Not Likely at all": 0,
        "2 Not Likely at all": 0,
        "3 Not Likely at all": 0,
        "4 Not Likely at all": 0,
        "5 Not Likely at all": 0,
        "6 Not Likely at all": 0,
        "7Likely": 0,
        "8Likely": 0,
        "9 Extremely Likely": 0,
        "10 Extremely Likely": 0,
      };
      let TotalcountOfRecommendation = 0;
      // Process each record
      data.forEach((item) => {
        // Extract month and year from the date
        const date = new Date(item.date);
        const monthYear = `${monthNames[date.getMonth()]}-${date.getFullYear()}`; // e.g., "May-2024"
  
        // Increment the count for the corresponding month
        if (monthlyFeedbackCountsForLinearChart[monthYear]) {
          monthlyFeedbackCountsForLinearChart[monthYear]++;
        } else {
          monthlyFeedbackCountsForLinearChart[monthYear] = 1;
        }
  
        // Array of keys containing ratings
        const ratingKeys = [
          "overAllPerformance",
          "preferingSabooRKS",
          "waitTime",
          "advisorTimeAndAttention",
          "advisorsUnderstandingWorkingRequirement",
          "advisorsListenAbility",
          "advisorsBehavior",
          "advisorsRecommendationOnWorkRequirement",
          "advancePerformingWork",
          "workPerformedOnTheCar",
          "qualityOfWork",
          "postServiceWashingAndCleaning",
          "billExplanation",
          "transparencyPrice",
        ];
  
        // Iterate over rating keys and count occurrences of each rating category
        ratingKeys.forEach((key) => {
          const rating = item[key];
          // Normalize rating by converting to lowercase and trimming spaces
          const normalizedRating = rating?.toString().toLowerCase().trim();
  
          // Find the index of the normalized rating in the ratingIndexMap array
          const index = ratingIndexMap.indexOf(normalizedRating);
          if (index !== -1) {
            countsOfEmojis[index]++;
          }
        });
  
        // // Process recommendation key
        // let countOfRecommendation = 0
        const recommendation = item.recommendation?.toString().trim();
        if (recommendationCounts.hasOwnProperty(recommendation)) {
          TotalcountOfRecommendation++;
          recommendationCounts[recommendation]++;
        }
      });
  
      const allMonthYearKeys = Object.keys(monthlyFeedbackCountsForLinearChart);
      allMonthYearKeys.forEach((monthYear) => {
        monthlyUserCountsForLinearChart[monthYear] = 0;
      });
    
      // Process each user record
      userData.forEach((item) => {
        // Extract month and year from the date
        const date = new Date(item.date);
        const monthYear = `${monthNames[date.getMonth()]}-${date.getFullYear()}`; // e.g., "May-2024"
    
        // Increment the count for the corresponding month
        if (monthlyUserCountsForLinearChart[monthYear] !== undefined) {
          monthlyUserCountsForLinearChart[monthYear]++;
        }
      });
      // Separate keys and values into two arrays
      const monthlyFeedbackKeys = Object.keys(
        monthlyFeedbackCountsForLinearChart
      );
      const monthlyFeedbackValues = Object.values(
        monthlyFeedbackCountsForLinearChart
      );
      const monthlyUserCountsValues = Object.values(monthlyUserCountsForLinearChart);
  
      // Separate keys and values for recommendation counts
      const recommendationKeys = Object.keys(recommendationCounts);
      const recommendationValues = Object.values(recommendationCounts);
      // console.log("countOfRecommendation")
  
      let totalEmojis =
        countsOfEmojis[0] +
        countsOfEmojis[1] +
        countsOfEmojis[2] +
        countsOfEmojis[3] +
        countsOfEmojis[4];
      let Average = countsOfEmojis[3];
      let Poor = countsOfEmojis[4];
      let OverAllGood = countsOfEmojis[0] + countsOfEmojis[1] + countsOfEmojis[2];
  
      let OverAllGoodPercentage = Math.round((OverAllGood / totalEmojis) * 100);
      let AveragePercentage = Math.round((Average / totalEmojis) * 100);
      let PoorPercentage = Math.round((Poor / totalEmojis) * 100);
  
      persentageOfemojis[0] = countsOfEmojis[0] != 0 ? Math.round((countsOfEmojis[0] / totalEmojis) * 100) : 0;  // Excellent percentage
      persentageOfemojis[1] = countsOfEmojis[1] != 0 ? Math.round((countsOfEmojis[1] / totalEmojis) * 100) : 0;  // Very Good percentage
      persentageOfemojis[2] = countsOfEmojis[2] != 0 ? Math.round((countsOfEmojis[2] / totalEmojis) * 100) : 0;  // Good percentage
      persentageOfemojis[3] = countsOfEmojis[3] != 0 ? Math.round((countsOfEmojis[3] / totalEmojis) * 100) : 0;  // Average percentage
      persentageOfemojis[4] = countsOfEmojis[4] != 0 ? Math.round((countsOfEmojis[4] / totalEmojis) * 100) : 0;  // Poor percentage
      // console.log("OverAllGood Percentage: " + OverAllGoodPercentage);
      // console.log("Average Percentage: " + AveragePercentage);
      // console.log("Poor Percentage: " + PoorPercentage);
  
      let NotLikelyAtAll =
        recommendationCounts["0 Not Likely at all"] +
        recommendationCounts["1 Not Likely at all"] +
        recommendationCounts["2 Not Likely at all"] +
        recommendationCounts["3 Not Likely at all"] +
        recommendationCounts["4 Not Likely at all"] +
        recommendationCounts["5 Not Likely at all"] +
        recommendationCounts["6 Not Likely at all"];
  
      let Likely =
        recommendationCounts["7Likely"] + recommendationCounts["8Likely"];
  
      let ExtremelyLikely =
        recommendationCounts["9 Extremely Likely"] +
        recommendationCounts["10 Extremely Likely"];
      // console.log(ExtremelyLikely, Likely, NotLikelyAtAll);
  
      let ExtremelyLikelyPercentage = Math.round((ExtremelyLikely / TotalcountOfRecommendation) * 100);
      let LikelyPercentage = Math.round((Likely / TotalcountOfRecommendation) * 100);
      let NotLikelyAtAllPercentage = Math.round((NotLikelyAtAll / TotalcountOfRecommendation) * 100);
      // console.log(ExtremelyLikelyPercentage,LikelyPercentage,NotLikelyAtAllPercentage)
      return res.status(200).send({
        status: true,
        data: {
          persentageOfemojis,
          totalFeedbacks: data.length,
          monthly_Feedback_Counts_LinearChart: {
            keys: monthlyFeedbackKeys,
            values: monthlyFeedbackValues,
          },
          monthly_User_Counts_LinearChart: {
            keys: monthlyFeedbackKeys,
            values: monthlyUserCountsValues,
          },
          recommendation_Counts_bar_chart: {
            keys: recommendationKeys,
            values: recommendationValues,
            countOfRecommendation: TotalcountOfRecommendation,
          },
          satisfactionPieChart: [
            OverAllGoodPercentage,
            AveragePercentage,
            PoorPercentage,
          ],
         recommendationPieChart:[ExtremelyLikelyPercentage,LikelyPercentage,NotLikelyAtAllPercentage]
        },
      });
    }
    if (filters.filter == "Last 12 Month") {
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

      // console.log(`Total records fetched: ${data.length}`);

      let userData = await userDataModel.aggregate([
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

      // console.log(`Total user records fetched: ${userData.length}`);
    

      // Initialize counts for ratings
      const countsOfEmojis = [0, 0, 0, 0, 0]; // Indexes: 0 - Excellent, 1 - Very Good, 2 - Good, 3 - Average, 4 - Poor
  
      // Array of valid ratings corresponding to their positions in the counts array
      const ratingIndexMap = [
        "excellent",
        "very good",
        "good",
        "average",
        "poor",
      ];
  
      // Object to store feedback counts per month
      const monthlyFeedbackCountsForLinearChart = {};
      const monthlyUserCountsForLinearChart = {};
      let persentageOfemojis = [0,0,0,0,0]
      // Array of month names
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
  
      // Initialize counts for recommendations
      const recommendationCounts = {
        "0 Not Likely at all": 0,
        "1 Not Likely at all": 0,
        "2 Not Likely at all": 0,
        "3 Not Likely at all": 0,
        "4 Not Likely at all": 0,
        "5 Not Likely at all": 0,
        "6 Not Likely at all": 0,
        "7Likely": 0,
        "8Likely": 0,
        "9 Extremely Likely": 0,
        "10 Extremely Likely": 0,
      };
      let TotalcountOfRecommendation = 0;
      // Process each record
      data.forEach((item) => {
        // Extract month and year from the date
        const date = new Date(item.date);
        const monthYear = `${monthNames[date.getMonth()]}-${date.getFullYear()}`; // e.g., "May-2024"
  
        // Increment the count for the corresponding month
        if (monthlyFeedbackCountsForLinearChart[monthYear]) {
          monthlyFeedbackCountsForLinearChart[monthYear]++;
        } else {
          monthlyFeedbackCountsForLinearChart[monthYear] = 1;
        }
  
        // Array of keys containing ratings
        const ratingKeys = [
          "overAllPerformance",
          "preferingSabooRKS",
          "waitTime",
          "advisorTimeAndAttention",
          "advisorsUnderstandingWorkingRequirement",
          "advisorsListenAbility",
          "advisorsBehavior",
          "advisorsRecommendationOnWorkRequirement",
          "advancePerformingWork",
          "workPerformedOnTheCar",
          "qualityOfWork",
          "postServiceWashingAndCleaning",
          "billExplanation",
          "transparencyPrice",
        ];
  
        // Iterate over rating keys and count occurrences of each rating category
        ratingKeys.forEach((key) => {
          const rating = item[key];
          // Normalize rating by converting to lowercase and trimming spaces
          const normalizedRating = rating?.toString().toLowerCase().trim();
  
          // Find the index of the normalized rating in the ratingIndexMap array
          const index = ratingIndexMap.indexOf(normalizedRating);
          if (index !== -1) {
            countsOfEmojis[index]++;
          }
        });
  
        // // Process recommendation key
        // let countOfRecommendation = 0
        const recommendation = item.recommendation?.toString().trim();
        if (recommendationCounts.hasOwnProperty(recommendation)) {
          TotalcountOfRecommendation++;
          recommendationCounts[recommendation]++;
        }
      });
  
      const allMonthYearKeys = Object.keys(monthlyFeedbackCountsForLinearChart);
      allMonthYearKeys.forEach((monthYear) => {
        monthlyUserCountsForLinearChart[monthYear] = 0;
      });
    
      // Process each user record
      userData.forEach((item) => {
        // Extract month and year from the date
        const date = new Date(item.date);
        const monthYear = `${monthNames[date.getMonth()]}-${date.getFullYear()}`; // e.g., "May-2024"
    
        // Increment the count for the corresponding month
        if (monthlyUserCountsForLinearChart[monthYear] !== undefined) {
          monthlyUserCountsForLinearChart[monthYear]++;
        }
      });
    
      // Separate keys and values into two arrays
      const monthlyFeedbackKeys = Object.keys(
        monthlyFeedbackCountsForLinearChart
      );
      const monthlyFeedbackValues = Object.values(
        monthlyFeedbackCountsForLinearChart
      );
  
      const monthlyUserCountsValues = Object.values(monthlyUserCountsForLinearChart);

      // Separate keys and values for recommendation counts
      const recommendationKeys = Object.keys(recommendationCounts);
      const recommendationValues = Object.values(recommendationCounts);
      // console.log("countOfRecommendation")
  
      let totalEmojis =
        countsOfEmojis[0] +
        countsOfEmojis[1] +
        countsOfEmojis[2] +
        countsOfEmojis[3] +
        countsOfEmojis[4];
      let Average = countsOfEmojis[3];
      let Poor = countsOfEmojis[4];
      let OverAllGood = countsOfEmojis[0] + countsOfEmojis[1] + countsOfEmojis[2];
  
      let OverAllGoodPercentage = Math.round((OverAllGood / totalEmojis) * 100);
      let AveragePercentage = Math.round((Average / totalEmojis) * 100);
      let PoorPercentage = Math.round((Poor / totalEmojis) * 100);
  
      persentageOfemojis[0] = countsOfEmojis[0] != 0 ? Math.round((countsOfEmojis[0] / totalEmojis) * 100) : 0;  // Excellent percentage
      persentageOfemojis[1] = countsOfEmojis[1] != 0 ? Math.round((countsOfEmojis[1] / totalEmojis) * 100) : 0;  // Very Good percentage
      persentageOfemojis[2] = countsOfEmojis[2] != 0 ? Math.round((countsOfEmojis[2] / totalEmojis) * 100) : 0;  // Good percentage
      persentageOfemojis[3] = countsOfEmojis[3] != 0 ? Math.round((countsOfEmojis[3] / totalEmojis) * 100) : 0;  // Average percentage
      persentageOfemojis[4] = countsOfEmojis[4] != 0 ? Math.round((countsOfEmojis[4] / totalEmojis) * 100) : 0;  // Poor percentage
      // console.log("OverAllGood Percentage: " + OverAllGoodPercentage);
      // console.log("Average Percentage: " + AveragePercentage);
      // console.log("Poor Percentage: " + PoorPercentage);
  
      let NotLikelyAtAll =
        recommendationCounts["0 Not Likely at all"] +
        recommendationCounts["1 Not Likely at all"] +
        recommendationCounts["2 Not Likely at all"] +
        recommendationCounts["3 Not Likely at all"] +
        recommendationCounts["4 Not Likely at all"] +
        recommendationCounts["5 Not Likely at all"] +
        recommendationCounts["6 Not Likely at all"];
  
      let Likely =
        recommendationCounts["7Likely"] + recommendationCounts["8Likely"];
  
      let ExtremelyLikely =
        recommendationCounts["9 Extremely Likely"] +
        recommendationCounts["10 Extremely Likely"];
      // console.log(ExtremelyLikely, Likely, NotLikelyAtAll);
  
      let ExtremelyLikelyPercentage = Math.round((ExtremelyLikely / TotalcountOfRecommendation) * 100);
      let LikelyPercentage = Math.round((Likely / TotalcountOfRecommendation) * 100);
      let NotLikelyAtAllPercentage = Math.round((NotLikelyAtAll / TotalcountOfRecommendation) * 100);
      // console.log(ExtremelyLikelyPercentage,LikelyPercentage,NotLikelyAtAllPercentage)
      return res.status(200).send({
        status: true,
        data: {
          persentageOfemojis,
          totalFeedbacks: data.length,
          monthly_Feedback_Counts_LinearChart: {
            keys: monthlyFeedbackKeys,
            values: monthlyFeedbackValues,
          },
          monthly_User_Counts_LinearChart: {
            keys: monthlyFeedbackKeys,
            values: monthlyUserCountsValues,
          },
          recommendation_Counts_bar_chart: {
            keys: recommendationKeys,
            values: recommendationValues,
            countOfRecommendation: TotalcountOfRecommendation,
          },
          satisfactionPieChart: [
            OverAllGoodPercentage,
            AveragePercentage,
            PoorPercentage,
          ],
         recommendationPieChart:[ExtremelyLikelyPercentage,LikelyPercentage,NotLikelyAtAllPercentage]
        },
      });
    }
    if (filters.filter == "Previous Year") {
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

      let userData = await userDataModel.aggregate([
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
      // console.log(`Total records fetched: ${data.length}`);

      // Initialize counts for ratings
      const countsOfEmojis = [0, 0, 0, 0, 0]; // Indexes: 0 - Excellent, 1 - Very Good, 2 - Good, 3 - Average, 4 - Poor
  
      // Array of valid ratings corresponding to their positions in the counts array
      const ratingIndexMap = [
        "excellent",
        "very good",
        "good",
        "average",
        "poor",
      ];
  
      // Object to store feedback counts per month
      const monthlyFeedbackCountsForLinearChart = {};
      const monthlyUserCountsForLinearChart = {};
      let persentageOfemojis = [0,0,0,0,0]
      // Array of month names
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
  
      // Initialize counts for recommendations
      const recommendationCounts = {
        "0 Not Likely at all": 0,
        "1 Not Likely at all": 0,
        "2 Not Likely at all": 0,
        "3 Not Likely at all": 0,
        "4 Not Likely at all": 0,
        "5 Not Likely at all": 0,
        "6 Not Likely at all": 0,
        "7Likely": 0,
        "8Likely": 0,
        "9 Extremely Likely": 0,
        "10 Extremely Likely": 0,
      };
      let TotalcountOfRecommendation = 0;
      // Process each record
      data.forEach((item) => {
        // Extract month and year from the date
        const date = new Date(item.date);
        const monthYear = `${monthNames[date.getMonth()]}-${date.getFullYear()}`; // e.g., "May-2024"
  
        // Increment the count for the corresponding month
        if (monthlyFeedbackCountsForLinearChart[monthYear]) {
          monthlyFeedbackCountsForLinearChart[monthYear]++;
        } else {
          monthlyFeedbackCountsForLinearChart[monthYear] = 1;
        }
  
        // Array of keys containing ratings
        const ratingKeys = [
          "overAllPerformance",
          "preferingSabooRKS",
          "waitTime",
          "advisorTimeAndAttention",
          "advisorsUnderstandingWorkingRequirement",
          "advisorsListenAbility",
          "advisorsBehavior",
          "advisorsRecommendationOnWorkRequirement",
          "advancePerformingWork",
          "workPerformedOnTheCar",
          "qualityOfWork",
          "postServiceWashingAndCleaning",
          "billExplanation",
          "transparencyPrice",
        ];
  
        // Iterate over rating keys and count occurrences of each rating category
        ratingKeys.forEach((key) => {
          const rating = item[key];
          // Normalize rating by converting to lowercase and trimming spaces
          const normalizedRating = rating?.toString().toLowerCase().trim();
  
          // Find the index of the normalized rating in the ratingIndexMap array
          const index = ratingIndexMap.indexOf(normalizedRating);
          if (index !== -1) {
            countsOfEmojis[index]++;
          }
        });
  
        // // Process recommendation key
        // let countOfRecommendation = 0
        const recommendation = item.recommendation?.toString().trim();
        if (recommendationCounts.hasOwnProperty(recommendation)) {
          TotalcountOfRecommendation++;
          recommendationCounts[recommendation]++;
        }
      });
  

      const allMonthYearKeys = Object.keys(monthlyFeedbackCountsForLinearChart);
      allMonthYearKeys.forEach((monthYear) => {
        monthlyUserCountsForLinearChart[monthYear] = 0;
      });
    
      // Process each user record
      userData.forEach((item) => {
        // Extract month and year from the date
        const date = new Date(item.date);
        const monthYear = `${monthNames[date.getMonth()]}-${date.getFullYear()}`; // e.g., "May-2024"
    
        // Increment the count for the corresponding month
        if (monthlyUserCountsForLinearChart[monthYear] !== undefined) {
          monthlyUserCountsForLinearChart[monthYear]++;
        }
      });
      // Separate keys and values into two arrays
      const monthlyFeedbackKeys = Object.keys(
        monthlyFeedbackCountsForLinearChart
      );
      const monthlyFeedbackValues = Object.values(
        monthlyFeedbackCountsForLinearChart
      );
  
      // Separate keys and values for recommendation counts
      const recommendationKeys = Object.keys(recommendationCounts);
      const recommendationValues = Object.values(recommendationCounts);
      const monthlyUserCountsValues = Object.values(monthlyUserCountsForLinearChart);
      // console.log("countOfRecommendation")
  
      let totalEmojis =
        countsOfEmojis[0] +
        countsOfEmojis[1] +
        countsOfEmojis[2] +
        countsOfEmojis[3] +
        countsOfEmojis[4];
      let Average = countsOfEmojis[3];
      let Poor = countsOfEmojis[4];
      let OverAllGood = countsOfEmojis[0] + countsOfEmojis[1] + countsOfEmojis[2];
  
      let OverAllGoodPercentage = Math.round((OverAllGood / totalEmojis) * 100);
      let AveragePercentage = Math.round((Average / totalEmojis) * 100);
      let PoorPercentage = Math.round((Poor / totalEmojis) * 100);
  
      persentageOfemojis[0] = countsOfEmojis[0] != 0 ? Math.round((countsOfEmojis[0] / totalEmojis) * 100) : 0;  // Excellent percentage
      persentageOfemojis[1] = countsOfEmojis[1] != 0 ? Math.round((countsOfEmojis[1] / totalEmojis) * 100) : 0;  // Very Good percentage
      persentageOfemojis[2] = countsOfEmojis[2] != 0 ? Math.round((countsOfEmojis[2] / totalEmojis) * 100) : 0;  // Good percentage
      persentageOfemojis[3] = countsOfEmojis[3] != 0 ? Math.round((countsOfEmojis[3] / totalEmojis) * 100) : 0;  // Average percentage
      persentageOfemojis[4] = countsOfEmojis[4] != 0 ? Math.round((countsOfEmojis[4] / totalEmojis) * 100) : 0;  // Poor percentage
      // console.log("OverAllGood Percentage: " + OverAllGoodPercentage);
      // console.log("Average Percentage: " + AveragePercentage);
      // console.log("Poor Percentage: " + PoorPercentage);
  
      let NotLikelyAtAll =
        recommendationCounts["0 Not Likely at all"] +
        recommendationCounts["1 Not Likely at all"] +
        recommendationCounts["2 Not Likely at all"] +
        recommendationCounts["3 Not Likely at all"] +
        recommendationCounts["4 Not Likely at all"] +
        recommendationCounts["5 Not Likely at all"] +
        recommendationCounts["6 Not Likely at all"];
  
      let Likely =
        recommendationCounts["7Likely"] + recommendationCounts["8Likely"];
  
      let ExtremelyLikely =
        recommendationCounts["9 Extremely Likely"] +
        recommendationCounts["10 Extremely Likely"];
      // console.log(ExtremelyLikely, Likely, NotLikelyAtAll);
  
      let ExtremelyLikelyPercentage = Math.round((ExtremelyLikely / TotalcountOfRecommendation) * 100);
      let LikelyPercentage = Math.round((Likely / TotalcountOfRecommendation) * 100);
      let NotLikelyAtAllPercentage = Math.round((NotLikelyAtAll / TotalcountOfRecommendation) * 100);
      // console.log(ExtremelyLikelyPercentage,LikelyPercentage,NotLikelyAtAllPercentage)
      return res.status(200).send({
        status: true,
        data: {
          // countsOfEmojis,
          persentageOfemojis,
          totalFeedbacks: data.length,

          monthly_Feedback_Counts_LinearChart: {
            keys: monthlyFeedbackKeys,
            values: monthlyFeedbackValues,
          },
          monthly_User_Counts_LinearChart: {
            keys: monthlyFeedbackKeys,
            values: monthlyUserCountsValues,
          },
          
          recommendation_Counts_bar_chart: {
            keys: recommendationKeys,
            values: recommendationValues,
            countOfRecommendation: TotalcountOfRecommendation,
          },
          satisfactionPieChart: [
            OverAllGoodPercentage,
            AveragePercentage,
            PoorPercentage,
          ],
         recommendationPieChart:[ExtremelyLikelyPercentage,LikelyPercentage,NotLikelyAtAllPercentage]
        },
      });
    }
   
    
  } catch (error) {
    res.status(500).send({ status: false, message: error.message });
  }
};

module.exports = {
  feedback,
  getfeedback,
  filtersfeedbacks,
  feedbackStatistics,
};
