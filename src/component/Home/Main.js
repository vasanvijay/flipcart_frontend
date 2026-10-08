import React, { useState } from 'react'
import Slider from '../Slider/Main';
import Products from '../Products/Main';


import BannerSlide from '../BannelSlide/Main';
import ProductSection from './ProductSection';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BASE_URL } from '../../utils/config';



const Home = () => {
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');
  const groupFilter = searchParams.get('group');
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [productGroups, setProductGroups] = useState([]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, groupRes] = await Promise.all([
          fetch(BASE_URL + '/api/products'),
          fetch(BASE_URL + '/api/product-groups')
        ]);

        if (prodRes.ok) {
          const resData = await prodRes.json();
          const formattedProducts = resData.map(p => ({
            id: p.id,
            title: p.title,
            price: p.price,
            cancelprice: p.cancelprice || (parseFloat(p.price) * 1.3).toFixed(0),
            category: p.category,
            image: Array.isArray(p.images) ? p.images : [p.images || ''],
            description: p.description
          }));
          setData(formattedProducts);
        }

        if (groupRes.ok) {
          setProductGroups(await groupRes.json());
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };

    fetchData();
  }, []);

  // Filter Data
  // Filter Data
  const filteredData = React.useMemo(() => {
    const normalize = (str) => str ? str.toLowerCase().replace(/[^a-z0-9]/g, '') : '';

    if (categoryFilter) {
      return data.filter(item => normalize(item.category) === normalize(categoryFilter));
    }
    if (groupFilter) {
      // Find matching group by title (case-insensitive for safety)
      const group = productGroups.find(g => g.title?.toLowerCase() === groupFilter.toLowerCase())
        // OR fallback if title is not exact? For now exact match
        || productGroups.find(g => g.title === groupFilter);

      if (group) {
        return data.filter(p => group.productIds.includes(p.id));
      }

      return [];
    }
    return data;
  }, [categoryFilter, groupFilter, data, productGroups]);

  return (
    <div className="min-h-screen pb-4">
      {/* Banner Section - Moved Top as per request */}
      {!categoryFilter && !groupFilter && <BannerSlide />}

      {!categoryFilter && !groupFilter && <Slider />}

      {/* Home Sections (Horizontal Scroll) */}
      {!categoryFilter && !groupFilter && (
        <div className="w-full max-w-[1248px] mx-auto px-2">
          {/* Dynamic Groups */}
          {/* Dynamic Groups: Standard Sliders */}
          {/* Dynamic Groups: Standard Sliders */}
          {productGroups.filter(g => g.type !== 'micro-grid').map(group => {
            // ... existing standard slider logic ...
            const productIds = Array.isArray(group.productIds) ? group.productIds.map(String) : [];
            const groupProducts = data.filter(p => productIds.includes(String(p.id)));
            // if (groupProducts.length === 0) return null; // Show even if empty for debugging / clarity
            return (
              <ProductSection
                key={group.id}
                title={group.title}
                tagline={group.tagline}
                data={groupProducts}
                backgroundColor={group.backgroundColor}
              />
            );
          })}

          {/* Dynamic Groups: Micro Grid Collections */}
          {productGroups.filter(g => g.type === 'micro-grid').map(group => (
            <div key={group.id} className="bg-white p-3 pt-4 mb-2 shadow-sm rounded-sm mt-2">
              <h2 className="text-[18px] md:text-[20px] font-bold text-gray-800 mb-4">{group.title}</h2>

              <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-6">
                {Array.isArray(group.subItems) && group.subItems.map((item, idx) => (
                  <div key={idx} className="cursor-pointer group" onClick={() => navigate(`/?group=${encodeURIComponent(item.link || item.title)}`)}>
                    <div className="relative rounded-[4px] border border-gray-100 bg-white overflow-hidden aspect-[4/5] flex items-center justify-center">
                      <img
                        src={item.image || 'https://via.placeholder.com/150?text=No+Img'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        alt={item.title || 'Offer'}
                      />
                      {/* Pink Badge (only if text provided) */}
                      {item.badgeText && (
                        <div className="absolute bottom-0 left-0 w-full bg-[#cc0f74] text-white text-[9px] md:text-[11px] font-bold text-center py-0.5 md:py-1 z-10">
                          {item.badgeText}
                        </div>
                      )}
                    </div>
                    {/* Caption (only if title provided) */}
                    {item.title && (
                      <p className="text-center text-[10px] md:text-[13px] text-gray-500 font-medium mt-1.5 leading-tight px-1">
                        {item.title}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}



          {/* --- NEW: Random "More to Explore" Section (All Products, Uncategorized, Listing Flow) --- */}
          <div className="mt-4 bg-white p-3 shadow-sm rounded-sm">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <div>
                <h2 className="text-[18px] md:text-[20px] font-bold text-gray-800">More to Explore</h2>
                <p className="text-gray-400 text-xs md:text-sm">Recommendations based on your interest</p>
              </div>
              <button
                onClick={() => navigate('/?group=Suggested for You')}
                className="bg-[#2874f0] text-white text-[12px] md:text-[13px] font-bold px-4 py-2 rounded shadow-sm hover:shadow-md"
              >
                VIEW ALL
              </button>
            </div>

            {/* All Products Grid (Bottom of Page) */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 border-t border-l border-gray-100">
              {data && data.map(item => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/product/${item.id}`)}
                  className="flex flex-col items-center p-3 border-r border-b border-gray-100 hover:shadow-lg transition-all cursor-pointer bg-white"
                >
                  <div className="h-32 w-full flex items-center justify-center mb-2 relative">
                    <img
                      src={item.image[0]}
                      className="max-h-full max-w-full object-contain hover:scale-105 transition-transform"
                      alt={item.title}
                    />
                    {/* Optional Heart Icon */}
                    {/* <div className="absolute top-0 right-0 text-gray-300 hover:text-red-500"><FaHeart /></div> */}
                  </div>
                  <div className="text-left w-full mt-1">
                    <h3 className="text-[13px] text-gray-800 font-medium truncate">{item.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-gray-400 text-[12px] line-through">₹{item.cancelprice}</span>
                      <span className="text-black font-bold text-[14px]">₹{item.price}</span>
                    </div>
                    <p className="text-[10px] text-green-600 font-bold mt-1">Hot Deal</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
      {/* Category View (Detailed) */}
      {categoryFilter && (
        <div className="w-full max-w-[1248px] mx-auto px-2 mt-2">
          <div className="bg-white p-3 mb-2 shadow-sm rounded-sm">
            <h2 className="text-[16px] font-bold text-gray-800">Showing results for "{categoryFilter}"</h2>
          </div>
          <Products data={filteredData} />
        </div>
      )}

      {/* Group View (Simplified "Offer Zone" Style) */}
      {groupFilter && (
        <div className="w-full max-w-[1248px] mx-auto min-h-screen bg-white md:bg-transparent">
          {/* PC View Header */}
          <div className="hidden md:flex flex-col items-center justify-center py-8 bg-white mb-2 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-800">{groupFilter}</h1>
            <p className="text-gray-500 text-sm mt-1">{filteredData.length} Items</p>
          </div>

          {/* Mobile View Header */}
          <div className="md:hidden bg-white p-4 border-b">
            <h1 className="text-lg font-medium text-gray-800">
              {groupFilter}
              <span className="text-gray-500 text-sm ml-2">({filteredData.length} Results)</span>
            </h1>
          </div>

          {/* Grid */}
          <div className="bg-white grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-0 border-t border-l border-gray-200">
            {filteredData.map(item => (
              <div
                key={item.id}
                onClick={() => navigate(`/product/${item.id}`)}
                className="flex flex-col items-center p-4 border-r border-b border-gray-200 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="h-40 w-full flex items-center justify-center mb-4">
                  <img src={item.image[0]} className="max-h-full max-w-full object-contain hover:scale-105 transition-transform" alt={item.title} />
                </div>
                <div className="text-center w-full">
                  <h3 className="text-[14px] text-gray-800 font-medium truncate px-2">{item.title}</h3>
                  <p className="text-black font-bold text-[14px] mt-1">From ₹{item.price ? item.price.toLocaleString() : '0'}</p>
                  {/* <p className="text-xs text-gray-400 mt-1">Grab Now!</p> */}
                </div>
              </div>
            ))}
          </div>
          {filteredData.length === 0 && (
            <div className="p-10 text-center text-gray-500 bg-white">
              No products found in this group.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Home