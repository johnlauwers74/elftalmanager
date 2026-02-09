
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
    
    const init = async () => {
      await fetchData();
      await checkSession();
      handleUrlParameters();
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔔 Auth Event:", event);
      if (session) {
        await checkSession();
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

  const fetchData = async () => {
    try {
      const { data: exData } = await supabase.from('exercises').select('*');
      if (exData) setExercises(exData);
      const { data: artData } = await supabase.from('articles').select('*');
      if (artData) setArticles(artData);
      const { data: usersData } = await supabase.from('profiles').select('*');
      if (usersData) setAllUsers(usersData);
    } catch (err) { console.error("Data fetch fout:", err); }
  };

  const checkSession = async () => {
    console.log("🔍 Sessie controleren...");
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Sessie ophaalfout:", sessionError.message);
        return false;
      }

      if (!session?.user) {
        console.log("ℹ️ Geen actieve sessie.");
        return false;
      }

      console.log("📡 Profiel zoeken voor:", session.user.email);
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (profileError) {
        console.error("❗ Database fout:", profileError.message);
        setIsLoginModalOpen(false);
        return false;
      }

      if (profile) {
        console.log("✅ Profiel gevonden:", profile.role);
        if (profile.status === 'INACTIVE') {
          await handleLogout();
          alert('Dit account is gedeactiveerd.');
          return false;
        }
        setCurrentUser(profile);
        setIsLoginModalOpen(false);
        if (view === 'LANDING') setView('DASHBOARD');
        return true;
      } else {
        // GEEN PROFIEL GEVONDEN -> AUTO REPAIR
        console.log("⚠️ Gebruiker ingelogd maar geen profielrij. Profiel aanmaken...");
        
        // Check of dit de allereerste gebruiker is
        const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const isFirstUser = count === 0;

        const newProfile = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Nieuwe Gebruiker',
          role: isFirstUser ? 'ADMIN' : 'COACH',
          status: isFirstUser ? 'ACTIVE' : 'PENDING'
        };

        const { data: insertedProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .single();

        if (insertError) {
          console.error("❌ Fout bij aanmaken profiel:", insertError.message);
          setIsLoginModalOpen(false);
          return false;
        }

        console.log("🎉 Profiel succesvol aangemaakt als:", newProfile.role);
        setCurrentUser(insertedProfile);
        setIsLoginModalOpen(false);
        setView('DASHBOARD');
        await fetchData();
        return true;
      }
    } catch (err) {
      console.error("💥 Onverwachte fout in checkSession:", err);
      setIsLoginModalOpen(false);
      return false;
    }
  };

  const handleLoginAttempt = async (email: string, pass: string) => {
    console.log("🔑 Inlogpoging...");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) {
        console.error("❌ Login fout:", error.message);
        alert(`Fout: ${error.message}`);
      }
      // checkSession wordt automatisch getriggerd door onAuthStateChange
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
