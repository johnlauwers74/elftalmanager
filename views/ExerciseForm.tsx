
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
    
    if (!formData.title || !formData.shortDescription || !formData.description) {
      alert('Vul alle verplichte velden in.');
      return;
    }

    const ex: Exercise = {
      ...formData as Exercise,
      id: initialData?.id || '',
      created_at: initialData?.created_at || new Date().toISOString()
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
                  className="flex-grow border border-slate-200 bg-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-green"
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
                className="w-full border border-slate-200 bg-white text-slate-900 rounded-xl px-4 py-3 outline-none"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              >
                {EXERCISE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Leeftijdscategorie</label>
              <select 
                className="w-full border border-slate-200 bg-white text-slate-900 rounded-xl px-4 py-3 outline-none"
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
                className="w-full border border-slate-200 bg-white text-slate-900 rounded-xl px-4 py-3 outline-none"
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
              className="w-full border border-slate-200 bg-white text-slate-900 rounded-xl px-4 py-3 outline-none"
              value={formData.shortDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Omschrijving *</label>
            <textarea 
              rows={6}
              required
              className="w-full border border-slate-200 bg-white text-slate-900 rounded-xl px-4 py-3 outline-none"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Veldopstelling</label>
            <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-slate-50 rounded-2xl border-2 border-dashed">
              <label className="cursor-pointer flex flex-col items-center">
                {uploading ? <Loader2 className="animate-spin" size={40} /> : <Upload size={40} />}
                <span className="text-sm font-bold">Upload tekening</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
              {formData.image && <img src={formData.image} className="w-32 h-24 object-contain" alt="Preview" />}
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <button type="submit" disabled={uploading} className="flex-grow bg-brand-green text-white py-4 rounded-xl font-bold text-lg shadow-lg">
              <Save size={22} className="inline mr-2" /> Opslaan
            </button>
            <button type="button" onClick={onCancel} className="px-8 bg-slate-100 text-slate-600 py-4 rounded-xl font-bold text-lg">Annuleren</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExerciseForm;
