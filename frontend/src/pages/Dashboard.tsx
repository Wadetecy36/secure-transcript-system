import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api.ts';
import { FileText, Download, LogOut, Loader2, ExternalLink, Shield, X, UserCircle, Plus, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

interface Transcript {
  id: string;
  semester: string;
  version: number;
  created_at: string;
}

interface TranscriptRequest {
  id: string;
  status: string;
  reason: string;
  created_at: string;
  updated_at: string;
}

function PreviewModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-navy/60 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white w-full h-full max-w-5xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white px-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-navy rounded-xl flex items-center justify-center text-gold shadow-lg">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-navy leading-none tracking-tight">Certified Transcript Viewer</h3>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em] mt-1">Official Registry Access Session</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-slate-50 rounded-2xl transition-all text-slate-300 hover:text-navy"
          >
            <X className="w-7 h-7" />
          </button>
        </div>
        <div className="flex-1 bg-slate-50 relative group">
          <iframe 
            src={`${url}#toolbar=1&navpanes=0&scrollbar=1`}
            className="w-full h-full border-none"
            title="Transcript Preview"
          />
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-navy/5 backdrop-blur-[1px]">
            <p className="text-xs font-black text-navy mb-5 bg-white/90 px-6 py-2.5 rounded-2xl shadow-xl uppercase tracking-widest border border-navy/10">Enhanced Security Preview</p>
            <a 
              href={url} 
              target="_blank" 
              rel="noreferrer"
              className="pointer-events-auto flex items-center gap-3 px-8 py-4 bg-navy text-gold rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all text-xs font-black uppercase tracking-widest"
            >
              <ExternalLink className="w-5 h-5" />
              Open Document Externally
            </a>
          </div>
        </div>
        <div className="p-5 bg-gold/5 border-t border-gold/10 text-center px-8">
          <p className="text-[10px] text-navy/60 font-black uppercase tracking-[0.1em] leading-relaxed">
            Esse Quam Videri — To be rather than to seem. This digital artifact is an official record of Accra Academy.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Dashboard() {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [requests, setRequests] = useState<TranscriptRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [requestShow, setRequestShow] = useState(false);
  const [requestReason, setRequestReason] = useState('');
  const [requestStatus, setRequestStatus] = useState({ loading: false, msg: '' });
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      navigate('/login');
      return;
    }
    const parsed = JSON.parse(savedUser);
    if (parsed.role !== 'student') {
      if (parsed.role === 'staff') navigate('/staff/dashboard');
      else if (parsed.role === 'admin') navigate('/admin/dashboard');
      return;
    }
    setUser(parsed);
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const [transcriptData, requestData] = await Promise.all([
        apiFetch('/transcripts'),
        apiFetch('/transcripts/requests')
      ]);
      setTranscripts(transcriptData);
      setRequests(requestData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestStatus({ loading: true, msg: '' });
    try {
      await apiFetch('/transcripts/request', {
        method: 'POST',
        body: JSON.stringify({ reason: requestReason })
      });
      setRequestStatus({ loading: false, msg: 'Request dispatched successfully.' });
      setRequestReason('');
      fetchData();
      setTimeout(() => setRequestShow(false), 2000);
    } catch (err: any) {
      setRequestStatus({ loading: false, msg: err.message });
    }
  };

  const handleAction = async (id: string, action: 'view' | 'download') => {
    try {
      const { url } = await apiFetch(`/transcripts/${id}/url${action === 'download' ? '?download=true' : ''}`);
      
      if (action === 'view') {
        const response = await fetch(url);
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = '';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfdfd]">
        <motion.div
          animate={{ scale: [0.9, 1.1, 0.9], rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-12 h-12 bg-navy rounded-2xl flex items-center justify-center text-gold shadow-xl"
        >
          <Loader2 className="w-6 h-6 animate-spin" />
        </motion.div>
      </div>
    );
  }

  // Group transcripts by semester or academic year pattern
  const groupedTranscripts = transcripts.reduce((acc, t) => {
    const year = t.semester.split(' ')[0]; // Basic logic: "2026 Term 1" -> "2026"
    if (!acc[year]) acc[year] = [];
    acc[year].push(t);
    return acc;
  }, {} as Record<string, Transcript[]>);

  return (
    <div className="min-h-screen bg-[#fcfdfd]">
      <nav className="bg-navy border-b border-white/5 sticky top-0 z-50 shadow-2xl shadow-navy/20">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-gold rounded-xl flex items-center justify-center font-bold text-navy shadow-lg">
              AA
            </div>
            <div>
              <span className="text-xl font-black text-white tracking-tight block leading-none">Accra Academy</span>
              <span className="text-[9px] font-bold text-gold uppercase tracking-[0.3em] mt-1 block">Student Academic Portal</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3 pr-6 border-r border-white/10">
              <div className="text-right">
                <div className="text-xs font-black text-white">{user?.fullName}</div>
                <div className="text-[10px] font-bold text-gold/80 uppercase tracking-widest">Active Enrollment</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-gold border border-white/20">
                <UserCircle className="w-6 h-6" />
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-3 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 rounded-2xl transition-all group"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-16">
        <AnimatePresence>
          {previewUrl && <PreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />}
          {requestShow && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/60 backdrop-blur-md"
            >
              <motion.form 
                onSubmit={handleRequestSubmit}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white p-10 rounded-[2.5rem] w-full max-w-md shadow-2xl space-y-8"
              >
                <div>
                  <div className="w-12 h-12 bg-navy/5 rounded-2xl flex items-center justify-center text-navy mb-6">
                     <Shield className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-black text-navy tracking-tight">Record Validation Request</h3>
                  <p className="text-sm text-slate-500 mt-2 font-medium">Submit a formal request to the Office of the Registrar for updated or certified documentation.</p>
                </div>
                
                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Purpose for Certification</label>
                  <select 
                    required 
                    value={requestReason} 
                    onChange={e => setRequestReason(e.target.value)}
                    className="input-academic bg-slate-50 border-transparent"
                  >
                    <option value="">Select a formal reason...</option>
                    <option value="Graduate School Application">Graduate School Application</option>
                    <option value="Employment Background Check">Employment Background Check</option>
                    <option value="Scholarship Verification">Scholarship Verification</option>
                    <option value="Personal Record">Personal Record</option>
                  </select>
                </div>

                <div className="p-5 bg-gold/5 rounded-2xl border border-gold/20 flex gap-4">
                   <div className="w-5 h-5 bg-navy text-white rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold mt-0.5">!</div>
                   <p className="text-[11px] text-navy font-bold leading-relaxed">Official processing requires 2-4 business days. Verification status will be tracked in your active registry.</p>
                </div>

                {requestStatus.msg && (
                  <div className={`p-4 rounded-xl text-xs font-bold ${requestStatus.msg.includes('success') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {requestStatus.msg}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setRequestShow(false)} className="flex-1 py-4 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all">Abort</button>
                  <button type="submit" disabled={requestStatus.loading} className="btn-primary flex-1 py-4 text-sm">
                    {requestStatus.loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Authorize Request'}
                  </button>
                </div>
              </motion.form>
            </motion.div>
          )}
        </AnimatePresence>

        <header className="mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-8"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                 <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-100 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Registry Active
                 </div>
                 <div className="px-3 py-1 bg-navy/5 text-navy/60 rounded-full text-[10px] font-bold uppercase tracking-widest border border-navy/10">
                    ID: {user?.id.slice(0, 12)}
                 </div>
              </div>
              <h1 className="text-5xl font-black text-navy tracking-tighter leading-none">Academic Repository</h1>
              <p className="text-slate-500 mt-6 text-xl max-w-2xl leading-relaxed font-medium">Digital access to your official transcripts and certified academic achievements.</p>
            </div>
            <button 
              onClick={() => setRequestShow(true)}
              className="btn-primary"
            >
              <Plus className="w-5 h-5" />
              Request Registry Update
            </button>
          </motion.div>
        </header>

        <div className="space-y-24">
          {requests.length > 0 && (
            <div className="space-y-8">
              <div className="flex items-center gap-6">
                <h2 className="text-2xl font-black text-navy flex items-center gap-4">
                   <Clock className="w-5 h-5 text-gold" />
                   Pending Certifications
                </h2>
                <div className="h-px bg-slate-100 flex-1"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {requests.map(req => (
                  <div key={req.id} className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        req.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-gold/20 text-navy'
                      }`}>
                        {req.status}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">{format(new Date(req.created_at), 'MMM dd')}</span>
                    </div>
                    <div>
                      <p className="text-xs font-black text-navy uppercase tracking-widest mb-1">Purpose</p>
                      <p className="text-sm font-medium text-slate-500 leading-snug">{req.reason}</p>
                    </div>
                    {req.status === 'pending' && (
                      <div className="mt-2 text-[10px] text-slate-400 font-bold italic">Estimated completion: 3-5 business days</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {transcripts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-[3rem] border border-slate-100 p-24 text-center shadow-sm"
            >
              <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 mx-auto mb-8 border border-slate-100">
                <FileText className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-navy mb-3">Null Records Found</h3>
              <p className="text-slate-400 max-w-sm mx-auto text-base font-medium">Your academic documents will appear here once verified and published by the Office of the Registrar.</p>
            </motion.div>
          ) : (
            <div className="space-y-16">
              {Object.entries(groupedTranscripts).sort(([a], [b]) => b.localeCompare(a)).map(([year, yearTranscripts]: [string, Transcript[]]) => (
                <div key={year} className="space-y-8">
                  <div className="flex items-center gap-6">
                    <h2 className="text-2xl font-black text-navy flex items-center gap-4">
                       <span className="w-2 h-10 bg-gold rounded-full"></span>
                       Academic Year {year}
                    </h2>
                    <div className="h-px bg-slate-100 flex-1"></div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {yearTranscripts.map((t) => (
                      <motion.div 
                        key={t.id} 
                        whileHover={{ y: -5 }}
                        className="bg-white rounded-3xl border border-slate-100 p-8 flex flex-col shadow-sm hover:shadow-2xl hover:shadow-navy/5 transition-all group"
                      >
                        <div className="flex justify-between items-start mb-6">
                           <div className="w-12 h-12 bg-navy p-3 rounded-2xl text-gold flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <FileText className="w-full h-full" />
                           </div>
                           <div className="flex flex-col items-end">
                              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-100">PUBLISHED</span>
                              <span className="text-[10px] text-slate-400 font-bold mt-2 font-mono uppercase">VER v{t.version}</span>
                           </div>
                        </div>
                        
                        <h3 className="font-black text-navy text-2xl tracking-tight mb-2">{t.semester}</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-8">Registered: {format(new Date(t.created_at), 'MMMM yyyy')}</p>
                        
                        <div className="flex gap-2 pt-2 border-t border-slate-50 mt-auto">
                          <button onClick={() => handleAction(t.id, 'view')} className="flex-1 py-3.5 bg-slate-50 text-navy rounded-2xl text-[11px] font-black hover:bg-navy hover:text-white transition-all uppercase tracking-widest">Preview</button>
                          <button onClick={() => handleAction(t.id, 'download')} className="flex-1 py-3.5 bg-navy text-white rounded-2xl text-[11px] font-black hover:bg-navy/90 shadow-xl shadow-navy/10 transition-all uppercase tracking-widest flex items-center justify-center gap-2">
                             <Download className="w-3.5 h-3.5" />
                             Download
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <footer className="mt-32 pt-12 border-t border-slate-100 text-center">
           <div className="flex flex-col items-center gap-6">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 font-bold text-lg grayscale opacity-50">AA</div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em] max-w-sm leading-relaxed">
                 Accra Academy Registrar Registry System<br/>
                 Secure Digital Credentials • v2.4.0
              </p>
           </div>
        </footer>
      </main>
    </div>
  );
}
