
import React from 'react';
import { Podcast } from '../types';
import { Play, Plus, Mic, Headphones, Volume2 } from 'lucide-react';

interface PodcastViewProps {
  podcasts: Podcast[];
  isAdmin: boolean;
  onAddPodcast: (p: Podcast) => void;
}

const PodcastView: React.FC<PodcastViewProps> = ({ podcasts, isAdmin, onAddPodcast }) => {
  const mockPodcasts: Podcast[] = [
    {
      id: 'p1',
      title: 'Episode 42: De weg naar het eerste elftal',
      description: 'In deze aflevering praten we met Peter over de overgang van U21 naar het A-team.',
      audioUrl: '#',
      duration: '45:20',
      date: '12 Dec 2023'
    },
    {
      id: 'p2',
      title: 'Episode 41: Data in het amateurvoetbal',
      description: 'Zijn GPS-trackers en video-analyse betaalbaar voor iedereen?',
      audioUrl: '#',
      duration: '38:15',
      date: '05 Dec 2023'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 text-slate-900">
        <div>
          <h1 className="text-3xl font-bold">Podcasts</h1>
          <p className="text-slate-500">Leer onderweg van andere coaches en specialisten.</p>
        </div>
        {isAdmin && (
          <button className="bg-brand-green hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all">
            <Mic size={20} /> Nieuwe Opname
          </button>
        )}
      </div>

      <div className="bg-brand-dark rounded-3xl p-8 mb-12 text-white relative overflow-hidden flex flex-col md:flex-row gap-8 items-center shadow-2xl transition-colors duration-300">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Headphones size={200} />
        </div>
        <div className="w-48 h-48 bg-brand-green rounded-2xl flex items-center justify-center shrink-0 shadow-lg relative z-10 group cursor-pointer">
          <Play size={64} className="fill-white group-hover:scale-110 transition-transform" />
        </div>
        <div className="relative z-10 text-center md:text-left">
          <span className="bg-brand-green text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full">Uitgelicht</span>
          <h2 className="text-4xl font-black mt-4 mb-2">Mentaliteit boven Talent?</h2>
          <p className="text-slate-300 text-lg max-w-lg mb-6 leading-relaxed">Gesprek met ex-bondscoach over de psychologische kant van scouting.</p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button className="bg-white text-brand-dark px-8 py-3 rounded-xl font-bold hover:bg-emerald-50 transition-all shadow-lg">Nu Luisteren</button>
            <span className="text-slate-400 font-medium">Duur: 52:10</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold mb-6 text-slate-900">Recent Toegevoegd</h3>
        {mockPodcasts.map(pod => (
          <div key={pod.id} className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center justify-between hover:border-emerald-200 hover:bg-emerald-50/30 transition-all group cursor-pointer text-slate-900 shadow-sm">
            <div className="flex items-center gap-4">
              <button className="w-12 h-12 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center group-hover:bg-brand-green group-hover:text-white transition-all shadow-sm">
                <Play size={20} className="fill-current" />
              </button>
              <div>
                <h4 className="font-bold text-lg text-slate-900">{pod.title}</h4>
                <p className="text-sm text-slate-500">{pod.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-sm text-slate-400 flex items-center gap-1"><Volume2 size={16} /> {pod.duration}</span>
              <span className="text-sm text-slate-400 hidden sm:block">{pod.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PodcastView;
