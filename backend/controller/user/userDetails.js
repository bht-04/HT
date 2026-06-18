const userModel = require("../../models/userModel");

async function userDetailsController(req, res) {
  try {
    const userId = req.user._id;

    const user = await userModel.findById(userId).select("-password");
    // const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        error: true,
        success: false,
      });
    }

    res.json({
      message: "User details fetched successfully",
      data: user,
      error: false,
      success: true,
    });
  } catch (err) {
    res.status(400).json({
      message: err.message || err,
      error: true,
      success: false,
    });
  }
}

module.exports = userDetailsController;
