import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import ChatWidget from '../chatbot/ChatWidget';

export default function CustomerLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-cream-50">
      <Navbar />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
}
