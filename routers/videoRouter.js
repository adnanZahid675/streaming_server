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
} = require("../controllers");
// const { getCallStreaming } = require("../controllers/callStreaming");

// Define your API endpoint here
router.get("/record-list", getVideoCTRL);
router.get("/streaming", getStreaming);
router.post("/callStreaming", getCallStreaming);


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

module.exports = router;


// http://invisibletest.myagecam.net/invisible/signalwire_call/inbound_call.php