
import React, { useState } from 'react';
import { User, Role, UserStatus } from '../types';
import { Check, X, UserCheck, ShieldAlert, Clock, UserPlus, UserMinus, Shield, ShieldOff, Copy, CheckCircle2, Key } from 'lucide-react';

interface AdminUserViewProps {
  users: User[];
  onApprove: (id: string) => void;
  onUpdateRole: (id: string, newRole: Role) => void;
  onToggleStatus: (id: string, currentStatus: UserStatus) => void;
  currentAdminId: string;
}

const AdminUserView: React.FC<AdminUserViewProps> = ({ users, onApprove, onUpdateRole, onToggleStatus, currentAdminId }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const pending = users.filter(u => u.status === 'PENDING');
  const approved = users.filter(u => u.status === 'APPROVED');
  const active = users.filter(u => u.status === 'ACTIVE');
  const inactive = users.filter(u => u.status === 'INACTIVE');

  const copyInviteLink = (email: string, id: string) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const link = `${baseUrl}?activate=${encodeURIComponent(email)}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 text-slate-900">
        <div>
          <h1 className="text-4xl font-black">Beheer</h1>
          <p className="text-slate-500 text-lg">Beheer rollen, keur aanvragen goed en deactiveer accounts.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="bg-orange-50 text-orange-700 border border-orange-100 px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm">
            <Clock size={18} /> {pending.length} Wachtend
          </div>
          <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm">
            <UserCheck size={18} /> {active.length} Actief
          </div>
        </div>
      </div>

      {/* Pending Requests */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-700">
          <UserPlus size={20} className="text-brand-green" /> Nieuwe Aanvragen
        </h2>
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 divide-y divide-slate-100 overflow-hidden">
          {pending.length === 0 ? (
            <div className="p-10 text-center text-slate-400 italic">Geen nieuwe aanvragen.</div>
          ) : (
            pending.map(u => (
              <div key={u.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div>
                  <h4 className="font-bold text-lg text-slate-900">{u.name}</h4>
                  <p className="text-slate-500 text-sm">{u.email}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => onApprove(u.id)}
                    className="bg-brand-green text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center gap-2"
                  >
                    <Check size={18} /> Goedkeuren
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Active Users Table */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4 text-slate-700">Gebruikerslijst</h2>
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-4 font-bold text-slate-600 text-sm">Naam / E-mail</th>
                <th className="p-4 font-bold text-slate-600 text-sm">Rol</th>
                <th className="p-4 font-bold text-slate-600 text-sm">Status</th>
                <th className="p-4 font-bold text-slate-600 text-sm text-right">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[...active, ...approved, ...inactive].map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      {u.name}
                      {u.id === currentAdminId && <span className="text-[9px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-black">JIJ</span>}
                    </div>
                    <div className="text-xs text-slate-400">{u.email}</div>
                  </td>
                  <td className="p-4">
                    <select 
                      disabled={u.id === currentAdminId}
                      value={u.role}
                      onChange={(e) => onUpdateRole(u.id, e.target.value as Role)}
                      className={`text-[10px] font-black px-2 py-1 rounded outline-none border-none cursor-pointer ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}
                    >
                      <option value="COACH">COACH</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <span className={`text-[9px] font-black px-2 py-1 rounded uppercase ${
                      u.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 
                      u.status === 'APPROVED' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => copyInviteLink(u.email, u.id)}
                        className={`p-2 rounded-lg transition-all ${copiedId === u.id ? 'bg-brand-green text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        title="Kopieer Wachtwoord-instel Link"
                      >
                        {copiedId === u.id ? <Check size={18} /> : <Key size={18} />}
                      </button>
                      
                      {u.id !== currentAdminId && (
                        <button 
                          onClick={() => onToggleStatus(u.id, u.status)}
                          className={`p-2 rounded-lg transition-all ${u.status === 'INACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}
                          title={u.status === 'INACTIVE' ? 'Activeren' : 'Deactiveren'}
                        >
                          {u.status === 'INACTIVE' ? <Shield size={18} /> : <ShieldOff size={18} />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-slate-400 italic">
          Tip: Gebruik het <Key size={12} className="inline" /> icoontje om een link te genereren waarmee een gebruiker zijn (eerste) wachtwoord kan instellen.
        </p>
      </section>
    </div>
  );
};

export default AdminUserView;
