import React, { useEffect, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay } from 'swiper/modules'

import { useNavigate, useParams } from 'react-router-dom'
import { BASE_URL } from '../../utils/config'
import { upsertCartItem as upsertItemUtil, notifyCartUpdated } from '../../utils/cart'
import {
  FaStar,
  FaHeart,
  FaShareAlt,
  FaTruck,
  FaWarehouse,
  FaUndo,
  FaMoneyBillWave,
  FaHeadset,
  FaCheck
} from 'react-icons/fa'

const calculateDiscount = (original, current) => {
  if (!original || original <= current) return 0
  return Math.round(((original - current) / original) * 100)
}

const normalizeSpecifications = (specifications) => {
  let parsedSpecifications = specifications

  if (typeof parsedSpecifications === 'string') {
    try {
      parsedSpecifications = JSON.parse(parsedSpecifications)
    } catch (error) {
      return []
    }
  }

  if (!Array.isArray(parsedSpecifications)) return []

  return parsedSpecifications
    .map(section => ({
      title: String(section?.title || '').trim(),
      items: Array.isArray(section?.items)
        ? section.items
          .map(item => ({
            name: String(item?.name || '').trim(),
            value: String(item?.value || '').trim()
          }))
          .filter(item => item.name && item.value)
        : []
    }))
    .filter(section => section.title && section.items.length > 0)
}



