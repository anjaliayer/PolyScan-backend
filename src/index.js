const express = require("express");
const fs = require("fs");
const multer = require("multer");
const tf = require("@tensorflow/tfjs-node");
const sharp = require("sharp");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const morgan = require("morgan");
const UserRouter = require("./api/user");

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware for compression
app.use(compression());

// Middleware for logging requests
app.use(morgan("combined"));

// File upload configuration using multer
const upload = multer();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Database connected successfully 😎 ");
    app.listen(port, () => {
      console.log(`Server is up and running 🚀 at http://localhost:${port}`);
    });
  })
  .catch((e) => {
    console.log("Something went wrong", e);
  });

// Middleware for user routes
app.use("/user", UserRouter);

// Load TensorFlow.js model once at server startup
let model;
const loadModel = async () => {
  try {
    const modelPath = "file://model/latest_model/model.json";
    model = await tf.loadGraphModel(modelPath);
    console.log("Model loaded successfully.");
  } catch (error) {
    console.error("Error loading model:", error);
  }
};
loadModel();

// Image preprocessing function
const preprocessImage = async (buffer) => {
  const imgBuffer = await sharp(buffer)
    .resize(256, 256) // Resize the image if needed
    .toBuffer();
  const img = tf.node.decodeImage(imgBuffer, 3); // 3 channels for RGB
  const reshapedImg = img.expandDims();
  const normalizedImg = reshapedImg.toFloat().div(tf.scalar(255));
  return normalizedImg;
};

// Route to handle image prediction
app.post("/predict", upload.single("file"), async (req, res) => {
  try {
    // Check if an image was uploaded
    if (!req.file) {
      return res.status(400).send("No image uploaded.");
    }

    // Preprocess the image
    const processedImage = await preprocessImage(req.file.buffer);

    // Make prediction
    const prediction = model.predict(processedImage);

    // Convert prediction to JSON
    const predictionArray = Array.from(prediction.dataSync());
    const jsonResponse = { prediction: predictionArray };

    // Determine status based on prediction
    const status = jsonResponse.prediction[0] > 0.5 ? 'pcos' : 'not pcos';
    res.status(200).json({ status });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error making prediction.");
  }
});

app.get("/", (req, res) => {
  res.send("Hi, I'm Fine");
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});
