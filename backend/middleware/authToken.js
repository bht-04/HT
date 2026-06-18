const jwt = require("jsonwebtoken");

function authToken(req, res, next) {
  try {
const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        message: "Vui lòng đăng nhập!",
        success: false,
      });
    }

    jwt.verify(token, process.env.TOKEN_SECRET_KEY, (err, decoded) => {
      if (err) {
        return res.status(403).json({
          message: "Token không hợp lệ",
          success: false,
        });
      }

      req.user = decoded;
      next();
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
      success: false,
    });
  }
}

module.exports = authToken;