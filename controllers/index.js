const getVideoCTRL = require("./getVideoController");
const {
  getStreaming,
  webSocketServers,
  closeAllSockets,
} = require("./createSocket");
const {
  getCallStreaming,
  send_sms,
  fetch_sms_status,
  handle_incoming_sms,
  getPlaybackRecords,
  getRecordFileInfo,
  execute_schedule_task
} = require("./callStreaming");

module.exports = {
  getVideoCTRL,
  getStreaming,
  webSocketServers,
  closeAllSockets,
  getCallStreaming,
  send_sms,
  fetch_sms_status,
  handle_incoming_sms,
  getPlaybackRecords,
  getRecordFileInfo,
  execute_schedule_task
};
