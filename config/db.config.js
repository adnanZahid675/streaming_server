const dotenv = require("dotenv");
const mysql = require("mysql2/promise");

dotenv.config();

async function connectMySQL() {
  try {
    // Create a connection to the MySQL database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost", // MySQL host
      user: process.env.DB_USER || "root",      // MySQL username
      password: process.env.DB_PASS || "",      // MySQL password
      database: process.env.DB_NAME || "invisible"   // MySQL database name
    });

    console.log("Database connected successfully!");

    // You can now export the connection to use it in other files
    return connection;
  } catch (err) {
    console.error("Database connection failed:", err.message);
    // throw err;
  }
}

module.exports = connectMySQL;