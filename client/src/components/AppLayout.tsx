import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';

export default function AppLayout() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#e2e8f0', backgroundImage: 'radial-gradient(circle, rgba(148,163,184,0.4) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      <NavBar />
      <Outlet />
    </div>
  );
}
