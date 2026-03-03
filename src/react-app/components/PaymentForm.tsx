import React, { useState } from 'react';
import { Merchant } from '../types';

interface PaymentFormProps {
  merchant: Merchant;
  onSave: (payment: any) => void;
  onCancel: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ merchant, onSave, onCancel }) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchant_id: merchant.id,
          amount: parseFloat(amount),
        }),
      });

      const result = await response.json();

      if (result.success) {
        onSave(result.data);
      } else {
        setError(result.error || 'Failed to create payment');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white">
      <div className="px-8 py-6 border-b border-gray-100">
        <h2 className="text-2xl font-light text-gray-900">Create Payment Link</h2>
        <p className="text-sm text-gray-500 mt-1">Merchant: {merchant.merchant_name}</p>
      </div>
      
      {error && (
        <div className="mx-8 mt-4 bg-red-50 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount (₹)
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              step="0.01"
              min="1"
              className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              placeholder="Enter amount"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Merchant Details
            </label>
            <div className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg text-gray-600">
              <div className="font-medium">{merchant.merchant_name}</div>
              <div className="text-sm">{merchant.upi_id}</div>
              <div className="text-sm">{merchant.mobile_no}</div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6">
          <button 
            type="button" 
            onClick={onCancel} 
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading} 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors font-medium"
          >
            {loading ? 'Creating...' : 'Create Payment Link'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentForm;
