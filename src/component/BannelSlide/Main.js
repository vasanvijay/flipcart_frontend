import React, { useState, useEffect } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import './style.css';

import { BASE_URL, getImgSrc } from '../../utils/config';


import { useNavigate } from 'react-router-dom';

const BannerSlide = () => {
  const [banners, setBanners] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${BASE_URL}/api/banners`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setBanners(data);
        } else {
          setBanners([]);
        }
      })
      .catch(err => {
        console.warn("Banner API failed", err);
      });
  }, []);

  // Handle Banner Click
  const handleBannerClick = (link) => {
    if (!link) return;

    // External Link
    if (link.startsWith('http')) {
      window.location.href = link;
      return;
    }

    // Internal Link - Ensure it has leading slash if not present for navigate()
    const path = link.startsWith('/') ? link : '/' + link;
    navigate(path);
  };

  if (banners.length === 0) {
    return (
      <div className="w-full max-w-[1248px] mx-auto px-2 mt-3 mb-2 h-40 bg-gray-100 flex items-center justify-center text-gray-400 rounded">
        No Banners. Add them from Admin Panel.
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1248px] mx-auto px-2 mt-3 mb-2 relative">
      {/* Mobile Banner Swiper (Only visible on Mobile) */}
      <div className="md:hidden">
        <Swiper
          spaceBetween={0}
          slidesPerView={1}
          autoplay={{
            delay: 3500,
            disableOnInteraction: false,
          }}
          loop={true}
          pagination={{
            clickable: true,
            renderBullet: (index, className) => {
              return '<span class="' + className + ' custom-bullet"></span>';
            }
          }}
          modules={[Autoplay, Pagination]}
          className="w-full banner-swiper"
        >
          {banners.filter(b => b.image).map((b, index) => (
            <SwiperSlide key={b.id || index}>
              <div
                onClick={() => handleBannerClick(b.link)}
                className={`w-full cursor-pointer ${!b.link ? 'cursor-default' : ''}`}
              >
                <img
                  src={getImgSrc(b.image)}
                  alt="Banner"
                  className="w-full h-[180px] object-fill rounded-sm"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Desktop Banner Swiper (Only visible on Desktop) */}
      <div className="hidden md:block">
        <Swiper
          spaceBetween={0}
          slidesPerView={1}
          autoplay={{
            delay: 4500,
            disableOnInteraction: false, // Different delay for desktop maybe?
          }}
          loop={true}
          pagination={{
            clickable: true,
            renderBullet: (index, className) => {
              return '<span class="' + className + ' custom-bullet"></span>';
            }
          }}
          modules={[Autoplay, Pagination]}
          className="w-full banner-swiper"
        >
          {banners.filter(b => b.desktopImage).map((b, index) => (
            <SwiperSlide key={b.id || index}>
              <div
                onClick={() => handleBannerClick(b.link)}
                className={`w-full cursor-pointer ${!b.link ? 'cursor-default' : ''}`}
              >
                <img
                  src={getImgSrc(b.desktopImage)}
                  alt="Desktop Banner"
                  className="w-full h-auto object-cover rounded-sm"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  )
}

export default BannerSlide