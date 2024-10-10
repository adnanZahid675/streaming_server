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
  dialAndAddToConference
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
  dialAndAddToConference
};
