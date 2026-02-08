
import React from 'react';
import { Play, BookOpen, Users, Calendar, ArrowRight } from 'lucide-react';

interface DashboardProps {
  exercisesCount: number;
  articlesCount: number;
}

const Dashboard: React.FC<DashboardProps> = ({ exercisesCount, articlesCount }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-brand-dark tracking-tight">Welkom terug, Coach!</h1>
        <p className="text-slate-500 mt-2 text-lg font-medium">Beheer je team en blijf jezelf ontwikkelen.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 transition-all hover:shadow-md group">
          <div className="w-14 h-14 bg-brand-green/10 text-brand-green rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Play size={28} className="fill-current" />
          </div>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Oefeningen</p>
          <p className="text-5xl font-black mt-2 text-brand-dark">{exercisesCount}</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 transition-all hover:shadow-md group">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <BookOpen size={28} />
          </div>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Artikelen</p>
          <p className="text-5xl font-black mt-2 text-brand-dark">{articlesCount}</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 transition-all hover:shadow-md group">
          <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Users size={28} />
          </div>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Leden</p>
          <p className="text-5xl font-black mt-2 text-brand-dark">124</p>
        </div>

        <div className="bg-brand-green p-8 rounded-3xl shadow-xl shadow-brand-green/20 text-white transition-all hover:scale-[1.02] group">
          <div className="w-14 h-14 bg-white/20 text-white rounded-2xl flex items-center justify-center mb-6">
            <Calendar size={28} />
          </div>
          <p className="text-white/70 text-sm font-bold uppercase tracking-wider">Volgende Training</p>
          <p className="text-2xl font-black mt-2">Morgen 18:30</p>
          <p className="text-sm font-bold mt-1 text-white/90">U15 - Veld 2</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-brand-dark uppercase tracking-tight">Recent Toegevoegd</h2>
            <button className="text-brand-green font-black flex items-center gap-2 hover:translate-x-1 transition-all">Alles bekijken <ArrowRight size={20} /></button>
          </div>
          <div className="bg-white rounded-3xl border border-slate-100 divide-y divide-slate-100 overflow-hidden shadow-sm">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-6 hover:bg-slate-50 transition-all flex items-center gap-6 cursor-pointer group text-slate-900">
                <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden">
                  <Play className="text-slate-300 group-hover:scale-125 transition-transform" />
                </div>
                <div>
                  <h4 className="font-black text-xl group-hover:text-brand-green transition-colors">Tactische Drukzetting {i}</h4>
                  <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-widest">U13 • TECHNISCH • 12 DEC</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <h2 className="text-2xl font-black text-brand-dark uppercase tracking-tight">Branding Update</h2>
          <div className="bg-brand-dark rounded-3xl p-10 text-white relative overflow-hidden shadow-2xl border border-white/5">
            <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-brand-green/20 blur-[100px] rounded-full"></div>
            <p className="text-brand-green text-xs font-black uppercase tracking-[0.3em] mb-4">Nieuw Design</p>
            <h3 className="text-3xl font-black mb-6 leading-tight">Welkom bij de vernieuwde Elftalmanager</h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-8">
              We hebben onze visuele identiteit opgefrist om beter aan te sluiten bij de professionele coaching wereld.
            </p>
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-brand-green rounded-lg flex items-center justify-center font-black">E</div>
               <span className="font-bold text-slate-300 italic">Be Bold. Be Professional.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
