const express = require("express");
const router = express.Router();
const {
  getVideoCTRL,
  getStreaming,
  closeAllSockets,
  getCallStreaming,
  checkDigits,
  dialAndAddToConference,
  getConferenceStreaming,
  calling_to_owner,
  connect_call,
  status_call_back,
  process_authorization,
  initialGreetings,
  bridge_end,
  send_sms,
  fetch_sms_status,
  handle_incoming_sms
} = require("../controllers");

const authMiddleware = require('./../middleware/auth_check');

// Define your API endpoint here
router.get("/record-list", getVideoCTRL);
router.get("/streaming",getStreaming);
router.post("/callStreaming", getCallStreaming); // creating it public because visitor is not logged in during the call


router.post("/conference", getConferenceStreaming);
router.get("/dialCall", dialAndAddToConference);
router.get("/checkDigits", checkDigits);
router.get("/closeAllSockets", closeAllSockets);

router.post("/initialGreetings", initialGreetings);
router.post("/call_to_owner", calling_to_owner);
router.post("/connect_call", connect_call);
router.post("/status_call_back", status_call_back);
router.post("/process_authorization", process_authorization);
router.post("/bridge_end", bridge_end);

router.post("/send_sms",send_sms);
router.post("/fetch_sms_status",fetch_sms_status);
router.post("/handle_incoming_sms",handle_incoming_sms);

module.exports = router;


// http://invisibletest.myagecam.net/invisible/signalwire_call/inbound_call.php