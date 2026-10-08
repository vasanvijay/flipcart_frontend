import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import QRCode from "react-qr-code";
import { BASE_URL } from "../../utils/config";

const Payment = () => {
    const { state } = useLocation(); // Expecting { totalAmount } or similar
    // Fallback: Check localStorage if state is missing (legacy support)
    const [price] = useState(
        state?.totalAmount ||
        (localStorage.getItem('qty') && localStorage.getItem('price') ? localStorage.getItem('qty') * localStorage.getItem('price') : 0)
    );

    const [upiConfig, setUpiConfig] = useState({
        pa: '', // UPI ID
        pn: '', // Merchant Name
        mc: '', // Merchant Code (optional)
        tid: '', // Transaction ID
        tr: '', // Transaction Ref ID
        am: '0', // Amount
        cu: 'INR', // Currency
        tn: '', // Note/Description
        methodUpiIds: {
            phonepe: '',
            gpay: '',
            paytm: '',
            bhim: ''
        }
    });

    const [loadingConfig, setLoadingConfig] = useState(true);
    const [configError, setConfigError] = useState('');
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

    useEffect(() => {
        // Fetch Admin UPI Settings
        const fetchSettings = async () => {
            try {
                const res = await fetch(`${BASE_URL}/api/settings/payment`);
                if (!res.ok) throw new Error('Unable to load payment configuration');

                const data = await res.json();
                const defaultUpiId = typeof data.upiId === 'string' ? data.upiId.trim() : '';
                const merchantName = typeof data.merchantName === 'string' ? data.merchantName.trim() : '';

                if (!defaultUpiId || !merchantName) {
                    throw new Error('UPI payment is not configured');
                }

                const orderRef = `ORD${Date.now()}`;

                setUpiConfig(prev => ({
                    ...prev,
                    pa: defaultUpiId,
                    pn: merchantName,
                    am: price.toString(),
                    tn: `Order ${orderRef}`,
                    tr: orderRef,
                    methodUpiIds: {
                        phonepe: data.methodUpiIds?.phonepe?.trim() || '',
                        gpay: data.methodUpiIds?.gpay?.trim() || '',
                        paytm: data.methodUpiIds?.paytm?.trim() || '',
                        bhim: data.methodUpiIds?.bhim?.trim() || ''
                    }
                }));
                setLoadingConfig(false);
            } catch (err) {
                console.error("Failed to load UPI settings", err);
                setConfigError('UPI payment is temporarily unavailable. Please try again later.');
                setLoadingConfig(false);
            }
        };
        fetchSettings();
    }, [price]);

    // Construct UPI Deep Link
    // Format: upi://pay?pa=...&pn=...&am=...&cu=INR&tn=...
    const buildUpiLink = (upiId) => `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiConfig.pn)}&am=${upiConfig.am}&cu=INR&tn=${encodeURIComponent(upiConfig.tn)}`;
    const upiLink = buildUpiLink(upiConfig.pa);
    const selectedQrUpiId = selectedPaymentMethod
        ? upiConfig.methodUpiIds[selectedPaymentMethod] || upiConfig.pa
        : upiConfig.pa;
    const selectedQrLink = buildUpiLink(selectedQrUpiId);
    const paymentMethodLabels = {
        phonepe: 'PhonePe',
        gpay: 'GPay',
        paytm: 'Paytm',
        bhim: 'BHIM / UPI'
    };

    const handlePaymentMethodClick = (event, method) => {
        if (window.matchMedia('(min-width: 768px)').matches) {
            event.preventDefault();
            setSelectedPaymentMethod(method);
        }
    };

    // App Specific Deep Links (Mobile)
    const getAppLink = (appScheme) => {
        // GPay requires 'tez://upi/pay' typically, not just 'tez://pay'
        if (appScheme === 'tez://') {
            return upiLink.replace('upi://pay', 'tez://upi/pay');
        }
        return upiLink.replace('upi://', appScheme);
    };

    // Timer Logic
    const [timeLeft, setTimeLeft] = useState(
        () => Math.floor(Math.random() * (360 - 120 + 1) + 120) // Random seconds between 120 (2m) and 360 (6m)
    );

    useEffect(() => {
        if (!timeLeft) return;
        const intervalId = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(intervalId);
    }, [timeLeft]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (loadingConfig) {
        return <div className="flex h-screen items-center justify-center">Loading Payment Gateway...</div>;
    }

    if (price <= 0) {
        return <div className="p-8 text-center bg-red-50 text-red-600 font-bold">Invalid Payment Amount</div>;
    }

    if (configError) {
        return <div className="p-8 text-center bg-red-50 text-red-600 font-bold">{configError}</div>;
    }

    return (
        <div className="bg-gray-100 min-h-screen py-6 px-4 font-sans">

            {/* Amount & Timer Card */}
            <div className="max-w-md mx-auto bg-white rounded-3xl shadow-sm text-center p-8 mb-6 relative overflow-hidden">
                <p className="text-gray-500 font-bold text-xs tracking-wider uppercase mb-1">Amount to Pay</p>
                <h1 className="text-4xl font-extrabold text-gray-900 mb-8">₹{price.toLocaleString()}</h1>

                <div className="flex flex-col items-center justify-center">
                    <p className="text-gray-400 font-bold text-[10px] tracking-widest uppercase mb-1">Expires In</p>
                    <div className="text-3xl font-bold text-gray-800 tracking-wider">
                        {formatTime(timeLeft)}
                    </div>
                </div>
            </div>

            {/* UPI Methods Card */}
            <div className="max-w-md mx-auto bg-white rounded-3xl shadow-sm p-6 mb-8">
                <p className="text-center text-gray-400 font-bold text-[10px] tracking-widest uppercase mb-8">Available UPI Methods</p>

                <div className="grid grid-cols-4 gap-4">
                    {/* PhonePe */}
                    <a
                        href={getAppLink('phonepe://')}
                        onClick={(event) => handlePaymentMethodClick(event, 'phonepe')}
                        aria-label="Pay with PhonePe"
                        className="flex flex-col items-center gap-2 group"
                    >
                        <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shadow-sm group-active:scale-95 transition-all bg-white overflow-hidden ${selectedPaymentMethod === 'phonepe' ? 'border-purple-500 ring-2 ring-purple-100' : 'border-gray-200'}`}>
                            <img src="https://img.icons8.com/color/96/phone-pe.png" className="w-10 h-10 object-contain" alt="PhonePe" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase">PhonePe</span>
                    </a>

                    {/* GPay */}
                    <a
                        href={getAppLink('tez://')}
                        onClick={(event) => handlePaymentMethodClick(event, 'gpay')}
                        aria-label="Pay with Google Pay"
                        className="flex flex-col items-center gap-2 group"
                    >
                        <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shadow-sm group-active:scale-95 transition-all bg-white overflow-hidden ${selectedPaymentMethod === 'gpay' ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'}`}>
                            <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" className="w-8 h-8 object-contain" alt="GPay" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase">GPay</span>
                    </a>

                    {/* Paytm */}
                    <a
                        href={getAppLink('paytmmp://')}
                        onClick={(event) => handlePaymentMethodClick(event, 'paytm')}
                        aria-label="Pay with Paytm"
                        className="flex flex-col items-center gap-2 group"
                    >
                        <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shadow-sm group-active:scale-95 transition-all bg-white overflow-hidden ${selectedPaymentMethod === 'paytm' ? 'border-cyan-500 ring-2 ring-cyan-100' : 'border-gray-200'}`}>
                            <img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg" className="w-10 h-10 object-contain" alt="Paytm" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Paytm</span>
                    </a>

                    {/* BHIM / Generic */}
                    <a
                        href={upiLink}
                        onClick={(event) => handlePaymentMethodClick(event, 'bhim')}
                        aria-label="Pay with BHIM or another UPI app"
                        className="flex flex-col items-center gap-2 group"
                    >
                        <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shadow-sm group-active:scale-95 transition-all bg-white overflow-hidden ${selectedPaymentMethod === 'bhim' ? 'border-green-500 ring-2 ring-green-100' : 'border-gray-200'}`}>
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/1280px-UPI-Logo-vector.svg.png" className="w-12 h-12 object-contain" alt="BHIM" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase">BHIM</span>
                    </a>
                </div>
            </div>

            {/* Desktop Only QR Fallback (Hidden on Mobile) */}
            <div className="hidden md:flex justify-center mb-8">
                <div className="bg-white p-4 rounded-xl shadow-sm border text-center">
                    <p className="text-xs font-bold text-gray-500 mb-1">Scan to Pay</p>
                    <p className="h-4 mb-2 text-[10px] font-semibold text-gray-400">
                        {selectedPaymentMethod ? paymentMethodLabels[selectedPaymentMethod] : 'Any UPI App'}
                    </p>
                    <QRCode value={selectedQrLink} size={150} />
                </div>
            </div>

            {/* Footer */}
            <div className="text-center">
                <p className="text-gray-500 font-semibold text-xs mb-3">Scan QR code with any UPI App to verify payment</p>
                <div className="flex items-center justify-center gap-2 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08zm3.094 8.016a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[10px] font-bold tracking-wider uppercase">Verified by NPCI</span>
                </div>
            </div>

        </div>
    );
};

export default Payment;
