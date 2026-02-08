
import React, { useState, useEffect } from 'react';
import { Article } from '../types';
import { Save, X, Image as ImageIcon, Type, User, Upload, Loader2 } from 'lucide-react';
import { uploadFile } from '../services/storageService';

interface ArticleFormProps {
  onSave: (article: Article) => void;
  onCancel: () => void;
  initialData?: Article;
}

const ArticleForm: React.FC<ArticleFormProps> = ({ onSave, onCancel, initialData }) => {
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<Partial<Article>>({
    title: '',
    author: '',
    content: '',
    imageUrl: '',
    tags: [],
    date: new Date().toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })
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
      const url = await uploadFile('artikelen', file);
      if (url) {
        setFormData(prev => ({ ...prev, imageUrl: url }));
      }
      setUploading(false);
    }
  };

  const addTag = () => {
    if (tagInput && !formData.tags?.includes(tagInput)) {
      setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), tagInput] }));
      setTagInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imageUrl) {
      alert('Upload eerst een afbeelding voor het artikel.');
      return;
    }
    const article: Article = {
      ...formData as Article,
      id: initialData?.id || 'art-' + Date.now(),
    };
    onSave(article);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-slate-100">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900">
            {initialData ? 'Artikel Bewerken' : 'Nieuw Artikel'}
          </h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Titel</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-3 border border-slate-200 bg-white text-slate-900 rounded-xl outline-none focus:ring-2 focus:ring-brand-green"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Auteur</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-3 border border-slate-200 bg-white text-slate-900 rounded-xl outline-none focus:ring-2 focus:ring-brand-green"
                value={formData.author}
                onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Cover Afbeelding</label>
            <div className="flex items-center gap-6">
               <label className="flex-grow cursor-pointer bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center hover:bg-slate-100 transition-all">
                {uploading ? <Loader2 className="animate-spin text-brand-green" /> : <Upload className="text-slate-400 mb-2" />}
                <span className="text-xs font-bold text-slate-500">Upload JPG/PNG</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
              {formData.imageUrl && (
                <img src={formData.imageUrl} className="w-32 h-24 object-cover rounded-xl shadow-sm border" alt="Preview" />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Inhoud</label>
            <textarea 
              rows={12}
              required
              className="w-full border border-slate-200 bg-white text-slate-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-green"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="submit" 
              disabled={uploading}
              className="flex-grow bg-brand-green hover:bg-emerald-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              <Save size={20} /> Publiceren
            </button>
            <button type="button" onClick={onCancel} className="px-8 bg-slate-100 text-slate-600 py-4 rounded-xl font-bold text-lg hover:bg-slate-200">Annuleren</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ArticleForm;
