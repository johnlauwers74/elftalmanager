
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
    const init = async () => {
      await fetchData();
      const sessionActive = await checkSession();
      if (!sessionActive) {
        await ensureAdminExists();
      }
      handleUrlParameters();
    };
    init();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setCurrentUser(null);
        if (view !== 'SET_PASSWORD') setView('LANDING');
      } else {
        checkSession();
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
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'ADMIN')
        .limit(1);

      if (!admins || admins.length === 0) {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPass = process.env.ADMIN_PASSWORD;

        if (adminEmail && adminPass) {
          // Probeer aan te melden, als dat faalt, probeer te registreren
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
      }
    } catch (err) {
      console.error("Admin check fail:", err);
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
      console.error("Fetch error:", err);
    }
  };

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (profile) {
          if (profile.status === 'INACTIVE') {
            await handleLogout();
            alert('Account gedeactiveerd.');
            return false;
          }
          setCurrentUser(profile);
          if (view === 'LANDING') setView('DASHBOARD');
          return true;
        }
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const handleLoginAttempt = async (email: string, pass: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
        if (profile?.status === 'PENDING') return alert('Aanvraag in behandeling.');
        if (profile?.status === 'APPROVED') return alert('Eerst activeren via mail!');
        alert('Foutieve gegevens.');
        return;
      }
      
      if (data.user) {
        const ok = await checkSession();
        if (ok) setIsLoginModalOpen(false);
      }
    } catch (err) { alert('Verbindingsfout.'); }
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
    } catch (err: any) { alert(err.message); throw err; }
  };

  const renderView = () => {
    if (view === 'SET_PASSWORD') return <SetPasswordView onSave={handleSetPassword} email={activationEmail} onCancel={() => setView('LANDING')} />;
    if (!currentUser || view === 'LANDING') return <LandingPage onLogin={() => setIsLoginModalOpen(true)} onSubscribe={(email, name) => {
      supabase.from('profiles').insert([{ email, name, role: 'COACH', status: 'PENDING' }]).then(() => fetchData());
    }} />;

    switch (view) {
      case 'DASHBOARD': return <Dashboard exercisesCount={exercises.length} articlesCount={articles.length} />;
      case 'EXERCISES': return <ExerciseList exercises={exercises} onAdd={() => setView('CREATE_EXERCISE')} onEdit={(ex) => { setEditingExercise(ex); setView('EDIT_EXERCISE'); }} isAdmin={currentUser.role === 'ADMIN'} />;
      case 'CREATE_EXERCISE': return <ExerciseForm onSave={async (ex) => { 
        const { id, createdAt, ...data } = ex;
        await supabase.from('exercises').insert([data]);
        await fetchData();
        setView('EXERCISES');
      }} onCancel={() => setView('EXERCISES')} />;
      case 'EDIT_EXERCISE': return <ExerciseForm onSave={async (ex) => {
        await supabase.from('exercises').update(ex).eq('id', ex.id);
        await fetchData();
        setView('EXERCISES');
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
