import React from 'react';
import { signInWithGoogle } from '../services/auth';
import { LogIn } from 'lucide-react';

export const Login: React.FC = () => {
  const handleLogin = async () => {
    await signInWithGoogle();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <LogIn className="text-indigo-600 w-10 h-10" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">IELTS AI Master</h1>
        <p className="text-gray-500 mb-8">
          Master your exam with AI-powered feedback, real-time grading, and adaptive flashcards.
        </p>

        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center px-6 py-4 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 md:text-lg transition transform hover:scale-105 shadow-lg"
        >
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google" 
            className="w-6 h-6 mr-3"
          />
          Sign in with Google
        </button>
        
        <div className="mt-6 text-xs text-gray-400">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </div>
      </div>
    </div>
  );
};