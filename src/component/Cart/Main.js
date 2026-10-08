import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BASE_URL } from '../../utils/config'

const getCartItems = () => {
  const raw = localStorage.getItem('cartItems')
  if (!raw) return []
  try { return JSON.parse(raw) || [] } catch { return [] }
}

const setCartItems = items => {
  localStorage.setItem('cartItems', JSON.stringify(items))
}

const normalizeProduct = (p) => {
  // Ensure numeric fields
  const price = Number(p.price) || 0;
  const cancelprice = Number(p.cancelprice) || (price * 1.5);

  // Ensure image array
  let images = [];
  if (Array.isArray(p.images)) images = p.images;
  else if (Array.isArray(p.image)) images = p.image;
  else if (typeof p.image === 'string') images = [p.image];
  else images = [''];

  return { ...p, price, cancelprice, image: images };
}

const Cart = () => {
  const [items, setItems] = useState(getCartItems())
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(BASE_URL + '/api/products');
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        }
      } catch (err) {
        console.error("Failed to fetch products for cart:", err);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    setItems(getCartItems())
  }, [])

  const enriched = useMemo(() => {
    if (products.length === 0) return [];
    return items
      .map(it => {
        const product = products.find(p => p.id === it.productId);
        if (!product) return null;
        return { ...it, product: normalizeProduct(product) };
      })
      .filter(it => it !== null)
  }, [items, products])

  const totals = useMemo(() => {
    const rawTotal = enriched.reduce((sum, it) => sum + (it.product.cancelprice || it.product.price * 1.5) * it.qty, 0); // Fake original price
    const subtotal = enriched.reduce((sum, it) => sum + it.qty * (it.price ?? it.product.price), 0)
    const discount = rawTotal - subtotal;
    const packagingFee = 0; // Made free as per request
    const finalTotal = subtotal + packagingFee;
    return { rawTotal, subtotal, discount, packagingFee, finalTotal }
  }, [enriched])


  const updateQty = (productId, delta) => {
    setItems(prev => {
      let next = prev.map(i => i.productId === productId ? { ...i, qty: i.qty + delta } : i)
      // Check if any item has qty < 1, if so filter it out (remove)
      next = next.filter(i => i.qty > 0)
      setCartItems(next)
      return next
    })
  }

  const removeItem = productId => {
    setItems(prev => {
      const next = prev.filter(i => i.productId !== productId)
      setCartItems(next)
      return next
    })
  }

  if (enriched.length === 0) {
    return (
      <div className="min-h-[75vh] px-4 py-8 flex flex-col items-center justify-center">
        <img src="https://rukminim1.flixcart.com/www/800/800/promos/16/05/2019/d438a32e-765a-4d8b-b4a6-520b560971e8.png" className="w-48 mb-4 object-contain" alt="Empty Cart" />
        <div className="text-lg font-semibold mb-2">Missing Cart items?</div>
        <div className="text-sm text-gray-500 mb-6">Login to see the items you added previously</div>
        <Link to="/" className="bg-[#fb641b] text-white px-12 py-3 rounded-sm font-medium shadow-sm uppercase text-sm">Shop Now</Link>
      </div>
    )
  }

  return (
    <div className="min-h-[90vh] bg-[#f1f3f6] pb-24 md:pb-8 pt-2">
      <div className="container mx-auto max-w-6xl md:flex md:gap-4 md:px-2">

        {/* Left Column: Cart Items */}
        <div className="md:w-2/3">
          {/* Top Tabs (Mobile Simulation) */}
          <div className="bg-white flex mb-2 shadow-sm md:hidden">
            <div className="flex-1 text-center py-3 border-b-2 border-blue-600 text-blue-600 font-medium text-sm">Flipkart ({enriched.length})</div>
            <div className="flex-1 text-center py-3 border-b border-gray-200 text-gray-800 font-medium text-sm">Grocery</div>
          </div>

          {/* Address Strip (Mock) */}
          <div className="bg-white p-3 mb-2 shadow-sm flex justify-between items-center md:rounded-sm">
            <div className="text-sm">Deliver to: <span className="font-semibold text-gray-800">User, 395006</span></div>
            <button className="text-blue-600 border border-gray-200 px-3 py-1 rounded text-xs font-medium uppercase bg-white shadow-sm">Change</button>
          </div>

          {/* Cart Items List */}
          <div className="bg-white shadow-sm md:rounded-sm">
            {enriched.map(({ productId, qty, price, product }) => {
              const originalPrice = product.cancelprice || Math.round(product.price * 1.5);
              const offPercent = Math.round(((originalPrice - product.price) / originalPrice) * 100);

              return (
                <div key={productId} className="flex flex-col p-4 border-b border-gray-100 last:border-0 relative">
                  <div className="flex gap-4">
                    <div className="w-20 h-24 shrink-0 flex items-center justify-center">
                      <img src={product.image?.[0]} className="max-h-full max-w-full object-contain" alt="" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-[15px] text-gray-900 line-clamp-1 mb-1">{product.title}</div>
                      <div className="text-xs text-gray-500 mb-2">Seller: RetailNet <img src="https://static-assets-web.flixcart.com/fk-p-linchpin-web/fk-cp-zion/img/fa_62673a.png" className="h-4 inline ml-1" alt="Assured" /></div>

                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-gray-400 line-through text-sm">₹{originalPrice.toLocaleString()}</span>
                        <span className="font-bold text-lg text-gray-900">₹{(price ?? product.price).toLocaleString()}</span>
                        <span className="text-green-600 text-sm font-semibold">{offPercent}% Off</span>
                        <span className="text-green-600 text-sm font-semibold">1 offer applied</span>
                      </div>
                    </div>
                  </div>

                  {/* Qty & Remove Actions */}
                  <div className="flex gap-6 mt-3 items-center">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQty(productId, -1)}
                        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600"
                      >-</button>
                      <div className="w-10 text-center border-gray-200 text-sm font-semibold">{qty}</div>
                      <button
                        onClick={() => updateQty(productId, 1)}
                        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600"
                      >+</button>
                    </div>
                    <button onClick={() => removeItem(productId)} className="font-semibold text-[14px] uppercase text-gray-800 hover:text-blue-600 ml-2">Remove</button>
                    <button className="font-semibold text-[14px] uppercase text-gray-800 hover:text-blue-600 ml-2 border-l border-gray-300 pl-4 hidden md:block">Save for later</button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Mobile Place Order Button (Inside Left Col for Desktop flow, but hidden on Mobile to use Sticky) */}
          <div className="hidden md:flex justify-end bg-white p-4 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] sticky bottom-0 z-10 border-t border-gray-100 mt-2">
            <Link to="/checkout" className="bg-[#fb641b] text-white font-medium text-base px-16 py-3 rounded-sm shadow-sm uppercase tracking-wide">
              Place Order
            </Link>
          </div>
        </div>

        {/* Right Column: Price Details */}
        <div className="md:w-1/3 mt-4 md:mt-0">
          <div className="bg-white shadow-sm rounded-xl md:rounded-sm mx-3 md:mx-0 p-0 sticky top-20 overflow-hidden">
            <h3 className="text-gray-500 font-bold uppercase text-[13px] border-b border-gray-100 p-4">Price Details</h3>

            <div className="space-y-4 px-4 pt-4 pb-2 text-[15px]">
              <div className="flex justify-between">
                <span>Price ({enriched.length} item)</span>
                <span>₹{totals.rawTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount</span>
                <span className="text-green-600">- ₹{(totals.discount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charges</span>
                <span className="text-green-600">Free</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  Protect Promise Fee
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="#878787" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16ZM8 14.4C11.5346 14.4 14.4 11.5346 14.4 8C14.4 4.46538 11.5346 1.6 8 1.6C4.46538 1.6 1.6 4.46538 1.6 8C1.6 11.5346 4.46538 14.4 8 14.4ZM8 4C8.55228 4 9 4.44772 9 5V8C9 8.55228 8.55228 9 8 9C7.44772 9 7 8.55228 7 8V5C7 4.44772 7.44772 4 8 4ZM8 12C8.55228 12 9 11.5523 9 11C9 10.4477 8.55228 10 8 10C7.44772 10 7 10.4477 7 11C7 11.5523 7.44772 12 8 12Z" /></svg>
                </div>
                <span className="text-green-600">Free</span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-200 p-4">
              <div className="flex justify-between font-bold text-lg">
                <span>Total Amount</span>
                <span>₹{totals.finalTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-green-50 text-green-700 font-semibold text-[13px] py-3 px-4 border-t border-green-100 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M8 0L10.3511 5.23607L16 5.83579L11.75 9.61803L13.0031 15.2361L8 12.3511L2.99691 15.2361L4.25 9.61803L0 5.83579L5.64886 5.23607L8 0Z" /></svg>
              You will save ₹{totals.discount.toLocaleString()} on this order!
            </div>
          </div>

          <div className="mx-4 md:mx-0 mt-4 flex items-start gap-3 p-2 text-[12px] text-gray-500">
            <img src="/shield_icon.png" className="h-6 w-auto mt-0.5 object-contain" alt="Secure" />
            <div className="leading-tight">
              <span className="font-semibold text-gray-700">Safe and secure payments.</span> Easy returns. 100% Authentic products.
            </div>
          </div>
        </div>

      </div>

      {/* Mobile Sticky Footer Buttons - MATCHING SCREENSHOT */}
      <div className="fixed bottom-[60px] left-0 right-0 md:hidden z-40 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
        {/* Green Savings Strip */}
        <div className="bg-[#effcf5] text-[#26a541] text-[13px] text-center py-2 font-medium border-t border-gray-100 flex items-center justify-center gap-1">
          <img src="https://static-assets-web.flixcart.com/fk-p-linchpin-web/fk-cp-zion/img/shield_b33d0c.svg" className="h-4 w-4 hidden" alt="" /> {/* Hidden shield in strip, using generic text per screenshot */}
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M8 0L10.3511 5.23607L16 5.83579L11.75 9.61803L13.0031 15.2361L8 12.3511L2.99691 15.2361L4.25 9.61803L0 5.83579L5.64886 5.23607L8 0Z" /></svg>
          You'll save ₹{totals.discount.toLocaleString()} on this order!
        </div>

        {/* Main Footer Content */}
        <div className="flex items-center justify-between p-3 border-t border-gray-100">
          <div className="flex flex-col pl-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 line-through text-[13px]">₹{totals.rawTotal.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-[18px] text-gray-900">₹{totals.finalTotal.toLocaleString()}</span>
              <span className="text-gray-400 text-[10px] border border-gray-400 rounded-full w-3.5 h-3.5 flex items-center justify-center cursor-pointer">i</span>
            </div>
          </div>
          <Link to="/checkout" className="bg-[#ffc200] text-gray-900 font-bold text-[15px] px-12 py-3 rounded-[4px] shadow-sm">
            Place Order
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Cart