'use client';

import { useAuth } from '../lib/auth';
import Image from 'next/image';

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-600 to-blue-500">
      <div className="bg-white p-8 rounded-lg shadow-2xl transform transition-all hover:scale-105">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Tic Tac Toe Online</h1>
        <button
          onClick={signInWithGoogle}
          className="w-full px-6 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-700 font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2"
        >
          <div className="relative w-6 h-6">
            <Image
              src="/google.svg"
              alt="Google"
              fill
              className="object-contain"
            />
          </div>
          <span>Sign in with Google</span>
        </button>
      </div>
    </div>
  );
}