
import React from 'react';
import { CheckCircle, Shield, Zap, Mail, ChevronRight, BookOpen, Users, Loader2, AlertCircle } from 'lucide-react';
import Logo from './Logo';

interface LandingPageProps {
  onLogin: () => void;
  onSubscribe: (email: string, name: string) => Promise<void>;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onSubscribe }) => {
  const [email, setEmail] = React.useState('');
  const [name, setName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubscribe(email, name);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Er is iets misgegaan. Probeer het later opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  const scrollToSubscribe = () => {
    document.getElementById('subscribe')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white transition-colors duration-300">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-brand-dark text-white">
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="animate-in fade-in slide-in-from-left duration-700">
              <Logo light={true} showTagline={true} className="mb-10 scale-125 origin-left" />
              <h1 className="text-5xl md:text-7xl font-black leading-tight mb-8">
                De tactiek van <br/>
                <span className="text-brand-green">morgen</span> start vandaag.
              </h1>
              <p className="text-xl text-slate-300 mb-10 max-w-lg leading-relaxed">
                Beheer je elftal als een pro. Van geavanceerde oefeningen tot diepgaande podcasts – alles wat je nodig hebt om te groeien als coach.
              </p>
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={scrollToSubscribe}
                  className="bg-brand-green hover:bg-emerald-600 px-10 py-5 rounded-2xl font-black text-lg transition-all transform hover:scale-105 shadow-xl shadow-brand-green/20"
                >
                  Start Nu Gratis
                </button>
                <button 
                  onClick={onLogin}
                  className="bg-white/5 border-2 border-white/10 hover:border-brand-green px-10 py-5 rounded-2xl font-black text-lg transition-all"
                >
                  Inloggen
                </button>
              </div>
            </div>
            <div className="hidden md:block animate-in fade-in slide-in-from-right duration-700">
              <div className="relative">
                <div className="absolute -inset-4 bg-brand-green/20 blur-3xl rounded-full"></div>
                <img 
                  src="https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&q=80&w=800" 
                  alt="Football coaching" 
                  className="relative rounded-3xl shadow-2xl border border-white/10 transform rotate-1 hover:rotate-0 transition-transform duration-500" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-black text-brand-dark">Het Platform</h2>
          <p className="text-slate-500 mt-4 text-lg">Ontworpen voor en door voetbalcoaches.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-10">
          {[
            { title: "Training", desc: "Maak en beheer professionele oefeningen. Gebruik AI voor inspiratie en print ze direct uit voor op het veld.", icon: Zap, color: "brand-green" },
            { title: "Artikelen", desc: "Blijf op de hoogte met diepgaande tactische analyses en de laatste trends in de voetbalwereld.", icon: BookOpen, color: "blue-500" },
            { title: "Podcasts", desc: "Luister naar ervaringen van topcoaches en experts terwijl je onderweg bent naar de club.", icon: Users, color: "purple-500" },
          ].map((feature, i) => (
            <div key={i} className="group p-10 border border-slate-100 rounded-3xl hover:shadow-2xl transition-all bg-white relative overflow-hidden">
               <div className={`absolute top-0 right-0 w-2 h-full bg-${feature.color}`}></div>
              <div className={`w-14 h-14 bg-brand-green/10 text-brand-green rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                <feature.icon size={28} />
              </div>
              <h3 className="text-2xl font-black mb-4 uppercase tracking-tight text-brand-dark">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed text-lg">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Subscription Form */}
      <div id="subscribe" className="bg-brand-light py-32 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {submitted ? (
            <div className="bg-white p-16 rounded-3xl shadow-2xl border animate-in zoom-in duration-300">
              <CheckCircle size={80} className="text-brand-green mx-auto mb-8 animate-bounce" />
              <h2 className="text-4xl font-black mb-6">Aanvraag Verzonden!</h2>
              <p className="text-slate-600 text-lg leading-relaxed">
                Bedankt coach! Onze admins bekijken je aanvraag binnen 24 uur. Houd je inbox in de gaten voor je activatielink.
              </p>
            </div>
          ) : (
            <div className="bg-white p-10 md:p-16 rounded-3xl shadow-2xl border relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-brand-green"></div>
              <h2 className="text-4xl font-black mb-4 text-brand-dark">Word Elftalmanager</h2>
              <p className="text-slate-500 mb-10 text-lg">Krijg direct toegang tot de volledige database en tools.</p>
              
              {error && (
                <div className="max-w-md mx-auto mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle size={20} className="shrink-0" />
                  <p className="text-sm font-bold text-left">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5 max-w-md mx-auto">
                <input
                  type="text"
                  placeholder="Volledige Naam"
                  required
                  disabled={loading}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-6 py-5 border border-slate-200 bg-white text-slate-900 rounded-2xl focus:ring-2 focus:ring-brand-green outline-none font-bold transition-all disabled:opacity-50"
                />
                <input
                  type="email"
                  placeholder="E-mail adres"
                  required
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-6 py-5 border border-slate-200 bg-white text-slate-900 rounded-2xl focus:ring-2 focus:ring-brand-green outline-none font-bold transition-all disabled:opacity-50"
                />
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-brand-dark hover:bg-brand-green text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 text-lg shadow-xl disabled:opacity-70 disabled:cursor-not-allowed group"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={24} /> Bezig met verzenden...
                    </>
                  ) : (
                    <>
                      Aanvraag Versturen <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
