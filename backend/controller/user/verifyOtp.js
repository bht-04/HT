const userModel = require("../../models/userModel");

async function verifyOtpController(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      throw new Error("Vui lòng cung cấp email và OTP!");
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      throw new Error("Email không tồn tại trong hệ thống!");
    }

    if (!user.otp || user.otp !== otp) {
      throw new Error("OTP không hợp lệ!");
    }

    if (!user.otpExpire || user.otpExpire < Date.now()) {
      throw new Error("OTP đã hết hạn!");
    }

    return res.json({
      message: "Xác thực OTP thành công",
      success: true,
      error: false,
    });
  } catch (err) {
    return res.status(400).json({
      message: err.message || "Có lỗi xảy ra!",
      success: false,
      error: true,
    });
  }
}

module.exports = verifyOtpController;
