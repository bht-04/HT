const uploadProductPermission = require("../../helpers/permission");
const productModel = require("../../models/productModel");

async function updateProductController(req,res) {
    try {
        if (!(await uploadProductPermission(req.user))) {
          return res.status(403).json({
          message: "Bạn cần quyền Quản Trị Viên!",
          error: true,
          success: false,
      });
    }

    const {_id, ...resBody} = req.body

    const updateProduct = await productModel.findByIdAndUpdate(_id,resBody)

    res.json ({
        message : "Cập nhật sản phẩm thành công!",
        data : updateProduct,
        success : true,
        error : false
    })
    }catch (err) {
      return res.status(400).json({
      message: err.message || err,
      error: true,
      success: false,
    });
  }
}
module.exports = updateProductController