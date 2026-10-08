export const CART_KEY = 'cartItems'

export const readCart = () => {
  const raw = localStorage.getItem(CART_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const writeCart = (items) => {
  localStorage.setItem(CART_KEY, JSON.stringify(items))
  notifyCartUpdated()
}

export const getCartCount = () => {
  return readCart().reduce((sum, it) => sum + (it.qty || 0), 0)
}

export const upsertCartItem = (productId, qty, price) => {
  const items = readCart()
  const idx = items.findIndex(i => i.productId === productId)
  if (idx >= 0) {
    items[idx].qty = (items[idx].qty || 0) + qty
    if (items[idx].qty <= 0) items.splice(idx, 1)
  } else if (qty > 0) {
    items.push({ productId, qty, price })
  }
  writeCart(items)
}

export const removeCartItem = (productId) => {
  const items = readCart().filter(i => i.productId !== productId)
  writeCart(items)
}

export const clearCart = () => {
  writeCart([])
}

export const notifyCartUpdated = () => {
  window.dispatchEvent(new CustomEvent('cart:updated'))
}


