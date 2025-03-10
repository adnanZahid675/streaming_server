const cron = require("node-cron");
const decryptData = require("./shared_func");
const { callApi } = require("../utils/call_api");

function createACronJob(dateTime, data, time_ahead) {
  const timeFrequency = getCronTime(time_ahead);
  console.log(timeFrequency, "timeFrequency");
  cron.schedule(timeFrequency, async () => {
    try {
      console.log("Cron job started");
      const decryptedData = decryptData(data);
      console.log("Cron Job Data:", decryptedData?.url);
      if (!decryptedData?.url) {
        console.error("Error: URL is missing in decrypted data");
        return;
      }
      const record = await callApi(decryptedData.url, "GET", null, {});
    } catch (error) {
      console.error("Error in cron job:", error.message);
    }
  });
}

function getCronTime(aheadOfTime) {
  const now = new Date();
  const value = parseInt(aheadOfTime);
  const unit = aheadOfTime.slice(-1).toLowerCase();

  if (isNaN(value) || !["h", "m"].includes(unit)) return null;

  unit === "h"
    ? now.setHours(now.getHours() + value)
    : now.setMinutes(now.getMinutes() + value);

  return `${now.getMinutes()} ${now.getHours()} ${now.getDate()} ${
    now.getMonth() + 1
  } *`;
}

module.exports = {
  createACronJob,
};
