const mongoose = require("mongoose");

const productSchema = mongoose.Schema(
  {
    productName: {
      type: String,
      required: [true, "Tên sản phẩm là bắt buộc"],
      trim: true,
    },
    brandName: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Danh mục sản phẩm là bắt buộc"],
    },
    productImage: {
      type: [String],
      required: [true, "Ít nhất một hình ảnh sản phẩm là bắt buộc"],
      validate: {
        validator: function (images) {
          return images.length > 0;
        },
        message: "Ít nhất một hình ảnh sản phẩm là bắt buộc",
      },
    },
    description: String,
    price: { 
      type: Number,
      required: [true, "Giá gốc là bắt buộc"],
      min: [0, "Giá không được âm"],
    },
    sellingPrice: {
      type: Number,
      required: [true, "Giá bán là bắt buộc"],
      min: [0, "Giá không được âm"],
    },
    more_details: [
      {
        key: { type: String },
        value: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const productModel = mongoose.model("Product", productSchema);

module.exports = productModel;
