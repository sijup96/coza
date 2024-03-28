const express = require("express");
const adminRoute = express();

const {
  adminLogin,
  login,
  adminDashboard,
  logout,
  loadOrders,
  loadOrderDetail,
  changeOrderStatus,
  loadSalesReport,
} = require("../controller/adminController");
const { isAdmin } = require("../middlewares/authMiddleware");
const {
  createProduct,
  loadaddProduct,
  loadAllProducts,
  deleteProduct,
  loadUpdateProduct,
  updateProduct,
  updateImages,
  deleteImage,
} = require("../controller/productCtrl");
const {
  createCategory,
  getAllCategory,
  deleteCategory,
  updateCategory,
  loadUpdateCategory,
  updateCategoryStatus,
} = require("../controller/categoryCtrl");
const { upload } = require("../config/config");
const {
  getAllUsers,
  blockUser,
  unblockUser,
} = require("../controller/userCtrl");

adminRoute.get("/", adminLogin);
adminRoute.post("/", login);

adminRoute.get("/dashboard", isAdmin, adminDashboard);
adminRoute.get("/logout", isAdmin, logout);

adminRoute.get("/products", isAdmin, loadAllProducts);

adminRoute.get("/addProduct", isAdmin, loadaddProduct);
adminRoute.post("/addProduct", upload, isAdmin, createProduct);

adminRoute.get("/updateProduct/:id", isAdmin, loadUpdateProduct);
adminRoute.post("/updateProduct", upload, isAdmin, updateProduct);

adminRoute.get("/deleteProduct/:id", isAdmin, deleteProduct);
adminRoute.post("/deleteImages", isAdmin, deleteImage);

adminRoute.get("/productCategory", isAdmin, getAllCategory);
adminRoute.post("/createCategory", isAdmin, createCategory);

adminRoute.get("/deleteCategory/:id", isAdmin, deleteCategory);
adminRoute.get("/updateCategory/:id", isAdmin, loadUpdateCategory);
adminRoute.post("/updateCategory", isAdmin, updateCategory);
adminRoute.put("/updateCategoryStatus/:id", isAdmin, updateCategoryStatus);

adminRoute.get("/getAllUsers", isAdmin, getAllUsers);
adminRoute.patch("/blockUser/:id", isAdmin, blockUser);
adminRoute.patch("/unblockUser/:id", isAdmin, unblockUser);

adminRoute.get("/orders", isAdmin, loadOrders);
adminRoute.get("/orderDetail", isAdmin, loadOrderDetail);
adminRoute.put("/changeOrderStatus/:id", isAdmin, changeOrderStatus);
adminRoute.get("/salesReport", isAdmin, loadSalesReport);

module.exports = adminRoute;
