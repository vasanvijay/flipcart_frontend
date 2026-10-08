import React, { useEffect, useMemo, useState } from 'react'
import { readCart, writeCart, removeCartItem, clearCart } from '../../utils/cart'
import { BASE_URL } from '../../utils/config'
import { Link } from 'react-router-dom'

const CartDrawer = ({ open, onClose }) => {
  const [items, setItems] = useState(readCart())
  const [productCache, setProductCache] = useState({});

  useEffect(() => {
    const handler = () => setItems(readCart())
    window.addEventListener('cart:updated', handler)
    return () => window.removeEventListener('cart:updated', handler)
  }, [])

  // Fetch product details for items in cart
  useEffect(() => {
    const fetchMissingProducts = async () => {
      const missingIds = items.map(i => i.productId).filter(id => productCache[id] === undefined);
      if (missingIds.length === 0) return;

      const newCache = { ...productCache };
      let hasChanges = false;
      let itemsToRemove = [];

      await Promise.all(missingIds.map(async (id) => {
        try {
          const res = await fetch(`${BASE_URL}/api/products/${id}`);
          if (res.ok) {
            const p = await res.json();
            // Normalize image
            let images = [];
            if (Array.isArray(p.images)) images = p.images;
            else if (typeof p.images === 'string') {
              try {
                const parsed = JSON.parse(p.images);
                images = Array.isArray(parsed) ? parsed : [p.images];
              } catch (e) { images = [p.images]; }
            }
            else images = [''];
            newCache[id] = { ...p, image: images };
          } else if (res.status === 404) {
            // Product deleted/missing -> Remove from cart
            itemsToRemove.push(id);
            newCache[id] = null; // Mark as null so we don't retry immediately if removal lags
          } else {
            newCache[id] = null; // Mark as failed to prevent infinite loop
          }
          hasChanges = true;
        } catch (e) {
          console.error("Error loading cart product", id, e);
          newCache[id] = null; // Prevent retry
          hasChanges = true;
        }
      }));

      if (hasChanges) {
        setProductCache(newCache);
      }

      if (itemsToRemove.length > 0) {
        itemsToRemove.forEach(id => removeCartItem(id));
        // Force update local state if needed, although event listener should catch it
        // setItems(readCart()); 
      }
    };

    if (items.length > 0) {
      fetchMissingProducts();
    }
  }, [items, productCache]);

  const enriched = useMemo(() => {
    return items
      .map(it => {
        const product = productCache[it.productId];
        return product ? { ...it, product } : null;
      })
      .filter(Boolean)
  }, [items, productCache])

  const updateQty = (productId, delta) => {
    const next = items.map(i => i.productId === productId ? { ...i, qty: Math.max(1, i.qty + delta) } : i)
    setItems(next)
    writeCart(next)
  }

  const removeItem = (productId) => {
    removeCartItem(productId)
    setItems(readCart())
  }

  const totals = useMemo(() => {
    const subtotal = enriched.reduce((sum, it) => sum + it.qty * (it.price ?? it.product.price), 0)
    return { subtotal, total: subtotal }
  }, [enriched])

  return (
    <div className={`fixed inset-0 z-[70] ${open ? '' : 'pointer-events-none'}`}>
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transition-transform ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Your Cart</h3>
          <button onClick={onClose} className="text-gray-600">✕</button>
        </div>

        <div className="p-4 overflow-y-auto h-[calc(100%-160px)]">
          {enriched.length === 0 ? (
            <div className="text-center text-gray-600 mt-10">
              {items.length > 0 ? "Loading cart items..." : "Your cart is empty"}
            </div>
          ) : (
            enriched.map(({ productId, qty, price, product }) => (
              <div key={productId} className="border border-slate-200 rounded mb-3 p-3 flex gap-3">
                <img src={product.image?.[0]} className="w-16 h-16 object-contain bg-gray-50 rounded" alt="" />
                <div className="flex-1">
                  <div className="text-sm font-semibold line-clamp-2">{product.title}</div>
                  <div className="text-sm text-gray-600">₹{price ?? product.price}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <button className="px-2 py-1 border" onClick={() => updateQty(productId, -1)}>-</button>
                    <span className="px-3">{qty}</span>
                    <button className="px-2 py-1 border" onClick={() => updateQty(productId, 1)}>+</button>
                    <button className="ml-4 text-red-600 text-sm" onClick={() => removeItem(productId)}>Remove</button>
                  </div>
                </div>
                <div className="text-right font-semibold">₹{(qty * (price ?? product.price)).toFixed(2)}</div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t bg-white">
          <div className="flex items-center justify-between mb-3 text-sm">
            <span className="font-semibold">Subtotal</span>
            <span className="font-semibold">₹{totals.total.toFixed(2)}</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { clearCart(); setItems([]) }}
              className="px-3 py-2 border rounded text-sm"
            >
              Clear
            </button>
            <Link
              to="/cart"
              onClick={onClose}
              className="flex-1 text-center px-3 py-2 border rounded text-sm"
            >
              View Cart
            </Link>
            <Link
              to="/checkout"
              onClick={onClose}
              className="flex-1 text-center bg-[#fb641b] text-white px-3 py-2 rounded text-sm font-semibold"
            >
              Checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartDrawer


