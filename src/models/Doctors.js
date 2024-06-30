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

const Doctors_1 = new Doctors ({
    name: "Dr. John Doe",
    specialization: "Cardiologist",
    department: "Cardiology",
    address: "123 Main St, City, State, ZIP",
    contact: 1234567890,
    availableHours: [
      { dayOfWeek: "Monday", startTime: "09:00 AM", endTime: "12:00 PM" },
      { dayOfWeek: "Friday", startTime: "09:00 AM", endTime: "12:00 PM" }
    ]
})

Doctors_1.save();