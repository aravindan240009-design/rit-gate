import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import ProfessionalVisitorForm from './components/ProfessionalVisitorForm';

type Page = 'home' | 'form';

function App() {
  const [page, setPage] = useState<Page>('home');

  return (
    <div>
      {page === 'home' && (
        <LandingPage
          onGetStarted={() => setPage('form')}
        />
      )}
      {page === 'form' && (
        <ProfessionalVisitorForm onBack={() => setPage('home')} />
      )}
    </div>
  );
}

export default App;
