const express = require("express");

const router = express.Router();
const authToken = require("../middleware/authToken");

const userSignUpController = require("../controller/user/userSignUp");
const userSignInController = require("../controller/user/userSignIn");
const userDetailsController = require("../controller/user/userDetails");
const userLogout = require("../controller/user/userLogout");
const allUsers = require("../controller/user/allUsers");
const updateUser = require("../controller/user/updateUser");
const UploadProductController = require("../controller/product/uploadProduct");
const getProductController = require("../controller/product/getProduct");
const updateProductController = require("../controller/product/updateProduct");
const getCategoryProduct = require("../controller/product/getCategoryProductOne");
const getCategoryWiseProduct = require("../controller/product/getCategoryWiseProduct");
const getProductDetails = require("../controller/product/getProductDetails");
const addToCartController = require("../controller/user/addToCartController");
const addToCartViewProduct = require("../controller/user/addToCartViewProduct");
const updateAddToCartProduct = require("../controller/user/updateAddToCartProduct");
const deleteAddToCartProduct = require("../controller/user/deleteAddToCartProduct");
const searchProduct = require("../controller/product/searchProduct");
const filterProductController = require("../controller/product/filterProduct");
const paymentController = require("../controller/order/paymentController");
const { getUserOrders } = require("../controller/order/orderController");
const forgotPasswordController = require("../controller/user/forgotPassword");
const resetPasswordController = require("../controller/user/resetPassword");
const verifyOtpController = require("../controller/user/verifyOtp");
const deleteProductController = require("../controller/product/deleteProductController");
const revenueChartController = require("../controller/order/revenueChartController");
const getOrdersByUser = require("../controller/order/getOrdersByUser");
const countAddToCartProduct = require("../controller/user/countAddToCartProduct");

router.post("/signup", userSignUpController);
router.post("/signin", userSignInController);
router.get("/user-details", authToken, userDetailsController);
router.get("/userLogout", userLogout);

//
router.get("/tat-ca-nguoi-dung", authToken, allUsers);
router.post("/cap-nhat-nguoi-dung", authToken, updateUser);

//
router.post("/cap-nhat-san-pham", authToken, UploadProductController);
router.get("/danh-sach-san-pham", authToken, getProductController);
router.post("/chinh-sua-san-pham", authToken, updateProductController);
router.get("/lay-danh-muc-san-pham", getCategoryProduct);
router.post("/danh-muc-san-pham", getCategoryWiseProduct);
router.post("/chi-tiet-san-pham", getProductDetails);
router.get("/tim-kiem-san-pham", searchProduct);
router.post("/loc-san-pham", filterProductController);
router.delete("/xoa-san-pham", deleteProductController);

//
router.post("/them-vao-gio-hang", authToken, addToCartController);
router.get("/so-luong-gio-hang", authToken, countAddToCartProduct);
router.get("/gio-hang", authToken, addToCartViewProduct);
router.post("/cap-nhat-gio-hang", authToken, updateAddToCartProduct);
router.post("/xoa-san-pham-khoi-gio-hang", authToken, deleteAddToCartProduct);

//
router.post("/thanh-toan", authToken, paymentController);
router.get("/danh-sach-don-hang", authToken, getUserOrders);
router.get("/bieu-do-doanh-thu", revenueChartController);
router.get("/don-hang-cua-nguoi-dung", getOrdersByUser);

//
router.post("/quen-mat-khau", forgotPasswordController);
router.post("/dat-lai-mat-khau", resetPasswordController);
router.post("/xac-thuc-otp", verifyOtpController);

module.exports = router;
