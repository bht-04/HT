const uploadProductPermission = require("../../helpers/permission");
const productModel = require("../../models/productModel");

async function UploadProductController(req, res) {
  try {
    const sessionUserId = req.user._id;

    if (!(await uploadProductPermission(sessionUserId))) {
      return res.status(403).json({
        message: "Cần quyền Quản Trị Viên",
        error: true,
        success: false,
      });
    }


    if (!req.body.productImage || req.body.productImage.length === 0) {
      return res.status(400).json({
        message: "Ít nhất một hình ảnh sản phẩm!",
        error: true,
        success: false,
      });
    }

    const uploadProduct = new productModel(req.body);
    const saveProduct = await uploadProduct.save();

    res.status(201).json({
      message: "Tải sản phẩm lên thành công!",
      error: false,
      success: true,
      data: saveProduct,
    });
  } catch (err) {
    res.status(400).json({
      message: err.message || "Lỗi khi tải sản phẩm lên",
      error: true,
      success: false,
    });
  }
}

module.exports = UploadProductController;
