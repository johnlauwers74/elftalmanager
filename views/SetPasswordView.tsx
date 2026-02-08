import React, { useState, useMemo } from 'react';
import { ShieldCheck, Lock, ArrowRight, Loader2, ArrowLeft, Info, Check, X, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface SetPasswordViewProps {
  email: string;
  onSave: (pass: string) => Promise<void>;
  onCancel: () => void;
}

const SetPasswordView: React.FC<SetPasswordViewProps> = ({ email, onSave, onCancel }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // Fix: Explicitly type the state to avoid "Spread types may only be created from object types" error in functional updates
  const [touched, setTouched] = useState<{ password: boolean; confirm: boolean }>({ password: false, confirm: false });

  // Validatie criteria
  const validation = useMemo(() => {
    return {
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      match: password === confirm && confirm !== ''
    };
  }, [password, confirm]);

  const strengthScore = useMemo(() => {
    const scores = [
      validation.minLength,
      validation.hasUpper,
      validation.hasNumber,
      validation.hasSpecial
    ];
    return scores.filter(Boolean).length;
  }, [validation]);

  const isFormValid = validation.minLength && validation.hasUpper && validation.hasNumber && validation.hasSpecial && validation.match;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    setLoading(true);
    try {
      await onSave(password);
      setSuccess(true);
    } catch (err) {
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (strengthScore <= 1) return 'bg-red-500';
    if (strengthScore <= 3) return 'bg-orange-500';
    return 'bg-brand-green';
  };

  const getStrengthText = () => {
    if (password.length === 0) return '';
    if (strengthScore <= 1) return 'Zwak';
    if (strengthScore <= 3) return 'Gemiddeld';
    return 'Sterk';
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100 text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 text-brand-green rounded-full flex items-center justify-center mx-auto">
            <ShieldCheck size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Check je E-mail</h2>
          <p className="text-slate-600 leading-relaxed">
            We hebben een activatielink gestuurd naar <span className="font-bold text-slate-900">{email}</span>.
          </p>
          <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl text-left flex gap-3">
            <Info className="text-orange-500 shrink-0" size={20} />
            <div className="text-xs text-orange-800 space-y-2">
              <p><strong>Komt de mail niet aan?</strong></p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Check je spam-folder of ongewenste e-mail.</li>
                <li>Houd rekening met de limieten van de mailserver. Wacht eventueel een uur.</li>
              </ul>
            </div>
          </div>
          <button 
            onClick={onCancel}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors"
          >
            Terug naar de startpagina
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-300">
        <div className="bg-brand-dark p-8 text-center text-white relative">
          <button 
            onClick={onCancel} 
            disabled={loading}
            className="absolute left-4 top-4 text-slate-400 hover:text-white transition-colors disabled:opacity-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="w-16 h-16 bg-brand-green rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl font-bold">Account Activeren</h2>
          <p className="text-slate-400 mt-2 text-sm">Stel een veilig wachtwoord in voor <span className="text-white font-medium">{email}</span></p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Wachtwoord Veld */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Kies een Wachtwoord</label>
            <div className="relative">
              <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${touched.password ? (strengthScore >= 3 ? 'text-brand-green' : 'text-red-400') : 'text-slate-400'}`} size={20} />
              <input 
                type={showPassword ? "text" : "password"} 
                required
                disabled={loading}
                placeholder="Je geheime wachtwoord"
                className={`w-full pl-12 pr-12 py-3 border bg-white text-slate-900 rounded-xl outline-none transition-all disabled:opacity-50 ${touched.password ? (strengthScore >= 3 ? 'border-brand-green focus:ring-brand-green/20' : 'border-red-200 focus:ring-red-100') : 'border-slate-200 focus:ring-brand-green'}`}
                value={password}
                onBlur={() => setTouched(prev => ({...prev, password: true}))}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                title={showPassword ? "Wachtwoord verbergen" : "Wachtwoord tonen"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            
            {/* Sterkte Indicator */}
            {password.length > 0 && (
              <div className="space-y-2 pt-1 animate-in fade-in duration-300">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sterkte:</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${getStrengthColor().replace('bg-', 'text-')}`}>
                    {getStrengthText()}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${getStrengthColor()}`}
                    style={{ width: `${(strengthScore / 4) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {/* Real-time Checklist */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              {[
                { label: '8+ tekens', met: validation.minLength },
                { label: 'Hoofdletter', met: validation.hasUpper },
                { label: 'Cijfer', met: validation.hasNumber },
                { label: 'Symbool', met: validation.hasSpecial },
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-2 text-[10px] font-bold transition-colors ${item.met ? 'text-brand-green' : 'text-slate-300'}`}>
                  {item.met ? <Check size={12} /> : <X size={12} />}
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          {/* Bevestig Veld */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Bevestig Wachtwoord</label>
            <div className="relative">
              <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${touched.confirm ? (validation.match ? 'text-brand-green' : 'text-red-400') : 'text-slate-400'}`} size={20} />
              <input 
                type={showConfirm ? "text" : "password"} 
                required
                disabled={loading}
                placeholder="Herhaal je wachtwoord"
                className={`w-full pl-12 pr-12 py-3 border bg-white text-slate-900 rounded-xl outline-none transition-all disabled:opacity-50 ${touched.confirm ? (validation.match ? 'border-brand-green focus:ring-brand-green/20' : 'border-red-200 focus:ring-red-100') : 'border-slate-200 focus:ring-brand-green'}`}
                value={confirm}
                // Fix: Corrected setConfirm to setTouched to properly handle the object state for touched fields
                onBlur={() => setTouched(prev => ({...prev, confirm: true}))}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  setTouched(prev => ({...prev, confirm: true}));
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                title={showConfirm ? "Wachtwoord verbergen" : "Wachtwoord tonen"}
              >
                {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            
            {/* Mismatch Feedback */}
            {touched.confirm && confirm !== '' && !validation.match && (
              <div className="flex items-center gap-1.5 text-red-500 text-[10px] font-bold animate-in slide-in-from-top-1 duration-200 px-1">
                <AlertCircle size={12} />
                Wachtwoorden komen niet overeen
              </div>
            )}
            {touched.confirm && validation.match && (
              <div className="flex items-center gap-1.5 text-brand-green text-[10px] font-bold animate-in slide-in-from-top-1 duration-200 px-1">
                <Check size={12} />
                Wachtwoorden zijn gelijk
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading || !isFormValid}
            className="w-full bg-brand-green hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 disabled:grayscale"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} /> Bezig...
              </>
            ) : (
              <>
                Account Activeren <ArrowRight size={20} />
              </>
            )}
          </button>
          
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
             <p className="text-[10px] text-slate-500 leading-relaxed text-center">
              Door je account te activeren ga je akkoord met onze coachings-voorwaarden. Je ontvangt direct daarna een verificatie-mail.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetPasswordView;