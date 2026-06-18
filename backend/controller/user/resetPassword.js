const userModel = require("../../models/userModel");
const bcrypt = require("bcryptjs");

async function resetPasswordController(req, res) {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
      throw new Error("Vui lòng cung cấp email, otp và mật khẩu mới");

    const user = await userModel.findOne({ email }); 
    if (!user) throw new Error("Email không tồn tại");

    if (!user.otp || user.otp !== otp) throw new Error("OTP không hợp lệ");
    if (!user.otpExpire || user.otpExpire < Date.now())
      throw new Error("OTP đã hết hạn");

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    res.json({
      message: "Đổi mật khẩu thành công",
      success: true,
      error: false,
    });
  } catch (err) {
    res
      .status(400)
      .json({ message: err.message || err, success: false, error: true });
  }
}

module.exports = resetPasswordController;
