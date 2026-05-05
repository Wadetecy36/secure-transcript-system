import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../utils/api.ts';
import { Lock, Calendar, ShieldCheck, ArrowRight, UserCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Login() {
  const [mode, setMode] = useState<'student' | 'staff'>('student');
  const [accessCode, setAccessCode] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = mode === 'student' 
        ? { dob, accessCode } 
        : { email, accessCode };

      const data = await apiFetch('/auth/verify', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      if (data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (data.user.role === 'staff') {
        navigate('/staff/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      <div className="hidden md:flex md:w-1/2 bg-navy relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        </div>
        <div className="relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-32 h-32 bg-gold p-4 rounded-3xl mx-auto mb-8 shadow-2xl flex items-center justify-center font-serif text- navy font-black text-4xl"
          >
            AA
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white text-4xl font-bold tracking-tight mb-4"
          >
            Accra Academy
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-gold font-serif italic text-lg opacity-90"
          >
            Esse Quam Videri
          </motion.p>
          <div className="mt-12 flex flex-col items-center gap-4">
            <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-white/80 text-xs font-bold uppercase tracking-widest flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-gold" />
              Secure Institution Gateway
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#fcfdfd]">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-[400px] w-full"
        >
          <div className="md:hidden text-center mb-8">
             <div className="w-16 h-16 bg-navy rounded-2xl mx-auto mb-4 flex items-center justify-center text-gold font-bold text-xl">AA</div>
             <h2 className="text-2xl font-bold text-navy">Accra Academy</h2>
          </div>

          <div className="mb-10 text-center md:text-left">
            <h1 className="text-3xl font-black text-navy tracking-tight mb-2">Secure Access</h1>
            <p className="text-slate-500 text-sm font-medium">Please verify your identity to access restricted academic records.</p>
          </div>

          <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl mb-8">
            <button 
              onClick={() => setMode('student')}
              className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${mode === 'student' ? 'bg-white shadow-sm text-navy' : 'text-slate-500 hover:text-navy'}`}
            >
              Student Portal
            </button>
            <button 
              onClick={() => setMode('staff')}
              className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${mode === 'staff' ? 'bg-white shadow-sm text-navy' : 'text-slate-500 hover:text-navy'}`}
            >
              Faculty Access
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'student' ? (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Student Birth Declaration</label>
                <div className="relative group">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-navy transition-colors" />
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="input-academic pl-11"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Faculty Registry Email</label>
                <div className="relative group">
                  <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-navy transition-colors" />
                  <input
                    type="email"
                    required
                    placeholder="official@accraacademy.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-academic pl-11"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Secret Access Code</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-navy transition-colors" />
                <input
                  type="password"
                  required
                  placeholder={mode === 'student' ? "STUDENT_ID" : "STAFF_TOKEN"}
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="input-academic pl-11 tracking-widest placeholder:tracking-normal"
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-3"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 text-sm"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Authorize Session
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col items-center gap-6">
            <Link to="/signup" className="text-xs font-bold text-navy hover:text-navy/80 flex items-center gap-2">
              Identity Enrollment
              <ArrowRight className="w-3 h-3" />
            </Link>
            
            <div className="flex items-center gap-4 text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">
               <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-emerald-500" />
                  SSL v3
               </div>
               <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-emerald-500" />
                  No-Cache
               </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
