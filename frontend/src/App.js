import React, { useState, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Layout from './components/Layout';
import WaitlistModal from './components/WaitlistModal';
import Home from './pages/Home';
import Products from './pages/Products';
import HabitPage from './pages/HabitPage';
import StudioPage from './pages/StudioPage';
import DeskPage from './pages/DeskPage';
import About from './pages/About';
import Support from './pages/Support';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import HabitPrivacy from './pages/HabitPrivacy';
import HabitTerms from './pages/HabitTerms';
import './App.css';

export const WaitlistContext = createContext(null);
export const useWaitlist = () => useContext(WaitlistContext);

function App() {
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [defaultProduct, setDefaultProduct] = useState('ecosystem');

  const openWaitlist = (product = 'ecosystem') => {
    setDefaultProduct(product);
    setIsWaitlistOpen(true);
  };

  const closeWaitlist = () => setIsWaitlistOpen(false);

  return (
    <HelmetProvider>
      <WaitlistContext.Provider value={{ openWaitlist, closeWaitlist, isWaitlistOpen }}>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/habit" element={<HabitPage />} />
              <Route path="/products/studio" element={<StudioPage />} />
              <Route path="/products/desk" element={<DeskPage />} />
              <Route path="/about" element={<About />} />
              <Route path="/support" element={<Support />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/habit/privacy" element={<HabitPrivacy />} />
              <Route path="/habit/terms" element={<HabitTerms />} />
            </Routes>
          </Layout>
          <WaitlistModal
            isOpen={isWaitlistOpen}
            onClose={closeWaitlist}
            defaultProduct={defaultProduct}
          />
        </BrowserRouter>
      </WaitlistContext.Provider>
    </HelmetProvider>
  );
}

export default App;
