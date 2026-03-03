import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MerchantList from "./components/MerchantList";
import MerchantForm from "./components/MerchantForm";
import PaymentForm from "./components/PaymentForm";
import PaymentPage from "./components/PaymentPage";
import { Merchant } from "./types";

type View = 'list' | 'form' | 'payment' | null;

function App() {
  const [currentView, setCurrentView] = useState<View>('list');
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);
  const [paymentMerchant, setPaymentMerchant] = useState<Merchant | null>(null);

  const handleAddMerchant = () => {
    setEditingMerchant(null);
    setCurrentView('form');
  };

  const handleEditMerchant = (merchant: Merchant) => {
    setEditingMerchant(merchant);
    setCurrentView('form');
  };

  const handleCreatePayment = (merchant: Merchant) => {
    if (merchant.id) {
      setPaymentMerchant(merchant);
      setCurrentView('payment');
    }
  };

  const handleSaveMerchant = () => {
    setEditingMerchant(null);
    setCurrentView('list');
  };

  const handleSavePayment = (payment: any) => {
    // Redirect to payment page with the payment ID instead of order ID
    window.open(`/payment/${payment.payment_id}`, '_blank');
    setPaymentMerchant(null);
    setCurrentView('list');
  };

  const handleCancelForm = () => {
    setEditingMerchant(null);
    setPaymentMerchant(null);
    setCurrentView('list');
  };

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <header className="bg-white">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-light text-gray-900 tracking-tight">Paytm Business</h1>
            <p className="text-gray-500 mt-1">Merchant Management System</p>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={
              currentView === 'list' ? (
                <MerchantList
                  onEdit={handleEditMerchant}
                  onAdd={handleAddMerchant}
                  onCreatePayment={handleCreatePayment}
                />
              ) : currentView === 'form' ? (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white w-full max-w-2xl">
                    <MerchantForm
                      merchant={editingMerchant || undefined}
                      onSave={handleSaveMerchant}
                      onCancel={handleCancelForm}
                    />
                  </div>
                </div>
              ) : currentView === 'payment' && paymentMerchant ? (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white w-full max-w-2xl">
                    <PaymentForm
                      merchant={paymentMerchant}
                      onSave={handleSavePayment}
                      onCancel={handleCancelForm}
                    />
                  </div>
                </div>
              ) : null
            } />
            <Route path="/payment/:order_id" element={<PaymentPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
