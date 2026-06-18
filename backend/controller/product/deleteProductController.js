const ProductModel = require("../../models/productModel.js");

const deleteProductController = async (req, res) => {
  try {
    const productId = req.params.id || req.body.id;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu ID sản phẩm",
      });
    }

    const deletedProduct = await ProductModel.findByIdAndDelete(productId);

    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: "Sản phẩm không tồn tại",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Xóa sản phẩm thành công",
    });
  } catch (error) {
    console.error("Lỗi xóa sản phẩm:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa sản phẩm",
    });
  }
};

module.exports = deleteProductController;
