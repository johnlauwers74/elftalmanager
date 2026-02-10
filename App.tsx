
import React, { useState, useEffect } from 'react';
import { User, Exercise, Article, Podcast, ViewState, Role, UserStatus } from './types';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import ExerciseList from './views/ExerciseList';
import ExerciseForm from './views/ExerciseForm';
import BlogView from './views/BlogView';
import ArticleDetail from './views/ArticleDetail';
import ArticleForm from './views/ArticleForm';
import PodcastView from './views/PodcastView';
import AdminUserView from './views/AdminUserView';
import Dashboard from './views/Dashboard';
import LoginModal from './components/LoginModal';
import SetPasswordView from './views/SetPasswordView';
import { supabase } from './lib/supabase';
import { Loader2, Play } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('LANDING');
  const [authLoading, setAuthLoading] = useState(true);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [activationEmail, setActivationEmail] = useState('');
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  useEffect(() => {
    console.log("🚀 ELFTALMANAGER opstarten...");
    
    const init = async () => {
      try {
        setAuthLoading(true);
        const hasSession = await checkSession();
        if (hasSession) {
          await fetchData();
        }
      } catch (err) {
        console.error("❌ Init crash:", err);
      } finally {
        setAuthLoading(false);
        handleUrlParameters();
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`🔔 Auth Event: ${event}`);
      
      if (session) {
        setIsLoginModalOpen(false);
        const success = await checkSession();
        if (success) {
          await fetchData();
          // Forceer dashboard als we nog op de landing staan
          setView(current => (current === 'LANDING' ? 'DASHBOARD' : current));
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setView('LANDING');
      }
      
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUrlParameters = () => {
    const params = new URLSearchParams(window.location.search);
    const activateEmail = params.get('activate');
    if (activateEmail) {
      setActivationEmail(activateEmail);
      setView('SET_PASSWORD');
      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  };

  const fetchData = async () => {
    try {
      console.log("📊 Gegevens ophalen...");
      const [exRes, artRes, profRes] = await Promise.all([
        supabase.from('exercises').select('*').order('createdAt', { ascending: false }),
        supabase.from('articles').select('*').order('date', { ascending: false }),
        supabase.from('profiles').select('*')
      ]);

      if (exRes.data) setExercises(exRes.data);
      if (artRes.data) setArticles(artRes.data);
      if (profRes.data) setAllUsers(profRes.data);
    } catch (err) { 
      console.error("⚠️ Fout bij ophalen data:", err); 
    }
  };

  const checkSession = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        return false;
      }

      console.log("👤 Sessie actief voor:", session.user.email);

      // Probeer profiel op te halen met een timeout/snelle afhandeling
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (profileError) {
        console.warn("⚠️ Kon profiel niet ophalen uit tabel:", profileError.message);
        // We gaan door met een tijdelijk profiel als de tabel niet bestaat of leeg is
      }

      if (profile) {
        if (profile.status === 'INACTIVE') {
          await handleLogout();
          alert('Dit account is gedeactiveerd.');
          return false;
        }
        setCurrentUser(profile);
        return true;
      } else {
        // Maak een tijdelijk profiel object op basis van de auth data
        // Dit zorgt ervoor dat de app NIET blijft hangen als de database tabel ontbreekt
        const tempUser: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Coach',
          role: 'COACH', // Default
          status: 'ACTIVE'
        };
        
        console.log("🛠️ Gebruik van tijdelijk profiel (database sync nodig)");
        setCurrentUser(tempUser);
        
        // Probeer op de achtergrond het profiel echt aan te maken
        try {
          const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
          const isFirst = count === 0;
          await supabase.from('profiles').upsert([{
            ...tempUser,
            role: isFirst ? 'ADMIN' : 'COACH'
          }]);
        } catch (e) {
          console.warn("⚠️ Kon profiel niet persistent opslaan.");
        }
        
        return true;
      }
    } catch (err) {
      console.error("❌ Fout in checkSession:", err);
      return false;
    }
  };

  const handleLoginAttempt = async (email: string, pass: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) {
        alert(`Inloggen mislukt: ${error.message}`);
        throw error;
      }
    } catch (err) { 
      console.error(err);
      throw err;
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setView('LANDING');
  };

  const saveExercise = async (ex: Exercise) => {
    try {
      const exerciseData = {
        title: ex.title,
        type: ex.type,
        ageGroup: ex.ageGroup,
        playersCount: ex.playersCount || '0',
        shortDescription: ex.shortDescription,
        description: ex.description,
        image: ex.image || null,
        tags: ex.tags || [],
        createdAt: ex.createdAt || new Date().toISOString()
      };

      if (!ex.id || ex.id === '') {
        const { error } = await supabase.from('exercises').insert([exerciseData]);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('exercises').update(exerciseData).eq('id', ex.id);
        if (error) throw error;
      }

      await fetchData();
      setView('EXERCISES');
      setEditingExercise(null);
      alert("Oefening opgeslagen!");
    } catch (err: any) {
      alert(`Fout bij opslaan: ${err.message}`);
    }
  };

  // RENDER LOADING STATE
  if (authLoading) {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center text-white">
        <div className="w-20 h-20 bg-brand-green rounded-2xl flex items-center justify-center mb-6 shadow-2xl animate-pulse">
          <Play size={40} className="fill-current" />
        </div>
        <Loader2 className="animate-spin text-brand-green mb-4" size={32} />
        <p className="font-bold tracking-widest uppercase text-[10px] text-slate-400">Elftalmanager laden...</p>
      </div>
    );
  }

  const renderView = () => {
    if (view === 'SET_PASSWORD') return <SetPasswordView onSave={async (p) => {
      await supabase.auth.updateUser({ password: p });
      await supabase.from('profiles').update({ status: 'ACTIVE' }).eq('email', activationEmail);
      setView('LANDING');
    }} email={activationEmail} onCancel={() => setView('LANDING')} />;
    
    if (!currentUser || view === 'LANDING') return <LandingPage onLogin={() => setIsLoginModalOpen(true)} onSubscribe={(email, name) => {
      supabase.from('profiles').insert([{ email, name, role: 'COACH', status: 'PENDING' }]).then(() => alert('Aanvraag verzonden!'));
    }} />;

    switch (view) {
      case 'DASHBOARD': return <Dashboard exercisesCount={exercises.length} articlesCount={articles.length} />;
      case 'EXERCISES': return <ExerciseList exercises={exercises} onAdd={() => { setEditingExercise(null); setView('CREATE_EXERCISE'); }} onEdit={(ex) => { setEditingExercise(ex); setView('EDIT_EXERCISE'); }} isAdmin={currentUser.role === 'ADMIN'} />;
      case 'CREATE_EXERCISE': return <ExerciseForm onSave={saveExercise} onCancel={() => setView('EXERCISES')} />;
      case 'EDIT_EXERCISE': return <ExerciseForm onSave={saveExercise} onCancel={() => setView('EXERCISES')} initialData={editingExercise || undefined} />;
      case 'BLOG': return <BlogView articles={articles} isAdmin={currentUser.role === 'ADMIN'} onAddArticle={() => setView('CREATE_ARTICLE')} onEditArticle={(art) => { setEditingArticle(art); setView('EDIT_ARTICLE'); }} onViewArticle={(art) => { setSelectedArticle(art); setView('VIEW_ARTICLE'); }} />;
      case 'VIEW_ARTICLE': return selectedArticle ? <ArticleDetail article={selectedArticle} onBack={() => setView('BLOG')} /> : null;
      case 'ADMIN_USERS': return <AdminUserView users={allUsers} onApprove={(id) => supabase.from('profiles').update({ status: 'APPROVED' }).eq('id', id).then(fetchData)} onUpdateRole={(id, r) => supabase.from('profiles').update({ role: r }).eq('id', id).then(fetchData)} onToggleStatus={(id, s) => supabase.from('profiles').update({ status: s === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }).eq('id', id).then(fetchData)} currentAdminId={currentUser.id} />;
      case 'PODCASTS': return <PodcastView podcasts={podcasts} isAdmin={currentUser.role === 'ADMIN'} onAddPodcast={() => {}} />;
      default: return <Dashboard exercisesCount={exercises.length} articlesCount={articles.length} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {currentUser && view !== 'LANDING' && <Navbar userRole={currentUser.role} currentView={view} setView={setView} onLogout={handleLogout} />}
      <main className="flex-grow">{renderView()}</main>
      {isLoginModalOpen && <LoginModal onClose={() => setIsLoginModalOpen(false)} onLogin={handleLoginAttempt} onActivate={setActivationEmail} onDemoLogin={(role) => {
          const mockUser: User = { id: `demo-${role}`, name: `Demo ${role}`, email: `${role.toLowerCase()}@demo.be`, role: role, status: 'ACTIVE' };
          setCurrentUser(mockUser); setIsLoginModalOpen(false); setView('DASHBOARD');
      }} />}
    </div>
  );
};

export default App;
