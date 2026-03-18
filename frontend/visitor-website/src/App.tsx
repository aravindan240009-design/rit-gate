import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import ProfessionalVisitorForm from './components/ProfessionalVisitorForm';

function App() {
  const [showForm, setShowForm] = useState(false);

  const handleGetStarted = () => {
    setShowForm(true);
  };

  const handleBackToHome = () => {
    setShowForm(false);
  };

  return (
    <div>
      {!showForm ? (
        <LandingPage onGetStarted={handleGetStarted} />
      ) : (
        <ProfessionalVisitorForm onBack={handleBackToHome} />
      )}
    </div>
  );
}

export default App;
