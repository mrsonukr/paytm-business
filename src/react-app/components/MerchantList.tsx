import React, { useState, useEffect } from 'react';
import { Merchant } from '../types';

interface MerchantListProps {
  onEdit: (merchant: Merchant) => void;
  onAdd: () => void;
  onCreatePayment: (merchant: Merchant) => void;
}

const MerchantList: React.FC<MerchantListProps> = ({ onEdit, onAdd, onCreatePayment }) => {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMerchants();
  }, []);

  const fetchMerchants = async () => {
    try {
      const response = await fetch('/api/merchants');
      const result = await response.json();
      
      if (result.success) {
        setMerchants(result.data);
      } else {
        setError(result.error || 'Failed to fetch merchants');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this merchant?')) {
      return;
    }

    try {
      const response = await fetch(`/api/merchants/${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMerchants(prev => prev.filter(m => m.id !== id));
      } else {
        setError(result.error || 'Failed to delete merchant');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading merchants...</div>;
  }

  return (
    <div className="bg-white">
      <div className="px-8 py-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-light text-gray-900">Merchants</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your merchant accounts</p>
        </div>
        <button onClick={onAdd} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
          Add Merchant
        </button>
      </div>

      {error && (
        <div className="mx-8 mt-4 bg-red-50 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {merchants.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-gray-500 text-lg font-light">No merchants found</p>
          <p className="text-gray-400 mt-2">Click "Add Merchant" to get started</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Merchant Name</th>
                <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UPI ID</th>
                <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Merchant Key</th>
                <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {merchants.map((merchant) => (
                <tr key={merchant.id!} className="hover:bg-gray-50 transition-colors">
                  <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{merchant.id!}</td>
                  <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-900">{merchant.merchant_name}</td>
                  <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-600">{merchant.mobile_no}</td>
                  <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-600">{merchant.upi_id}</td>
                  <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">{merchant.merchant_key || ''}</td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        merchant.status ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <span className={`text-sm font-medium ${
                        merchant.status ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {merchant.status ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(merchant.created_at)}</td>
                  <td className="px-8 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onEdit(merchant)}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onCreatePayment(merchant)}
                        className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium"
                      >
                        Payment
                      </button>
                      <button
                        onClick={() => handleDelete(merchant.id!)}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MerchantList;
