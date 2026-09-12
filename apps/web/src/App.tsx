import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Me from './pages/Me';
import Morning from './pages/Morning';
import Focus from './pages/Focus';
import Night from './pages/Night';
import Goals from './pages/Goals';
import Money from './pages/Money';
import Crm from './pages/Crm';
import Colleges from './pages/Colleges';
import Habits from './pages/Habits';
import Evidence from './pages/Evidence';
import Reviews from './pages/Reviews';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import OnboardingGate from './components/OnboardingGate';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route element={<OnboardingGate />}>
        <Route path="/onboarding" element={<Onboarding />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/morning" element={<Morning />} />
          <Route path="/focus" element={<Focus />} />
          <Route path="/night" element={<Night />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/money" element={<Money />} />
          <Route path="/crm" element={<Crm />} />
          <Route path="/colleges" element={<Colleges />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/evidence" element={<Evidence />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/me" element={<Me />} />
        </Route>
      </Route>
    </Routes>
  );
}
