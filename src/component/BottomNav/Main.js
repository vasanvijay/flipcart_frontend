import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FaHouse, FaCirclePlay, FaBorderAll, FaUser, FaCartShopping } from "react-icons/fa6";

const BottomNav = ({ cartCount, onOpenCart }) => {
    const location = useLocation();

    const isActive = (path) => location.pathname === path ? "text-primary" : "text-gray-500";

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4 md:hidden z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center">

                {/* Home */}
                <Link to="/" className={`flex flex-col items-center gap-1 ${isActive('/')}`}>
                    <FaHouse size={20} />
                    <span className="text-[10px] font-medium">Home</span>
                </Link>

                {/* Play -> redirected to Home */}
                <Link to="/" className="flex flex-col items-center gap-1 text-gray-500 cursor-pointer hover:text-primary">
                    <FaCirclePlay size={20} />
                    <span className="text-[10px] font-medium">Play</span>
                </Link>

                {/* Categories */}
                <Link to="/category" className={`flex flex-col items-center gap-1 ${isActive('/category')}`}>
                    <FaBorderAll size={20} />
                    <span className="text-[10px] font-medium">Categories</span>
                </Link>

                {/* Account -> redirected to Home */}
                <Link to="/" className="flex flex-col items-center gap-1 text-gray-500 cursor-pointer hover:text-primary">
                    <FaUser size={20} />
                    <span className="text-[10px] font-medium">Account</span>
                </Link>

                {/* Cart */}
                <div onClick={onOpenCart} className="flex flex-col items-center gap-1 text-gray-500 cursor-pointer relative hover:text-primary">
                    <div className="relative">
                        <FaCartShopping size={20} />
                        {cartCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[9px] font-bold px-1 py-0.5 rounded-full leading-none border border-white">
                                {cartCount}
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] font-medium">Cart</span>
                </div>

            </div>
        </div>
    )
}

export default BottomNav
