import React, { useState, useEffect } from 'react';
import { MessageSquare, Shield, Lock, UserCircle, Menu, X, Eye } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import ToolsView from './components/ToolsView';
import EncryptionVisualizer from './components/EncryptionVisualizer';
import ProfileSettings from './components/ProfileSettings';
import { NavView, UserProfile } from './types';

// Liquid Eye Logo Component
const LiquidEyeLogo = () => (
  <div className="relative w-12 h-12 flex items-center justify-center">
    <div className="absolute inset-0 bg-primary-dark/20 blur-xl rounded-full animate-pulse-fast"></div>
    <div className="w-10 h-10 bg-gradient-to-br from-primary-dark to-emerald-800 animate-liquid shadow-[0_0_15px_rgba(16,185,129,0.5)] flex items-center justify-center border border-white/10 relative overflow-hidden">
        <div className="absolute top-1 left-2 w-3 h-3 bg-white/20 rounded-full blur-[2px]"></div>
        <div className="w-4 h-4 bg-surface-dim rounded-full flex items-center justify-center shadow-inner relative z-10">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-ping absolute opacity-75"></div>
            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
        </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<NavView>(NavView.CHAT);
  const [userProfile, setUserProfile] = useState<UserProfile>({
      username: 'Ghost',
      avatarUrl: ''
  });

  // Load Profile from Storage on Launch
  useEffect(() => {
      const savedProfile = localStorage.getItem('cipher_user_profile');
      if (savedProfile) {
          try {
              setUserProfile(JSON.parse(savedProfile));
          } catch (e) {
              console.error("Failed to load profile", e);
          }
      }
  }, []);

  const handleSaveProfile = (profile: UserProfile) => {
      setUserProfile(profile);
      localStorage.setItem('cipher_user_profile', JSON.stringify(profile));
      setCurrentView(NavView.CHAT);
  };

  const renderView = () => {
    switch (currentView) {
      case NavView.CHAT:
        return <ChatInterface userProfile={userProfile} />;
      case NavView.TOOLS:
        return <ToolsView />;
      case NavView.ENCRYPTION:
        return <EncryptionVisualizer />;
      case NavView.PROFILE:
        return <ProfileSettings profile={userProfile} onSave={handleSaveProfile} />;
      default:
        return <ChatInterface userProfile={userProfile} />;
    }
  };

  const navItems = [
    { id: NavView.CHAT, label: 'Chats', icon: MessageSquare },
    { id: NavView.TOOLS, label: 'Privacy', icon: Shield },
    { id: NavView.ENCRYPTION, label: 'Crypto', icon: Lock },
    { id: NavView.PROFILE, label: 'Profile', icon: UserCircle },
  ];

  return (
    <div className="h-[100dvh] w-screen flex flex-col md:flex-row bg-surface-dim text-zinc-100 overflow-hidden font-sans">
      
      {/* Desktop M3 Navigation Rail */}
      <aside className="hidden md:flex flex-col w-24 lg:w-72 bg-surface-container m-4 rounded-[2rem] border border-white/5 h-[calc(100vh-2rem)] py-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary-container/20 to-transparent pointer-events-none"></div>
        
        <div className="flex flex-col items-center lg:items-start px-4 lg:px-6 mb-8 z-10">
            <div className="flex items-center gap-4">
                <LiquidEyeLogo />
                <div className="hidden lg:block">
                    <h1 className="text-xl font-bold tracking-tight text-white">CipherChat</h1>
                    <p className="text-[10px] text-primary uppercase tracking-widest font-medium">Liquid Secure</p>
                </div>
            </div>
        </div>
        
        <nav className="flex-1 px-3 space-y-2 z-10 w-full flex flex-col items-center lg:items-stretch">
            {navItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`group relative flex items-center gap-4 px-4 py-4 lg:py-3 rounded-full transition-all duration-300 w-16 lg:w-full justify-center lg:justify-start ${
                        currentView === item.id 
                        ? 'bg-primary-container text-primary-dark' 
                        : 'text-zinc-400 hover:bg-surface-bright hover:text-zinc-200'
                    }`}
                >
                    <item.icon size={24} className={currentView === item.id ? 'fill-current' : ''} />
                    <span className={`hidden lg:block text-sm font-medium ${currentView === item.id ? 'font-bold' : ''}`}>
                        {item.label}
                    </span>
                    {currentView === item.id && (
                        <div className="absolute left-0 w-1 h-8 bg-primary rounded-r-full lg:hidden"></div>
                    )}
                </button>
            ))}
        </nav>

        <div className="mt-auto px-6 pt-6 border-t border-white/5 z-10">
             <div onClick={() => setCurrentView(NavView.PROFILE)} className="hidden lg:flex items-center gap-3 p-3 rounded-2xl bg-surface-dim border border-white/5 cursor-pointer hover:border-primary/30 transition-all group">
                 <div className="w-10 h-10 rounded-full bg-surface-bright overflow-hidden flex items-center justify-center shrink-0 border-2 border-transparent group-hover:border-primary transition-all">
                     {userProfile.avatarUrl ? (
                         <img src={userProfile.avatarUrl} alt="" className="w-full h-full object-cover" />
                     ) : (
                         <span className="font-bold text-sm text-zinc-400">{userProfile.username[0]}</span>
                     )}
                 </div>
                 <div className="overflow-hidden">
                     <p className="text-sm font-bold truncate text-zinc-200 group-hover:text-primary transition-colors">{userProfile.username}</p>
                     <p className="text-[10px] text-zinc-500">My Identity</p>
                 </div>
             </div>
             {/* Small Avatar for Rail mode */}
             <div onClick={() => setCurrentView(NavView.PROFILE)} className="lg:hidden flex justify-center cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-surface-dim border border-white/10 overflow-hidden flex items-center justify-center">
                     {userProfile.avatarUrl ? (
                         <img src={userProfile.avatarUrl} alt="" className="w-full h-full object-cover" />
                     ) : (
                         <span className="font-bold text-xs">{userProfile.username[0]}</span>
                     )}
                 </div>
             </div>
        </div>
      </aside>

      {/* Mobile Top Bar (M3 Small Top App Bar) */}
      <header className="md:hidden h-16 bg-surface-dim/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
            <LiquidEyeLogo />
            <span className="font-bold text-xl tracking-tight">CipherChat</span>
        </div>
        <button onClick={() => setCurrentView(NavView.PROFILE)} className="w-10 h-10 rounded-full bg-surface-bright overflow-hidden border border-white/5">
             {userProfile.avatarUrl ? (
                 <img src={userProfile.avatarUrl} alt="" className="w-full h-full object-cover" />
             ) : (
                 <div className="w-full h-full flex items-center justify-center bg-surface-container text-zinc-400">
                    <UserCircle size={24} />
                 </div>
             )}
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-hidden relative w-full md:py-4 md:pr-4">
        <div className="h-full w-full bg-surface-dim md:bg-surface-dim md:rounded-[2rem] md:border md:border-white/5 overflow-hidden relative shadow-2xl">
            {/* Liquid Background Gradient */}
            <div className="absolute inset-0 bg-liquid-glow pointer-events-none opacity-50"></div>
            {renderView()}
        </div>
      </main>

      {/* Mobile M3 Navigation Bar */}
      <nav className="md:hidden bg-surface-container border-t border-white/5 pb-safe-area shadow-[0_-5px_20px_rgba(0,0,0,0.3)] z-40">
        <div className="flex justify-around items-center h-20 px-2 pb-2">
           {navItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 group pt-2`}
                >
                    <div className={`px-5 py-1.5 rounded-full transition-all duration-300 ${currentView === item.id ? 'bg-primary-container text-primary-dark' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                        <item.icon size={24} className={currentView === item.id ? 'fill-current' : ''} />
                    </div>
                    <span className={`text-[11px] font-medium transition-colors ${currentView === item.id ? 'text-zinc-200' : 'text-zinc-500'}`}>{item.label}</span>
                </button>
            ))}
        </div>
      </nav>

    </div>
  );
};

export default App;