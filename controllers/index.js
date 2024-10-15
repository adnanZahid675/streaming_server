const getVideoCTRL = require("./getVideoController");
const {
  getStreaming,
  webSocketServers,
  closeAllSockets,
} = require("./createSocket");
const {
  getCallStreaming,
  callSocketServers,
  checkDigits,
  getConferenceStreaming,
  dialAndAddToConference,
  calling_to_owner,
  connect_call,
  status_call_back,
  process_authorization,
  initialGreetings,
} = require("./callStreaming");

module.exports = {
  getVideoCTRL,
  getStreaming,
  webSocketServers,
  closeAllSockets,
  getCallStreaming,
  callSocketServers,
  checkDigits,
  getConferenceStreaming,
  dialAndAddToConference,

  // calling_to_owner,
  calling_to_owner,
  connect_call,
  status_call_back,
  process_authorization,
  initialGreetings
};
