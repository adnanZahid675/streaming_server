const dotenv = require("dotenv");
const mysql = require("mysql2/promise");

dotenv.config();

async function connectMySQL() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "127.0.0.1", // Default to local IP
      user: process.env.DB_USER || "root",      // Default user
      password: process.env.DB_PASS || "",      // Default password
      database: process.env.DB_NAME || "invisible", // Default database
      port: process.env.DB_PORT || 3306         // Default MySQL port
    });

    console.log("Database connected successfully!");
    return connection;
  } catch (err) {
    console.error("Database connection failed:", err.stack || err.message);
  }
}

module.exports = connectMySQL;