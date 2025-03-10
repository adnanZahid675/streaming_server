const express = require("express");
const router = express.Router();
const {
  getVideoCTRL,
  getStreaming,
  closeAllSockets,
  getCallStreaming,
  send_sms,
  fetch_sms_status,
  handle_incoming_sms,
  getPlaybackRecords,
  getRecordFileInfo,
  execute_schedule_task
} = require("../controllers");

const authMiddleware = require('./../middleware/auth_check');

// Define your API endpoint here
router.get("/record-list", getVideoCTRL);
router.post("/streaming",getStreaming);
router.post("/callStreaming", getCallStreaming);

router.get("/closeAllSockets", closeAllSockets);

router.post("/send_sms",send_sms);
router.post("/fetch_sms_status",fetch_sms_status);
router.post("/handle_incoming_sms",handle_incoming_sms);
router.post("/execute_schedule_task",execute_schedule_task);
router.post("/getPlaybackRecords",getPlaybackRecords);
router.post("/getRecordFileInfo",getRecordFileInfo);

module.exports = router;


// http://invisibletest.myagecam.net/invisible/signalwire_call/inbound_call.php