const { response } = require('express');
// const VendorModel = require('../models/VendorModel');
const mongoose = require('mongoose');
const moment = require("moment");
require("moment-timezone");

const userDataModel = require('../model/userDataModel.js');
const fs = require('fs');
const xlsx = require('xlsx');
const csv = require('csvtojson');
let {isValidPhone,isValidVehicleNumber}= require("../validation/validator")

const importUser = async (req, res) => {
  try {
    moment.tz.setDefault("Asia/Kolkata"); // Default India time zone
    const currentDate = moment().format("YYYY-MM-DD");
    const times = moment().format("HH:mm:ss");
    const filename = req.file.filename;

    // Early exit if the filename does not include 'service'
    if (!filename.toLowerCase().includes('service')) {
      return res.status(400).json({
        status: false,
        message: 'Please upload a filename contains text service in it.',
      });
    }

    // Convert XLSX to CSV if necessary
    if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      const workbook = xlsx.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const csvData = xlsx.utils.sheet_to_csv(workbook.Sheets[sheetName]);
      fs.writeFileSync(req.file.path, csvData);
    }

    const response = await csv().fromFile(req.file.path);
    const userData = [];
    const duplicateEntries = [];
    const invalidRows = [];

    // Process each row asynchronously to improve performance
    for (let x = 0; x < response.length; x++) {
      const rowKeys = Object.keys(response[x]);
      const isEmptyRow = rowKeys.every((key) =>!response[x][key].trim());
      if (isEmptyRow) continue;

      const requiredKeys = ['name', 'phone', 'vehicleNumber'];
      const missingKeys = requiredKeys.filter((key) =>!rowKeys.includes(key));
      if (missingKeys.length > 0) {
        invalidRows.push(...missingKeys.map(key => ({ row: x + 2, key })));
        continue;
      }

      const existingClient = await userDataModel.findOne({ vehicleNumber: response[x].vehicleNumber, phone: response[x].phone });
      if (existingClient) {
        duplicateEntries.push({
          row: x + 2,
          vehicleNumber: response[x].vehicleNumber,
          phoneNumber: response[x].phone
        });
        continue;
      }

      if (!isValidPhone(response[x].phone)) {
        invalidRows.push({
          row: x + 2,
          reason: 'Invalid phone number',
        });
        continue;
      }

      userData.push({
        date: currentDate,
        time: times,
        name: response[x].name,
        url: `https://saboogroup.co.in/saboo-rks-service-feedback2/test/${response[x].phone}`,
        email: response[x].email,
        phone: response[x].phone,
        vehicleNumber: response[x].vehicleNumber,
        location: response[x].location,
        isDeleted: false,
      });
    }

    if (invalidRows.length > 0 || duplicateEntries.length > 0) {
      return res.status(400).json({
        status: false,
        message: 'Invalid rows or duplicate entries found in document',
        data: { invalidRows, duplicateEntries },
      });
    }

    await userDataModel.insertMany(userData);

    res.status(200).send({ status: true, msg: 'Imported' });
  } catch (error) {
    res.status(500).send({ status: false, message: error.message });
  }
};


///////////////=============================//////////////////////


const getUserData = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    // Retrieve all client documents from the clientModel collection
    let data = await userDataModel.aggregate([
      { $match: { isDeleted: false } }, // Match documents where the 'isDeleted' field is set to false
      { $group: { _id: "$vehicleNumber", doc: { $first: "$$ROOT" } } }, // Group the documents by 'vchNo' and fetch the first document of each group
      { $replaceRoot: { newRoot: "$doc" } }, // Replace the current root with the 'doc' object from the group (unwrap the grouped documents)
      { $sort: { createdAt: -1 } }, // Sort the documents in descending order based on the 'createdAt' field
    ]);

   

    // Return the successful response with the data
    res.status(200).send({ status: true, data: data });
  } catch (error) {
    // If there's an error, return the error message
    return res.status(500).send({ status: false, message: error.message });
  }
};

//============================================================================================
const markAllUsersAsDeleted = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    // Update all users in the collection to set isDeleted to true
    const result = await userDataModel.updateMany(
      { isDeleted: { $ne: true } },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );


    // Check if an y documents were updated
    console.log(result)
    if (result.modifiedCount > 0) {
      return res.status(200).send({ status: true, message: "All users marked as deleted successfully." });
    } else {
      return res.status(404).send({ status: false, message: "No users found to mark as deleted." });
    }
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
}




module.exports = { importUser ,getUserData , markAllUsersAsDeleted};