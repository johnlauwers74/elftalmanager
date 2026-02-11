
import React, { useState, useEffect, useCallback, useRef } from 'react';
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

  // Gebruik een ref om de huidige view bij te houden in async callbacks
  const currentViewRef = useRef<ViewState>('LANDING');
  useEffect(() => {
    currentViewRef.current = view;
  }, [view]);

  // Data ophalen zonder de rest te blokkeren
  const fetchData = useCallback(async () => {
    try {
      console.log("📊 Data ophalen...");
      const { data: exData } = await supabase.from('exercises').select('*').order('createdAt', { ascending: false });
      if (exData) setExercises(exData);
      
      const { data: artData } = await supabase.from('articles').select('*').order('date', { ascending: false });
      if (artData) setArticles(artData);
      
      const { data: usersData } = await supabase.from('profiles').select('*');
      if (usersData) setAllUsers(usersData);
    } catch (err) {
      console.warn("⚠️ Data fetch vertraagd:", err);
    }
  }, []);

  const checkSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setCurrentUser(null);
        return false;
      }

      console.log("👤 Sessie gevonden voor:", session.user.email);

      // Optimistisch profiel object
      const localUser: User = {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Coach',
        role: 'COACH',
        status: 'ACTIVE'
      };

      // Haal profiel uit DB
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (profile) {
        if (profile.status === 'INACTIVE') {
          await supabase.auth.signOut();
          setCurrentUser(null);
          return false;
        }
        setCurrentUser(profile);
      } else {
        // Gebruik het lokale object als de DB nog niet geüpdatet is
        setCurrentUser(localUser);
        // Sync op de achtergrond
        supabase.from('profiles').upsert([localUser]).then(
          () => console.log("✅ Profiel gesync"),
          (e) => console.error("Sync error", e)
        );
      }
      return true;
    } catch (err) {
      console.error("❌ checkSession crash:", err);
      return false;
    }
  }, []);

  useEffect(() => {
    const failsafe = setTimeout(() => {
      setAuthLoading(false);
    }, 2500);

    const init = async () => {
      const hasSession = await checkSession();
      if (hasSession) {
        setView('DASHBOARD');
        fetchData();
      }
      setAuthLoading(false);
      clearTimeout(failsafe);
      handleUrlParameters();
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`🔔 Auth Event: ${event}`);
      if (session) {
        setIsLoginModalOpen(false);
        const hasProfile = await checkSession();
        if (hasProfile) {
          fetchData();
          // Gebruik functionele update om de meest recente state te forceren
          setView(prev => (prev === 'LANDING' ? 'DASHBOARD' : prev));
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setView('LANDING');
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(failsafe);
    };
  }, [checkSession, fetchData]);

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

  const handleLoginAttempt = async (email: string, pass: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      
      if (data.session) {
        // Directe flow na succesvolle login (niet wachten op onAuthStateChange)
        const hasProfile = await checkSession();
        if (hasProfile) {
          setIsLoginModalOpen(false);
          setView('DASHBOARD');
          fetchData();
        }
      }
    } catch (err: any) { 
      alert(`Inloggen mislukt: ${err.message}`);
      throw err;
    }
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
    // 1. Forceer Wachtwoord instellen indien nodig
    if (view === 'SET_PASSWORD') return <SetPasswordView onSave={async (p) => {
      await supabase.auth.updateUser({ password: p });
      await supabase.from('profiles').update({ status: 'ACTIVE' }).eq('email', activationEmail);
      setView('LANDING');
    }} email={activationEmail} onCancel={() => setView('LANDING')} />;
    
    // 2. Toon Landing als er geen gebruiker is OF de view expliciet op LANDING staat
    if (!currentUser || view === 'LANDING') {
      return <LandingPage 
        onLogin={() => setIsLoginModalOpen(true)} 
        onSubscribe={(email, name) => {
          supabase.from('profiles').insert([{ email, name, role: 'COACH', status: 'PENDING' }]).then(() => alert('Aanvraag verzonden!'));
        }} 
      />;
    }

    // 3. Toon Dashboard of andere views als er een gebruiker is
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
      {currentUser && view !== 'LANDING' && (
        <Navbar 
          userRole={currentUser.role} 
          currentView={view} 
          setView={setView} 
          onLogout={() => {
            supabase.auth.signOut().then(() => {
              setCurrentUser(null);
              setView('LANDING');
            });
          }} 
        />
      )}
      <main className="flex-grow">{renderView()}</main>
      {isLoginModalOpen && (
        <LoginModal 
          onClose={() => setIsLoginModalOpen(false)} 
          onLogin={handleLoginAttempt} 
          onActivate={setActivationEmail} 
          onDemoLogin={(role) => {
            const mockUser: User = { id: `demo-${role}`, name: `Demo ${role}`, email: `${role.toLowerCase()}@demo.be`, role: role, status: 'ACTIVE' };
            setCurrentUser(mockUser); 
            setIsLoginModalOpen(false); 
            setView('DASHBOARD');
          }} 
        />
      )}
    </div>
  );
};

export default App;
