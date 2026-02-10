
import React, { useState, useEffect } from 'react';
import { Exercise } from '../types';
import { Save, X, Sparkles, Loader2, Upload, Plus } from 'lucide-react';
import { generateExerciseSuggestions } from '../services/geminiService';
import { uploadFile } from '../services/storageService';

interface ExerciseFormProps {
  onSave: (ex: Exercise) => void;
  onCancel: () => void;
  initialData?: Exercise;
}

const AGE_GROUPS = [
  'U6', 'U7', 'U8', 'U9', 'U10', 'U11', 'U12', 'U13', 
  'U14', 'U15', 'U16', 'U17', 'U18', 'U19', 'U21', 
  '1ste ploeg', 'OB', 'MB', 'BB'
];

const EXERCISE_TYPES = ['Technisch', 'Tactisch', 'Fysiek', 'Mentaal', 'Keepers', 'Spelvorm'];

const ExerciseForm: React.FC<ExerciseFormProps> = ({ onSave, onCancel, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<Partial<Exercise>>({
    title: '',
    type: 'Technisch',
    ageGroup: 'U12',
    playersCount: '10',
    shortDescription: '',
    description: '',
    tags: [],
    image: ''
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      try {
        const url = await uploadFile('oefeningen', file);
        if (url) {
          setFormData(prev => ({ ...prev, image: url }));
        }
      } finally {
        setUploading(false);
      }
    }
  };

  const handleAISuggest = async () => {
    if (!formData.title) {
      alert('Vul eerst een thema in voor AI suggesties.');
      return;
    }
    setLoading(true);
    try {
      const suggestion = await generateExerciseSuggestions(formData.title);
      if (suggestion) {
        setFormData(prev => ({ ...prev, ...suggestion }));
      }
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), tagInput.trim()] }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ 
      ...prev, 
      tags: (prev.tags || []).filter(t => t !== tagToRemove) 
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validatie
    if (!formData.title || !formData.shortDescription || !formData.description) {
      alert('Vul alle verplichte velden in.');
      return;
    }

    const ex: Exercise = {
      ...formData as Exercise,
      id: initialData?.id || '', // Leeg laten bij nieuwe oefening, wordt afgehandeld in App.tsx
      createdAt: initialData?.createdAt || new Date().toISOString()
    };
    
    onSave(ex);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-slate-100">
        <div className="flex justify-between items-center mb-8 text-slate-900">
          <h2 className="text-3xl font-bold">
            {initialData ? 'Oefening Bewerken' : 'Nieuwe Oefening'}
          </h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Titel / Thema *</label>
              <div className="flex gap-2 text-slate-900">
                <input 
                  type="text" 
                  required
                  placeholder="Bijv. Positiespel 4v4"
                  className="flex-grow border border-slate-200 bg-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-green transition-all"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
                {!initialData && (
                  <button 
                    type="button"
                    onClick={handleAISuggest}
                    disabled={loading}
                    className="bg-emerald-50 text-brand-green px-4 py-3 rounded-xl hover:bg-emerald-100 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
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
                className="w-full border border-slate-200 bg-white text-slate-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-green transition-all"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              >
                {EXERCISE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Leeftijdscategorie</label>
              <select 
                className="w-full border border-slate-200 bg-white text-slate-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-green transition-all"
                value={formData.ageGroup}
                onChange={(e) => setFormData(prev => ({ ...prev, ageGroup: e.target.value }))}
              >
                {AGE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Aantal Spelers</label>
              <input 
                type="text" 
                placeholder="Bijv. 8 + 2K"
                className="w-full border border-slate-200 bg-white text-slate-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-green transition-all"
                value={formData.playersCount}
                onChange={(e) => setFormData(prev => ({ ...prev, playersCount: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Korte omschrijving *</label>
            <input 
              type="text" 
              required
              placeholder="Hoofddoel in één zin"
              className="w-full border border-slate-200 bg-white text-slate-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-green transition-all"
              value={formData.shortDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Omschrijving (Instructies) *</label>
            <textarea 
              rows={6}
              required
              placeholder="Leg hier de oefening stap voor stap uit..."
              className="w-full border border-slate-200 bg-white text-slate-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-green transition-all"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Locatie tekening (Veldopstelling)</label>
            <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <label className="cursor-pointer flex flex-col items-center justify-center text-slate-500 hover:text-brand-green transition-colors">
                {uploading ? (
                  <Loader2 className="animate-spin text-brand-green" size={40} />
                ) : (
                  <>
                    <Upload size={40} className="mb-2" />
                    <span className="text-sm font-bold">Tekening uploaden</span>
                  </>
                )}
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploading} />
              </label>
              
              {formData.image && (
                <div className="relative w-full md:w-48 h-32 rounded-xl overflow-hidden border border-slate-200 shadow-md bg-white">
                  <img src={formData.image} className="w-full h-full object-contain" alt="Preview" />
                  <button 
                    type="button" 
                    onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                  >
                    <X size={14} />
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
                placeholder="Tag toevoegen..."
                className="flex-grow border border-slate-200 bg-white text-slate-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-green transition-all"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button 
                type="button"
                onClick={addTag}
                className="bg-slate-100 text-slate-600 px-4 py-3 rounded-xl hover:bg-slate-200 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags?.map(tag => (
                <span key={tag} className="bg-brand-green/10 text-brand-green px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-2">
                  #{tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500"><X size={12} /></button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <button 
              type="submit" 
              disabled={uploading}
              className="flex-grow bg-brand-green hover:bg-emerald-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:grayscale"
            >
              <Save size={22} /> Oefening Opslaan
            </button>
            <button 
              type="button" 
              onClick={onCancel}
              className="px-8 bg-slate-100 text-slate-600 py-4 rounded-xl font-bold text-lg hover:bg-slate-200 transition-colors"
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
