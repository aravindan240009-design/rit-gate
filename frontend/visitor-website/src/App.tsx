import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import ProfessionalVisitorForm from './components/ProfessionalVisitorForm';
import FeaturesPage from './components/FeaturesPage';

type Page = 'home' | 'form' | 'features';

function App() {
  const [page, setPage] = useState<Page>('home');

  return (
    <div>
      {page === 'home' && (
        <LandingPage
          onGetStarted={() => setPage('form')}
          onShowFeatures={() => setPage('features')}
        />
      )}
      {page === 'form' && (
        <ProfessionalVisitorForm onBack={() => setPage('home')} />
      )}
      {page === 'features' && (
        <FeaturesPage
          onBack={() => setPage('home')}
          onGetStarted={() => setPage('form')}
        />
      )}
    </div>
  );
}

export default App;
