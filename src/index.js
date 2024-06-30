//monodb
// require("./db/mongoose");
const app = require("express")();
const port = 5000;
const multerUtils = require("./utils/multerUtils");
const fs =require("fs");

const upload = multerUtils("./uploads");
const tf = require("@tensorflow/tfjs");
const sharp = require("sharp");

const UserRouter = require("./api/user");
require("dotenv").config();
const db = require("mongoose");
db.connect(process.env.MONGO_URL)
  .then(() => {
    console.log("Databse connected sucessfully 😎 ");
    app.listen(port, () => {
      console.log(`server is up and running  🚀 at http://localhost:` + port);
    });
  })
  .catch((e) => {
    console.log("Something went Wrong", e);
  });

//for accepting port from data
const bodyParser = require("express").json;
app.use(bodyParser());

app.use("/user", UserRouter);
app.post("/predict", upload.single("file"), async (req, res) => {
  try {
    // Check if an image was uploaded
    if (!req.file) {
      return res.status(400).send("No image uploaded.");
    }
    // Load the model
    const modelPath = "model/newModel/model.json";
    const model = await tf.loadGraphModel("file://" + modelPath);
    // console.log(model)

    // Normalize and preprocess the image   rs
    const imgBuffer = await sharp(req.file.path)
      .resize(128, 128) // Resize the image if needed
      .toBuffer();
    const img = tf.node.decodeImage(imgBuffer, 3); // 3 channels for RGB
    const reshapedImg = img.expandDims()

    // Normalize the image
    const normalizedImg = reshapedImg.toFloat().div(tf.scalar(255));
    console.log(normalizedImg.shape);

    // // Make prediction
    const prediction = model.predict(normalizedImg);

    // Convert prediction to JSON
    const predictionArray = Array.from(prediction.dataSync());
    
    const jsonResponse = { prediction: predictionArray };
    // Send the prediction as JSON response
    // res.json(parseFloat (jsonResponse.prediction));
    if (jsonResponse.prediction>0.5){
      console.log('pcos')
      res.status(200).json({status: 'pcos'})
    }else{
      console.log('not pcos')
      res.status(200).json({status: 'not pcos'})

    }

    // Clean up: remove the uploaded image file
    tf.dispose([img, normalizedImg, prediction]);
    fs.unlinkSync(req.file.path);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error making prediction.");
  }
});

app.get("/", (req, res) => {
  res.send("Hi, I'm Fine");
});
