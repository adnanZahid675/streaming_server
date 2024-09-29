const express = require("express");
const videoRouter = require("./videoRouter");

const router = express.Router();

// Use the routes
router.use("/api", videoRouter);

module.exports = router;