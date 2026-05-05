import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api.ts';
import { Shield, LogOut, Loader2, Activity, Users, FileStack, Search, Clock, MapPin, Monitor, Edit2, Trash2, X, Plus, Download } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

interface AuditLog {
  id: string;
  user_id: string;
  userName: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

interface User {
  id: string;
  fullName: string;
  role: string;
  email: string;
  dateOfBirth: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'audit' | 'users'>('audit');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      navigate('/login');
      return;
    }
    const parsed = JSON.parse(savedUser);
    if (parsed.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    setUser(parsed);
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const [logData, userData, statsData] = await Promise.all([
        apiFetch('/admin/audit-logs'),
        apiFetch('/admin/users'),
        apiFetch('/admin/stats')
      ]);
      setLogs(logData);
      setUsers(userData);
      setStats(statsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/audit-logs/export', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Audit_Logs_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Failed to export logs');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await apiFetch(`/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify(editingUser)
      });
      setEditingUser(null);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to permanently revoke access for this identity? This will purge all associated records.')) return;
    try {
      await apiFetch(`/admin/users/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err: any) {
      alert(err.message);
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
      <nav className="bg-navy border-b border-white/5 sticky top-0 z-50 shadow-2xl shadow-navy/20">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-gold rounded-xl flex items-center justify-center font-bold text-navy shadow-lg">
              AA
            </div>
            <div>
              <span className="text-xl font-black text-white tracking-tight block leading-none">Accra Academy</span>
              <span className="text-[9px] font-bold text-red-400 uppercase tracking-[0.3em] mt-1 block">Global Identity Administration</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3 pr-6 border-r border-white/10">
              <div className="text-right">
                <div className="text-xs font-black text-white">{user?.fullName}</div>
                <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest tracking-[0.2em]">Master Admin</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 border border-red-500/30 font-black text-xs">
                {user?.fullName.charAt(0)}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-3 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 rounded-2xl transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-16">
        <AnimatePresence>
          {editingUser && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/60 backdrop-blur-md"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl"
              >
                <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-black text-navy tracking-tight leading-none mb-2">Identity Modification</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Digital Registry: {editingUser.id.slice(0, 16)}</p>
                  </div>
                  <button onClick={() => setEditingUser(null)} className="p-3 hover:bg-slate-50 rounded-2xl transition-all">
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>
                <form onSubmit={handleUpdateUser} className="p-10 space-y-8">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Official Full Name</label>
                      <input 
                        type="text" 
                        value={editingUser.fullName}
                        onChange={e => setEditingUser({...editingUser, fullName: e.target.value})}
                        className="input-academic" 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Communication Protocol (Email)</label>
                      <input 
                        type="email" 
                        value={editingUser.email}
                        onChange={e => setEditingUser({...editingUser, email: e.target.value})}
                        className="input-academic" 
                        required 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Privilege Tier</label>
                        <select 
                          value={editingUser.role}
                          onChange={e => setEditingUser({...editingUser, role: e.target.value})}
                          className="input-academic"
                        >
                          <option value="student">Student Registry</option>
                          <option value="staff">Faculty Registry</option>
                          <option value="admin">Global Administrator</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Birth Declaration</label>
                        <input 
                          type="date" 
                          value={editingUser.dateOfBirth}
                          onChange={e => setEditingUser({...editingUser, dateOfBirth: e.target.value})}
                          className="input-academic" 
                        />
                      </div>
                    </div>
                  </div>
                  <div className="pt-6 flex gap-3">
                    <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-4 text-sm font-bold text-slate-400 hover:bg-slate-50 rounded-2xl transition-all uppercase tracking-widest">Abort</button>
                    <button type="submit" className="btn-primary flex-1 py-4 text-sm uppercase tracking-widest">Sign & Authorize</button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-20">
          {[
            { label: 'Total Registrants', count: users.length, icon: Users, color: 'navy' },
            { label: 'Official Transcripts', count: stats?.transcripts?.count || 0, icon: FileStack, color: 'navy' },
            { label: 'Pending Requests', count: stats?.requests?.find((r: any) => r.status === 'pending')?.count || 0, icon: Clock, color: 'gold' },
            { label: '24h Activity', count: stats?.recentActivity?.count || 0, icon: Activity, color: 'emerald' },
          ].map((stat, i) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-navy/5 flex items-center gap-5 group hover:scale-[1.02] transition-all"
            >
              <div className={`w-14 h-14 bg-${stat.color === 'emerald' ? 'emerald-50' : stat.color === 'gold' ? 'gold/10' : 'navy/5'} text-${stat.color === 'emerald' ? 'emerald-600' : stat.color === 'gold' ? 'gold' : 'navy'} rounded-2xl flex items-center justify-center transition-all group-hover:scale-110`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 leading-none">{stat.label}</div>
                <div className="text-2xl font-black text-navy leading-none tracking-tighter">{stat.count}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-12">
          <div className="flex p-1.5 bg-slate-100 rounded-2xl w-fit shadow-inner">
            <button 
              onClick={() => setActiveTab('audit')}
              className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'audit' ? 'bg-white shadow-xl shadow-navy/5 text-navy' : 'text-slate-400 hover:text-navy'}`}
            >
              System Encryption Audit
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-white shadow-xl shadow-navy/5 text-navy' : 'text-slate-400 hover:text-navy'}`}
            >
              Master Identity Registry
            </button>
          </div>
          
          <div className="flex items-center gap-4">
             {activeTab === 'audit' && (
               <button 
                onClick={handleExportLogs}
                className="flex items-center gap-3 px-6 h-12 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-navy hover:bg-navy hover:text-white transition-all shadow-sm"
               >
                 <Download className="w-4 h-4" />
                 Download Ledger Export
               </button>
             )}
             <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input type="text" placeholder="Filter global registry..." className="input-academic pl-12 pr-6 py-3 w-72 h-12 shadow-inner bg-slate-100/50 border-transparent" />
             </div>
             <button 
              onClick={() => navigate('/register')}
              className="btn-primary h-12 px-8 uppercase tracking-widest text-[11px]"
             >
               <Plus className="w-4 h-4" />
               New Identity Enrollment
             </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'audit' ? (
            <motion.div 
              key="audit"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-2xl shadow-navy/5"
            >
              <div className="px-10 py-8 border-b border-slate-50 bg-white flex items-center justify-between">
                <h2 className="text-xs font-black text-navy flex items-center gap-4 uppercase tracking-[0.2em]">
                  <Clock className="w-5 h-5 text-gold" />
                  Global Transaction Immutable Ledger
                </h2>
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black border border-emerald-100">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                   AUTHENTICATED
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-50 bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      <th className="px-10 py-6">Event Timestamp</th>
                      <th className="px-10 py-6">Identity Origin</th>
                      <th className="px-10 py-6">Operation</th>
                      <th className="px-10 py-6">Target Resource</th>
                      <th className="px-10 py-6 text-right">System Signature</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-all group">
                        <td className="px-10 py-8 font-mono text-[11px] text-slate-500 italic">
                          {format(new Date(log.created_at), 'MM/dd HH:mm:ss')}
                        </td>
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-navy text-gold flex items-center justify-center font-black text-[11px] shadow-lg shadow-navy/10">
                              {log.userName?.slice(0, 1) || '?'}
                            </div>
                            <div>
                              <div className="text-sm font-black text-navy leading-none mb-1">{log.userName || 'SYSTEM_DAEMON'}</div>
                              <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">ID: {log.user_id?.slice(0, 8) || 'ROOT'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-inner ${
                            log.action === 'UPLOAD' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            log.action === 'LOGIN' ? 'bg-navy text-gold' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-10 py-8">
                          <div className="text-[10px] font-black text-navy uppercase tracking-widest mb-1">{log.resource_type}</div>
                          <div className="text-[10px] font-mono text-slate-400 font-bold italic truncate max-w-[150px]">PTR_{log.resource_id?.slice(0, 12)}</div>
                        </td>
                        <td className="px-10 py-8 text-right">
                          <div className="text-[10px] font-mono text-slate-400 font-bold uppercase mb-1">
                            LOG {log.ip_address}
                          </div>
                          <div className="text-[9px] text-slate-300 truncate max-w-[140px] ml-auto italic group-hover:text-slate-500 transition-colors uppercase font-bold">{log.user_agent}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="users"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-2xl shadow-navy/5"
            >
              <div className="px-10 py-8 border-b border-slate-50 bg-white flex justify-between items-center">
                 <h2 className="text-xs font-black text-navy uppercase tracking-[0.2em] flex items-center gap-4">
                    <Users className="w-5 h-5 text-gold" />
                    Master Enrollment Registry
                 </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-50 bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      <th className="px-10 py-6">Official Identity</th>
                      <th className="px-10 py-6">Access Tier</th>
                      <th className="px-10 py-6">Authenticated Email</th>
                      <th className="px-10 py-6">Registered Birth</th>
                      <th className="px-10 py-6">Enrollment Date</th>
                      <th className="px-10 py-6 text-right">Registry Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-all group">
                        <td className="px-10 py-8 flex items-center gap-5">
                          <div className="w-12 h-12 rounded-[1.25rem] bg-navy text-gold flex items-center justify-center font-black text-base shadow-xl shadow-navy/10 group-hover:scale-110 transition-all">{u.fullName.charAt(0)}</div>
                          <div>
                            <p className="text-base font-black text-navy leading-none mb-1">{u.fullName}</p>
                            <p className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest">SIS_{u.id.slice(0, 10)}</p>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <span className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] shadow-inner ${
                            u.role === 'admin' ? 'bg-red-500 text-white shadow-red-200' :
                            u.role === 'staff' ? 'bg-navy text-white shadow-navy/10' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-10 py-8 text-[11px] font-black text-navy tracking-tight">{u.email}</td>
                        <td className="px-10 py-8 text-[11px] text-slate-400 font-black italic">{u.dateOfBirth || 'N/A'}</td>
                        <td className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                           {format(new Date(u.createdAt), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-10 py-8 text-right">
                          <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                             <button 
                              onClick={() => setEditingUser(u)}
                              className="w-10 h-10 bg-white border border-slate-100 text-gold rounded-xl flex items-center justify-center hover:bg-gold hover:text-navy hover:border-gold transition-all shadow-sm"
                             >
                                <Edit2 className="w-4 h-4" />
                             </button>
                             <button 
                              onClick={() => handleDeleteUser(u.id)}
                              className="w-10 h-10 bg-white border border-slate-100 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-sm"
                             >
                                <Trash2 className="w-4 h-4" />
                             </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="mt-40 text-center flex flex-col items-center gap-10 opacity-30 grayscale">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center font-black text-navy text-3xl">AA</div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] leading-relaxed max-w-sm">
               Accra Academy Master Security Administrator<br/>
               SIS-PROTOCOL-ACAD-ADM-V4
            </p>
        </div>
      </main>
    </div>
  );
}

