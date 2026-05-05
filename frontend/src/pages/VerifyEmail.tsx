import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../utils/api.ts';
import { ShieldCheck, Loader2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('No digital verification token provided by the registry.');
        return;
      }

      try {
        const data = await apiFetch(`/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage(data.message);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Identity verification protocol failed.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-[#fcfdfd] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[3rem] overflow-hidden shadow-2xl border border-slate-100 p-12 lg:p-16 text-center"
        >
          <div className="flex justify-center mb-10">
            <div className="w-20 h-20 bg-navy rounded-[2rem] flex items-center justify-center text-gold shadow-xl shadow-navy/10 group">
              <ShieldCheck className="w-10 h-10 group-hover:scale-110 transition-transform" />
            </div>
          </div>

          <div className="space-y-8">
            {status === 'loading' && (
              <div className="space-y-6">
                <Loader2 className="w-10 h-10 text-gold animate-spin mx-auto" />
                <h1 className="text-2xl font-black text-navy tracking-tight uppercase">Decrypting Identity...</h1>
                <p className="text-slate-400 text-sm font-medium">Please stand by while the registry validates your digital credentials.</p>
              </div>
            )}

            {status === 'success' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div>
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h1 className="text-3xl font-black text-navy mb-3 tracking-tighter uppercase">Identity Verified</h1>
                  <p className="text-slate-500 text-sm font-medium max-w-xs mx-auto">{message}</p>
                </div>
                <Link 
                  to="/login"
                  className="btn-primary w-full h-14 py-0 text-xs uppercase tracking-widest"
                >
                  Enter Secure Portal <ArrowRight className="ml-3 w-5 h-5" />
                </Link>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div>
                  <div className="w-16 h-16 bg-red-50 text-red-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <h1 className="text-3xl font-black text-navy mb-3 tracking-tighter uppercase">Verification Failed</h1>
                  <p className="text-red-500 text-sm font-bold">{message}</p>
                </div>
                <div className="flex flex-col gap-4">
                  <Link 
                    to="/signup"
                    className="btn-primary w-full h-14 py-0 text-xs uppercase tracking-widest"
                  >
                    Return to Registry Enrollment
                  </Link>
                  <Link 
                    to="/login"
                    className="text-slate-400 hover:text-navy text-[10px] font-black uppercase tracking-[0.2em] transition-colors"
                  >
                    Abort to Secure Login
                  </Link>
                </div>
              </motion.div>
            )}
          </div>
          
          <div className="mt-16 pt-12 border-t border-slate-50">
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Accra Academy SIS-TRUST</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VerifyEmail;
