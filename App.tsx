
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, Exercise, Article, Podcast, ViewState, Role } from './types';
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
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  // 1. Core State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('LANDING');
  const [authLoading, setAuthLoading] = useState(true);
  const initialized = useRef(false);
  
  // 2. Data State
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // 3. UI State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [activationEmail, setActivationEmail] = useState('');
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // Helper om data op te halen
  const refreshAppData = useCallback(async () => {
    try {
      const [exRes, artRes, profRes] = await Promise.all([
        supabase.from('exercises').select('*').order('created_at', { ascending: false }),
        supabase.from('articles').select('*').order('date', { ascending: false }),
        supabase.from('profiles').select('*')
      ]);
      
      if (exRes.data) setExercises(exRes.data);
      if (artRes.data) setArticles(artRes.data);
      if (profRes.data) setAllUsers(profRes.data);
    } catch (err) {
      console.warn("Achtergrond data laden mislukt, geen blokkade voor gebruiker.");
    }
  }, []);

  // Functie om de volledige gebruikersinfo op te halen
  const fetchUserWithRole = async (supabaseUser: any): Promise<User> => {
    try {
      // Zet een timeout op de profile fetch om hangen te voorkomen
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 2500)
      );

      const result: any = await Promise.race([profilePromise, timeoutPromise]);
      const profile = result.data;

      if (!profile) throw new Error('Geen profiel');

      return {
        id: profile.id,
        email: profile.email,
        name: profile.name || supabaseUser.user_metadata?.full_name || 'Coach',
        role: (profile.role as Role) || 'COACH',
        status: profile.status || 'ACTIVE'
      };
    } catch (err) {
      console.log("Valt terug op standaard profiel wegens:", err);
      return {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'Coach',
        role: 'COACH', // Veiligheidshalve coach rol als DB check faalt
        status: 'ACTIVE'
      };
    }
  };

  const enterDashboard = useCallback((user: User) => {
    setCurrentUser(user);
    setView('DASHBOARD');
    setIsLoginModalOpen(false);
    setAuthLoading(false);
    refreshAppData();
  }, [refreshAppData]);

  // Initialisatie & Auth Listener
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Harde failsafe: na 4 seconden MOET de loader weg
    const failsafe = setTimeout(() => {
      setAuthLoading(false);
    }, 4000);

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const fullUser = await fetchUserWithRole(session.user);
          enterDashboard(fullUser);
        } else {
          setAuthLoading(false);
        }
      } catch (e) {
        setAuthLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const fullUser = await fetchUserWithRole(session.user);
        enterDashboard(fullUser);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setView('LANDING');
        setAuthLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(failsafe);
    };
  }, [enterDashboard]);

  const handleLoginAttempt = async (email: string, pass: string) => {
    setAuthLoading(true); // Toon loader tijdens inloggen
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      
      if (data.session?.user) {
        const fullUser = await fetchUserWithRole(data.session.user);
        enterDashboard(fullUser);
      }
    } catch (err: any) { 
      setAuthLoading(false);
      alert(`Inloggen mislukt: ${err.message}`);
      throw err;
    }
  };

  const saveExercise = async (ex: Exercise) => {
    try {
      const { id, ...dataToSave } = ex;
      const { error } = id && id !== ''
        ? await supabase.from('exercises').update(dataToSave).eq('id', id)
        : await supabase.from('exercises').insert([dataToSave]);
      
      if (error) throw error;
      refreshAppData();
      setView('EXERCISES');
      setEditingExercise(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRegisterClick = () => {
    setIsLoginModalOpen(false);
    // Wacht even tot de modal gesloten is voor een vloeiende scroll
    setTimeout(() => {
      const element = document.getElementById('subscribe');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center text-white p-6 text-center">
        <Loader2 className="animate-spin text-brand-green mb-6" size={60} />
        <h2 className="text-xl font-black uppercase tracking-widest mb-2">Elftalmanager</h2>
        <p className="text-slate-400 font-medium">Bezig met initialiseren van je dashboard...</p>
        <button 
          onClick={() => setAuthLoading(false)} 
          className="mt-12 text-xs text-slate-500 underline hover:text-white transition-colors"
        >
          Laden duurt te lang? Klik hier om door te gaan.
        </button>
      </div>
    );
  }

  const renderView = () => {
    if (view === 'SET_PASSWORD') return <SetPasswordView onSave={async (p) => {
      await supabase.auth.updateUser({ password: p });
      setView('LANDING');
    }} email={activationEmail} onCancel={() => setView('LANDING')} />;
    
    if (!currentUser || view === 'LANDING') {
      return <LandingPage onLogin={() => setIsLoginModalOpen(true)} onSubscribe={() => {}} />;
    }

    switch (view) {
      case 'DASHBOARD': return <Dashboard exercisesCount={exercises.length} articlesCount={articles.length} coachName={currentUser.name} />;
      case 'EXERCISES': return <ExerciseList exercises={exercises} onAdd={() => setView('CREATE_EXERCISE')} onEdit={(ex) => { setEditingExercise(ex); setView('EDIT_EXERCISE'); }} isAdmin={currentUser.role === 'ADMIN'} />;
      case 'CREATE_EXERCISE': return <ExerciseForm onSave={saveExercise} onCancel={() => setView('EXERCISES')} />;
      case 'EDIT_EXERCISE': return <ExerciseForm onSave={saveExercise} onCancel={() => setView('EXERCISES')} initialData={editingExercise || undefined} />;
      case 'BLOG': return <BlogView articles={articles} isAdmin={currentUser.role === 'ADMIN'} onAddArticle={() => setView('CREATE_ARTICLE')} onEditArticle={(art) => { setEditingArticle(art); setView('EDIT_ARTICLE'); }} onViewArticle={(art) => { setSelectedArticle(art); setView('VIEW_ARTICLE'); }} />;
      case 'VIEW_ARTICLE': return selectedArticle ? <ArticleDetail article={selectedArticle} onBack={() => setView('BLOG')} /> : null;
      case 'CREATE_ARTICLE': return <ArticleForm onSave={async (art) => { 
        await supabase.from('articles').insert([art]);
        refreshAppData();
        setView('BLOG');
      }} onCancel={() => setView('BLOG')} />;
      case 'ADMIN_USERS': return <AdminUserView users={allUsers} onApprove={() => {}} onUpdateRole={() => {}} onToggleStatus={() => {}} currentAdminId={currentUser.id} />;
      case 'PODCASTS': return <PodcastView podcasts={podcasts} isAdmin={currentUser.role === 'ADMIN'} onAddPodcast={() => {}} />;
      default: return <Dashboard exercisesCount={exercises.length} articlesCount={articles.length} coachName={currentUser.name} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
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
          onRegisterClick={handleRegisterClick}
          onDemoLogin={(role) => {
            const mock: User = { id: 'demo', email: 'demo@pro.be', name: 'Demo Coach', role: role, status: 'ACTIVE' };
            enterDashboard(mock);
          }} 
        />
      )}
    </div>
  );
};

export default App;
