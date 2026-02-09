
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
    console.log("🚀 Elftalmanager opstarten...");
    
    // Initialisatie
    const init = async () => {
      const hasSession = await checkSession();
      if (hasSession) {
        await fetchData();
      }
      handleUrlParameters();
    };
    init();

    // Luisteren naar auth veranderingen
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔔 Auth Event:", event);
      
      if (event === 'SIGNED_IN' && session) {
        console.log("✅ Gebruiker ingelogd, switch naar Dashboard...");
        setIsLoginModalOpen(false);
        
        // Zet direct een tijdelijke user zodat de UI niet blokkeert
        if (!currentUser) {
          const tempUser: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.email?.split('@')[0] || 'Coach',
            role: 'ADMIN',
            status: 'ACTIVE'
          };
          setCurrentUser(tempUser);
        }
        
        setView('DASHBOARD');
        await checkSession();
        await fetchData();
      } else if (event === 'SIGNED_OUT') {
        console.log("👋 Gebruiker uitgelogd");
        setCurrentUser(null);
        setView('LANDING');
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
    console.log("📥 Data ophalen...");
    try {
      const { data: exData } = await supabase.from('exercises').select('*');
      if (exData) setExercises(exData);
      
      const { data: artData } = await supabase.from('articles').select('*');
      if (artData) setArticles(artData);
      
      const { data: usersData } = await supabase.from('profiles').select('*');
      if (usersData) setAllUsers(usersData);
    } catch (err) { 
      console.warn("⚠️ Kon sommige data niet ophalen (waarschijnlijk RLS restricties):", err); 
    }
  };

  const checkSession = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        return false;
      }

      console.log("👤 Actieve sessie gevonden voor:", session.user.email);

      // Stap 1: Haal profiel op, maar wees voorbereid op de RLS recursie-fout
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("❌ Database fout (profiel):", profileError.message);
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
        // Fallback: Gebruik de auth data als de profiles tabel niet reageert/leeg is
        const fallbackUser: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.email?.split('@')[0] || 'Coach',
          role: 'ADMIN',
          status: 'ACTIVE'
        };
        
        setCurrentUser(fallbackUser);
        
        // Probeer stilletjes het profiel aan te maken voor de volgende keer
        supabase.from('profiles').upsert([fallbackUser]).then(({error}) => {
          if (error) console.warn("Sync profiel mislukt:", error.message);
        });
        
        return true;
      }
    } catch (err) {
      console.error("💥 Fout in checkSession:", err);
      return false;
    } finally {
      setIsLoginModalOpen(false);
    }
  };

  const handleLoginAttempt = async (email: string, pass: string) => {
    console.log("🔑 Inlogpoging gestart...");
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: pass });
      
      if (signInError) {
        console.log("Inloggen mislukt, check of het een nieuwe gebruiker is...");
        if (signInError.message.includes('Invalid login credentials')) {
          const { error: signUpError } = await supabase.auth.signUp({ email, password: pass });
          if (signUpError) alert(`Fout bij registratie: ${signUpError.message}`);
          else alert('Account aangemaakt! Je bent nu ingelogd.');
        } else {
          alert(`Inlogfout: ${signInError.message}`);
        }
      }
    } catch (err) { 
      console.error("Login crash:", err);
    }
  };

  const handleDemoLogin = (role: Role) => {
    const mockUser: User = {
      id: role === 'ADMIN' ? 'demo-admin' : 'demo-coach',
      name: role === 'ADMIN' ? 'Demo Admin' : 'Demo Coach',
      email: role === 'ADMIN' ? 'admin@demo.be' : 'coach@demo.be',
      role: role,
      status: 'ACTIVE'
    };
    setCurrentUser(mockUser);
    setIsLoginModalOpen(false);
    setView('DASHBOARD');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setView('LANDING');
  };

  const handleSetPassword = async (pass: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: pass });
      if (error) throw error;
      await supabase.from('profiles').update({ status: 'ACTIVE' }).eq('email', activationEmail);
      alert('Wachtwoord ingesteld!');
      setView('LANDING');
    } catch (err: any) { alert(err.message); throw err; }
  };

  const renderView = () => {
    // Cruciaal: als we een user hebben en niet op SET_PASSWORD zitten, toon dan Dashboard-omgeving
    if (view === 'SET_PASSWORD') return <SetPasswordView onSave={handleSetPassword} email={activationEmail} onCancel={() => setView('LANDING')} />;
    
    // Als er geen user is OF we zitten expliciet op Landing, toon Landing
    if (!currentUser || view === 'LANDING') {
      return <LandingPage onLogin={() => setIsLoginModalOpen(true)} onSubscribe={(email, name) => {
        supabase.from('profiles').insert([{ email, name, role: 'COACH', status: 'PENDING' }]).then(() => {
          alert('Aanvraag verzonden!');
          fetchData();
        });
      }} />;
    }

    // In alle andere gevallen dat we ingelogd zijn:
    switch (view) {
      case 'DASHBOARD': return <Dashboard exercisesCount={exercises.length} articlesCount={articles.length} />;
      case 'EXERCISES': return <ExerciseList exercises={exercises} onAdd={() => setView('CREATE_EXERCISE')} onEdit={(ex) => { setEditingExercise(ex); setView('EDIT_EXERCISE'); }} isAdmin={currentUser.role === 'ADMIN'} />;
      case 'CREATE_EXERCISE': return <ExerciseForm onSave={async (ex) => { 
        const { id, createdAt, ...data } = ex;
        const { error } = await supabase.from('exercises').insert([data]);
        if (error) alert(error.message);
        else { await fetchData(); setView('EXERCISES'); }
      }} onCancel={() => setView('EXERCISES')} />;
      case 'EDIT_EXERCISE': return <ExerciseForm onSave={async (ex) => {
        const { error } = await supabase.from('exercises').update(ex).eq('id', ex.id);
        if (error) alert(error.message);
        else { await fetchData(); setView('EXERCISES'); }
      }} onCancel={() => setView('EXERCISES')} initialData={editingExercise || undefined} />;
      case 'BLOG': return <BlogView articles={articles} isAdmin={currentUser.role === 'ADMIN'} onAddArticle={() => setView('CREATE_ARTICLE')} onEditArticle={(art) => { setEditingArticle(art); setView('EDIT_ARTICLE'); }} onViewArticle={(art) => { setSelectedArticle(art); setView('VIEW_ARTICLE'); }} />;
      case 'VIEW_ARTICLE': return selectedArticle ? <ArticleDetail article={selectedArticle} onBack={() => setView('BLOG')} /> : null;
      case 'PODCASTS': return <PodcastView podcasts={podcasts} isAdmin={currentUser.role === 'ADMIN'} onAddPodcast={() => {}} />;
      case 'ADMIN_USERS': return <AdminUserView users={allUsers} onApprove={async (id) => {
        const user = allUsers.find(u => u.id === id || u.email === id);
        await supabase.from('profiles').update({ status: 'APPROVED' }).eq('email', user?.email);
        await supabase.auth.resetPasswordForEmail(user!.email, { redirectTo: `${window.location.origin}/?activate=${user!.email}` });
        await fetchData();
      }} onUpdateRole={(id, r) => supabase.from('profiles').update({ role: r }).eq('id', id).then(fetchData)} onToggleStatus={(id, s) => supabase.from('profiles').update({ status: s === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }).eq('id', id).then(fetchData)} currentAdminId={currentUser.id} />;
      default: return <Dashboard exercisesCount={exercises.length} articlesCount={articles.length} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {currentUser && view !== 'LANDING' && <Navbar userRole={currentUser.role} currentView={view} setView={setView} onLogout={handleLogout} />}
      <main className="flex-grow">{renderView()}</main>
      {isLoginModalOpen && <LoginModal onClose={() => setIsLoginModalOpen(false)} onLogin={handleLoginAttempt} onActivate={setActivationEmail} onDemoLogin={handleDemoLogin} />}
    </div>
  );
};

export default App;
