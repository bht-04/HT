const userModel = require("../../models/userModel");

async function updateUser(req, res) {
  try {
    const { userId, email, name, role, profilePic } = req.body;


    if (!userId) {
      return res.status(400).json({
        message: "Missing userId",
        error: true,
        success: false,
      });
    }

 
    const payload = {
      ...(email && { email }),
      ...(name && { name }),
      ...(role && { role }),
      ...(profilePic && { profilePic }),
    };


    if (payload.role) {
      if (payload.role === "ADMIN") payload.role = "Quản Trị Viên";
      else if (payload.role === "GENERAL") payload.role = "Người Dùng";
      else if (
        payload.role !== "Quản Trị Viên" &&
        payload.role !== "Người Dùng"
      ) {
        return res.status(400).json({
          message:
            "Role không hợp lệ. Chỉ chấp nhận 'Quản Trị Viên' hoặc 'Người Dùng'",
          error: true,
          success: false,
        });
      }
    }

    const updatedUser = await userModel.findByIdAndUpdate(userId, payload, {
      new: true,
    });


    if (!updatedUser) {
      return res.status(404).json({
        message: "Người dùng không tồn tại",
        error: true,
        success: false,
      });
    }

    return res.json({
      data: updatedUser,
      message: "Cập nhật thành công!",
      success: true,
      error: false,
    });
  } catch (err) {
    return res.status(400).json({
      message: err.message || err,
      error: true,
      success: false,
    });
  }
}

module.exports = updateUser;
