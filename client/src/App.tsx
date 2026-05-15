import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Account from './pages/Account';
import Admin from './pages/Admin';
import Analytics from './pages/Analytics';
import AIGenerate from './pages/AIGenerate';
import Campaigns from './pages/Campaigns';
import Feedback from './pages/Feedback';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/account" element={<Account />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/ai" element={<AIGenerate />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/feedback" element={<Feedback />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
