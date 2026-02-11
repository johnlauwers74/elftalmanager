
import React, { useState } from 'react';
import { X, Mail, Lock, Play, Loader2, ArrowRight, ShieldCheck, User as UserIcon } from 'lucide-react';
import { Role } from '../types';

interface LoginModalProps {
  onClose: () => void;
  onLogin: (email: string, pass: string) => Promise<void>;
  onActivate: (email: string) => void;
  onDemoLogin: (role: Role) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLogin, onActivate, onDemoLogin }) => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    try {
      await onLogin(email, pass);
      // Succesvolle login sluit de modal via de enterDashboard flow in App.tsx
    } catch (error) {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200">
        <div className="bg-brand-dark p-8 text-white flex flex-col items-center relative text-center">
          <button 
            onClick={onClose} 
            disabled={loading}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          <div className="w-16 h-16 bg-brand-green rounded-full flex items-center justify-center mb-4 shadow-lg">
            <Play className="text-white fill-current" size={32} />
          </div>
          <h2 className="text-2xl font-bold">Welkom terug</h2>
          <p className="text-slate-400 text-sm">Log in op je ELFTALMANAGER account</p>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => onDemoLogin('ADMIN')}
              className="flex items-center justify-center gap-2 bg-purple-50 text-purple-700 py-3 rounded-xl font-bold text-sm hover:bg-purple-100 transition-all"
            >
              <ShieldCheck size={18} /> Admin Demo
            </button>
            <button 
              onClick={() => onDemoLogin('COACH')}
              className="flex items-center justify-center gap-2 bg-blue-50 text-blue-700 py-3 rounded-xl font-bold text-sm hover:bg-blue-100 transition-all"
            >
              <UserIcon size={18} /> Coach Demo
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400 tracking-widest"><span className="bg-white px-3">Of met e-mail</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="email" 
                placeholder="E-mail" 
                required
                disabled={loading}
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-green bg-slate-50"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="password" 
                placeholder="Wachtwoord" 
                required
                disabled={loading}
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-green bg-slate-50"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-brand-green hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Inloggen'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
