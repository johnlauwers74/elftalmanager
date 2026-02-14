
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
        supabase.from('profiles').select('*').order('name', { ascending: true })
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
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();
      
      if (!profile) throw new Error('Geen profiel');

      return {
        id: profile.id,
        email: profile.email,
        name: profile.name || supabaseUser.user_metadata?.full_name || 'Coach',
        role: (profile.role as Role) || 'COACH',
        status: profile.status || 'ACTIVE'
      };
    } catch (err) {
      return {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: supabaseUser.user_metadata?.full_name || 'Coach',
        role: 'COACH',
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

    return () => subscription.unsubscribe();
  }, [enterDashboard]);

  const handleLoginAttempt = async (email: string, pass: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
    } catch (err: any) { 
      alert(`Inloggen mislukt: ${err.message}`);
      throw err;
    }
  };

  const handleSubscribe = async (email: string, name: string) => {
    try {
      const { error } = await supabase.from('profiles').insert([
        { 
          email: email, 
          name: name, 
          role: 'COACH', 
          status: 'PENDING' 
        }
      ]);

      if (error) {
        if (error.code === '23505') throw new Error('Dit e-mailadres heeft al een aanvraag ingediend.');
        throw error;
      }
      refreshAppData();
    } catch (err: any) {
      throw err;
    }
  };

  // ADMIN USER MANAGEMENT HANDLERS
  const handleApproveUser = async (idOrEmail: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'APPROVED' })
        .or(`id.eq.${idOrEmail},email.eq.${idOrEmail}`);
      
      if (error) throw error;
      alert('Coach goedgekeurd! De status is nu "Wacht op wachtwoord".');
      refreshAppData();
    } catch (err: any) {
      alert(`Fout bij goedkeuren: ${err.message}`);
    }
  };

  const handleUpdateUserRole = async (idOrEmail: string, newRole: Role) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .or(`id.eq.${idOrEmail},email.eq.${idOrEmail}`);
      
      if (error) throw error;
      refreshAppData();
    } catch (err: any) {
      alert(`Fout bij rol wijzigen: ${err.message}`);
    }
  };

  const handleToggleUserStatus = async (idOrEmail: string, currentStatus: UserStatus) => {
    try {
      const nextStatus = currentStatus === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
      const { error } = await supabase
        .from('profiles')
        .update({ status: nextStatus })
        .or(`id.eq.${idOrEmail},email.eq.${idOrEmail}`);
      
      if (error) throw error;
      refreshAppData();
    } catch (err: any) {
      alert(`Fout bij status wijzigen: ${err.message}`);
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
    setTimeout(() => {
      const element = document.getElementById('subscribe');
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center text-white p-6 text-center">
        <Loader2 className="animate-spin text-brand-green mb-6" size={60} />
        <h2 className="text-xl font-black uppercase tracking-widest mb-2">Elftalmanager</h2>
        <p className="text-slate-400 font-medium">Bezig met laden...</p>
      </div>
    );
  }

  const renderView = () => {
    if (view === 'SET_PASSWORD') return <SetPasswordView onSave={async (p) => {
      await supabase.auth.updateUser({ password: p });
      setView('LANDING');
    }} email={activationEmail} onCancel={() => setView('LANDING')} />;
    
    if (!currentUser || view === 'LANDING') {
      return <LandingPage onLogin={() => setIsLoginModalOpen(true)} onSubscribe={handleSubscribe} />;
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
      case 'ADMIN_USERS': return <AdminUserView users={allUsers} onApprove={handleApproveUser} onUpdateRole={handleUpdateUserRole} onToggleStatus={handleToggleUserStatus} currentAdminId={currentUser.id} />;
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
