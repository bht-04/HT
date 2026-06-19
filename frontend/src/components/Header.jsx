import React, { useState, useEffect, useContext } from "react";
import Logo from "./Logo";
import { IoSearchOutline } from "react-icons/io5";
import { FaShoppingCart } from "react-icons/fa";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import SummaryApi from "../common";
import { toast } from "react-toastify";
import { setUserDetails, setAvatarUpdated } from "../store/userSlice";
import ROLE from "../common/role";
import Context from "../context";

const Header = () => {
const context = useContext(Context);
const navigate = useNavigate();
const location = useLocation();

const URLSearch = new URLSearchParams(location.search);
const searchQuery = URLSearch.get("ht") || "";

const [search, setSearch] = useState(searchQuery);
const [showSearch, setShowSearch] = useState(false);
const [menuDisplay, setMenuDisplay] = useState(false);

const avatarUpdated = useSelector((state) => state.user.avatarUpdated);
const user = useSelector((state) => state?.user?.user);
const tempProfilePic = useSelector(
  (state) => state?.user?.tempProfilePic
);

const dispatch = useDispatch();

const fullText = "Tìm kiếm sản phẩm...";
const [displayText, setDisplayText] = useState("");
const [index, setIndex] = useState(0);
const [isDeleting, setIsDeleting] = useState(false);

// đóng menu khi chuyển trang
useEffect(() => {
  setMenuDisplay(false);
  setShowSearch(false);
}, [location.pathname]);

// đồng bộ input với URL
useEffect(() => {
  setSearch(searchQuery);
}, [searchQuery]);

// hiệu ứng placeholder typing
useEffect(() => {
  const delay = isDeleting ? 50 : 100;

  const timer = setTimeout(() => {
    if (!isDeleting) {
      setDisplayText(fullText.slice(0, index + 1));
      setIndex(index + 1);

      if (index === fullText.length) {
        setTimeout(() => setIsDeleting(true), 1000);
      }
    } else {
      setDisplayText(fullText.slice(0, index - 1));
      setIndex(index - 1);

      if (index === 0) {
        setIsDeleting(false);
      }
    }
  }, delay);

  return () => clearTimeout(timer);
}, [index, isDeleting]);

const mapRole = (role) => {
  if (role === "ADMIN") return ROLE.ADMIN;
  if (role === "GENERAL") return ROLE.GENERAL;
  return role;
};

const handleSearch = (e) => {
  setSearch(e.target.value);
};

// debounce search
useEffect(() => {
  // chỉ search khi đang ở trang tìm kiếm
  if (location.pathname !== "/tim-kiem-san-pham") return;

  const timer = setTimeout(() => {
    const keyword = search.trim();

    navigate(
      keyword
        ? `/tim-kiem-san-pham?ht=${encodeURIComponent(keyword)}`
        : "/tim-kiem-san-pham",
      { replace: true }
    );
  }, 300);

  return () => clearTimeout(timer);
}, [search, location.pathname, navigate]);

const handleLogout = async () => {
  const fetchData = await fetch(SummaryApi.logout_user.url, {
    method: SummaryApi.logout_user.method,
    credentials: "include",
  });

  const data = await fetchData.json();

  if (data.success) {
    toast.success(data.message);
    dispatch(setUserDetails(null));
    navigate("/");
  }

  if (data.error) {
    toast.error(data.message);
  }
};

const fetchUserDetails = async () => {
  try {
    const res = await fetch("/api/user/details", {
      credentials: "include",
    });

    const data = await res.json();

    if (data.success) {
      dispatch(setUserDetails(data.user));
    }
  } catch (error) {
    console.error("Lỗi fetch user details:", error);
  }
};

useEffect(() => {
  fetchUserDetails();

  if (avatarUpdated) {
    dispatch(setAvatarUpdated(false));
  }
}, [avatarUpdated, dispatch]);
  return (
    <>

      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 py-3">
<div className="flex items-center justify-between h-16">

  {/* Logo */}
  <Link to="/" className="flex-shrink-0 mix-blend-multiply">
    <Logo w={60} h={50} className="object-contain" />
  </Link>

  {/* Search Desktop */}
  <div className="hidden md:flex flex-1 max-w-xl mx-6">
    <div className="relative w-full">
      <input
        type="text"
        placeholder={displayText}
        className="w-full py-2 px-4 pr-10 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all duration-200"
        onChange={handleSearch}
        value={search}
      />
      <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors">
        <IoSearchOutline className="text-lg" />
      </button>
    </div>
  </div>

  {/* Right Actions */}
  <div className="flex items-center space-x-4">

    {/* Mobile Search */}
    <button
      className="md:hidden text-gray-500 hover:text-primary transition-colors"
      onClick={() => setShowSearch(!showSearch)}
    >
      <IoSearchOutline className="text-2xl" />
    </button>

    {/* User */}
    <div className="relative">
      {user?._id ? (
        <div
          className="flex items-center cursor-pointer"
          onClick={() => setMenuDisplay((prev) => !prev)}
        >
          {tempProfilePic ? (
            <img
              src={tempProfilePic}
              className="w-9 h-9 rounded-full object-cover border-2 border-gray-200 hover:border-primary transition-all"
              alt="preview avatar"
            />
          ) : user?.profilePic ? (
            <img
              src={user.profilePic}
              className="w-9 h-9 rounded-full object-cover border-2 border-gray-200 hover:border-primary transition-all"
              alt={user?.name}
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gray-100 border-2 border-gray-200 hover:border-primary flex items-center justify-center transition-all">
              <Logo w={24} h={24} className="text-gray-400" />
            </div>
          )}
        </div>
      ) : (
        <Link
          to="/dang-nhap"
          className="px-4 py-2 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary-dark shadow-sm transition-colors"
        >
          Đăng nhập
        </Link>
      )}

      {menuDisplay && user?._id && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-50 py-1 border border-gray-100 divide-y divide-gray-100">
          {user?.role && mapRole(user.role) === ROLE.ADMIN && (
            <Link
              to="/trang-quan-tri/tat-ca-san-pham"
              className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setMenuDisplay(false)}
            >
              Trang Quản Trị
            </Link>
          )}

          <Link
            to="/danh-sach-don-hang"
            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Đơn đã đặt
          </Link>

          <Link
            to="/tai-khoan"
            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => setMenuDisplay(false)}
          >
            Tài khoản của tôi
          </Link>

          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      )}
    </div>

    {/* Cart */}
    <Link to="/gio-hang" className="relative">
      {user?._id && (
        <div className="text-gray-500 hover:text-primary transition-colors relative">
          <FaShoppingCart className="text-xl" />
          <div className="absolute -top-2 -right-2 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
            <span className="text-xs font-medium">
              {context?.cartProductCount}
            </span>
          </div>
        </div>
      )}
    </Link>

  </div>
</div>

{/* Mobile Search Panel */}
{showSearch && (
  <div className="md:hidden mt-3">
    <div className="relative">
      <input
        type="text"
        placeholder={displayText}
        value={search}
        onChange={handleSearch}
        autoFocus
        className="w-full py-2 px-4 pr-10 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
      />

      <IoSearchOutline className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
    </div>
  </div>
)}
        </div>
      </header>

      <div
  className={`transition-all duration-300 ${
    showSearch ? "h-36" : "h-16"
  } md:h-16`}
/>
    </>
  );
};

export default Header;