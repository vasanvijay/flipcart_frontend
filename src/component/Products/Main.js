import React from 'react'
import { useNavigate } from 'react-router-dom'
import Fassur from '../../assets/fassur.png'
import { FaStar } from 'react-icons/fa6'

const Products = ({ data }) => {
  const navigate = useNavigate()
  const openProduct = (productId) => {
    // Navigate to product page using product ID
    navigate(`/product/${productId}`)
  }
  return (
    <div className="bg-white grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-0 border-t border-l border-gray-100/50 mb-4 bg-gray-100">
      {data && data.map((item, index) => (
        <div
          className="group relative flex flex-col p-4 bg-white border-r border-b border-gray-100 hover:shadow-[0_0_16px_rgba(0,0,0,0.15)] transition-all duration-300 cursor-pointer z-0 hover:z-20 hover:scale-[1.005]"
          key={item.id}
          onClick={() => openProduct(item.id)}
        >
          {/* Wishlist Placeholder */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm border border-gray-100">
              <span className="text-xl">♥</span>
            </div>
          </div>

          <div className="w-full h-[150px] md:h-[180px] flex items-center justify-center mb-4 overflow-hidden relative">
            <img src={item.image[0]} className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500 ease-in-out" alt={item.title} />
          </div>

          <div className="flex-1 w-full flex flex-col">
            <h3 className="text-[13px] md:text-[14px] font-medium text-gray-800 group-hover:text-primary line-clamp-2 leading-snug mb-2 transition-colors min-h-[36px]" title={item.title}>
              {item.title}
            </h3>

            <div className="flex items-center gap-2 mb-2">
              <div className="bg-[#388e3c] text-white text-[12px] font-bold px-1.5 py-[2px] rounded-[3px] flex items-center gap-1 shadow-sm">
                4.4 <FaStar size={8} />
              </div>
              <span className="text-gray-400 text-[13px] font-medium">(2,354)</span>
              <img src={Fassur} className="h-[18px] object-contain ml-2" alt="Assured" />
            </div>

            <div className="flex items-center gap-2.5 mt-auto">
              <span className="text-[16px] font-bold text-gray-900">From ₹{item.price ? item.price.toLocaleString() : '0'}</span>
              {item.cancelprice && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-[13px] line-through decoration-gray-400">₹{item.cancelprice.toLocaleString()}</span>
                  <span className="text-[#388e3c] text-[13px] font-bold">25% off</span>
                </div>
              )}
            </div>

            <div className="mt-2 text-[12px] font-medium text-gray-500 border border-gray-200 rounded-full w-fit px-2 py-0.5 bg-gray-50 group-hover:border-primary/30 group-hover:bg-blue-50 group-hover:text-primary transition-colors">
              Free delivery
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default Products