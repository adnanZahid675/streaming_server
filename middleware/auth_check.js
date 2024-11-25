const connectMySQL = require("./../config/db.config"); // Adjust the path to your connection file

const authMiddleware = async (req, res, next) => {
  try {
    // Check if Authorization header exists
    const token = req.headers["authorization"];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized, token missing" });
    }

    // Get database connection
    const connection = await connectMySQL();

    // Query to check if the token exists in the audit_trail_login table
    const [rows] = await connection.execute(
      "SELECT * FROM audit_trail_login WHERE csrf_token = ?",
      [token]
    );

    if (rows.length === 0) {
      return res.status(403).json({ error: "Invalid Unauthorized token" });
    }

    // Token is valid, proceed to the next middleware or route handler
    req.user = rows[0]; // Optional: Attach the user record to the request object
    next();
  } catch (err) {
    console.error("Error in authMiddleware:", err.message);
    res.status(500).json({ error: "Internal Server Error,Unauthorized" });
  }
};

module.exports = authMiddleware;
