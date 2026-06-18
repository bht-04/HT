const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const compression = require("compression");
require("dotenv").config();

const connectDB = require("./config/db");
const router = require("./routes");
const webhooks = require("./controller/order/webhook");
const chatbotRoutes = require("./routes/chatbot.routes.js");

const app = express();

app.set("trust proxy", 1);

app.use(
  cors({
        origin: [
      "http://localhost:3000",
      "https://shopht.vercel.app",
      "https://shopht.io.vn",
      "https://www.shopht.io.vn",
    ],
    credentials: true,
  })
);

app.use(compression());

app.post(
  "/api/webhook",
  express.raw({ type: "application/json" }),
  webhooks
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());


app.use("/api", router);
app.use("/api", chatbotRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: Date.now(),
  });
});

const PORT = process.env.PORT || 8080;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});