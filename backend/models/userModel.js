const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    name: String,
    email: {
      type: String,
      unique: true,
      require: true,
    },
    password: String,
    profilePic: String,
    role: {
      type: String,
      enum: ["Quản Trị Viên", "Người Dùng"],
      default: "Người Dùng",
    },
    otp: { type: String },
    otpExpire: { type: Date },
    isVerified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", function (next) {
  if (this.role === "ADMIN") {
    this.role = "Quản Trị Viên";
  } else if (this.role === "GENERAL") {
    this.role = "Người Dùng";
  }
  next();
});

const userModel = mongoose.model("user", userSchema);

module.exports = userModel;
