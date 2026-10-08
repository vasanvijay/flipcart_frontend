import React, { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [totalAmount, setTotalAmount] = useState(0);

    // Load from localStorage on mount
    useEffect(() => {
        const loadCart = () => {
            const savedCart = localStorage.getItem('cartItems');
            if (savedCart) {
                try {
                    const parsed = JSON.parse(savedCart);
                    setCartItems(parsed);
                } catch (e) {
                    console.error("Failed to parse cart", e);
                    setCartItems([]);
                }
            }
        };
        loadCart();

        // Listen for storage events (compatibility with partial implementations)
        window.addEventListener('storage', loadCart);
        return () => window.removeEventListener('storage', loadCart);
    }, []);

    // Calculate total whenever cart changes
    useEffect(() => {
        const total = cartItems.reduce((sum, item) => {
            // Handle both structure types if necessary, though standardized is better
            const price = item.price || item.product?.price || 0;
            const qty = item.qty || 1;
            return sum + (price * qty);
        }, 0);
        setTotalAmount(total);
    }, [cartItems]);

    const addToCart = (product, qty = 1) => {
        setCartItems(prev => {
            const existingIdx = prev.findIndex(item => item.productId === product.id);
            let newCart;
            if (existingIdx >= 0) {
                newCart = [...prev];
                newCart[existingIdx].qty += qty;
            } else {
                newCart = [...prev, {
                    productId: product.id,
                    qty,
                    price: product.price,
                    title: product.title,
                    image: product.image
                }]; // Storing minimal details
            }
            localStorage.setItem('cartItems', JSON.stringify(newCart));
            // Also update legacy keys if needed by other components
            // localStorage.setItem('qty', qty); 
            return newCart;
        });
    };

    const removeFromCart = (productId) => {
        setCartItems(prev => {
            const newCart = prev.filter(item => item.productId !== productId);
            localStorage.setItem('cartItems', JSON.stringify(newCart));
            return newCart;
        });
    };

    const clearCart = () => {
        setCartItems([]);
        localStorage.removeItem('cartItems');
    };

    return (
        <CartContext.Provider value={{ cartItems, totalAmount, addToCart, removeFromCart, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};
