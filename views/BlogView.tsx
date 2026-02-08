
import React from 'react';
import { Article } from '../types';
import { Plus, Clock, User as UserIcon, Edit3 } from 'lucide-react';

interface BlogViewProps {
  articles: Article[];
  isAdmin: boolean;
  onAddArticle: () => void;
  onEditArticle: (article: Article) => void;
  onViewArticle: (article: Article) => void;
}

const BlogView: React.FC<BlogViewProps> = ({ articles, isAdmin, onAddArticle, onEditArticle, onViewArticle }) => {
  // We combineren de database artikelen met de mock artikelen als er geen data is
  const displayArticles = articles.length > 0 ? articles : [
    {
      id: 'a1',
      title: 'De toekomst van jeugdopleidingen in België',
      content: 'Een diepe duik in hoe clubs zich voorbereiden op de nieuwe regels. De Belgische voetbalbond heeft onlangs een nieuw strategisch plan onthuld dat zich richt op de modernisering van jeugdcentra en het verbeteren van de coachkwaliteit over de hele linie.\n\nDit betekent dat clubs meer dan ooit moeten investeren in gediplomeerde trainers en innovatieve trainingsmethoden. Bij ELFTALMANAGER helpen we coaches om deze overstap makkelijker te maken door toegang te bieden tot de nieuwste oefenstof en theoretische kaders.',
      author: 'Dirk De Coach',
      date: '14 Dec 2023',
      imageUrl: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&q=80&w=800',
      tags: ['Jeugd', 'België']
    },
    {
      id: 'a2',
      title: 'Tactische Periodisering: Een Overzicht',
      content: 'Hoe plan je een volledig seizoen zonder je spelers te overbelasten? Tactische periodisering is een trainingsmethode die fysieke, tactische, technische en psychologische aspecten integreert in elke oefening.\n\nDe sleutel is de "Microcycle", waarbij elke trainingsdag een specifieke relatie heeft met de wedstrijddag. Op deze manier creëer je een ritme dat blessures minimaliseert terwijl de tactische uitvoering van het team maximaliseert.',
      author: 'Jan Tactiek',
      date: '10 Dec 2023',
      imageUrl: 'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?auto=format&fit=crop&q=80&w=800',
      tags: ['Tactiek', 'Planning']
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 text-slate-900">
        <div>
          <h1 className="text-3xl font-bold">Kennisbank</h1>
          <p className="text-slate-500">Verdiep je in coaching technieken en nieuws.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={onAddArticle}
            className="bg-brand-green hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
          >
            <Plus size={20} /> Nieuw Artikel
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {displayArticles.map(art => (
          <article 
            key={art.id} 
            onClick={() => onViewArticle(art)}
            className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl transition-all group flex flex-col relative cursor-pointer"
          >
            {isAdmin && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onEditArticle(art);
                }}
                className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur p-2 rounded-full shadow-lg text-brand-dark hover:text-brand-green transition-colors"
                title="Artikel bewerken"
              >
                <Edit3 size={18} />
              </button>
            )}
            <div className="h-56 overflow-hidden">
              <img src={art.imageUrl} alt={art.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="p-8 flex-grow flex flex-col">
              <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                <span className="flex items-center gap-1"><Clock size={14} /> {art.date}</span>
                <span className="flex items-center gap-1"><UserIcon size={14} /> {art.author}</span>
              </div>
              <h2 className="text-2xl font-bold mb-4 text-slate-900 group-hover:text-brand-green transition-colors leading-tight">{art.title}</h2>
              <p className="text-slate-600 mb-6 line-clamp-3 leading-relaxed">{art.content}</p>
              <div className="mt-auto flex justify-between items-center">
                <div className="flex gap-2">
                  {art.tags.map(t => <span key={t} className="text-[10px] font-bold uppercase tracking-wider text-brand-green">#{t}</span>)}
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewArticle(art);
                  }}
                  className="text-slate-900 font-bold hover:text-brand-green transition-colors"
                >
                  Lees Meer &rarr;
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default BlogView;
