const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const DoctorsSchema = new Schema({
  name: String,
  specialization: String,
  department: String,
  address: String,
  contact: Number,
  availableHours: [{ dayOfWeek: String, startTime: String, endTime: String }]
});
const Doctors = new mongoose.model("Doctors", DoctorsSchema);
module.exports = Doctors;

