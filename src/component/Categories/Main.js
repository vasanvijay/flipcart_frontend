import React, { useState, useEffect } from 'react'
import { FaMagnifyingGlass, FaCamera, FaCartShopping, FaAngleRight } from "react-icons/fa6";
import { useNavigate } from 'react-router-dom';
import { BASE_URL, getImgSrc } from '../../utils/config';


const Categories = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);

    // Initial Data Loading
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Load Categories
                const catRes = await fetch(BASE_URL + '/api/categories');
                if (catRes.ok) {
                    const cats = await catRes.json();
                    setCategories(cats);
                }

                // Load Products
                const prodRes = await fetch(BASE_URL + '/api/products');
                if (prodRes.ok) {
                    let prods = await prodRes.json();

                    // Normalize product data
                    if (prods.length > 0) {
                        prods = prods.map(p => ({
                            ...p,
                            image: Array.isArray(p.images) ? p.images[0] : (p.images || ''),
                        }));
                        setProducts(prods);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch data:", err);
            }
        };
        fetchData();
    }, []);

    // Set default selected category
    useEffect(() => {
        if (categories.length > 0 && !selectedCategory) {
            setSelectedCategory(categories[0].name);
        }
    }, [categories, selectedCategory]);

    const filteredProducts = selectedCategory
        ? products.filter(p => p.category?.toLowerCase() === selectedCategory?.toLowerCase())
        : [];

    return (
        <div className="flex flex-col h-screen bg-white pb-14 md:pb-0">
            {/* Header (Mobile style) */}
            <div className="flex justify-between items-center p-3 sticky top-0 bg-white z-10 border-b border-gray-100">
                <h1 className="text-lg text-gray-800 font-medium">All Categories</h1>
                <div className="flex gap-4 text-gray-700">
                    <FaMagnifyingGlass size={20} />
                    <FaCamera size={20} />
                    <FaCartShopping size={20} onClick={() => navigate('/cart')} className="cursor-pointer" />
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar */}
                <div className="w-[85px] bg-[#f0f5ff] h-full overflow-y-auto no-scrollbar pb-20">
                    {categories.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => setSelectedCategory(item.name)}
                            className={`flex flex-col items-center justify-center py-4 px-1 cursor-pointer transition-all relative ${selectedCategory === item.name ? 'bg-white' : 'hover:bg-blue-50'
                                }`}
                        >
                            {selectedCategory === item.name && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-md"></div>
                            )}
                            <div className="h-12 w-12 mb-1 rounded-full overflow-hidden bg-white p-1 shadow-sm">
                                <img src={getImgSrc(item.image)} alt={item.name} className="w-full h-full object-contain" />
                            </div>
                            <span className={`text-[10px] text-center leading-3 ${selectedCategory === item.name ? 'font-bold text-blue-600' : 'text-gray-600 font-medium'}`}>
                                {item.name}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Right Content Area */}
                <div className="flex-1 h-full overflow-y-auto bg-white p-3 pb-24">

                    {/* Category Title */}
                    <div className="mb-4 sticky top-0 bg-white pb-2 border-b border-dashed border-gray-200">
                        <h2 className="text-lg font-bold text-gray-800">{selectedCategory}</h2>
                        <p className="text-xs text-gray-400">{filteredProducts.length} products</p>
                    </div>

                    {/* Products Grid */}
                    {filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {filteredProducts.map((prod) => (
                                <div
                                    key={prod.id}
                                    className="border border-gray-100 rounded-lg p-2 flex flex-col items-center shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => navigate(`/product/${prod.id}`)}
                                >
                                    <div className="h-32 w-full mb-2">
                                        <img src={getImgSrc(prod.image)} alt={prod.title} className="w-full h-full object-contain" />
                                    </div>
                                    <h3 className="text-xs font-medium text-gray-700 line-clamp-2 text-center mb-1 w-full mx-auto">
                                        {prod.title}
                                    </h3>
                                    <div className="mt-auto">
                                        <span className="text-sm font-bold text-gray-900">₹{prod.price}</span>
                                    </div>
                                    {/* Intentionally NO Buy Button as requested */}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <p>No products found in this category.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Categories