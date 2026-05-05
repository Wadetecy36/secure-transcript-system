import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../utils/api.ts';
import { UserPlus, Mail, Lock, User, Calendar, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Register = () => {
  const [role, setRole] = useState<'student' | 'staff'>('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [debugLink, setDebugLink] = useState('');
  const [debugCode, setDebugCode] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await apiFetch('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          fullName,
          email,
          role,
          dateOfBirth: role === 'student' ? dob : undefined
        })
      });

      setSuccess(data.message);
      if (data.debugLink) {
        setDebugLink(data.debugLink);
        setDebugCode(data.debugCode);
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfdfd] flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[3rem] overflow-hidden shadow-2xl border border-slate-100"
        >
          <div className="grid grid-cols-1 md:grid-cols-5 h-full">
            <div className="md:col-span-2 bg-navy p-10 flex flex-col justify-between text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
               <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold/10 rounded-full -ml-16 -mb-16" />
               
               <div className="relative z-10">
                 <div className="w-12 h-12 bg-gold rounded-xl flex items-center justify-center text-navy font-black text-xl mb-6 shadow-xl">AA</div>
                 <h2 className="text-3xl font-black tracking-tighter leading-tight mb-4">Enroll in the Registry</h2>
                 <p className="text-white/60 text-sm font-medium leading-relaxed">Official accreditation is required to access the Academic Repository.</p>
               </div>

               <div className="relative z-10 pt-12">
                 <div className="space-y-6">
                    <div className="flex gap-4 items-start">
                       <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center shrink-0 text-gold shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                       </div>
                       <p className="text-[11px] font-bold uppercase tracking-widest text-white/80">Identity Validation</p>
                    </div>
                    <div className="flex gap-4 items-start">
                       <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center shrink-0 text-gold shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                       </div>
                       <p className="text-[11px] font-bold uppercase tracking-widest text-white/80">Secure Vault Storage</p>
                    </div>
                    <div className="flex gap-4 items-start">
                       <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center shrink-0 text-gold shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                       </div>
                       <p className="text-[11px] font-bold uppercase tracking-widest text-white/80">Audit Log Transparency</p>
                    </div>
                 </div>
               </div>
            </div>

            <div className="md:col-span-3 p-10 lg:p-12">
              <AnimatePresence mode="wait">
                {success ? (
                  <motion.div 
                    key="success"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="h-full flex flex-col justify-center text-center"
                  >
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/10">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-black text-navy mb-4 tracking-tight">Identity Enrolled</h2>
                    <p className="text-slate-500 text-sm leading-relaxed font-medium mb-10">
                      A secured Access Code has been dispatched to <span className="text-navy font-black">{email}</span>. Please verify your portal access.
                    </p>
                    
                    {debugLink && (
                      <div className="mb-10 p-6 bg-slate-50 rounded-3xl border border-slate-100 text-left overflow-hidden shadow-inner">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-4">Internal Security Link</p>
                        <div className="space-y-4">
                          <div>
                            <p className="text-[9px] text-slate-400 font-black uppercase mb-1">Generated Access Code</p>
                            <p className="text-xl font-mono font-black text-navy tracking-[0.3em]">{debugCode}</p>
                          </div>
                          <a 
                            href={debugLink} 
                            className="inline-flex items-center gap-2 text-xs text-gold font-black uppercase tracking-widest hover:text-navy transition-colors"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Verify Identity Now <ArrowRight className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    )}

                    <Link to="/login" className="btn-primary py-4 uppercase tracking-widest text-xs">
                      Return to Secure Login
                    </Link>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="mb-10 text-center md:text-left">
                       <h1 className="text-2xl font-black text-navy tracking-tight mb-2">Academic Registry</h1>
                       <p className="text-sm text-slate-400 font-medium">Create your official digital identity.</p>
                    </div>

                    <div className="flex p-1 bg-slate-100 rounded-2xl mb-8 shadow-inner">
                      <button 
                        onClick={() => setRole('student')}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${
                          role === 'student' ? 'bg-white text-navy shadow-xl shadow-navy/5' : 'text-slate-400 hover:text-navy'
                        }`}
                      >
                        Student
                      </button>
                      <button 
                        onClick={() => setRole('staff')}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${
                          role === 'staff' ? 'bg-white text-navy shadow-xl shadow-navy/5' : 'text-slate-400 hover:text-navy'
                        }`}
                      >
                        Faculty
                      </button>
                    </div>

                    <form onSubmit={handleSignup} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Legal Name</label>
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-navy transition-colors" />
                          <input 
                            type="text" 
                            required
                            placeholder="Full Name as per records"
                            className="input-academic pl-12 h-12 text-xs"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Institutional Email</label>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-navy transition-colors" />
                          <input 
                            type="email" 
                            required
                            placeholder="you@accraacademy.edu"
                            className="input-academic pl-12 h-12 text-xs"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                      </div>

                      {role === 'student' && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-2"
                        >
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date of Birth Identification</label>
                          <div className="relative group">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-navy transition-colors" />
                            <input 
                              type="date" 
                              required
                              className="input-academic pl-12 h-12 text-xs"
                              value={dob}
                              onChange={(e) => setDob(e.target.value)}
                            />
                          </div>
                        </motion.div>
                      )}

                      {error && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-[11px] font-bold"
                        >
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          {error}
                        </motion.div>
                      )}

                      <button 
                        type="submit" 
                        disabled={loading}
                        className="btn-primary w-full h-12 py-0 text-[11px] uppercase tracking-[0.2em]"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enroll Now'}
                      </button>

                      <p className="text-center text-[10px] text-slate-400 font-medium">
                        Already enrolled? <Link to="/login" className="text-navy font-black hover:text-gold transition-colors underline decoration-gold/30 underline-offset-4">Sign In</Link>
                      </p>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
        
        <div className="mt-12 text-center">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Accra Academy SIS-PROT-V4</p>
        </div>
      </div>
    </div>
  );
};

export default Register;
