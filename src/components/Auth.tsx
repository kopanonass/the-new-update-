import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, UserCheck, IdCard, GraduationCap, ArrowLeft, Loader2 } from 'lucide-react';

interface AuthProps {
  onSuccess: (token: string, user: any) => void;
  onBack: () => void;
}

export default function Auth({ onSuccess, onBack }: AuthProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [studentNumber, setStudentNumber] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (mode === 'login' || mode === 'register') {
        const endpoint = mode === 'login' ? '/api/login' : '/api/register';
        const body = mode === 'login' 
          ? { email, password }
          : { name, surname, idNumber, studentNumber, email, password };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error || 'Authentication failed');

        localStorage.setItem('orbit_token', data.token);
        localStorage.setItem('orbit_user', JSON.stringify(data.user));
        onSuccess(data.token, data.user);
      } else if (mode === 'forgot') {
        const response = await fetch('/api/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to send OTP');
        
        setSuccessMessage('OTP sent! Check your server logs (simulated).');
        setMode('reset');
      } else if (mode === 'reset') {
        const response = await fetch('/api/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp, newPassword }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to reset password');
        
        setSuccessMessage('Password reset successfully! You can now log in.');
        setMode('login');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black flex items-center justify-center p-6 overflow-y-auto">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[30%] h-[30%] bg-yellow-400/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[30%] h-[30%] bg-yellow-400/5 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-xl relative"
      >
        <button
          onClick={onBack}
          className="absolute left-6 top-6 p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="text-center mb-8 pt-4">
          <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center text-3xl shadow-xl shadow-yellow-400/20 mx-auto mb-4">
            {mode === 'login' ? '🍌' : mode === 'register' ? <UserCheck size={32} className="text-black" /> : '🔑'}
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
            {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Create Account' : mode === 'forgot' ? 'Forgot Password' : 'Reset Password'}
          </h2>
          <p className="text-zinc-500 text-sm">
            {mode === 'login' ? 'Access your Orbit student dashboard' : 
             mode === 'register' ? 'Join the Orbit College Student AI community' :
             mode === 'forgot' ? 'Enter your email to receive an OTP' : 
             'Enter the OTP and your new password'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <AnimatePresence mode="wait">
            {mode === 'register' && (
              <motion.div
                key="register-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold ml-1">Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-black/40 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-yellow-400/50 transition-colors"
                        placeholder="John"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold ml-1">Surname</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                      <input
                        type="text"
                        required
                        value={surname}
                        onChange={(e) => setSurname(e.target.value)}
                        className="w-full bg-black/40 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-yellow-400/50 transition-colors"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold ml-1">ID Number</label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input
                      type="text"
                      required
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      className="w-full bg-black/40 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-yellow-400/50 transition-colors"
                      placeholder="13-digit ID"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold ml-1">Student Number</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input
                      type="text"
                      required
                      value={studentNumber}
                      onChange={(e) => setStudentNumber(e.target.value)}
                      className="w-full bg-black/40 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-yellow-400/50 transition-colors"
                      placeholder="STUD123456"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {(mode !== 'reset') && (
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/40 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-yellow-400/50 transition-colors"
                  placeholder="university@example.edu"
                />
              </div>
            </div>
          )}

          {mode === 'reset' && (
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold ml-1">
                Enter OTP (check server logs)
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-black/40 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-yellow-400/50 transition-colors"
                  placeholder="6-digit code"
                />
              </div>
            </div>
          )}

          {(mode === 'login' || mode === 'register') && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center mr-1">
                <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold ml-1">Password</label>
                {mode === 'login' && (
                  <button 
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[10px] uppercase tracking-wider text-yellow-400 font-bold hover:underline"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-yellow-400/50 transition-colors"
                  placeholder="Min. 5 characters"
                  minLength={5}
                />
              </div>
            </div>
          )}

          {mode === 'reset' && (
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold ml-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-black/40 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-yellow-400/50 transition-colors"
                  placeholder="Min. 5 characters"
                  minLength={5}
                />
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-400 mt-2 bg-red-400/10 p-3 rounded-lg border border-red-400/20">
              {error}
            </p>
          )}

          {successMessage && (
            <p className="text-xs text-green-400 mt-2 bg-green-400/10 p-3 rounded-lg border border-green-400/20">
              {successMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-accent text-black font-black rounded-xl shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 
             mode === 'login' ? 'Sign In' : 
             mode === 'register' ? 'Register Now' :
             mode === 'forgot' ? 'Send OTP' : 'Reset Password'}
          </button>

          {mode === 'reset' && (
            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                setError(null);
                setSuccessMessage(null);
                try {
                  const endpoint = '/api/forgot-password';
                  const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                  });
                  const data = await response.json();
                  if (!response.ok) throw new Error(data.error || 'Failed to resend code');
                  
                  setSuccessMessage('A new code has been sent!');
                } catch (err: any) {
                  setError(err.message);
                } finally {
                  setLoading(false);
                }
              }}
              className="w-full py-2 text-xs text-zinc-500 hover:text-yellow-400 font-bold transition-colors"
            >
              Didn't get the code? <span className="underline">Resend</span>
            </button>
          )}
        </form>

        <div className="mt-6 text-center space-y-2">
          {mode === 'login' ? (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setMode('register')}
                className="text-sm text-zinc-400 hover:text-yellow-400 transition-colors"
              >
                Don't have an account? <span className="font-bold">Register</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMessage(null);
              }}
              className="text-sm text-zinc-400 hover:text-yellow-400 transition-colors"
            >
              Back to <span className="font-bold">Sign In</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
