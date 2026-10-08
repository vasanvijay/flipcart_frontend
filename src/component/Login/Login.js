import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaXmark } from "react-icons/fa6";
import Logo from '../../assets/logo.png';

const Login = () => {
    const [loginType, setLoginType] = useState('phone'); // 'phone' or 'email'
    const [inputValue, setInputValue] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        if (inputValue.trim()) {
            localStorage.setItem('isDemoLoggedin', 'true');
            // Store a simple identifier for display
            localStorage.setItem('userIdentifier', inputValue);
            navigate('/');
        }
    };

    const isButtonEnabled = inputValue.length > 0;

    return (
        <div className="min-h-screen bg-gray-100 flex items-start justify-center p-4 pt-20 sm:items-center sm:pt-4">
            <div className="bg-white rounded-[4px] shadow-md w-full max-w-[850px] flex overflow-hidden min-h-[500px]">
                {/* Left Side - Blue Info Panel */}
                <div className="bg-[#2874f0] text-white p-10 w-[40%] hidden sm:flex flex-col justify-between relative">
                    <div>
                        <h2 className="text-[28px] font-semibold mb-4">Login</h2>
                        <p className="text-[#dbdbdb] text-[18px] leading-[150%]">
                            Get access to your Orders, Wishlist and Recommendations
                        </p>
                    </div>
                    {/* Decorative placeholder graphic can go here */}
                    <div className="absolute bottom-10 left-10">
                        {/* Placeholder for standard Flipkart login graphic if available, else simple decoration */}
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="w-full sm:w-[60%] p-10 flex flex-col relative">
                    <Link to="/" className="absolute top-4 right-4 text-gray-600 hover:text-gray-800">
                        <FaXmark size={24} />
                    </Link>

                    <div className="flex-1 flex flex-col justify-start mt-4">
                        {/* Mobile Header for small screens */}
                        <div className="sm:hidden mb-6">
                            <h2 className="text-[24px] font-bold text-black mb-2">Log in for the best experience</h2>
                            <p className="text-[14px] text-gray-600 space-y-1">
                                {loginType === 'phone' ? 'Enter your phone number to continue' : 'Enter your Email ID to continue'}
                            </p>
                        </div>

                        <form onSubmit={handleLogin} className="flex flex-col gap-6 w-full max-w-[400px] mx-auto sm:mx-0">

                            {loginType === 'phone' ? (
                                <div className="relative">
                                    <label className={`absolute left-[70px] transition-all duration-200 pointer-events-none ${inputValue ? 'top-[-10px] text-[10px] text-gray-500' : 'top-[14px] text-[14px] text-gray-400'}`}>
                                        Phone Number
                                    </label>
                                    <div className="flex border-b border-gray-300 focus-within:border-[#2874f0]">
                                        <div className="w-[60px] py-3 text-[16px] text-gray-500 font-medium text-center border-r border-gray-300 mr-3">
                                            +91
                                        </div>
                                        <input
                                            type="text"
                                            className="flex-1 py-3 text-[16px] outline-none text-gray-800"
                                            value={inputValue}
                                            onChange={(e) => {
                                                // Allow only numbers for phone
                                                const val = e.target.value;
                                                if (/^\d*$/.test(val)) setInputValue(val);
                                            }}
                                            maxLength={10}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="relative border-b border-gray-300 focus-within:border-[#2874f0]">
                                    <label className={`absolute left-0 transition-all duration-200 pointer-events-none ${inputValue ? 'top-[-10px] text-[10px] text-gray-500' : 'top-[14px] text-[14px] text-gray-400'}`}>
                                        Email ID
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full py-3 text-[16px] outline-none text-gray-800"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                    />
                                </div>
                            )}

                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setLoginType(prev => prev === 'phone' ? 'email' : 'phone');
                                        setInputValue('');
                                    }}
                                    className="text-[#2874f0] text-[14px] font-medium hover:text-blue-700"
                                >
                                    {loginType === 'phone' ? 'Use Email-ID' : 'Use Phone Number'}
                                </button>
                            </div>

                            <div className="text-[12px] text-gray-400 mt-4">
                                By continuing, you agree to Flipkart's <span className="text-[#2874f0] cursor-pointer">Terms of Use</span> and <span className="text-[#2874f0] cursor-pointer">Privacy Policy</span>.
                            </div>

                            <button
                                type="submit"
                                disabled={!isButtonEnabled}
                                className={`w-full py-3 rounded-[2px] font-medium text-white shadow-sm transition-colors mt-2
                                    ${isButtonEnabled ? 'bg-[#fb641b] hover:bg-[#f05c16] cursor-pointer' : 'bg-gray-300 cursor-not-allowed'}`}
                            >
                                Continue
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
