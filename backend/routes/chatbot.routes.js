const express = require("express");
const router = express.Router();
const chatbotController = require("../controller/chatbot/chatbot.controller.js");

router.post("/chatbot", chatbotController.chatbotHandler);

module.exports = router;
