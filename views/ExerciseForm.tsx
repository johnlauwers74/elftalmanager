
import React, { useState, useEffect } from 'react';
import { Exercise } from '../types';
import { Save, X, Sparkles, Loader2, Upload, Plus, Tag, AlertTriangle, ExternalLink, Info } from 'lucide-react';
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
  const [storageError, setStorageError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Exercise>>({
    title: '',
    type: 'Technisch',
    agegroup: 'U12',
    playerscount: '10',
    shortdescription: '',
    detailedinstructions: '',
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
      setStorageError(null);
      try {
        const url = await uploadFile('oefeningen', file);
        if (url) {
          setFormData(prev => ({ ...prev, image: url }));
        }
      } catch (err: any) {
        if (err.message.includes('STORAGE_RLS_ERROR')) {
          setStorageError('Supabase Permission Error: Je moet de "Storage Policies" configureren in je Supabase Dashboard om afbeeldingen te kunnen uploaden.');
        } else if (err.message.includes('STORAGE_BUCKET_NOT_FOUND')) {
          setStorageError('Bucket niet gevonden: Maak een bucket genaamd "oefeningen" aan in Supabase Storage.');
        } else {
          setStorageError('Er is iets misgegaan bij het uploaden van de afbeelding.');
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
    const cleanTag = tagInput.trim().toLowerCase();
    if (cleanTag && !formData.tags?.includes(cleanTag)) {
      setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), cleanTag] }));
      setTagInput('');
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
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
    
    if (!formData.title || !formData.shortdescription || !formData.detailedinstructions) {
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
    <div className="max-w-4xl mx-auto px-4 py-10 text-slate-900">
      <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-slate-100">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">
            {initialData ? 'Oefening Bewerken' : 'Nieuwe Oefening'}
          </h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
        </div>

        {storageError && (
          <div className="mb-8 p-6 bg-red-50 border border-red-100 rounded-2xl flex flex-col gap-4 animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-start gap-4">
              <div className="bg-red-500 text-white p-2 rounded-lg">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="font-bold text-red-900">Configuratie vereist</h3>
                <p className="text-sm text-red-700 leading-relaxed mt-1">{storageError}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-2 border-t border-red-200">
              <a 
                href="https://supabase.com/dashboard/project/_/storage/buckets/oefeningen" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all"
              >
                Ga naar Supabase Dashboard <ExternalLink size={14} />
              </a>
              <button 
                onClick={() => alert(`Plak dit in de SQL editor van Supabase:\n\n-- Toestaan dat iedereen kan uploaden naar de buckets\ncreate policy "Upload Toestaan" on storage.objects for insert with check ( bucket_id in ('oefeningen', 'artikelen', 'podcasts') );\n\n-- Toestaan dat iedereen de bestanden kan zien\ncreate policy "Bekijken Toestaan" on storage.objects for select using ( bucket_id in ('oefeningen', 'artikelen', 'podcasts') );`)}
                className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-50 transition-all"
              >
                Toon SQL Oplossing
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Titel / Thema *</label>
              <div className="flex gap-2">
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
                    title="Genereer inhoud met AI"
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
                className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 outline-none"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              >
                {EXERCISE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Leeftijdscategorie</label>
              <select 
                className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 outline-none"
                value={formData.agegroup}
                onChange={(e) => setFormData(prev => ({ ...prev, agegroup: e.target.value }))}
              >
                {AGE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Aantal Spelers</label>
              <input 
                type="text" 
                className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 outline-none"
                value={formData.playerscount}
                onChange={(e) => setFormData(prev => ({ ...prev, playerscount: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Korte omschrijving *</label>
            <input 
              type="text" 
              required
              placeholder="Wat is het hoofddoel van deze oefening?"
              className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 outline-none"
              value={formData.shortdescription}
              onChange={(e) => setFormData(prev => ({ ...prev, shortdescription: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Gedetailleerde omschrijving *</label>
            <textarea 
              rows={6}
              required
              placeholder="Leg hier de stappen en regels van de oefening uit..."
              className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 outline-none"
              value={formData.detailedinstructions}
              onChange={(e) => setFormData(prev => ({ ...prev, detailedinstructions: e.target.value }))}
            />
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold text-slate-700">Tags (zoekwoorden)</label>
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="text" 
                  placeholder="Bijv. drukzetten, omschakelen..."
                  className="w-full pl-12 pr-4 py-3 border border-slate-200 bg-white rounded-xl outline-none focus:ring-2 focus:ring-brand-green"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                />
              </div>
              <button 
                type="button"
                onClick={addTag}
                className="bg-slate-100 text-slate-600 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center gap-2"
              >
                <Plus size={20} />
              </button>
            </div>
            
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {formData.tags.map(tag => (
                  <span 
                    key={tag} 
                    className="bg-emerald-50 text-brand-green border border-emerald-100 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 animate-in zoom-in duration-200"
                  >
                    #{tag}
                    <button 
                      type="button" 
                      onClick={() => removeTag(tag)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Veldopstelling (Afbeelding)</label>
            <div className={`flex flex-col md:flex-row items-center gap-6 p-6 bg-slate-50 rounded-2xl border-2 border-dashed transition-all ${storageError ? 'border-red-200' : 'border-slate-200'}`}>
              <label className="cursor-pointer flex flex-col items-center group">
                {uploading ? (
                  <Loader2 className="animate-spin text-brand-green" size={40} />
                ) : (
                  <Upload className={`transition-colors ${storageError ? 'text-red-300' : 'text-slate-400 group-hover:text-brand-green'}`} size={40} />
                )}
                <span className="text-sm font-bold mt-2">Upload tekening</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
              {formData.image && (
                <div className="relative group">
                   <img src={formData.image} className="w-48 h-32 object-contain rounded-xl border bg-white" alt="Preview" />
                   <button 
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg"
                   >
                     <X size={14} />
                   </button>
                </div>
              )}
              {!formData.image && !uploading && (
                <div className="text-xs text-slate-400 italic flex items-center gap-2">
                   <Info size={14} /> Optioneel: voeg een veldtekening toe
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-slate-100">
            <button 
              type="submit" 
              disabled={uploading || loading} 
              className="flex-grow bg-brand-green text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
