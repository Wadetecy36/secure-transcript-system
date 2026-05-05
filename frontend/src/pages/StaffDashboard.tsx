import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api.ts';
import { FileText, LogOut, Loader2, UploadCloud, UserCircle, ShieldCheck, History, Search, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

interface Transcript {
  id: string;
  semester: string;
  version: number;
  created_at: string;
  studentName: string;
  student_id: string;
}

interface TranscriptRequest {
  id: string;
  student_id: string;
  studentName: string;
  status: string;
  reason: string;
  created_at: string;
}

interface Student {
  id: string;
  fullName: string;
  email: string;
  dateOfBirth: string;
  createdAt: string;
}

export default function StaffDashboard() {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [requests, setRequests] = useState<TranscriptRequest[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [studentId, setStudentId] = useState('');
  const [semester, setSemester] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'requests' | 'registry'>('upload');
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      navigate('/login');
      return;
    }
    const parsed = JSON.parse(savedUser);
    if (parsed.role !== 'staff' && parsed.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    setUser(parsed);
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const [tData, rData, sData] = await Promise.all([
        apiFetch('/transcripts'),
        apiFetch('/transcripts/requests'),
        apiFetch('/transcripts/students')
      ]);
      setTranscripts(tData);
      setRequests(rData);
      setStudents(sData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await apiFetch(`/transcripts/requests/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append('transcript', file);
    formData.append('studentId', studentId);
    formData.append('semester', semester);
    formData.append('isPublished', 'true');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Upload failed');
      }

      setFile(null);
      setSemester('');
      setStudentId('');
      fetchData();
      alert('Transcript published successfully');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfdfd]">
        <motion.div
           animate={{ rotate: 360 }}
           transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
           className="w-12 h-12 bg-navy rounded-2xl flex items-center justify-center text-gold shadow-xl"
        >
           <Loader2 className="w-6 h-6 animate-spin" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfdfd]">
      <nav className="bg-navy border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center font-bold text-navy shadow-lg">
              AA
            </div>
            <div>
              <span className="text-lg font-black text-white tracking-tight block leading-none">Accra Academy</span>
              <span className="text-[9px] font-bold text-gold uppercase tracking-[0.2em] mt-1 block">Staff Registry Control</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3 pr-6 border-r border-white/10">
              <div className="text-right">
                <div className="text-xs font-black text-white">{user?.fullName}</div>
                <div className="text-[10px] font-bold text-gold/80 uppercase tracking-widest">{user?.role} Authority</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-gold border border-white/20 uppercase font-black text-xs">
                {user?.fullName.charAt(0)}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-3 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 rounded-2xl transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-16">
        <header className="mb-16 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
          <div>
            <h1 className="text-4xl font-black text-navy tracking-tight">Institutional Registrar</h1>
            <p className="text-slate-500 mt-2 text-lg font-medium italic">Secure administration of verified academic micro-credentials.</p>
          </div>
          
          <div className="flex p-1.5 bg-slate-100 rounded-2xl shadow-inner">
            {[
              { id: 'upload', icon: UploadCloud, label: 'Publishing Terminal' },
              { id: 'requests', icon: History, label: 'Validation Requests' },
              { id: 'registry', icon: Users, label: 'Active Registry' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-3 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-white shadow-xl shadow-navy/5 text-navy' : 'text-slate-400 hover:text-navy'}`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.id === 'requests' && requests.filter(r => r.status === 'pending').length > 0 && (
                  <span className="ml-1 w-4 h-4 bg-navy text-gold rounded-full text-[8px] flex items-center justify-center">
                    {requests.filter(r => r.status === 'pending').length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'upload' ? (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-10"
            >
              <div className="lg:col-span-4 self-start sticky top-32">
                <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-2xl shadow-navy/5">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-gold/10 text-navy rounded-2xl flex items-center justify-center shadow-inner">
                      <UploadCloud className="w-6 h-6 text-gold" />
                    </div>
                    <h2 className="font-black text-navy uppercase tracking-widest text-xs">Authorize Publication</h2>
                  </div>

                  <form onSubmit={handleUpload} className="space-y-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Recipient Identity ID</label>
                      <input 
                        type="text" 
                        placeholder="Enrollment ID"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        className="input-academic" 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Academic Term / Semester</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 2026 Term 1" 
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                        className="input-academic" 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Official PDF Binary</label>
                      <div className="relative">
                         <input 
                           type="file" 
                           accept=".pdf"
                           onChange={(e) => setFile(e.target.files?.[0] || null)}
                           className="w-full text-[11px] font-bold text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-navy file:text-gold hover:file:bg-navy/90 transition-all border border-slate-100 rounded-2xl p-1.5 bg-slate-50/50" 
                           required 
                         />
                      </div>
                    </div>
                    <button 
                      disabled={uploading}
                      className="btn-primary w-full py-5 text-sm uppercase tracking-widest"
                    >
                      {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign & Publish Record'}
                    </button>
                  </form>
                </div>
              </div>

              <div className="lg:col-span-8">
                <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-2xl shadow-navy/5">
                  <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-white relative">
                    <h2 className="font-black text-navy flex items-center gap-3 text-xs uppercase tracking-[0.2em]">
                      <History className="w-4 h-4 text-gold" />
                      Publication Audit Ledger
                    </h2>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {transcripts.map((t) => (
                      <div key={t.id} className="px-10 py-8 flex items-center justify-between hover:bg-slate-50/50 transition-all group">
                        <div className="flex items-center gap-6">
                          <div className="w-14 h-14 bg-navy/5 rounded-2xl flex items-center justify-center text-navy group-hover:bg-navy group-hover:text-gold transition-all shadow-inner">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="font-black text-navy text-lg tracking-tight mb-1">{t.semester}</div>
                            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                               Student: <span className="text-navy">{t.studentName}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{format(new Date(t.created_at), 'MMM dd, yyyy')}</div>
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 font-black text-[9px] uppercase tracking-widest rounded-lg border border-emerald-100">
                             <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                             Verified v{t.version}
                          </div>
                        </div>
                      </div>
                    ))}
                    {transcripts.length === 0 && (
                      <div className="p-32 text-center">
                         <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-6">
                            <History className="w-8 h-8" />
                         </div>
                         <p className="text-slate-400 italic text-sm font-medium">No historical transactions found in current session registry.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'requests' ? (
            <motion.div 
              key="requests"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-2xl shadow-navy/5">
                <div className="grid grid-cols-12 px-10 py-6 bg-navy text-[10px] font-black text-gold/60 uppercase tracking-[0.2em]">
                   <p className="col-span-3">Registry Identity</p>
                   <p className="col-span-4">Declaration of Intent</p>
                   <p className="col-span-2">Logged At</p>
                   <p className="col-span-1 text-center">Status</p>
                   <p className="col-span-2 text-right">Registry Action</p>
                </div>
                
                <div className="divide-y divide-slate-50">
                  {requests.map(r => (
                    <div key={r.id} className="grid grid-cols-12 px-10 py-10 items-center hover:bg-slate-50/50 transition-all group">
                      <div className="col-span-3 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-navy text-gold flex items-center justify-center text-xs font-black shadow-lg shadow-navy/10">{r.studentName.charAt(0)}</div>
                        <div>
                          <p className="text-base font-black text-navy leading-none mb-1">{r.studentName}</p>
                          <p className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest">{r.student_id.slice(0, 8)}</p>
                        </div>
                      </div>
                      
                      <div className="col-span-4 pr-10">
                        <p className="text-sm text-slate-500 font-medium leading-relaxed italic">{r.reason}</p>
                      </div>

                      <div className="col-span-2">
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{format(new Date(r.created_at), 'MMM dd, HH:mm')}</p>
                      </div>

                      <div className="col-span-1 flex justify-center">
                        <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                          r.status === 'pending' ? 'bg-gold/10 text-gold-hover border border-gold/20' :
                          r.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}>
                          {r.status}
                        </span>
                      </div>

                      <div className="col-span-2 flex justify-end gap-3">
                        {r.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => {
                                setStudentId(r.student_id);
                                setActiveTab('upload');
                              }}
                              className="px-5 py-2.5 bg-navy text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-navy/90 transition-all shadow-lg shadow-navy/10"
                            >
                              Fulfill
                            </button>
                            <button 
                              onClick={() => handleStatusUpdate(r.id, 'rejected')}
                              className="px-5 py-2.5 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-100 transition-all border border-red-100"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {r.status !== 'pending' && (
                          <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Immutable Entry</div>
                        )}
                      </div>
                    </div>
                  ))}
                  {requests.length === 0 && (
                    <div className="p-32 text-center">
                       <Clock className="w-16 h-16 text-slate-50 mx-auto mb-6" />
                       <p className="text-slate-400 italic text-sm font-medium">Validation queue at zero state.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="registry"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-2xl shadow-navy/5"
            >
              <div className="p-10 border-b border-slate-50 bg-white flex justify-between items-center">
                 <h2 className="text-xs font-black text-navy uppercase tracking-[0.2em] flex items-center gap-4">
                   <div className="w-2 h-6 bg-gold rounded-full"></div>
                   Verified Enrollment Directory
                 </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="border-b border-slate-50 bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                         <th className="px-10 py-6">Official Identity</th>
                         <th className="px-10 py-6">Authenticated Email</th>
                         <th className="px-10 py-6">Registered Birth</th>
                         <th className="px-10 py-6">Enrollment Date</th>
                         <th className="px-10 py-6 text-right">Action</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {students.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50/50 transition-all group">
                           <td className="px-10 py-8 flex items-center gap-5">
                              <div className="w-11 h-11 rounded-2xl bg-navy/5 flex items-center justify-center font-black text-navy border border-navy/10 group-hover:bg-navy group-hover:text-gold transition-all">{s.fullName.charAt(0)}</div>
                              <div>
                                 <p className="text-base font-black text-navy leading-none mb-1">{s.fullName}</p>
                                 <p className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest">SIS-ID: {s.id.slice(0, 10)}</p>
                              </div>
                           </td>
                           <td className="px-10 py-8 text-[11px] text-navy font-black tracking-tight">{s.email}</td>
                           <td className="px-10 py-8 text-[11px] text-slate-400 font-black italic">{s.dateOfBirth}</td>
                           <td className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{format(new Date(s.createdAt), 'MMM dd, yyyy')}</td>
                           <td className="px-10 py-8 text-right">
                              <button 
                                onClick={() => {
                                  setStudentId(s.id);
                                  setActiveTab('upload');
                                }}
                                className="px-6 py-2.5 bg-navy text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-navy/90 shadow-xl shadow-navy/20"
                              >
                                Issue Document
                              </button>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                 </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="mt-40 text-center opacity-40">
           <div className="flex flex-col items-center gap-6 grayscale">
              <div className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded-xl font-black text-navy text-lg opacity-50">AA</div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] leading-relaxed">
                 Accra Academy Registrar Administration<br/>
                 Secure Credentials Protocol Integrated
              </p>
           </div>
        </div>
      </main>
    </div>
  );
}

