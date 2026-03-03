import React, { useState, useEffect } from 'react';

interface Merchant {
  id: number;
  merchant_name: string;
  mobile_no: string;
  upi_id: string;
  merchant_key: string;
  status: number;
  created_at: string;
  updated_at: string;
}

interface MerchantListProps {
  onEdit: (merchant: Merchant) => void;
  onAdd: () => void;
}

const MerchantList: React.FC<MerchantListProps> = ({ onEdit, onAdd }) => {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <div className="loading">Loading merchants...</div>;
  }

  return (
    <div className="merchant-list">
      <div className="list-header">
        <h2>Merchants</h2>
        <button onClick={onAdd} className="btn-primary">
          Add New Merchant
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {merchants.length === 0 ? (
        <div className="empty-state">
          <p>No merchants found. Click "Add New Merchant" to get started.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="merchants-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Merchant Name</th>
                <th>Mobile Number</th>
                <th>UPI ID</th>
                <th>Merchant Key</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {merchants.map((merchant) => (
                <tr key={merchant.id}>
                  <td>{merchant.id}</td>
                  <td>{merchant.merchant_name}</td>
                  <td>{merchant.mobile_no}</td>
                  <td>{merchant.upi_id}</td>
                  <td>{merchant.merchant_key}</td>
                  <td>
                    <span className={`status-badge ${merchant.status ? 'active' : 'inactive'}`}>
                      {merchant.status ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{formatDate(merchant.created_at)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => onEdit(merchant)}
                        className="btn-edit"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(merchant.id)}
                        className="btn-delete"
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
