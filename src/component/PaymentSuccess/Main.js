import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaCheckCircle, FaHome, FaShoppingBag } from 'react-icons/fa';
import { BASE_URL } from '../../utils/config';

const PaymentSuccess = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [orderDetails, setOrderDetails] = useState(null);
    const [productDetails, setProductDetails] = useState(null);

    useEffect(() => {
        // Fetch product details if ID exists in local storage
        const fetchProduct = async () => {
            const pid = localStorage.getItem('id');
            if (pid) {
                try {
                    const response = await fetch(`${BASE_URL}/api/products/${pid}`);
                    if (response.ok) {
                        const product = await response.json();
                        // Normalize image
                        let image = '';
                        if (Array.isArray(product.images) && product.images.length > 0) image = product.images[0];
                        else if (typeof product.images === 'string') {
                            try {
                                const parsed = JSON.parse(product.images);
                                image = Array.isArray(parsed) ? parsed[0] : product.images;
                            } catch (e) { image = product.images; }
                        }
                        setProductDetails({ ...product, image });
                    }
                } catch (err) {
                    console.error("Error fetching product details", err);
                }
            }
        };
        fetchProduct();
    }, []);

    useEffect(() => {
        // Get PayU response parameters from URL (PayU redirects with GET parameters)
        const txnid = searchParams.get('txnid');
        const status = searchParams.get('status');
        const amount = searchParams.get('amount');
        const productinfo = searchParams.get('productinfo');
        const firstname = searchParams.get('firstname');
        const email = searchParams.get('email');
        const phone = searchParams.get('phone');
        const mihpayid = searchParams.get('mihpayid'); // PayU transaction ID

        // Calculate price from localStorage if not in URL
        const calculatedPrice = localStorage.getItem('qty') && localStorage.getItem('price')
            ? (parseFloat(localStorage.getItem('qty')) * parseFloat(localStorage.getItem('price'))).toFixed(2)
            : '0'; // Default to 0 if not found, will rely on API data if needed but usually flow comes from checkout

        // Set order details from URL params or fallback to localStorage
        setOrderDetails({
            txnid: txnid || mihpayid || `TXN${Date.now()}`,
            status: status || 'success',
            amount: amount || calculatedPrice,
            productinfo: productinfo || (productDetails ? productDetails.title : 'Product'),
            firstname: firstname || localStorage.getItem('fname') || 'Customer',
            email: email || '',
            phone: phone || localStorage.getItem('phone') || ''
        });
    }, [searchParams, productDetails]);

    const handleContinueShopping = () => {
        navigate('/');
    };

    return (
        <div className="bg-gray-200 font-sans min-h-screen">
            <div className="container mx-auto px-4 py-8">
                {/* Success Icon and Message */}
                <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="mb-6">
                        <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                            Payment Successful!
                        </h1>
                        <p className="text-gray-600 text-lg">
                            Thank you for your purchase. Your order has been confirmed.
                        </p>
                    </div>

                    {/* Order Details Card */}
                    {orderDetails && (
                        <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-300">
                                Order Details
                            </h2>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Transaction ID:</span>
                                    <span className="font-semibold text-gray-800">{orderDetails.txnid}</span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Product:</span>
                                    <span className="font-semibold text-gray-800">{orderDetails.productinfo}</span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Amount Paid:</span>
                                    <span className="font-bold text-orange-600 text-lg">₹{orderDetails.amount}</span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Customer Name:</span>
                                    <span className="font-semibold text-gray-800">{orderDetails.firstname}</span>
                                </div>

                                {orderDetails.phone && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Phone:</span>
                                        <span className="font-semibold text-gray-800">{orderDetails.phone}</span>
                                    </div>
                                )}

                                <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                                    <span className="text-gray-600">Status:</span>
                                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                                        ✓ Confirmed
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Information Message */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-blue-800">
                            <strong>What's Next?</strong> You will receive an order confirmation email shortly.
                            Our team will process your order and you'll receive updates on your registered email/phone.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={handleContinueShopping}
                            className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-105"
                        >
                            <FaHome className="text-lg" />
                            Continue Shopping
                        </button>

                        <button
                            onClick={() => navigate('/cart')}
                            className="flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-gray-800 font-bold py-3 px-6 rounded-lg border-2 border-gray-300 transition duration-200 ease-in-out"
                        >
                            <FaShoppingBag className="text-lg" />
                            View Orders
                        </button>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <p className="text-sm text-gray-500">
                            Need help? Contact us at <a href="mailto:support@example.com" className="text-orange-600 hover:underline">support@example.com</a>
                        </p>
                    </div>
                </div>

                {/* Order Summary Card (if product data available) */}
                {productDetails && (
                    <div className="max-w-2xl mx-auto mt-6 bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Summary</h2>
                        <div className="flex gap-4">
                            <img
                                src={productDetails.image}
                                alt={productDetails.title}
                                className="w-32 h-32 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-800 mb-2">{productDetails.title}</h3>
                                <div className="space-y-1 text-sm text-gray-600">
                                    <p>Quantity: {localStorage.getItem('qty') || 1}</p>
                                    {localStorage.getItem('size') && <p>Size: {localStorage.getItem('size')}</p>}
                                    <p className="text-lg font-bold text-orange-600 mt-2">
                                        ₹{orderDetails?.amount || productDetails.price}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentSuccess;

