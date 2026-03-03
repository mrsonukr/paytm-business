import React, { useState } from 'react';
import ToggleSwitch from './ToggleSwitch';
import { Merchant } from '../types';

interface MerchantFormProps {
  merchant?: Merchant;
  onSave: (merchant: Merchant) => void;
  onCancel: () => void;
}

const MerchantForm: React.FC<MerchantFormProps> = ({ merchant, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Merchant>({
    merchant_name: '',
    mobile_no: '',
    upi_id: '',
    merchant_key: '',
    status: 0,
    ...merchant
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'status' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = merchant?.id 
        ? `/api/merchants/${merchant.id}`
        : '/api/merchants';
      
      const method = merchant?.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        onSave(result.data);
      } else {
        setError(result.error || 'Failed to save merchant');
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
        <h2 className="text-2xl font-light text-gray-900">
          {merchant?.id ? 'Edit Merchant' : 'Add New Merchant'}
        </h2>
      </div>
      
      {error && (
        <div className="mx-8 mt-4 bg-red-50 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="merchant_name" className="block text-sm font-medium text-gray-700 mb-2">
              Merchant Name
            </label>
            <input
              type="text"
              id="merchant_name"
              name="merchant_name"
              value={formData.merchant_name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              placeholder="Enter merchant name"
            />
          </div>

          <div>
            <label htmlFor="mobile_no" className="block text-sm font-medium text-gray-700 mb-2">
              Mobile Number
            </label>
            <input
              type="tel"
              id="mobile_no"
              name="mobile_no"
              value={formData.mobile_no}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              placeholder="Enter mobile number"
            />
          </div>

          <div>
            <label htmlFor="upi_id" className="block text-sm font-medium text-gray-700 mb-2">
              UPI ID
            </label>
            <input
              type="text"
              id="upi_id"
              name="upi_id"
              value={formData.upi_id}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              placeholder="Enter UPI ID"
            />
          </div>

          <div>
            <label htmlFor="merchant_key" className="block text-sm font-medium text-gray-700 mb-2">
              Merchant Key
            </label>
            <input
              type="text"
              id="merchant_key"
              name="merchant_key"
              value={formData.merchant_key}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              placeholder="Enter merchant key"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <ToggleSwitch
              checked={formData.status === 1}
              onChange={(checked) => setFormData(prev => ({ ...prev, status: checked ? 1 : 0 }))}
            />
            <span className="text-sm text-gray-500">
              {formData.status === 1 ? 'Active' : 'Inactive'}
            </span>
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
            {loading ? 'Saving...' : (merchant?.id ? 'Update' : 'Save')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MerchantForm;
