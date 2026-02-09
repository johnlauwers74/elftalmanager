
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
    console.log("App initialisatie...");
    const init = async () => {
      await fetchData();
      const sessionActive = await checkSession();
      if (!sessionActive) {
        await ensureAdminExists();
      }
      handleUrlParameters();
    };
    init();

    // De enige bron van waarheid voor auth status
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth Event:", event);
      if (session) {
        const profileFound = await checkSession();
        if (profileFound) {
          setIsLoginModalOpen(false);
        }
      } else {
        setCurrentUser(null);
        if (view !== 'SET_PASSWORD') setView('LANDING');
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

  const ensureAdminExists = async () => {
    try {
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPass = process.env.ADMIN_PASSWORD;

      if (!adminEmail || !adminPass) {
        console.warn("Admin omgevingsvariabelen ontbreken. Overslaan admin-check.");
        return;
      }

      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'ADMIN')
        .limit(1);

      if (!admins || admins.length === 0) {
        console.log("Geen admin gevonden, poging tot aanmaken...");
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: adminEmail,
          password: adminPass,
        });

        let userId = signInData.user?.id;

        if (signInError) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: adminEmail,
            password: adminPass,
          });
          if (!signUpError) userId = signUpData.user?.id;
        }

        if (userId) {
          await supabase.from('profiles').upsert({
            id: userId,
            email: adminEmail,
            name: 'Hoofd Administrator',
            role: 'ADMIN',
            status: 'ACTIVE'
          });
        }
        await fetchData();
      }
    } catch (err) {
      console.error("Fout bij admin initialisatie:", err);
    }
  };

  const fetchData = async () => {
    try {
      const { data: exData } = await supabase.from('exercises').select('*').order('createdAt', { ascending: false });
      if (exData) setExercises(exData);

      const { data: artData } = await supabase.from('articles').select('*').order('date', { ascending: false });
      if (artData) setArticles(artData);

      const { data: podData } = await supabase.from('podcasts').select('*').order('date', { ascending: false });
      if (podData) setPodcasts(podData);

      const { data: usersData } = await supabase.from('profiles').select('*').order('status', { ascending: true });
      if (usersData) setAllUsers(usersData);
    } catch (err) {
      console.error("Fout bij ophalen data:", err);
    }
  };

  const checkSession = async () => {
    console.log("Sessie controleren...");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.log("Geen actieve sessie.");
        return false;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (error) {
        console.error("Profiel ophaalfout:", error);
        return false;
      }

      if (profile) {
        console.log("Profiel gevonden:", profile.name);
        if (profile.status === 'INACTIVE') {
          await handleLogout();
          alert('Je account is gedeactiveerd.');
          return false;
        }
        setCurrentUser(profile);
        if (view === 'LANDING') setView('DASHBOARD');
        return true;
      } else {
        console.warn("Gebruiker ingelogd in Auth, maar geen profiel in database.");
        return false;
      }
    } catch (err) {
      console.error("Sessie check error:", err);
      return false;
    }
  };

  const handleLoginAttempt = async (email: string, pass: string) => {
    console.log("Inlogpoging voor:", email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      
      if (error) {
        console.error("Login fout:", error.message);
        const { data: profile } = await supabase.from('profiles').select('status').eq('email', email).maybeSingle();
        
        if (profile?.status === 'PENDING') {
          alert('Je aanvraag is nog in behandeling.');
        } else if (profile?.status === 'APPROVED') {
          alert('Je account is goedgekeurd! Stel eerst je wachtwoord in via de mail.');
        } else {
          alert(`Inloggen mislukt: ${error.message}`);
        }
        return;
      }
      
      console.log("Auth succesvol voor:", data.user?.email);
      // De useEffect/onAuthStateChange handelt de rest af
    } catch (err) { 
      console.error("Onverwachte login fout:", err);
      alert('Verbindingsfout met de server.'); 
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
      alert('Klaar! Je kunt nu inloggen.');
      setView('LANDING');
    } catch (err: any) { 
      alert(`Fout: ${err.message}`); 
      throw err; 
    }
  };

  const renderView = () => {
    if (view === 'SET_PASSWORD') return <SetPasswordView onSave={handleSetPassword} email={activationEmail} onCancel={() => setView('LANDING')} />;
    if (!currentUser || view === 'LANDING') return <LandingPage onLogin={() => setIsLoginModalOpen(true)} onSubscribe={(email, name) => {
      supabase.from('profiles').insert([{ email, name, role: 'COACH', status: 'PENDING' }]).then(() => {
        alert('Aanvraag verzonden!');
        fetchData();
      });
    }} />;

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
