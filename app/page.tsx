'use client';

import LoginScreen from './components/LoginScreen';
import Lobby from './components/Lobby';
import { useAuth } from './lib/auth';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-600 to-blue-500">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return user ? <Lobby /> : <LoginScreen />;
}
