require("dotenv").config();
const db = require("mongoose");
console.log(process.env.MONGO_URL);
db.connect(process.env.MONGO_URL)
  .then(() => {
    console.log("DB Connected sucessful 😎");
  })
  .catch((e) => {
    console.log("Something went Wrong", e);
  });
