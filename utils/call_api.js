const axios = require("axios");

/**
 * Generic function to make API calls
 * @param {string} url - API endpoint
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {object} data - Request payload
 * @param {object} headers - Custom headers (optional)
 * @returns {Promise<object>} - API response
 */
const callApi = async (url, method = "POST", data = {}, headers = {},options = {}) => {
  try {
    const response = await axios({
      url,
      method,
      data,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      withCredentials: true,
      timeout: options.timeout || 5000,
    });

    return { success: true, data: response.data };
  } catch (error) {
    console.error("API Call Error:", error?.message || error);
    return {
      success: false,
      error_message: error?.message,
      error: error?.response?.data || error,
    };
  }
};


module.exports = { callApi };