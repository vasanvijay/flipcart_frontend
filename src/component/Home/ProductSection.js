import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { useNavigate } from 'react-router-dom';
import 'swiper/css';
import 'swiper/css/navigation';

const ProductSection = ({ title, tagline, data, bgBlue = false, backgroundColor = '#ffffff' }) => {
    const navigate = useNavigate();
    const showViewAll = data && data.length > 4;

    return (
        <div className="my-3">
            {/* --- DESKTOP VIEW (Swiper Slider) --- */}
            <div className="hidden md:block bg-white shadow-sm border-b border-gray-100 pb-4">
                <div className={`p-4 flex justify-between items-center ${bgBlue ? 'bg-blue-600 text-white mb-3' : 'border-b border-gray-100 mb-2'}`}>
                    <div>
                        <h2 className={`text-lg font-semibold ${bgBlue ? 'text-white' : 'text-black'}`}>{title}</h2>
                        {tagline && <p className={`text-sm opacity-80 ${bgBlue ? 'text-white' : 'text-gray-500'}`}>{tagline}</p>}
                    </div>
                    <button
                        onClick={() => navigate(`/?group=${encodeURIComponent(title)}`)}
                        className={`px-4 py-2 rounded shadow-sm text-xs font-bold uppercase ${bgBlue ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}
                    >
                        View All
                    </button>
                </div>

                <div className="px-2">
                    <Swiper
                        modules={[Navigation]}
                        navigation={{
                            nextEl: '.swiper-button-next',
                            prevEl: '.swiper-button-prev',
                        }}
                        spaceBetween={8}
                        slidesPerView={2.2}
                        breakpoints={{
                            640: { slidesPerView: 3, spaceBetween: 10 },
                            768: { slidesPerView: 4, spaceBetween: 12 },
                            1024: { slidesPerView: 5, spaceBetween: 15 },
                            1280: { slidesPerView: 6, spaceBetween: 15 },
                        }}
                        className="product-section-slider"
                    >
                        {data && data.map((item, index) => (
                            <SwiperSlide key={index}>
                                <div
                                    onClick={() => navigate(`/product/${item.id}`)}
                                    className="flex flex-col items-center p-2 cursor-pointer hover:shadow-lg transition-shadow rounded-lg border border-transparent hover:border-gray-100 h-full"
                                >
                                    <div className="h-32 w-full mb-3 flex items-center justify-center">
                                        <img src={item.image[0]} alt={item.title} className="max-h-full max-w-full object-contain hover:scale-105 transition-transform duration-200" />
                                    </div>
                                    <div className="text-center w-full">
                                        <h3 className="text-sm font-medium text-gray-800 truncate px-2 mb-1">{item.title}</h3>
                                        <div className="text-black text-sm font-bold mb-1">From ₹{item.price ? item.price.toLocaleString() : '0'}</div>
                                        <div className="text-gray-500 text-xs">Grab Now!</div>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </div>

            {/* --- MOBILE VIEW (2x2 Grid) --- */}
            <div className="md:hidden p-3 rounded-lg mx-2 mb-4" style={{ backgroundColor: backgroundColor || '#ffffff' }}>
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-[17px] font-bold text-gray-800">{title}</h2>
                    {showViewAll && (
                        <button
                            onClick={() => navigate(`/?group=${encodeURIComponent(title)}`)}
                            className="bg-black text-white rounded-full w-6 h-6 flex items-center justify-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {data && data.slice(0, 4).map((item, index) => (
                        <div
                            key={index}
                            onClick={() => navigate(`/product/${item.id}`)}
                            className="bg-white rounded-lg p-2.5 flex flex-col items-center cursor-pointer shadow-sm relative overflow-hidden"
                        >
                            {/* Offer Badge (Example logic) */}
                            {/* <div className="absolute top-2 right-2 bg-blue-100 text-blue-700 text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                                44% off
                            </div> */}

                            <div className="h-28 w-full mb-2 flex items-center justify-center">
                                <img src={item.image[0] || 'https://via.placeholder.com/150'} alt={item.title} className="max-h-full max-w-full object-contain" />
                            </div>
                            <div className="text-center w-full">
                                <h3 className="text-[13px] font-medium text-gray-800 truncate px-1 mb-0.5">{item.title}</h3>
                                <p className="text-green-700 font-bold text-[13px] whitespace-nowrap">From ₹{item.price ? item.price.toLocaleString() : '0'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProductSection;
