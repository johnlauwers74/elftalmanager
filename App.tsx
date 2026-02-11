
import React, { useState, useEffect, useCallback } from 'react';
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
import { Loader2, Play } from 'lucide-react';

const App: React.FC = () => {
  // 1. Core State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('LANDING');
  const [authLoading, setAuthLoading] = useState(true);
  
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

  // Helper om data op te halen (stille achtergrondtaak)
  const refreshAppData = useCallback(async () => {
    try {
      const [exRes, artRes, profRes] = await Promise.all([
        supabase.from('exercises').select('*').order('createdAt', { ascending: false }),
        supabase.from('articles').select('*').order('date', { ascending: false }),
        supabase.from('profiles').select('*')
      ]);
      
      if (exRes.data) setExercises(exRes.data);
      if (artRes.data) setArticles(artRes.data);
      if (profRes.data) setAllUsers(profRes.data);
    } catch (err) {
      console.warn("Data fetch vertraagd, geen blokkade.");
    }
  }, []);

  // Centrale functie om de gebruiker te zetten en naar dashboard te gaan
  const enterDashboard = useCallback((user: User) => {
    setCurrentUser(user);
    setView('DASHBOARD');
    setIsLoginModalOpen(false);
    setAuthLoading(false);
    refreshAppData();
  }, [refreshAppData]);

  // Initialisatie & Auth Listener
  useEffect(() => {
    // Harde failsafe voor het laadscherm
    const failsafe = setTimeout(() => setAuthLoading(false), 2000);

    const checkInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const user: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Coach',
          role: 'COACH',
          status: 'ACTIVE'
        };
        enterDashboard(user);
      } else {
        setAuthLoading(false);
      }
    };

    checkInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`🔔 Auth Event: ${event}`);
      if (event === 'SIGNED_IN' && session?.user) {
        const user: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Coach',
          role: 'COACH',
          status: 'ACTIVE'
        };
        enterDashboard(user);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setView('LANDING');
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(failsafe);
    };
  }, [enterDashboard]);

  // Handle Login Poging
  const handleLoginAttempt = async (email: string, pass: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      
      if (data.session?.user) {
        const user: User = {
          id: data.session.user.id,
          email: data.session.user.email || '',
          name: data.session.user.user_metadata?.full_name || 'Coach',
          role: 'COACH',
          status: 'ACTIVE'
        };
        enterDashboard(user);
      }
    } catch (err: any) { 
      alert(`Fout: ${err.message}`);
      throw err;
    }
  };

  const saveExercise = async (ex: Exercise) => {
    try {
      const { error } = ex.id 
        ? await supabase.from('exercises').update(ex).eq('id', ex.id)
        : await supabase.from('exercises').insert([ex]);
      if (error) throw error;
      refreshAppData();
      setView('EXERCISES');
      setEditingExercise(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin text-brand-green mb-4" size={48} />
        <p className="font-bold tracking-widest uppercase text-xs text-slate-400">Elftalmanager laden...</p>
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
      case 'DASHBOARD': return <Dashboard exercisesCount={exercises.length} articlesCount={articles.length} />;
      case 'EXERCISES': return <ExerciseList exercises={exercises} onAdd={() => setView('CREATE_EXERCISE')} onEdit={(ex) => { setEditingExercise(ex); setView('EDIT_EXERCISE'); }} isAdmin={currentUser.role === 'ADMIN'} />;
      case 'CREATE_EXERCISE': return <ExerciseForm onSave={saveExercise} onCancel={() => setView('EXERCISES')} />;
      case 'EDIT_EXERCISE': return <ExerciseForm onSave={saveExercise} onCancel={() => setView('EXERCISES')} initialData={editingExercise || undefined} />;
      case 'BLOG': return <BlogView articles={articles} isAdmin={currentUser.role === 'ADMIN'} onAddArticle={() => setView('CREATE_ARTICLE')} onEditArticle={(art) => { setEditingArticle(art); setView('EDIT_ARTICLE'); }} onViewArticle={(art) => { setSelectedArticle(art); setView('VIEW_ARTICLE'); }} />;
      case 'VIEW_ARTICLE': return selectedArticle ? <ArticleDetail article={selectedArticle} onBack={() => setView('BLOG')} /> : null;
      case 'ADMIN_USERS': return <AdminUserView users={allUsers} onApprove={() => {}} onUpdateRole={() => {}} onToggleStatus={() => {}} currentAdminId={currentUser.id} />;
      case 'PODCASTS': return <PodcastView podcasts={podcasts} isAdmin={currentUser.role === 'ADMIN'} onAddPodcast={() => {}} />;
      default: return <Dashboard exercisesCount={exercises.length} articlesCount={articles.length} />;
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
