
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
    fetchData();
    checkSession();
    handleUrlParameters();
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
      const { data: exData } = await supabase.from('exercises').select('*').order('createdAt', { ascending: false });
      if (exData) setExercises(exData);

      const { data: artData } = await supabase.from('articles').select('*').order('date', { ascending: false });
      if (artData) setArticles(artData);

      const { data: podData } = await supabase.from('podcasts').select('*').order('date', { ascending: false });
      if (podData) setPodcasts(podData);

      const { data: usersData } = await supabase.from('profiles').select('*').order('status', { ascending: true });
      if (usersData) setAllUsers(usersData || []);
    } catch (err) {
      console.error("Fout bij ophalen Supabase data:", err);
    }
  };

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .or(`id.eq.${session.user.id},email.eq.${session.user.email}`)
          .maybeSingle();
        
        if (profile) {
          if (profile.status === 'INACTIVE') {
            await handleLogout();
            alert('Dit account is gedeactiveerd.');
            return;
          }
          setCurrentUser(profile);
          if (view === 'LANDING' || view === 'SET_PASSWORD') setView('DASHBOARD');
        }
      }
    } catch (err) {
      console.error("Session check error:", err);
    }
  };

  const handleLoginAttempt = async (email: string, pass: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
        if (profile && (profile.status === 'APPROVED' || profile.status === 'PENDING' || !profile.password)) {
          alert('Je account is nog niet volledig geactiveerd. Gebruik de link in je mail of de activatieknop.');
          return;
        }
        alert('Foutieve inloggegevens.');
        return;
      }
      if (data.user) await checkSession();
    } catch (err) { alert('Verbindingsfout.'); }
  };

  const handleDemoLogin = (role: Role) => {
    const mockUser: User = {
      id: role === 'ADMIN' ? 'demo-admin-id' : 'demo-coach-id',
      name: role === 'ADMIN' ? 'Demo Admin' : 'Demo Coach',
      email: role === 'ADMIN' ? 'admin@elftal.be' : 'coach@elftal.be',
      role: role,
      status: 'ACTIVE'
    };
    setCurrentUser(mockUser);
    setIsLoginModalOpen(false);
    setView('DASHBOARD');
  };

  const handleActivateAccount = (email: string) => {
    setActivationEmail(email);
    setIsLoginModalOpen(false);
    setView('SET_PASSWORD');
  };

  const handleSubscribeRequest = async (email: string, name: string) => {
    try {
      const { error } = await supabase.from('profiles').insert([{ email, name, role: 'COACH', status: 'PENDING' }]);
      if (error) throw error;
      alert('Aanvraag verzonden! Een admin zal je account bekijken.');
      await fetchData();
    } catch (err: any) { alert('Aanvraag mislukt.'); }
  };

  const handleApproveUser = async (id: string) => {
    try {
      // We zetten de status op APPROVED. In een echte productie omgeving zou je hier een 
      // Edge Function aanroepen die de Supabase Auth invite verstuurt.
      const { error } = await supabase.from('profiles').update({ status: 'APPROVED' }).eq('id', id);
      if (error) throw error;
      alert('Gebruiker goedgekeurd. De coach kan nu zijn wachtwoord instellen via de activatie-URL.');
      await fetchData();
    } catch (err: any) { alert('Fout: ' + err.message); }
  };

  const handleSetPassword = async (pass: string) => {
    if (!activationEmail) return;
    try {
      // Supabase Auth signUp verstuurt automatisch een email ter bevestiging 
      // mits ingeschakeld in het dashboard.
      const { data, error } = await supabase.auth.signUp({ email: activationEmail, password: pass });
      if (error) {
        if (error.message.includes("already registered")) {
          alert("Dit e-mailadres is al geactiveerd.");
          return;
        }
        throw error;
      }
      if (data.user) {
        await supabase.from('profiles').update({ id: data.user.id, status: 'ACTIVE', password: 'AUTH_MANAGED' }).eq('email', activationEmail);
        alert('Account succesvol aangemaakt! Check je mail voor de allerlaatste bevestiging.');
        setView('LANDING');
      }
    } catch (err: any) { alert('Fout: ' + err.message); throw err; }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setView('LANDING');
  };

  // Fixed: Added missing handleToggleStatus function to resolve the error on line 222
  const handleToggleStatus = async (id: string, currentStatus: UserStatus) => {
    try {
      const newStatus: UserStatus = currentStatus === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
      const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      alert('Fout bij wijzigen status: ' + err.message);
    }
  };

  const handleSaveExercise = async (ex: Exercise) => {
    try {
      const isExisting = exercises.some(e => e.id === ex.id && !ex.id.startsWith('demo'));
      if (isExisting) {
        const { error } = await supabase.from('exercises').update(ex).eq('id', ex.id);
        if (error) throw error;
      } else {
        const { id, createdAt, ...newExData } = ex;
        const { error } = await supabase.from('exercises').insert([newExData]);
        if (error) throw error;
      }
      await fetchData();
      setEditingExercise(null);
      setView('EXERCISES');
    } catch (err: any) { alert(err.message); }
  };

  const handleSaveArticle = async (art: Article) => {
    try {
      const isExisting = articles.some(a => a.id === art.id && !art.id.startsWith('art-'));
      if (isExisting) {
        const { error } = await supabase.from('articles').update(art).eq('id', art.id);
        if (error) throw error;
      } else {
        const { id, ...newArtData } = art;
        const { error } = await supabase.from('articles').insert([newArtData]);
        if (error) throw error;
      }
      await fetchData();
      setEditingArticle(null);
      setView('BLOG');
    } catch (err: any) { alert(err.message); }
  };

  const renderView = () => {
    if (view === 'SET_PASSWORD') return <SetPasswordView onSave={handleSetPassword} email={activationEmail} onCancel={() => setView('LANDING')} />;
    if (!currentUser || view === 'LANDING') return <LandingPage onLogin={() => setIsLoginModalOpen(true)} onSubscribe={handleSubscribeRequest} />;

    switch (view) {
      case 'DASHBOARD': return <Dashboard exercisesCount={exercises.length} articlesCount={articles.length} />;
      case 'EXERCISES': return <ExerciseList exercises={exercises} onAdd={() => setView('CREATE_EXERCISE')} onEdit={(ex) => { setEditingExercise(ex); setView('EDIT_EXERCISE'); }} isAdmin={currentUser.role === 'ADMIN'} />;
      case 'CREATE_EXERCISE': return <ExerciseForm onSave={handleSaveExercise} onCancel={() => setView('EXERCISES')} />;
      case 'EDIT_EXERCISE': return <ExerciseForm onSave={handleSaveExercise} onCancel={() => setView('EXERCISES')} initialData={editingExercise || undefined} />;
      case 'BLOG': return <BlogView articles={articles} isAdmin={currentUser.role === 'ADMIN'} onAddArticle={() => setView('CREATE_ARTICLE')} onEditArticle={(art) => { setEditingArticle(art); setView('EDIT_ARTICLE'); }} onViewArticle={(art) => { setSelectedArticle(art); setView('VIEW_ARTICLE'); }} />;
      case 'VIEW_ARTICLE': return selectedArticle ? <ArticleDetail article={selectedArticle} onBack={() => setView('BLOG')} /> : null;
      case 'CREATE_ARTICLE': return <ArticleForm onSave={handleSaveArticle} onCancel={() => setView('BLOG')} />;
      case 'EDIT_ARTICLE': return <ArticleForm onSave={handleSaveArticle} onCancel={() => setView('BLOG')} initialData={editingArticle || undefined} />;
      case 'PODCASTS': return <PodcastView podcasts={podcasts} isAdmin={currentUser.role === 'ADMIN'} onAddPodcast={() => {}} />;
      case 'ADMIN_USERS': return <AdminUserView users={allUsers} onApprove={handleApproveUser} onUpdateRole={(id, r) => supabase.from('profiles').update({ role: r }).eq('id', id).then(fetchData)} onToggleStatus={handleToggleStatus} currentAdminId={currentUser.id} />;
      default: return <Dashboard exercisesCount={exercises.length} articlesCount={articles.length} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {currentUser && view !== 'LANDING' && <Navbar userRole={currentUser.role} currentView={view} setView={setView} onLogout={handleLogout} />}
      <main className="flex-grow">{renderView()}</main>
      {isLoginModalOpen && <LoginModal onClose={() => setIsLoginModalOpen(false)} onLogin={handleLoginAttempt} onActivate={handleActivateAccount} onDemoLogin={handleDemoLogin} />}
    </div>
  );
};

export default App;
