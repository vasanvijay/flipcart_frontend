import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaTimesCircle, FaHome, FaRedo } from 'react-icons/fa';

const PaymentFailure = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [errorDetails, setErrorDetails] = useState(null);
    
    useEffect(() => {
        // Get PayU response parameters from URL
        const txnid = searchParams.get('txnid');
        const status = searchParams.get('status');
        const error = searchParams.get('error');
        const errorMessage = searchParams.get('error_Message');
        
        if (txnid || status || error) {
            setErrorDetails({
                txnid: txnid || 'N/A',
                status: status || 'failure',
                error: error || 'Payment failed',
                errorMessage: errorMessage || 'Your payment could not be processed. Please try again.'
            });
        }
    }, [searchParams]);

    const handleRetryPayment = () => {
        navigate('/payment');
    };

    const handleGoHome = () => {
        navigate('/');
    };

    return (
        <div className="bg-gray-200 font-sans min-h-screen">
            <div className="container mx-auto px-4 py-8">
                {/* Failure Icon and Message */}
                <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="mb-6">
                        <FaTimesCircle className="text-red-500 text-6xl mx-auto mb-4" />
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                            Payment Failed
                        </h1>
                        <p className="text-gray-600 text-lg">
                            We're sorry, but your payment could not be processed.
                        </p>
                    </div>

                    {/* Error Details Card */}
                    {errorDetails && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6 text-left">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-red-300">
                                Error Details
                            </h2>
                            
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Transaction ID:</span>
                                    <span className="font-semibold text-gray-800">{errorDetails.txnid}</span>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Status:</span>
                                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                                        Failed
                                    </span>
                                </div>
                                
                                <div className="pt-2 border-t border-red-300">
                                    <p className="text-red-700 font-medium">{errorDetails.errorMessage}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Information Message */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-yellow-800">
                            <strong>What happened?</strong> Your payment was not completed. This could be due to:
                        </p>
                        <ul className="text-sm text-yellow-700 mt-2 text-left list-disc list-inside space-y-1">
                            <li>Insufficient funds in your account</li>
                            <li>Incorrect card/bank details</li>
                            <li>Network connectivity issues</li>
                            <li>Transaction timeout</li>
                        </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={handleRetryPayment}
                            className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-105"
                        >
                            <FaRedo className="text-lg" />
                            Retry Payment
                        </button>
                        
                        <button
                            onClick={handleGoHome}
                            className="flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-gray-800 font-bold py-3 px-6 rounded-lg border-2 border-gray-300 transition duration-200 ease-in-out"
                        >
                            <FaHome className="text-lg" />
                            Go to Home
                        </button>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <p className="text-sm text-gray-500">
                            Need help? Contact us at <a href="mailto:support@example.com" className="text-orange-600 hover:underline">support@example.com</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentFailure;


