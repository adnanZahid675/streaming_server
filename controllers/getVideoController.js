const CryptoJS = require("crypto-js");

const getVideoCTRL = (req, res) => {
  res.json({
    message: getEncryptedPassword('abcdefg','2021-03-05T17:50:02','admin','admin'),
  });
};

function getEncryptedPassword(licenseKey,dateTime,username,password) {
  const dateBase64 = Buffer.from(dateTime).toString("base64");
  const concatStr = username + licenseKey + dateBase64 + password;
  const sha256Encrypted = CryptoJS.SHA256(concatStr).toString(CryptoJS.enc.Hex);
  return sha256Encrypted
}

module.exports = getVideoCTRL;
