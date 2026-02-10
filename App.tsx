
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

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('LANDING');
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
      await fetchData();
      await checkSession();
      handleUrlParameters();
    };
    init();

    // Luister naar auth veranderingen
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔔 Auth Event:", event);
      if (session) {
        // BELANGRIJK: Sluit de modal direct zodra we een sessie hebben
        setIsLoginModalOpen(false);
        await checkSession();
      } else {
        setCurrentUser(null);
        if (view !== 'SET_PASSWORD' && view !== 'LANDING') setView('LANDING');
      }
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
      const { data: exData, error: exError } = await supabase.from('exercises').select('*').order('createdAt', { ascending: false });
      if (exError) console.warn("Kon oefeningen niet ophalen (bestaat de tabel 'exercises'?)");
      else if (exData) setExercises(exData);
      
      const { data: artData } = await supabase.from('articles').select('*').order('date', { ascending: false });
      if (artData) setArticles(artData);
      
      const { data: usersData } = await supabase.from('profiles').select('*');
      if (usersData) setAllUsers(usersData);
    } catch (err) { console.error("Data fetch fout:", err); }
  };

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return false;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (profileError) {
        console.error("Profiel fout:", profileError.message);
        return false;
      }

      if (profile) {
        if (profile.status === 'INACTIVE') {
          await handleLogout();
          alert('Dit account is gedeactiveerd.');
          return false;
        }
        setCurrentUser(profile);
        if (view === 'LANDING') setView('DASHBOARD');
        return true;
      } else {
        // Auto-create profiel voor nieuwe gebruikers
        const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const isFirst = count === 0;
        const newProfile = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
          role: isFirst ? 'ADMIN' : 'COACH',
          status: isFirst ? 'ACTIVE' : 'PENDING'
        };
        const { data: ins, error: insErr } = await supabase.from('profiles').insert([newProfile]).select().single();
        if (!insErr && ins) {
          setCurrentUser(ins);
          setView('DASHBOARD');
          return true;
        }
      }
    } catch (err) {
      console.error("Sessie check crash:", err);
    }
    return false;
  };

  const handleLoginAttempt = async (email: string, pass: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) {
        alert(`Inloggen mislukt: ${error.message}`);
        throw error;
      }
    } catch (err) {
      console.error("Login attempt error:", err);
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
      console.log("💾 Opslaan oefening...", ex);
      
      // Bereid data voor (verwijder metadata die niet in de kolommen moet)
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
        // NIEUW
        const { error } = await supabase.from('exercises').insert([exerciseData]);
        if (error) throw error;
      } else {
        // UPDATE
        const { error } = await supabase.from('exercises').update(exerciseData).eq('id', ex.id);
        if (error) throw error;
      }

      await fetchData();
      setView('EXERCISES');
      setEditingExercise(null);
      alert("Oefening succesvol opgeslagen!");
    } catch (err: any) {
      console.error("Opslaan fout:", err);
      alert(`Fout bij opslaan: ${err.message}. \n\nCheck of de tabel 'exercises' bestaat in Supabase met de juiste kolommen.`);
    }
  };

  const renderView = () => {
    if (view === 'SET_PASSWORD') return <SetPasswordView onSave={async (p) => { 
      const { error } = await supabase.auth.updateUser({ password: p });
      if (error) throw error;
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
      case 'ADMIN_USERS': return <AdminUserView users={allUsers} onApprove={(id) => supabase.from('profiles').update({ status: 'APPROVED' }).eq('id', id).then(fetchData)} onUpdateRole={(id, r) => supabase.from('profiles').update({ role: r }).eq('id', id).then(fetchData)} onToggleStatus={(id, s) => supabase.from('profiles').update({ status: s === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }).eq('id', id).then(fetchData)} currentAdminId={currentUser.id} />;
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
