
import React, { useState, useMemo } from 'react';
import { Exercise } from '../types';
import { Search, Filter, Plus, FileDown, Edit3, Play, ChevronLeft, Loader2 } from 'lucide-react';
import { downloadAsPDF } from '../services/pdfService';

interface ExerciseListProps {
  exercises: Exercise[];
  onAdd: () => void;
  onEdit: (ex: Exercise) => void;
  isAdmin: boolean;
}

const ExerciseList: React.FC<ExerciseListProps> = ({ exercises, onAdd, onEdit, isAdmin }) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('Alle');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => {
      const matchesSearch = ex.title.toLowerCase().includes(search.toLowerCase()) || 
                           ex.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
      const matchesType = filterType === 'Alle' || ex.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [exercises, search, filterType]);

  const uniqueTypes = useMemo(() => {
    return ['Alle', ...new Set(exercises.map(ex => ex.type))];
  }, [exercises]);

  const handleDownloadPDF = async () => {
    if (!selectedExercise) return;
    setIsGeneratingPDF(true);
    await downloadAsPDF('exercise-print-area', `oefening_${selectedExercise.title}`);
    setIsGeneratingPDF(false);
  };

  if (selectedExercise) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-xl my-8 border border-slate-100 transition-all duration-300">
        
        <div className="flex justify-between items-center mb-6 no-print">
          <button 
            onClick={() => setSelectedExercise(null)} 
            className="flex items-center gap-1 text-brand-green hover:text-emerald-700 font-bold transition-colors"
          >
            <ChevronLeft size={20} /> Terug naar overzicht
          </button>
          <div className="flex gap-2">
            {isAdmin && (
              <button 
                onClick={() => onEdit(selectedExercise)}
                className="flex items-center gap-2 bg-emerald-50 text-brand-green hover:bg-emerald-100 px-4 py-2 rounded-lg font-bold transition-colors"
              >
                <Edit3 size={18} /> Bewerken
              </button>
            )}
            <button 
              onClick={handleDownloadPDF} 
              disabled={isGeneratingPDF}
              className="flex items-center gap-2 bg-brand-dark text-white hover:bg-black px-6 py-2 rounded-lg font-bold transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> PDF maken...
                </>
              ) : (
                <>
                  <FileDown size={18} /> Download PDF
                </>
              )}
            </button>
          </div>
        </div>
        
        <div id="exercise-print-area" className="bg-white p-4">
          <header className="mb-6 border-b-4 border-brand-green pb-4">
            <h1 className="text-4xl font-black mb-1 text-slate-900 leading-tight uppercase tracking-tight">{selectedExercise.title}</h1>
            <p className="text-brand-green font-black uppercase tracking-[0.2em] text-xs">ELFTALMANAGER TRAININGSSCHEMA</p>
          </header>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-6 bg-slate-50 rounded-2xl">
            <div>
              <span className="text-slate-400 text-[10px] block uppercase font-black tracking-widest mb-1">Type</span>
              <span className="font-bold text-slate-900">{selectedExercise.type}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block uppercase font-black tracking-widest mb-1">Leeftijd</span>
              <span className="font-bold text-slate-900">{selectedExercise.ageGroup}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block uppercase font-black tracking-widest mb-1">Spelers</span>
              <span className="font-bold text-slate-900">{selectedExercise.playersCount}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block uppercase font-black tracking-widest mb-1">Datum</span>
              <span className="font-bold text-slate-900">{new Date(selectedExercise.createdAt).toLocaleDateString('nl-BE')}</span>
            </div>
          </div>
          
          <div className="mb-10 text-left">
            <h2 className="text-xl font-black mb-4 text-brand-dark uppercase tracking-tight border-l-4 border-brand-green pl-4">
               Focus van de training
            </h2>
            <p className="text-slate-700 leading-relaxed text-lg">{selectedExercise.shortDescription}</p>
          </div>

          <div className="mb-10 text-left">
            <h2 className="text-xl font-black mb-4 text-brand-dark uppercase tracking-tight border-l-4 border-brand-green pl-4">
               Omschrijving (Instructies)
            </h2>
            <div className="text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
              {selectedExercise.description}
            </div>
          </div>

          {selectedExercise.image && (
            <div className="mb-10">
              <h2 className="text-xl font-black mb-4 text-brand-dark uppercase tracking-tight border-l-4 border-brand-green pl-4">Veldopstelling</h2>
              <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-inner overflow-hidden">
                <img src={selectedExercise.image} alt="Veldopstelling Diagram" className="w-full max-h-[600px] object-contain mx-auto" crossOrigin="anonymous" />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 no-print mt-8">
            {selectedExercise.tags.map(t => (
              <span key={t} className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-slate-200">#{t}</span>
            ))}
          </div>
          
          <footer className="mt-20 pt-8 border-t border-slate-200 text-center">
            <div className="text-brand-dark font-black text-lg mb-1">ELFTALMANAGER</div>
            <div className="text-slate-400 text-[10px] uppercase tracking-[0.2em]">De tactiek van morgen start vandaag.</div>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-black text-brand-dark tracking-tight">Oefeningen Database</h1>
          <p className="text-slate-500 font-medium">Beheer en ontdek professioneel trainingsmateriaal.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={onAdd}
            className="flex items-center gap-2 bg-brand-green hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-brand-green/20 transform hover:scale-[1.02] active:scale-95"
          >
            <Plus size={20} /> Nieuwe Oefening
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-grow">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Zoek op titel, thema of tag..."
            className="w-full pl-14 pr-6 py-4 border border-slate-200 bg-white text-slate-900 rounded-2xl outline-none focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green transition-all shadow-sm font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <Filter size={20} className="text-slate-500" />
          </div>
          <select 
            className="bg-white border border-slate-200 text-slate-700 px-6 py-4 rounded-2xl outline-none focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green transition-all shadow-sm font-bold cursor-pointer"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredExercises.map(ex => (
          <div 
            key={ex.id} 
            className="bg-white rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group cursor-pointer flex flex-col"
            onClick={() => setSelectedExercise(ex)}
          >
            <div className="relative h-56 overflow-hidden">
              {ex.image ? (
                <img src={ex.image} alt={ex.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" crossOrigin="anonymous" />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center transition-colors group-hover:bg-slate-200">
                  <Play className="text-slate-300" size={48} />
                </div>
              )}
              <div className="absolute top-4 left-4">
                <span className="bg-brand-dark/80 backdrop-blur text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">{ex.type}</span>
              </div>
            </div>
            <div className="p-8 flex-grow flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <span className="text-brand-green font-black text-xs uppercase tracking-widest">{ex.ageGroup}</span>
                <span className="text-slate-400 text-xs font-bold">{ex.playersCount} Spelers</span>
              </div>
              <h3 className="text-2xl font-black mb-3 text-brand-dark group-hover:text-brand-green transition-colors leading-tight uppercase tracking-tight">{ex.title}</h3>
              <p className="text-slate-500 text-sm line-clamp-2 mb-6 font-medium leading-relaxed">{ex.shortDescription}</p>
              <div className="mt-auto flex flex-wrap gap-2">
                {ex.tags.slice(0, 2).map(t => (
                  <span key={t} className="bg-slate-50 text-slate-400 text-[10px] px-3 py-1 rounded-full border border-slate-100 uppercase font-black tracking-tighter">#{t}</span>
                ))}
                {ex.tags.length > 2 && <span className="text-slate-300 text-[10px] font-black py-1">+{ex.tags.length - 2}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredExercises.length === 0 && (
        <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Play className="text-slate-300" size={40} />
          </div>
          <h3 className="text-2xl font-black text-brand-dark uppercase tracking-tight">Niets gevonden</h3>
          <p className="text-slate-400 mt-2 font-medium">Pas je zoekterm aan of voeg een nieuwe oefening toe.</p>
        </div>
      )}
    </div>
  );
};

export default ExerciseList;
