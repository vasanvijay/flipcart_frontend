import React, { useEffect, useState } from 'react'
import { FaBars, FaCartShopping, FaUser, FaStore, FaEllipsisVertical, FaMagnifyingGlass, FaXmark } from "react-icons/fa6";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Logo from '../../assets/logo.png'

const Header = ({ setSelected, onOpenCart, cartCount }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [menu, setmenu] = useState(false)
  const [loading, setLoading] = useState(false)

  // Mobile Sidebar Link Handler
  const handleMobileNav = (path) => {
    setmenu(false)
    if (path) navigate(path)
  }

  return (
    <>
      {/* MOBILE HEADER */}
      <div className="md:hidden bg-white sticky top-0 z-50 shadow-md">
        <div className="flex items-center justify-between px-3 py-3">
          {/* Left: Menu & Logo */}
          <div className="flex items-center gap-3">
            <button onClick={() => setmenu(true)} className="text-gray-800 p-1">
              <FaBars size={20} />
            </button>
            <Link to="/" className="flex flex-col">
              <img src={Logo} className="h-5 object-contain md:h-6" alt="Flipkart" />
              <div className="flex items-center gap-0.5 text-[10px] text-gray-400 italic font-medium -mt-0.5">
                Explore <span className="text-[#ffe500] font-bold">Plus</span>
                <img src="https://static-assets-web.flixcart.com/fk-p-linchpin-web/fk-cp-zion/img/plus_aef861.png" className="w-[8px]" alt="" />
              </div>
            </Link>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-4">
            {/* Mobile/App Icon */}
            <button className="text-black hidden sm:block">
              {/* Using SVG for the specific phone icon if needed, or stick to FaMobile for now if not valid import. 
                   I'll use a text-based fallback or simple icon if strict about imports.
                   React Icons usually has FaMobile. I'll add it to import. 
               */}
            </button>

            {localStorage.getItem('isDemoLoggedin') === 'true' ? (
              <div className="text-gray-800 flex items-center gap-1.5 cursor-pointer">
                <FaUser size={18} />
                <span className="text-[14px] font-medium hidden sm:block">{localStorage.getItem('userIdentifier')}</span>
                <span className="text-[14px] font-medium sm:hidden">User</span>
              </div>
            ) : (
              <Link to="/login" className="text-gray-800 flex items-center gap-1.5">
                <FaUser size={18} />
                <span className="text-[14px] font-medium hidden sm:block">Login</span>
                <span className="text-[14px] font-medium sm:hidden">Login</span>
              </Link>
            )}

            <button onClick={onOpenCart} className="relative text-gray-800 p-1">
              <FaCartShopping size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#ff6161] text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full border border-white">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="px-3 pb-2">
          <div className="bg-gray-50 border border-gray-200 rounded-[4px] flex items-center px-3 py-2">
            <FaMagnifyingGlass className="text-gray-500 mr-3" size={16} />
            <input
              type="text"
              className="w-full text-[14px] outline-none text-gray-700 placeholder:text-gray-500 bg-transparent"
              placeholder="Search for Products, Brands and More"
            />
          </div>
        </div>
      </div>

      {/* MOBILE SIDEBAR DRAWER */}
      <div className={`fixed inset-0 z-[100] md:hidden ${menu ? '' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${menu ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setmenu(false)}
        />
        <div className={`absolute top-0 left-0 w-[280px] h-full bg-white shadow-2xl transition-transform duration-300 transform ${menu ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="bg-[#2874f0] text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                <FaUser />
              </div>
              <span className="font-semibold text-[15px]">
                {localStorage.getItem('isDemoLoggedin') === 'true'
                  ? localStorage.getItem('userIdentifier')
                  : 'Login & Sign up'}
              </span>
            </div>
            <button onClick={() => setmenu(false)} className="text-white/80 hover:text-white"><FaXmark size={22} /></button>
          </div>
          <div className="flex flex-col py-2">
            <button onClick={() => handleMobileNav('/')} className="px-5 py-3 text-left hover:bg-gray-50 flex items-center gap-4 text-gray-700 font-medium text-[14px]"><FaStore size={16} className="text-gray-400" /> Home</button>
            <button onClick={() => handleMobileNav('/category')} className="px-5 py-3 text-left hover:bg-gray-50 flex items-center gap-4 text-gray-700 font-medium text-[14px]"><div className="w-[18px] text-center grid place-items-center"><img src="https://static-assets-web.flixcart.com/fk-p-linchpin-web/fk-cp-zion/img/plus_aef861.png" className="w-4" alt="" /></div> Flipkart Plus Zone</button>
            <hr className="my-1 border-gray-100" />
            <button onClick={() => handleMobileNav('/category?category=Electronics')} className="px-5 py-3 text-left hover:bg-gray-50 flex items-center gap-4 text-gray-700 font-medium text-[14px]">Electronics</button>
            <button onClick={() => handleMobileNav('/category?category=Fashion')} className="px-5 py-3 text-left hover:bg-gray-50 flex items-center gap-4 text-gray-700 font-medium text-[14px]">Fashion</button>
            <button onClick={() => handleMobileNav('/category?category=Home')} className="px-5 py-3 text-left hover:bg-gray-50 flex items-center gap-4 text-gray-700 font-medium text-[14px]">Home & Furniture</button>
            <hr className="my-1 border-gray-100" />
            <button onClick={() => handleMobileNav('/account')} className="px-5 py-3 text-left hover:bg-gray-50 flex items-center gap-4 text-gray-700 font-medium text-[14px]">My Account</button>
            <button onClick={() => handleMobileNav('/orders')} className="px-5 py-3 text-left hover:bg-gray-50 flex items-center gap-4 text-gray-700 font-medium text-[14px]">My Orders</button>
          </div>
        </div>
      </div>


      {/* DESKTOP HEADER */}
      <div className="hidden md:block bg-white sticky top-0 z-50 py-2.5 h-[64px] shadow-sm">
        <div className="w-full max-w-[1248px] mx-auto px-4 flex items-center justify-between h-full">
          {/* Logo */}
          <div className="min-w-[75px] cursor-pointer mr-6 md:mr-10" onClick={() => navigate('/')}>
            <img src={Logo} className="w-[75px] object-contain" alt="Flipkart" />
            <div className="flex items-center gap-1 text-[11px] text-gray-400 italic hover:underline -mt-1 font-medium">
              Explore <span className="text-[#ffe500] font-bold">Plus</span>
              <img src="https://static-assets-web.flixcart.com/fk-p-linchpin-web/fk-cp-zion/img/plus_aef861.png" className="w-[10px]" alt="" />
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-[550px] relative">
            <div className="relative w-full shadow-sm rounded-[4px] bg-[#f0f5ff] border border-gray-100 flex items-center">
              <button className="pl-3 pr-2 text-gray-500">
                <FaMagnifyingGlass size={16} />
              </button>
              <input
                type="text"
                className="w-full px-2 py-[9px] text-[14px] text-gray-700 placeholder:text-gray-500 rounded-[2px] outline-none border-none font-normal bg-transparent"
                placeholder="Search for Products, Brands and More"
              />
            </div>
          </div>

          {/* Nav Items */}
          <div className="flex items-center gap-8 ml-auto">
            {localStorage.getItem('isDemoLoggedin') === 'true' ? (
              <div className="group relative cursor-pointer font-medium text-[15px] text-gray-700 hover:text-blue-600 transition-colors py-2">
                <div className="flex items-center gap-2 text-blue-600 font-semibold">
                  <FaUser size={16} />
                  <span>{localStorage.getItem('userIdentifier') || 'My Account'}</span>
                  <FaEllipsisVertical className="rotate-90" size={12} />
                </div>
                <div className="absolute top-[40px] left-1/2 -translate-x-1/2 w-[200px] bg-white text-black shadow-lg rounded-[2px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[60] border border-gray-100">
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-b-8 border-transparent border-b-white"></div>
                  <div className="flex flex-col py-2">
                    <Link to="/orders" className="px-4 py-3 hover:bg-gray-50 text-[14px] font-medium border-b border-gray-50 text-gray-700 flex items-center gap-2">My Orders</Link>
                    <button onClick={() => {
                      localStorage.removeItem('isDemoLoggedin');
                      localStorage.removeItem('userIdentifier');
                      window.location.reload();
                    }} className="px-4 py-3 hover:bg-gray-50 text-[14px] font-medium text-gray-700 text-left w-full">Logout</button>
                  </div>
                </div>
              </div>
            ) : (
              <Link to="/login" className="flex items-center gap-2 group hover:text-blue-600 transition-colors">
                <FaUser className="text-gray-600 group-hover:text-blue-600" size={16} />
                <span className="font-medium text-gray-700 group-hover:text-blue-600 text-[15px]">Login</span>
              </Link>
            )}

            <div className="flex items-center gap-1 cursor-pointer font-medium text-[15px] text-gray-700 hover:text-blue-600 transition-colors">
              <span>Become a Seller</span>
            </div>

            <div className="group relative cursor-pointer font-medium text-[15px] text-gray-700 hover:text-blue-600 transition-colors py-2">
              <div className="flex items-center gap-1">
                <span>More</span>
                <FaEllipsisVertical className="rotate-90 group-hover:rotate-180 transition-transform duration-300" size={14} />
              </div>

              {/* Dropdown using group-hover */}
              <div className="absolute top-[40px] left-1/2 -translate-x-1/2 w-[200px] bg-white text-black shadow-lg rounded-[2px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[60] border border-gray-100">
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-b-8 border-transparent border-b-white"></div>
                <div className="flex flex-col py-2">
                  <Link to="/orders" className="px-4 py-3 hover:bg-gray-50 text-[14px] font-medium border-b border-gray-50 text-gray-700 flex items-center gap-2">Notification Preferences</Link>
                  <Link to="/help" className="px-4 py-3 hover:bg-gray-50 text-[14px] font-medium border-b border-gray-50 text-gray-700">24x7 Customer Care</Link>
                  <Link to="/advertise" className="px-4 py-3 hover:bg-gray-50 text-[14px] font-medium border-b border-gray-50 text-gray-700">Advertise</Link>
                  <Link to="/download" className="px-4 py-3 hover:bg-gray-50 text-[14px] font-medium text-gray-700">Download App</Link>
                </div>
              </div>
            </div>

            <button onClick={onOpenCart} className="flex items-center gap-2 font-medium text-[15px] text-gray-700 hover:text-blue-600 transition-colors cursor-pointer">
              <div className="relative">
                <FaCartShopping size={18} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#ff6161] text-white text-[9px] font-bold px-1 py-[1px] rounded-[4px] border border-white min-w-[16px] text-center">
                    {cartCount}
                  </span>
                )}
              </div>
              <span>Cart</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default Header