const ProductDetails = () => {
  const navigate = useNavigate()
  const { id } = useParams()

  const [currentProduct, setCurrentProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  const [selectedColor, setSelectedColor] = useState(0)
  const [wishlisted, setWishlisted] = useState(false)
  const [showCartToast, setShowCartToast] = useState(false)
  const [selectedDetailsTab, setSelectedDetailsTab] = useState('specifications')

  // Reviews Data (Mock)
  const avgRating = 4.9
  const totalRatings = 780
  // --- Review System Logic ---
  const [localReviews, setLocalReviews] = useState([]) // Keep for fallback or user-added temp
  const [dbReviews, setDbReviews] = useState([])
  const [reviewForm, setReviewForm] = useState({ rating: 5, text: '' })
  const [editingReviewId, setEditingReviewId] = useState(null)

  // Fetch reviews from Backend
  const fetchReviews = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/reviews?product_id=${id}`)
      if (res.ok) {
        const data = await res.json()
        setDbReviews(data)
      }
    } catch (err) {
      console.warn("Failed to fetch reviews", err)
    }
  }

  // Load reviews on mount
  useEffect(() => {
    fetchReviews()
  }, [id])

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!reviewForm.text.trim()) return

    const sentimentMap = { 5: 'Excellent', 4: 'Very Good', 3: 'Good', 2: 'Fair', 1: 'Poor' }
    const payload = {
      productId: id,
      rating: reviewForm.rating,
      text: reviewForm.text,
      sentiment: sentimentMap[reviewForm.rating],
      author: 'You', // User logic can be added here
      date: new Date().toLocaleDateString(),
      verified: true
    }

    try {
      if (editingReviewId) {
        // Update Review
        const res = await fetch(`${BASE_URL}/api/reviews/${editingReviewId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (res.ok) {
          fetchReviews() // Refresh from DB
          setEditingReviewId(null)
          alert("Review updated!")
        } else {
          alert("Failed to update review")
        }
      } else {
        // Create Review
        const res = await fetch(BASE_URL + '/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (res.ok) {
          fetchReviews() // Refresh from DB
          alert("Review submitted!")
        } else {
          alert("Failed to submit review")
        }
      }
    } catch (err) {
      console.error("Review Submit Error", err)
      alert("Error submitting review")
    }

    setReviewForm({ rating: 5, text: '' })
  }

  const handleEditClick = (review) => {
    setReviewForm({ rating: review.rating, text: review.text })
    setEditingReviewId(review.id)
    const formElement = document.getElementById('review-form-anchor')
    if (formElement) formElement.scrollIntoView({ behavior: 'smooth' })
  }

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm("Delete this review?")) {
      try {
        const res = await fetch(`${BASE_URL}/api/reviews/${reviewId}`, { method: 'DELETE' })
        if (res.ok) {
          fetchReviews()
        } else {
          alert("Failed to delete review")
        }
      } catch (err) {
        console.error(err)
      }
    }
  }

  // Use DB reviews
  const reviews = dbReviews.length > 0 ? dbReviews : []

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/products/${id}`);
        if (!response.ok) {
          navigate('/');
          return;
        }

        const foundProduct = await response.json();

        // 3. Normalize Data for View
        // Ensure 'image' is always an array of strings
        let normalizeImages = [];
        if (Array.isArray(foundProduct.images)) {
          normalizeImages = foundProduct.images;
        } else if (Array.isArray(foundProduct.image)) {
          normalizeImages = foundProduct.image;
        } else if (typeof foundProduct.image === 'string') {
          normalizeImages = [foundProduct.image];
        } else {
          normalizeImages = [''];
        }

        // Ensure numeric values
        const safeProduct = {
          ...foundProduct,
          image: normalizeImages,
          price: Number(foundProduct.price) || 0,
          cancelprice: Number(foundProduct.cancelprice) || (Number(foundProduct.price) * 1.3).toFixed(0),
          specifications: normalizeSpecifications(foundProduct.specifications)
        };

        setCurrentProduct(safeProduct);
        localStorage.setItem('id', safeProduct.id); // Save ID for Payment/Legacy flows
        setLoading(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (err) {
        console.error("Fetch product failed", err);
        navigate('/');
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id, navigate]);


  if (loading || !currentProduct) {
    return <div className="flex items-center justify-center min-h-screen text-gray-500">Loading Product...</div>
  }

  const discount = calculateDiscount(currentProduct.cancelprice, currentProduct.price)
  const hasDescription = Boolean(currentProduct.description?.trim())
  const hasSpecifications = currentProduct.specifications.length > 0
  const detailsTabs = [
    ...(hasSpecifications ? [{ id: 'specifications', label: 'Specifications' }] : []),
    ...(hasDescription ? [{ id: 'description', label: 'Description' }] : [])
  ]
  const activeDetailsTab = detailsTabs.some(tab => tab.id === selectedDetailsTab)
    ? selectedDetailsTab
    : detailsTabs[0]?.id



  const handleAddToCart = () => {
    upsertItemUtil(currentProduct.id, 1, currentProduct.price)
    notifyCartUpdated()
    setShowCartToast(true)
    setTimeout(() => setShowCartToast(false), 3000)
  }

  const handleBuyNow = () => {
    upsertItemUtil(currentProduct.id, 1, currentProduct.price)
    notifyCartUpdated()
    navigate('/checkout')
  }

  return (
    <div className="bg-white min-h-screen pb-24 md:pb-8">
      <div className="container mx-auto max-w-7xl md:flex md:gap-8 md:px-4 md:py-6">

        {/* Left Column: Images */}
        <div className="w-full md:w-1/2 lg:w-2/5 md:sticky md:top-24 md:h-fit">
          <div className="relative w-full border border-gray-100 rounded-xl overflow-hidden shadow-sm">
            <Swiper
              spaceBetween={0}
              slidesPerView={1}
              autoplay={{ delay: 3000, disableOnInteraction: false }}
              modules={[Autoplay]}
              className="w-full"
            >
              {currentProduct.image
                .filter(img => img)
                .map((item, idx) => (
                  <SwiperSlide key={idx}>
                    <div className="relative w-full h-[50vh] md:h-[60vh] bg-white flex items-center justify-center pb-8 border-b border-gray-100">
                      <img
                        src={item}
                        className="w-full h-full object-contain p-4"
                        alt={currentProduct.title}
                      />

                      {/* Floating Rating Badge for Mobile/Desktop */}
                      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm shadow border border-gray-100">
                        <span className="font-semibold text-gray-900">{avgRating.toFixed(1)}</span>
                        <FaStar className="text-yellow-400" size={14} />
                        <span className="text-gray-400">|</span>
                        <span className="text-gray-500">{totalRatings} Ratings</span>
                      </div>

                      {/* Action Buttons (Heart/Share) */}
                      <div className="absolute top-4 right-4 flex flex-col gap-3">
                        <button
                          onClick={() => setWishlisted(prev => !prev)}
                          className="bg-white p-2.5 rounded-full shadow-md hover:bg-gray-50 transition-colors border border-gray-100"
                        >
                          <FaHeart className={wishlisted ? 'text-red-500' : 'text-gray-300'} size={18} />
                        </button>
                        <button className="bg-white p-2.5 rounded-full shadow-md hover:bg-gray-50 transition-colors border border-gray-100">
                          <FaShareAlt className="text-gray-400" size={18} />
                        </button>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
            </Swiper>
          </div>

          {/* Desktop Only: Add to Cart Buttons Group below image if desired, or keep in right column. 
              Keeping in right column is standard for Ecommerce. */}
        </div>

        {/* Right Column: Details */}
        <div className="w-full md:w-1/2 lg:w-3/5 px-4 md:px-0 mt-4 md:mt-0">
          <div className="mb-3">
            <p className="text-sm text-gray-500 mb-1 font-medium tracking-wide">Brand: Parona</p>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-snug">{currentProduct.title}</h1>
          </div>

          <div className="mb-6">
            <div className="bg-green-50 text-green-700 text-xs font-bold px-2 py-1 rounded inline-block mb-3 border border-green-100">
              Lowest Price in the year
            </div>
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-gray-900 font-bold text-3xl">₹{currentProduct.price}</span>
              <span className="text-gray-400 line-through text-lg">₹{currentProduct.cancelprice?.toLocaleString()}</span>
              <span className="text-green-600 font-bold text-lg">{discount}% off</span>
            </div>
            {/* <p className="text-xs text-blue-600 font-medium">+ ₹29 Secured Packaging Fee</p> */}
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex gap-4 mb-8">
            <button
              onClick={handleAddToCart}
              className="flex-1 py-3.5 bg-[#ff9f00] text-white font-bold rounded shadow hover:shadow-lg transition-all text-sm uppercase tracking-wide"
            >
              Add to Cart
            </button>
            <button
              onClick={handleBuyNow}
              className="flex-1 py-3.5 bg-[#fb641b] text-white font-bold rounded shadow hover:shadow-lg transition-all text-sm uppercase tracking-wide"
            >
              Buy Now
            </button>
          </div>

          <div className="border border-gray-100 rounded-xl p-4 mb-6 bg-gray-50/50">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Delivery Options</h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3 text-gray-700">
                <FaTruck className="text-blue-500 mt-0.5" size={18} />
                <div>
                  <span className="font-medium">Free Delivery</span>
                  <p className="text-xs text-gray-500 mt-0.5">By 13 Nov, Thursday</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-gray-700">
                <FaWarehouse className="text-purple-500 mt-0.5" size={18} />
                <div>
                  <span className="font-medium">Fulfilled by KSExport</span>
                  <p className="text-xs text-gray-500 mt-0.5">4.2 ★ • 3 years Seller</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 py-6 border-t border-gray-100 mb-6">
            <div className="flex flex-col items-center text-center p-2 rounded-lg hover:bg-gray-50 transition">
              <div className="bg-blue-100 rounded-full p-3 mb-2">
                <FaUndo className="text-blue-600" size={18} />
              </div>
              <span className="text-xs font-medium text-gray-700">7-Day Return</span>
            </div>
            <div className="flex flex-col items-center text-center p-2 rounded-lg hover:bg-gray-50 transition">
              <div className="bg-green-100 rounded-full p-3 mb-2">
                <FaMoneyBillWave className="text-green-600" size={18} />
              </div>
              <span className="text-xs font-medium text-gray-700">Cash on Delivery</span>
            </div>
            <div className="flex flex-col items-center text-center p-2 rounded-lg hover:bg-gray-50 transition">
              <div className="bg-purple-100 rounded-full p-3 mb-2">
                <FaHeadset className="text-purple-600" size={18} />
              </div>
              <span className="text-xs font-medium text-gray-700">24x7 Support</span>
            </div>
          </div>

          {detailsTabs.length > 0 && (
            <section className="mb-6 overflow-hidden border border-gray-200 rounded-lg bg-white">
              <div className="px-5 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">All details</h2>
                <p className="mt-1 text-sm text-gray-500">Product information and feature details</p>
              </div>

              <div className="flex gap-2 px-4 pt-4 overflow-x-auto md:px-5">
                {detailsTabs.map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedDetailsTab(tab.id)}
                    className={`px-4 py-2 text-sm font-semibold whitespace-nowrap border rounded-lg transition-colors ${
                      activeDetailsTab === tab.id
                        ? 'text-white bg-gray-900 border-gray-900'
                        : 'text-gray-700 bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeDetailsTab === 'description' && (
                <div className="p-5 md:p-6">
                  <h3 className="mb-3 text-base font-bold text-gray-900">Product Description</h3>
                  <p className="text-sm leading-7 text-gray-700 whitespace-pre-line break-words">
                    {currentProduct.description.trim()}
                  </p>
                </div>
              )}

              {activeDetailsTab === 'specifications' && (
                <div className="px-5 pb-5 md:px-6 md:pb-6">
                  {currentProduct.specifications.map((section, sectionIndex) => (
                    <div
                      key={`${section.title}-${sectionIndex}`}
                      className={sectionIndex === 0 ? 'pt-5' : 'pt-5 mt-1 border-t border-gray-200'}
                    >
                      <h3 className="mb-2 text-base font-bold text-gray-900">{section.title}</h3>
                      <div className="grid md:grid-cols-2 md:gap-x-10">
                        {section.items.map((item, itemIndex) => (
                          <div
                            key={`${item.name}-${itemIndex}`}
                            className="py-3 border-b border-gray-100 min-w-0"
                          >
                            <p className="mb-1 text-xs text-gray-500">{item.name}</p>
                            <p className="text-sm font-medium leading-5 text-gray-800 break-words">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          <div className="border-t border-gray-100 pt-6" id="review-form-anchor">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ratings and Reviews ({totalRatings})</h3>



            <div className="space-y-4">
              {reviews.map((review, idx) => (
                <div key={review.id || idx} className="border-b border-gray-100 pb-4 last:border-0 relative group">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1 bg-green-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold">
                      {review.rating} <FaStar size={8} />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{review.sentiment}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2 leading-relaxed">{review.text}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="font-medium text-gray-600">{review.author}</span>
                    {review.verified && <span className="text-green-600 flex items-center gap-0.5">Verified Buyer</span>}
                    <span className="ml-auto">{review.date}</span>
                  </div>

                  {/* Edit/Delete Actions - Allow editing for all reviews since user is likely the admin or owner in this demo context, OR add check for 'You' author/userId */}

                </div>
              ))}
            </div>
          </div>
        </div>
      </div>



      {/* Mobile Fixed Footer - Floating Box Style */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-2 bg-white border-t border-gray-100 shadow-lg">
        <div className="flex gap-2">
          <button
            onClick={handleAddToCart}
            className="flex-1 py-3 px-4 bg-white text-gray-900 font-bold border border-gray-300 rounded-md text-sm shadow-sm active:bg-gray-50 transition-colors"
          >
            Add to cart
          </button>
          <button
            onClick={handleBuyNow}
            className="flex-1 py-3 px-4 bg-[#ffc200] text-gray-900 font-bold border border-[#ffc200] rounded-md text-sm shadow-sm active:bg-[#e6af00] transition-colors"
          >
            Buy at ₹{currentProduct.price}
          </button>
        </div>
      </div>

      {/* Item Added Toast Notification (Mobile) */}
      {showCartToast && (
        <div className="md:hidden fixed bottom-20 left-4 right-4 bg-[#1a1a1a] text-white p-3 rounded-lg shadow-xl z-[60] flex items-center justify-between animate-fade-in-up">
          <span className="text-sm font-medium pl-1">Item added to cart</span>
          <button
            onClick={() => navigate('/cart')}
            className="text-[#ff9f00] font-bold text-sm bg-transparent border-none uppercase pr-1"
          >
            GO TO CART
          </button>
        </div>
      )}

    </div>
  )
}

export default ProductDetails
