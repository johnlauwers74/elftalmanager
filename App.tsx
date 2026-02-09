
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
      await checkSession();
      await ensureAdminExists();
      handleUrlParameters();
    };
    init();
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
      // Check of er al een admin is in de profiles tabel
      const { data: admins, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'ADMIN')
        .limit(1);

      if (!admins || admins.length === 0) {
        console.log("Geen admin gevonden, bezig met initialisatie...");
        const adminEmail = (process.env as any).ADMIN_EMAIL;
        const adminPass = (process.env as any).ADMIN_PASSWORD;

        if (adminEmail && adminPass) {
          // Maak de admin aan in Auth
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: adminEmail,
            password: adminPass,
          });

          if (authError && !authError.message.includes("already registered")) {
            console.error("Admin Auth Error:", authError.message);
            return;
          }

          // Maak of update het profiel
          const adminUserId = authData.user?.id;
          const { error: profileError } = await supabase.from('profiles').upsert({
            email: adminEmail,
            name: 'Hoofd Administrator',
            role: 'ADMIN',
            status: 'ACTIVE',
            id: adminUserId || undefined
          }, { onConflict: 'email' });

          if (profileError) console.error("Admin Profile Error:", profileError.message);
          else console.log("Admin succesvol geïnitialiseerd.");
          
          await fetchData();
        }
      }
    } catch (err) {
      console.error("Fout bij checken admin status:", err);
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
          .eq('email', session.user.email)
          .maybeSingle();
        
        if (profile) {
          if (profile.status === 'INACTIVE') {
            await handleLogout();
            alert('Dit account is momenteel gedeactiveerd.');
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
        if (profile && profile.status === 'PENDING') {
          alert('Je aanvraag is nog in behandeling door een administrator.');
          return;
        }
        if (profile && profile.status === 'APPROVED') {
          alert('Je account is goedgekeurd! Stel eerst je wachtwoord in via de link in je e-mail.');
          return;
        }
        alert('E-mail of wachtwoord onjuist.');
        return;
      }
      if (data.user) await checkSession();
    } catch (err) { alert('Verbindingsfout.'); }
  };

  const handleDemoLogin = (role: Role) => {
    // Demo login voor snelle preview
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

  const handleActivateAccount = (email: string) => {
    setActivationEmail(email);
    setIsLoginModalOpen(false);
    setView('SET_PASSWORD');
  };

  const handleSubscribeRequest = async (email: string, name: string) => {
    try {
      const { error } = await supabase.from('profiles').insert([{ email, name, role: 'COACH', status: 'PENDING' }]);
      if (error) {
        if (error.code === '23505') alert('Dit e-mailadres heeft al een aanvraag ingediend.');
        else throw error;
      } else {
        alert('Bedankt! Je aanvraag is verzonden naar de administratie.');
        await fetchData();
      }
    } catch (err: any) { alert('Aanvraag mislukt.'); }
  };

  const handleApproveUser = async (id: string) => {
    try {
      const user = allUsers.find(u => u.id === id || (u as any).email === id);
      const email = user?.email;

      // 1. Update status naar APPROVED in de database
      const { error: updateError } = await supabase.from('profiles').update({ status: 'APPROVED' }).eq('email', email);
      if (updateError) throw updateError;

      // 2. Verstuur activatie-instructies (Simulatie via Supabase Auth reset password flow)
      // Dit stuurt een officiële e-mail naar de gebruiker om een wachtwoord te kiezen
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email!, {
        redirectTo: `${window.location.origin}/?activate=${encodeURIComponent(email!)}`,
      });

      if (authError) console.warn("Auth Mail Error:", authError.message);
      
      alert('Coach goedgekeurd! Er is een e-mail verzonden naar ' + email + ' om een wachtwoord in te stellen.');
      await fetchData();
    } catch (err: any) { alert('Fout bij goedkeuren: ' + err.message); }
  };

  const handleSetPassword = async (pass: string) => {
    if (!activationEmail) return;
    try {
      // Gebruik signUp voor nieuwe gebruikers of updatePassword voor bestaande invitees
      const { data, error } = await supabase.auth.signUp({ email: activationEmail, password: pass });
      
      if (error) {
        if (error.message.includes("already registered")) {
          // Als ze al in Auth staan (via de invite/approve stap), update dan het wachtwoord
          const { error: updateError } = await supabase.auth.updateUser({ password: pass });
          if (updateError) throw updateError;
        } else {
          throw error;
        }
      }

      await supabase.from('profiles').update({ 
        status: 'ACTIVE', 
        password: 'AUTH_MANAGED' 
      }).eq('email', activationEmail);

      alert('Wachtwoord ingesteld! Je kunt nu inloggen.');
      setView('LANDING');
    } catch (err: any) { 
      alert('Fout bij instellen wachtwoord: ' + err.message); 
      throw err; 
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setView('LANDING');
  };

  const handleToggleStatus = async (id: string, currentStatus: UserStatus) => {
    try {
      const newStatus: UserStatus = currentStatus === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
      const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (err: any) { alert('Fout: ' + err.message); }
  };

  const handleSaveExercise = async (ex: Exercise) => {
    try {
      const isExisting = exercises.some(e => e.id === ex.id && !ex.id.startsWith('demo'));
      if (isExisting) {
        await supabase.from('exercises').update(ex).eq('id', ex.id);
      } else {
        const { id, createdAt, ...newExData } = ex;
        await supabase.from('exercises').insert([newExData]);
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
        await supabase.from('articles').update(art).eq('id', art.id);
      } else {
        const { id, ...newArtData } = art;
        await supabase.from('articles').insert([newArtData]);
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
