import { useState } from "react";
import MerchantList from "./components/MerchantList";
import MerchantForm from "./components/MerchantForm";
import "./App.css";

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

type View = 'list' | 'form' | null;

function App() {
  const [currentView, setCurrentView] = useState<View>('list');
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);

  const handleAddMerchant = () => {
    setEditingMerchant(null);
    setCurrentView('form');
  };

  const handleEditMerchant = (merchant: Merchant) => {
    setEditingMerchant(merchant);
    setCurrentView('form');
  };

  const handleSaveMerchant = () => {
    setEditingMerchant(null);
    setCurrentView('list');
  };

  const handleCancelForm = () => {
    setEditingMerchant(null);
    setCurrentView('list');
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Paytm Business - Merchant Management</h1>
      </header>
      
      <main className="app-main">
        {currentView === 'list' && (
          <MerchantList
            onEdit={handleEditMerchant}
            onAdd={handleAddMerchant}
          />
        )}
        
        {currentView === 'form' && (
          <MerchantForm
            merchant={editingMerchant || undefined}
            onSave={handleSaveMerchant}
            onCancel={handleCancelForm}
          />
        )}
      </main>
    </div>
  );
}

export default App;
