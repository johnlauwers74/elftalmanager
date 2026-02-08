
import React, { useState, useEffect } from 'react';
import { Exercise } from '../types';
import { Save, X, Image as ImageIcon, Sparkles, Loader2 } from 'lucide-react';
import { generateExerciseSuggestions } from '../services/geminiService';

interface ExerciseFormProps {
  onSave: (ex: Exercise) => void;
  onCancel: () => void;
  initialData?: Exercise;
}

const ExerciseForm: React.FC<ExerciseFormProps> = ({ onSave, onCancel, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Exercise>>({
    title: '',
    type: 'Technisch',
    ageGroup: 'U12',
    playersCount: '10',
    shortDescription: '',
    detailedInstructions: '',
    tags: [],
    image: ''
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAISuggest = async () => {
    if (!formData.title) {
      alert('Vul eerst een thema of titel in voor AI suggesties.');
      return;
    }
    setLoading(true);
    const suggestion = await generateExerciseSuggestions(formData.title);
    if (suggestion) {
      setFormData(prev => ({ ...prev, ...suggestion }));
    }
    setLoading(false);
  };

  const addTag = () => {
    if (tagInput && !formData.tags?.includes(tagInput)) {
      setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), tagInput] }));
      setTagInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ex: Exercise = {
      ...formData as Exercise,
      id: initialData?.id || '',
      createdAt: initialData?.createdAt || new Date().toISOString()
    };
    onSave(ex);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-slate-100 transition-colors">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900">
            {initialData ? 'Oefening Bewerken' : 'Nieuwe Oefening'}
          </h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Titel / Thema</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  required
                  placeholder="Bijv. Positiespel 4v4"
                  className="flex-grow border border-slate-200 bg-white text-slate-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-green transition-colors"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
                {!initialData && (
                  <button 
                    type="button"
                    onClick={handleAISuggest}
                    disabled={loading}
                    className="bg-emerald-50 text-brand-green px-4 py-3 rounded-xl hover:bg-emerald-100 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                    AI
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Type Oefening</label>
              <select 
                className="w-full border border-slate-200 bg-white text-slate-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-green transition-colors"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              >
                <option>Technisch</option>
                <option>Tactisch</option>
                <option>Fysiek</option>
                <option>Mentaal</option>
                <option>Keepers</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Leeftijdscategorie</label>
              <input 
                type="text" 
                placeholder="Bijv. U13-U15"
                className="w-full border border-slate-200 bg-white text-slate-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-green transition-colors"
                value={formData.ageGroup}
                onChange={(e) => setFormData(prev => ({ ...prev, ageGroup: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Spelers</label>
              <input 
                type="text" 
                placeholder="Bijv. 12 + 2K"
                className="w-full border border-slate-200 bg-white text-slate-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-green transition-colors"
                value={formData.playersCount}
                onChange={(e) => setFormData(prev => ({ ...prev, playersCount: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Korte Beschrijving</label>
            <input 
              type="text" 
              required
              className="w-full border border-slate-200 bg-white text-slate-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-green transition-colors"
              value={formData.shortDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Uitgebreide Instructies</label>
            <textarea 
              rows={5}
              required
              className="w-full border border-slate-200 bg-white text-slate-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-green transition-colors"
              value={formData.detailedInstructions}
              onChange={(e) => setFormData(prev => ({ ...prev, detailedInstructions: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Diagram Uploaden</label>
            <div className="flex items-center gap-4">
              <label className="cursor-pointer bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center flex-grow transition-colors text-slate-500">
                <ImageIcon className="text-slate-400 mb-2" size={32} />
                <span className="text-sm text-center">Klik om een diagram te uploaden</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
              </label>
              {formData.image && (
                <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-slate-200">
                  <img src={formData.image} className="w-full h-full object-cover" alt="Preview" />
                  <button 
                    type="button" 
                    onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-lg"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Tags</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Bijv. Balbezit"
                className="flex-grow border border-slate-200 bg-white text-slate-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-green transition-colors"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button type="button" onClick={addTag} className="bg-slate-200 text-slate-700 px-4 py-3 rounded-xl font-bold transition-colors">Voeg toe</button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags?.map(t => (
                <span key={t} className="bg-emerald-50 text-brand-green px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-emerald-100">
                  {t}
                  <button onClick={() => setFormData(prev => ({ ...prev, tags: prev.tags?.filter(tag => tag !== t) }))}>
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="submit" 
              className="flex-grow bg-brand-green hover:bg-emerald-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01]"
            >
              <Save size={20} /> {initialData ? 'Wijzigingen Opslaan' : 'Oefening Opslaan'}
            </button>
            <button 
              type="button" 
              onClick={onCancel}
              className="px-8 bg-slate-100 text-slate-600 py-4 rounded-xl font-bold text-lg transition-colors hover:bg-slate-200"
            >
              Annuleren
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExerciseForm;
