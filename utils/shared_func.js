const CryptoJS = require("crypto-js");

const SECRET_KEY = "8F7A3D9C1E6B4F8D2A5C7E0F3B1D9E2C"; // 32-byte secret key

function decryptData(encryptedData) {
  try {
    if (!SECRET_KEY) {
      throw new Error("Secret key is missing.");
    }
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decrypted) {
        throw new Error("Decryption failed. Invalid data or key.");
    }
    
    const decryptData=JSON.parse(decrypted);
    console.log("Decrypted Data:", decryptData);
    return decryptData;
  } catch (error) {
    throw new Error("Decryption failed. Invalid data");
  }
}

module.exports = decryptData;
