
import React, { useState, useEffect } from 'react';
import { Article } from '../types';
import { Save, X, Image as ImageIcon, Type, User, Calendar } from 'lucide-react';

interface ArticleFormProps {
  onSave: (article: Article) => void;
  onCancel: () => void;
  initialData?: Article;
}

const ArticleForm: React.FC<ArticleFormProps> = ({ onSave, onCancel, initialData }) => {
  const [formData, setFormData] = useState<Partial<Article>>({
    title: '',
    author: '',
    content: '',
    imageUrl: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&q=80&w=800',
    tags: [],
    date: new Date().toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const addTag = () => {
    if (tagInput && !formData.tags?.includes(tagInput)) {
      setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), tagInput] }));
      setTagInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
              <div className="relative">
                <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  required
                  placeholder="De toekomst van..."
                  className="w-full pl-12 pr-4 py-3 border border-slate-200 bg-white text-slate-900 rounded-xl outline-none focus:ring-2 focus:ring-brand-green"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Auteur</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  required
                  placeholder="Naam auteur"
                  className="w-full pl-12 pr-4 py-3 border border-slate-200 bg-white text-slate-900 rounded-xl outline-none focus:ring-2 focus:ring-brand-green"
                  value={formData.author}
                  onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Afbeelding URL</label>
            <div className="relative">
              <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="url" 
                required
                placeholder="https://images.unsplash.com/..."
                className="w-full pl-12 pr-4 py-3 border border-slate-200 bg-white text-slate-900 rounded-xl outline-none focus:ring-2 focus:ring-brand-green"
                value={formData.imageUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Inhoud</label>
            <textarea 
              rows={12}
              required
              placeholder="Schrijf hier je artikel..."
              className="w-full border border-slate-200 bg-white text-slate-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-green"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Tags</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Bijv. Tactiek"
                className="flex-grow border border-slate-200 bg-white text-slate-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-green"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button type="button" onClick={addTag} className="bg-slate-200 text-slate-700 px-4 py-3 rounded-xl font-bold">Voeg toe</button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags?.map(t => (
                <span key={t} className="bg-emerald-50 text-brand-green px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-emerald-100">
                  {t}
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, tags: prev.tags?.filter(tag => tag !== t) }))}>
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="submit" 
              className="flex-grow bg-brand-green hover:bg-emerald-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              <Save size={20} /> {initialData ? 'Wijzigingen Opslaan' : 'Artikel Publiceren'}
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

export default ArticleForm;
