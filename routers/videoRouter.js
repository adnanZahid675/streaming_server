const express = require("express");
const router = express.Router();
const {
  getVideoCTRL,
  getStreaming,
  closeAllSockets,
  getCallStreaming,
  checkDigits,
} = require("../controllers");
// const { getCallStreaming } = require("../controllers/callStreaming");

// Define your API endpoint here
router.get("/record-list", getVideoCTRL);
router.get("/streaming", getStreaming);
router.get("/callStreaming", getCallStreaming);
router.get("/checkDigits", checkDigits);
router.get("/closeAllSockets", closeAllSockets);

module.exports = router;
