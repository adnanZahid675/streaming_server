const dotenv = require("dotenv");
const mysql = require("mysql2/promise");

dotenv.config();

async function connectMySQL() {
  try {
    const connection = await mysql.createConnection({
      host: "127.0.0.1",
      user: "root",
      password: "",
      database: "invisible",
      port: 3306,
    });
    return connection;
  } catch (err) {
    console.error("Database connection failed:", err.stack || err.message);
  }
}

module.exports = connectMySQL;
