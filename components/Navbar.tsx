
import React from 'react';
import { Layout, Users, Play, BookOpen, LogOut, Menu, X, Settings } from 'lucide-react';
import { Role, ViewState } from '../types';
import Logo from './Logo';

interface NavbarProps {
  userRole: Role;
  currentView: ViewState;
  setView: (view: ViewState) => void;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ userRole, currentView, setView, onLogout }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const navItems = [
    { label: 'Dashboard', view: 'DASHBOARD', role: ['COACH', 'ADMIN'], icon: Layout },
    { label: 'Oefeningen', view: 'EXERCISES', role: ['COACH', 'ADMIN'], icon: Play },
    { label: 'Blog', view: 'BLOG', role: ['COACH', 'ADMIN'], icon: BookOpen },
    { label: 'Podcasts', view: 'PODCASTS', role: ['COACH', 'ADMIN'], icon: Users },
    { label: 'Gebruikers', view: 'ADMIN_USERS', role: ['ADMIN'], icon: Settings },
  ];

  return (
    <nav className="bg-brand-dark text-white shadow-lg sticky top-0 z-50 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center cursor-pointer" onClick={() => setView('DASHBOARD')}>
            <Logo light={true} />
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-2">
              {navItems.filter(item => item.role.includes(userRole)).map((item) => (
                <button
                  key={item.view}
                  onClick={() => setView(item.view as ViewState)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    currentView === item.view 
                      ? 'bg-brand-green text-white shadow-lg shadow-brand-green/20' 
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon size={16} />
                  {item.label}
                </button>
              ))}
              
              <div className="h-6 w-px bg-white/10 mx-4"></div>
              
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={16} />
                Uitloggen
              </button>
            </div>
          </div>

          <div className="md:hidden flex items-center gap-4">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-300 hover:text-white focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-slate-900 border-t border-white/5 px-2 pt-2 pb-3 space-y-1 sm:px-3 animate-in slide-in-from-top duration-300">
          {navItems.filter(item => item.role.includes(userRole)).map((item) => (
            <button
              key={item.view}
              onClick={() => {
                setView(item.view as ViewState);
                setIsOpen(false);
              }}
              className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl text-base font-bold ${
                currentView === item.view ? 'bg-brand-green text-white' : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
          <button
            onClick={onLogout}
            className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl text-base font-bold text-red-400 hover:bg-red-500/10"
          >
            <LogOut size={18} />
            Uitloggen
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
