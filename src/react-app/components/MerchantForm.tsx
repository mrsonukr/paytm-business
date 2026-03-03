import React, { useState } from 'react';

interface Merchant {
  id?: number;
  merchant_name: string;
  mobile_no: string;
  upi_id: string;
  merchant_key: string;
  status: number;
  created_at?: string;
  updated_at?: string;
}

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
    <div className="merchant-form">
      <h2>{merchant?.id ? 'Edit Merchant' : 'Add New Merchant'}</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="merchant_name">Merchant Name</label>
          <input
            type="text"
            id="merchant_name"
            name="merchant_name"
            value={formData.merchant_name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="mobile_no">Mobile Number</label>
          <input
            type="tel"
            id="mobile_no"
            name="mobile_no"
            value={formData.mobile_no}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="upi_id">UPI ID</label>
          <input
            type="text"
            id="upi_id"
            name="upi_id"
            value={formData.upi_id}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="merchant_key">Merchant Key</label>
          <input
            type="text"
            id="merchant_key"
            name="merchant_key"
            value={formData.merchant_key}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn-cancel">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : (merchant?.id ? 'Update' : 'Save')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MerchantForm;
