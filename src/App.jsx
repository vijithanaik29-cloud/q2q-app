import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import CommunityAuth from './components/CommunityAuth';
import Footer from './components/Footer';
import Home from './pages/Home';
import EventDetail from './pages/EventDetail';
import Booking from './pages/Booking';
import Confirmation from './pages/Confirmation';
import Admin from './pages/Admin';
import SuperAdmin from './pages/SuperAdmin';
import Apply from './pages/Apply';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Refund from './pages/Refund';
import Stories from './pages/Stories';
import Fundraisers from './pages/Fundraisers';
import MyBookings from './pages/MyBookings';
import About from './pages/About';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

function AppShell({ children }) {
  const { user, profile, profileLoaded } = useApp();
  // Only community (Google OAuth) users need onboarding — email/password = organiser login
  const isCommunityUser = user?.app_metadata?.provider !== 'email';
  const needsOnboarding = isCommunityUser && user && profileLoaded && !profile;
  return (
    <>
      {needsOnboarding && (
        <CommunityAuth initialStep="onboard" onClose={() => {}} onSuccess={() => {}} />
      )}
      {children}
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppShell>
        <div className="rainbow-stripe" />
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/event/:id" element={<EventDetail />} />
            <Route path="/book/:id" element={<Booking />} />
            <Route path="/confirmation" element={<Confirmation />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/organiser-login" element={<Admin />} />
            <Route path="/superadmin" element={<SuperAdmin />} />
            <Route path="/apply" element={<Apply />} />
            <Route path="/stories" element={<Stories />} />
            <Route path="/fundraisers" element={<Fundraisers />} />
            <Route path="/fundraisers/:id" element={<Fundraisers />} />
            <Route path="/about" element={<About />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/refund" element={<Refund />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
        </AppShell>
      </BrowserRouter>
    </AppProvider>
  );
}
