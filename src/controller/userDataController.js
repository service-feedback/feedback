const { response } = require('express');
// const VendorModel = require('../models/VendorModel');
const mongoose = require('mongoose');

const userDataModel = require('../model/userDataModel.js');
const fs = require('fs');
const xlsx = require('xlsx');
const csv = require('csvtojson');
let {isValidPhone,isValidVehicleNumber}= require("../validation/validator")
const importUser = async (req, res) => {
  try {
    // Check if the file name is correct (assuming the correct file name is "client.csv")
    const filename = req.file.filename;
    if (!filename.toLowerCase().includes('service')) {
      return res.status(400).json({
        status: false,
        message: 'Incorrect file type. Please upload a filename contains text service',
      });
    }

    // If the file is in XLSX format, convert it to CSV before proceeding
    if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      const workbook = xlsx.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const csvData = xlsx.utils.sheet_to_csv(workbook.Sheets[sheetName]);
      fs.writeFileSync(req.file.path, csvData);
    }

    const userData = [];
    const response = await csv().fromFile(req.file.path);
    const duplicateEntries = [];
    const invalidRows = [];

    for (let x = 0; x < response.length; x++) {
      // Check if the row contains any valid data
      const rowKeys = Object.keys(response[x]);
      const isEmptyRow = rowKeys.every((key) => !response[x][key].trim());

      if (isEmptyRow) {
        // Skip processing empty rows
        continue;
      }

      // Check for missing or incorrect keys in the row
      const requiredKeys = ['name',  'phone',"vehicleNumber" ];
      const missingKeys = requiredKeys.filter((key) => !rowKeys.includes(key));

      if (missingKeys.length > 0) {
        const existingMissingKeys = invalidRows.find((row) => row.every((key) => missingKeys.includes(key)));
        if (!existingMissingKeys) {
          invalidRows.push(missingKeys);
        }
      } else {
        const existingClient = await userDataModel.findOne({  vehicleNumber: response[x].vehicleNumber });
        if (existingClient) {
          duplicateEntries.push({
            row: x + 2,
            vehicleNumber: response[x].vehicleNumber,
          });
        } else {
          if (!isValidPhone(response[x].phone)) {
            invalidRows.push({
              row: x + 2,
              reason: 'Invalid phone number',
            });
            // continue; // Skip this iteration if the phone number is invalid
          }
          const trimmedVehicleNumber = response[x].vehicleNumber.trim();

          if (!isValidVehicleNumber(trimmedVehicleNumber)) {
            console.log(`Trimmed Vehicle Number: ${trimmedVehicleNumber}`);
console.log(`Validation Result: ${isValidVehicleNumber(trimmedVehicleNumber)}`);

            invalidRows.push({
              row: x + 2,
              reason: 'Invalid vehicle number',
            });
            continue; // Skip this iteration if the vehicle number is invalid
          }
          
          
          
          userData.push({
            date: response[x].date,
            time: response[x].time,
            name: response[x].name,
            url: `localhost:3001/feedback?phone=${response[x].phone}`,
            email: response[x].email,
            phone: response[x].phone,
            vehicleNumber: response[x].vehicleNumber,
            isDeleted: false,
            // vchNo: response[x]['Vch-No.'],
            
          });
        }
      }
    }

    if (invalidRows.length > 0 || duplicateEntries.length > 0) {
      // If there are invalid rows or duplicate entries, send the response with the errors
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

    // Check if data is empty or no documents were found
    if (!data || data.length === 0) {
      return res.status(404).send({ status: false, data: [] });
    }

    // Return the successful response with the data
    res.status(200).send({ status: true, data: data });
  } catch (error) {
    // If there's an error, return the error message
    return res.status(500).send({ status: false, message: error.message });
  }
};

module.exports = { importUser ,getUserData};