
import React, { useState } from 'react';
import { Article } from '../types';
import { ArrowLeft, User, Calendar, Share2, FileDown, Loader2 } from 'lucide-react';
import { downloadAsPDF } from '../services/pdfService';

interface ArticleDetailProps {
  article: Article;
  onBack: () => void;
}

const ArticleDetail: React.FC<ArticleDetailProps> = ({ article, onBack }) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    await downloadAsPDF('article-print-area', `artikel_${article.title}`);
    setIsGeneratingPDF(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <button 
        onClick={onBack}
        disabled={isGeneratingPDF}
        className="flex items-center gap-2 text-brand-green font-bold hover:underline mb-8 no-print disabled:opacity-50"
      >
        <ArrowLeft size={20} /> Terug naar overzicht
      </button>

      <div id="article-print-area" className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="h-64 md:h-96 w-full relative">
          <img 
            src={article.imageUrl} 
            alt={article.title} 
            className="w-full h-full object-cover"
            crossOrigin="anonymous"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute bottom-8 left-8 right-8">
            <div className="flex flex-wrap gap-2 mb-4">
              {article.tags.map(tag => (
                <span key={tag} className="bg-brand-green text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
                  #{tag}
                </span>
              ))}
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">
              {article.title}
            </h1>
          </div>
        </div>

        <div className="p-8 md:p-12">
          <div className="flex flex-wrap items-center gap-6 mb-10 pb-6 border-b border-slate-100 text-slate-500 text-sm">
            <div className="flex items-center gap-2">
              <User size={18} className="text-brand-green" />
              <span className="font-bold text-slate-700">{article.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-brand-green" />
              <span>{article.date}</span>
            </div>
            <div className="ml-auto flex gap-4 no-print">
               <button 
                onClick={handleDownloadPDF} 
                disabled={isGeneratingPDF}
                className="hover:text-brand-green transition-colors disabled:opacity-50" 
                title="Download PDF"
               >
                 {isGeneratingPDF ? <Loader2 size={20} className="animate-spin" /> : <FileDown size={20} />}
               </button>
               <button className="hover:text-brand-green transition-colors"><Share2 size={20} /></button>
            </div>
          </div>

          <div className="prose prose-lg max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap text-left">
            {article.content}
          </div>

          <div className="mt-16 pt-8 border-t border-slate-100 flex items-center justify-between no-print">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-brand-green">
                <User size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Geschreven door</p>
                <p className="font-black text-slate-900">{article.author}</p>
              </div>
            </div>
            <button 
              onClick={onBack}
              className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-3 rounded-xl font-bold transition-all"
            >
              Lees meer artikelen
            </button>
          </div>
          
          <footer className="hidden print:block mt-12 pt-8 border-t text-center text-slate-400 text-xs">
            Gelezen op ELFTALMANAGER - Jouw coaching assistent
          </footer>
        </div>
      </div>
    </div>
  );
};

export default ArticleDetail;
