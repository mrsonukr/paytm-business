import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

interface PaymentData {
  order_id: string;
  merchant_name: string;
  upi_id: string;
  amount: number;
  payment_link: string;
  qr_code_data: string;
  status: string;
}

const PaymentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (orderId) {
      fetchPaymentDetails();
    }
  }, [orderId]);

  const fetchPaymentDetails = async () => {
    try {
      const response = await fetch(`/api/payment/${orderId}`);
      const result = await response.json();

      if (result.success) {
        setPaymentData(result.data);
      } else {
        setError(result.error || 'Payment not found');
      }
    } catch (err) {
      setError('Failed to load payment details');
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = (data: string) => {
    // For now, return a placeholder URL. In production, you'd use a QR code library
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-gray-500">Loading payment details...</div>
      </div>
    );
  }

  if (error || !paymentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg max-w-md w-full">
          <div className="text-red-600 text-center">{error || 'Payment not found'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-light text-gray-900 tracking-tight">Payment</h1>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white">
          <div className="px-8 py-6 border-b border-gray-100">
            <h2 className="text-2xl font-light text-gray-900">Payment Details</h2>
            <p className="text-sm text-gray-500 mt-1">Order ID: {paymentData.order_id}</p>
          </div>
          
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column - Payment Info */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Merchant Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{paymentData.merchant_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">UPI ID:</span>
                      <span className="font-mono">{paymentData.upi_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-bold text-lg text-green-600">₹{paymentData.amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        paymentData.status === 'PENDING' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {paymentData.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Link</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-2">Share this link:</div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={paymentData.payment_link}
                        readOnly
                        className="flex-1 px-3 py-2 bg-white border-0 rounded text-sm"
                      />
                      <button
                        onClick={() => navigator.clipboard.writeText(paymentData.payment_link)}
                        className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - QR Code */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Scan to Pay</h3>
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <div className="bg-white p-4 rounded-lg inline-block">
                    <img
                      src={generateQRCode(paymentData.qr_code_data)}
                      alt="Payment QR Code"
                      className="w-48 h-48 mx-auto"
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-4">
                    Scan this QR code with any UPI app to complete the payment
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="text-center text-sm text-gray-500">
                <p>Payment initiated for Order ID: {paymentData.order_id}</p>
                <p className="mt-1">Please keep this page open until payment is completed</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaymentPage;
