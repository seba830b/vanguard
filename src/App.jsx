import React, { useState, useEffect } from 'react';
import { ClerkProvider, SignIn, SignedIn, SignedOut, useUser, useAuth, useClerk, UserButton } from "@clerk/clerk-react";

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

import { 
  Settings, Terminal, Database, Palette, 
  FileText, ChevronRight, CheckCircle,
  Image as ImageIcon, Eye, Edit3, Link as LinkIcon,
  Plus, Trash2, Users, BarChart, ChevronLeft,
  Moon, Sun
} from 'lucide-react';

// --- INITIAL DEFAULT DATA ---
const DEFAULT_CONFIG = {
  identity: {
    siteName: "what you need me to do",
    tagline: "Voice of the Red Commune",
    mastheadDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    aboutTitle: "The Program",
    aboutText: "We are the vanguard. Our mission is to dismantle the archaic structures of capital and forge a new paradigm of collective ownership.\n\n1. Abolition of private property.\n2. Heavy progressive income tax.\n3. Centralization of credit."
  },
  theme: { primary: "#990000", accent: "#FFD700", background: "#FDFBF7", text: "#222222", fontFamily: "serif" },
  categories: ["Current Struggle", "Theory & Education", "International", "The Archives"],
  integrations: { dbEndpoint: "Firebase Sync Active", apiWebhook: "https://api.redcommune.org/publish", cliToken: "rc_sec_8f92a" },
  team: [
    { email: "admin@vanguard.org", role: "admin" }
  ]
};

const INITIAL_ARTICLES = [
  { 
    id: 1, 
    title: "Database Initialized", 
    category: "The Archives", 
    excerpt: "The Vanguard cloud databank is active. Dispatches will now sync globally.", 
    content: "The Vanguard cloud databank is active. Dispatches will now sync globally.\n\nThis is the full text of the article where you can expand upon the theories, current struggles, and international news. Workers of the world, unite!",
    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    featured: true,
    imageUrl: "https://images.unsplash.com/photo-1506869640319-ce1a4484c2eb?auto=format&fit=crop&q=80&w=1000"
  }
];

// --- ENVIRONMENT VARIABLES ---
const getEnv = (key) => {
  try { return import.meta.env[key] || ""; } 
  catch (e) { return ""; }
};

const CLERK_KEY = getEnv("VITE_CLERK_PUBLISHABLE_KEY");

const fbConfig = {
  apiKey: getEnv("VITE_FIREBASE_API_KEY"),
  authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: getEnv("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: getEnv("VITE_FIREBASE_APP_ID")
};

// --- MAIN APPLICATION COMPONENT ---
export default function AppWrapper() {
  if (!CLERK_KEY || !fbConfig.apiKey) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-10">
         <div className="bg-red-900/20 border border-red-500 text-red-100 p-6 rounded-lg max-w-lg text-center font-mono shadow-2xl">
            <h2 className="text-xl font-bold mb-2 uppercase">Missing API Keys</h2>
            <p className="text-sm mb-4">Clerk or Firebase keys are missing from your environment.</p>
            <div className="text-xs text-left bg-black/40 p-4 rounded space-y-2">
              <p>Check your <code>.env.local</code> and Cloudflare settings for:</p>
              <ul className="list-disc pl-4 text-gray-300">
                <li>VITE_CLERK_PUBLISHABLE_KEY</li>
                <li>VITE_FIREBASE_API_KEY</li>
                <li>VITE_FIREBASE_AUTH_DOMAIN</li>
                <li>(and the rest of the Firebase config)</li>
              </ul>
            </div>
         </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={CLERK_KEY}>
      <VanguardApp />
    </ClerkProvider>
  );
}

function VanguardApp() {
  const [view, setView] = useState('public'); 
  const { isLoaded: isClerkLoaded } = useAuth();

  const [db, setDb] = useState(null);
  const [fbUser, setFbUser] = useState(null);
  const [isDbReady, setIsDbReady] = useState(false);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [articles, setArticles] = useState(INITIAL_ARTICLES);

  useEffect(() => {
    if (!fbConfig.apiKey) return;
    
    try {
      const app = initializeApp(fbConfig);
      const auth = getAuth(app);
      const database = getFirestore(app);
      setDb(database);

      const initAuth = async () => {
        try {
          await signInAnonymously(auth);
        } catch (e) {
          console.error("Firebase auth error:", e);
        }
      };
      
      initAuth();
      const unsubscribe = onAuthStateChanged(auth, (user) => {
         setFbUser(user);
      });
      return () => unsubscribe();
    } catch (e) {
      console.error("Firebase Initialization Error:", e);
    }
  }, []);

  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      setIsDbReady(true);
    }, 2500);

    if (!fbUser || !db) return;

    const appId = typeof __app_id !== 'undefined' ? __app_id : 'vanguard-app';
    const configRef = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'main');
    const articlesRef = doc(db, 'artifacts', appId, 'public', 'data', 'articles', 'main');

    const unsubConfig = onSnapshot(configRef, (snap) => {
      clearTimeout(fallbackTimer);
      if (snap.exists()) {
        const cloudConfig = snap.data();
        setConfig({
          ...DEFAULT_CONFIG,
          ...cloudConfig,
          identity: { ...DEFAULT_CONFIG.identity, ...(cloudConfig?.identity || {}) },
          theme: { ...DEFAULT_CONFIG.theme, ...(cloudConfig?.theme || {}) },
          categories: cloudConfig?.categories || DEFAULT_CONFIG.categories,
          team: cloudConfig?.team || DEFAULT_CONFIG.team
        });
      }
      setIsDbReady(true);
    }, (err) => {
      clearTimeout(fallbackTimer);
      console.error("Config Sync Error:", err);
      setIsDbReady(true);
    });

    const unsubArticles = onSnapshot(articlesRef, (snap) => {
      if (snap.exists() && snap.data().items) {
        setArticles(snap.data().items);
      }
    }, (err) => console.error("Article Sync Error:", err));

    return () => { 
      clearTimeout(fallbackTimer);
      unsubConfig(); 
      unsubArticles(); 
    };
  }, [fbUser, db]);

  return (
    <div className="min-h-screen relative font-sans transition-colors duration-300">
      {(!isDbReady || (view === 'admin' && !isClerkLoaded)) && (
        <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col items-center justify-center font-mono text-red-500">
          <Terminal size={48} className="animate-pulse mb-4" />
          <div className="tracking-widest">ESTABLISHING SECURE CONNECTION...</div>
        </div>
      )}

      {view === 'public' && isDbReady && (
        <PublicSite 
          config={config} 
          articles={articles} 
          onSecretLogin={() => setView('admin')} 
        />
      )}
      
      {view === 'admin' && isClerkLoaded && isDbReady && (
        <>
          <SignedOut>
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
              <div className="mb-8 text-center">
                <Terminal size={48} className="mx-auto mb-4" style={{ color: config.theme.primary }} />
                <h2 className="text-2xl text-white font-bold uppercase tracking-wider">Vanguard CMS Access</h2>
                <p className="text-gray-400 text-sm mt-2 mb-6">Authorized personnel only.</p>
              </div>
              <SignIn routing="hash" forceRedirectUrl="/" />
              <button 
                onClick={() => setView('public')}
                className="mt-8 text-gray-500 hover:text-white text-sm transition-colors font-mono"
              >
                ← Return to Public Dispatch
              </button>
            </div>
          </SignedOut>
          
          <SignedIn>
            <AdminDashboard 
              db={db}
              fbUser={fbUser}
              config={config} 
              setConfig={setConfig}
              articles={articles}
              setArticles={setArticles}
              onReturnPublic={() => setView('public')}
            />
          </SignedIn>
        </>
      )}
    </div>
  );
}

// --- PUBLIC SITE COMPONENT ---
function PublicSite({ config, articles, onSecretLogin }) {
  const { identity, theme, categories } = config;
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  
  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Computed Theme (Swaps colors if dark mode is active)
  const activeTheme = isDarkMode 
    ? { ...theme, background: '#121212', text: '#e5e5e5' } 
    : theme;

  const todayDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const sortedArticles = [...(articles || [])].sort((a, b) => b.id - a.id);

  const featuredArticle = sortedArticles.find(a => a.featured) || sortedArticles[0] || null;
  const otherArticles = sortedArticles.filter(a => featuredArticle ? a.id !== featuredArticle.id : true);
  const categoryArticles = sortedArticles.filter(a => a.category === activeCategory);

  // Floating Dark Mode Toggle Button
  const DarkModeToggle = () => (
    <button 
      onClick={() => setIsDarkMode(!isDarkMode)}
      className="fixed top-6 right-6 z-50 p-2.5 rounded-full border-2 shadow-lg transition-transform hover:scale-110 active:scale-95"
      style={{ 
        borderColor: activeTheme.text, 
        color: activeTheme.text, 
        backgroundColor: activeTheme.background 
      }}
      title="Toggle Dark Mode"
    >
      {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );

  // FULL ARTICLE VIEW
  if (selectedArticle) {
    return (
      <div className="min-h-screen flex flex-col selection:bg-red-900 selection:text-white transition-colors duration-500" style={{ backgroundColor: activeTheme.background, color: activeTheme.text, fontFamily: activeTheme.fontFamily === 'serif' ? 'Georgia, serif' : 'system-ui, sans-serif' }}>
        <DarkModeToggle />
        <div className="w-full text-center py-1 text-xs tracking-widest uppercase font-bold text-white mb-8" style={{ backgroundColor: activeTheme.primary }}>
          Workers of the world, unite!
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex-1 w-full pb-20">
          <button 
            onClick={() => setSelectedArticle(null)}
            className="mb-8 flex items-center gap-2 text-sm font-bold uppercase tracking-widest hover:underline cursor-pointer"
            style={{ color: activeTheme.primary }}
          >
            <ChevronLeft size={16} /> Return to Dispatches
          </button>

          <article className="animate-in fade-in duration-500">
            {selectedArticle.imageUrl && (
              <img 
                src={selectedArticle.imageUrl} 
                alt={selectedArticle.title}
                className="w-full h-64 md:h-[50vh] object-cover mb-8 border-4 grayscale hover:grayscale-0 transition-all duration-500 shadow-xl"
                style={{ borderColor: activeTheme.text }}
              />
            )}
            <div className="flex items-center gap-4 mb-4 text-sm font-bold uppercase tracking-wider" style={{ color: activeTheme.primary }}>
              <span>{selectedArticle.category}</span>
              <span>•</span>
              <span>{selectedArticle.date}</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black uppercase leading-tight mb-8 tracking-tighter">
              {selectedArticle.title}
            </h1>
            
            <div className="text-xl md:text-2xl leading-relaxed whitespace-pre-wrap font-medium">
              {selectedArticle.content || selectedArticle.excerpt}
            </div>
          </article>
        </div>
      </div>
    );
  }

  // STANDARD GRID VIEW
  return (
    <div className="min-h-screen flex flex-col selection:bg-red-900 selection:text-white transition-colors duration-500" style={{ backgroundColor: activeTheme.background, color: activeTheme.text, fontFamily: activeTheme.fontFamily === 'serif' ? 'Georgia, serif' : 'system-ui, sans-serif' }}>
      <DarkModeToggle />
      <div className="w-full text-center py-1 text-xs tracking-widest uppercase font-bold text-white" style={{ backgroundColor: activeTheme.primary }}>
        Workers of the world, unite!
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 w-full">
        <header className="py-8 border-b-8 mb-8" style={{ borderColor: activeTheme.text }}>
          <div className="flex justify-between items-end border-b-2 pb-2 mb-4" style={{ borderColor: activeTheme.text }}>
            <span className="text-sm font-bold uppercase tracking-wider">{todayDate}</span>
            <span className="text-sm font-bold uppercase tracking-wider">Issue No. 48</span>
          </div>
          <h1 
            onClick={() => setActiveCategory(null)}
            className="text-6xl md:text-8xl lg:text-9xl font-black text-center uppercase tracking-tighter leading-none mb-4 cursor-pointer hover:opacity-90 transition-opacity" 
            style={{ color: activeTheme.primary }}
          >
            {identity.siteName}
          </h1>
          <p className="text-center text-xl md:text-2xl italic font-semibold border-t-2 pt-4" style={{ borderColor: activeTheme.text }}>{identity.tagline}</p>
        </header>

        <nav className="border-y-4 py-3 mb-12 flex flex-wrap justify-center gap-6 md:gap-12" style={{ borderColor: activeTheme.text }}>
          {categories.map((cat, idx) => (
            <span 
              key={idx} 
              onClick={() => setActiveCategory(cat)}
              className={`uppercase font-bold tracking-widest text-sm hover:underline cursor-pointer transition-colors ${activeCategory === cat ? 'underline' : 'opacity-80 hover:opacity-100'}`}
              style={{ color: activeCategory === cat ? activeTheme.primary : activeTheme.text }}
            >
              {cat}
            </span>
          ))}
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <main className="lg:col-span-8">
            {activeCategory ? (
              <div className="mb-16 animate-in fade-in duration-500">
                <h2 className="text-4xl md:text-5xl font-black uppercase mb-8 border-b-4 pb-2" style={{ borderColor: activeTheme.text }}>
                  Dispatch: {activeCategory}
                </h2>
                <div className="space-y-12">
                  {categoryArticles.length > 0 ? (
                    categoryArticles.map(article => (
                      <article key={article.id} onClick={() => setSelectedArticle(article)} className="group cursor-pointer border-b-2 pb-8 last:border-0" style={{ borderColor: activeTheme.text }}>
                        {article.imageUrl && (
                          <img 
                            src={article.imageUrl} 
                            alt={article.title}
                            className="w-full h-64 object-cover mb-4 border-4 grayscale hover:grayscale-0 transition-all duration-500"
                            style={{ borderColor: activeTheme.text }}
                          />
                        )}
                        <h3 className="text-3xl font-bold uppercase leading-tight mb-2 group-hover:underline">{article.title}</h3>
                        <div className="text-xs font-bold uppercase tracking-wider mb-4 opacity-70">{article.date}</div>
                        <p className="leading-relaxed text-lg whitespace-pre-wrap">{article.excerpt}</p>
                      </article>
                    ))
                  ) : (
                    <p className="text-xl italic font-medium opacity-70">No dispatches filed under this category yet.</p>
                  )}
                </div>
              </div>
            ) : (
              <>
                {featuredArticle && (
                  <article onClick={() => setSelectedArticle(featuredArticle)} className="mb-16 animate-in fade-in duration-500 cursor-pointer group">
                    {featuredArticle.imageUrl ? (
                      <img 
                        src={featuredArticle.imageUrl} 
                        alt={featuredArticle.title}
                        className="w-full h-64 md:h-96 object-cover mb-6 border-4 grayscale group-hover:grayscale-0 transition-all duration-500 shadow-xl"
                        style={{ borderColor: activeTheme.primary }}
                      />
                    ) : (
                      <div className="w-full h-64 md:h-96 mb-6 flex items-center justify-center border-4 shadow-xl group-hover:bg-black/10 transition-colors" style={{ backgroundColor: `${activeTheme.primary}20`, borderColor: activeTheme.primary }}>
                        <div className="text-center" style={{ color: activeTheme.primary }}>
                          <ImageIcon size={64} className="mx-auto mb-4 opacity-80" />
                          <p className="font-bold uppercase tracking-widest opacity-80">[ ARCHIVAL WOODCUT ]</p>
                        </div>
                      </div>
                    )}
                    
                    <h2 className="text-4xl md:text-6xl font-black uppercase leading-none mb-4 tracking-tight group-hover:underline">{featuredArticle.title}</h2>
                    <div className="flex items-center gap-4 mb-6 text-sm font-bold uppercase tracking-wider" style={{ color: activeTheme.primary }}>
                      <span onClick={(e) => { e.stopPropagation(); setActiveCategory(featuredArticle.category); }} className="cursor-pointer hover:underline">{featuredArticle.category}</span>
                      <span>•</span>
                      <span>{featuredArticle.date}</span>
                    </div>
                    <p className="text-xl leading-relaxed font-medium whitespace-pre-wrap">{featuredArticle.excerpt}</p>
                  </article>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t-4 pt-8" style={{ borderColor: activeTheme.text }}>
                  {otherArticles.map(article => (
                    <article key={article.id} onClick={() => setSelectedArticle(article)} className="group cursor-pointer">
                      {article.imageUrl && (
                        <img 
                          src={article.imageUrl} 
                          alt={article.title}
                          className="w-full h-40 object-cover mb-4 border-2 grayscale group-hover:grayscale-0 transition-all duration-500"
                          style={{ borderColor: activeTheme.text }}
                        />
                      )}
                      <h3 className="text-2xl font-bold uppercase leading-tight mb-2 group-hover:underline">{article.title}</h3>
                      <div className="text-xs font-bold uppercase tracking-wider mb-3 opacity-70" style={{ color: activeTheme.primary }}>{article.category}</div>
                      <p className="leading-snug line-clamp-3">{article.excerpt}</p>
                    </article>
                  ))}
                </div>
              </>
            )}
          </main>

          <aside className="lg:col-span-4 space-y-12">
            <div className="p-6 border-4 shadow-[8px_8px_0px_0px] transition-all hover:shadow-[12px_12px_0px_0px]" style={{ borderColor: activeTheme.text, shadowColor: activeTheme.primary, backgroundColor: activeTheme.background }}>
              <h3 className="text-2xl font-black uppercase mb-4 border-b-2 pb-2" style={{ borderColor: activeTheme.text }}>
                {identity.aboutTitle || "The Program"}
              </h3>
              <div className="whitespace-pre-wrap text-sm leading-relaxed font-medium">{identity.aboutText}</div>
            </div>
          </aside>
        </div>
      </div>

      <footer className="mt-20 py-8 border-t-4 text-center group" style={{ borderColor: activeTheme.text }}>
        <button 
          onClick={onSecretLogin}
          className="text-xs font-mono uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-500 cursor-pointer"
          style={{ color: activeTheme.text }}
        >
           [ TERMINAL ACCESS ] 
        </button>
      </footer>
    </div>
  );
}

// --- ADMIN DASHBOARD COMPONENT ---
function AdminDashboard({ db, fbUser, config, setConfig, articles, setArticles, onReturnPublic }) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [activeTab, setActiveTab] = useState('content');
  const [savedStatus, setSavedStatus] = useState(false);
  
  const [previewStates, setPreviewStates] = useState({});
  const [expandedArticleId, setExpandedArticleId] = useState(null);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('moderator');

  const userEmail = (user?.primaryEmailAddress?.emailAddress || '').toLowerCase();
  
  const configTeam = config.team || [];
  const teamMember = configTeam.find(m => m.email.toLowerCase() === userEmail);
  const isAdmin = userEmail.includes('admin') || (teamMember && teamMember.role === 'admin');
  const roleName = isAdmin ? 'Admin' : 'Moderator';

  const tabs = [
    { id: 'content', label: 'Article Manager', icon: FileText, requireAdmin: false },
    { id: 'analytics', label: 'Reader Analytics', icon: BarChart, requireAdmin: false },
    { id: 'identity', label: 'Identity Settings', icon: Settings, requireAdmin: true },
    { id: 'theme', label: 'Theme Architecture', icon: Palette, requireAdmin: true },
    { id: 'team', label: 'Access Control', icon: Users, requireAdmin: true },
  ].filter(tab => !tab.requireAdmin || isAdmin);

  const handleSave = async () => {
    if (!db) {
      alert("Error: Database connection is missing.");
      return;
    }
    if (!fbUser) {
      alert("Error: Firebase User is missing. Did you enable Anonymous Authentication in the Firebase Console?");
      return;
    }

    try {
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'vanguard-app';
      const configRef = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'main');
      const articlesRef = doc(db, 'artifacts', appId, 'public', 'data', 'articles', 'main');
      
      await setDoc(configRef, config);
      await setDoc(articlesRef, { items: articles });

      setSavedStatus(true);
      setTimeout(() => setSavedStatus(false), 3000);
    } catch (err) {
      console.error("Deployment failed:", err);
      alert("Failed to push changes to Firebase database.");
    }
  };

  const togglePreview = (id) => {
    setPreviewStates(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const addArticle = () => {
    const newArticle = {
      id: Date.now(),
      title: "New Dispatch Draft",
      category: config.categories[0],
      excerpt: "Enter your short front-page TLDR here...",
      content: "Enter the full dispatch content here...",
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      featured: false,
      imageUrl: ""
    };
    setArticles([newArticle, ...articles]);
    setExpandedArticleId(newArticle.id);
  };

  const deleteArticle = (id) => {
    if (window.confirm("Permanently delete this dispatch?")) {
      setArticles(articles.filter(a => a.id !== id));
    }
  };

  const addTeamMember = () => {
    if (!newEmail) return;
    const updatedTeam = [...(config.team || []), { email: newEmail.toLowerCase(), role: newRole }];
    setConfig({ ...config, team: updatedTeam });
    setNewEmail('');
  };

  const removeTeamMember = (emailToRemove) => {
    if (window.confirm(`Revoke access for ${emailToRemove}?`)) {
      const updatedTeam = (config.team || []).filter(m => m.email !== emailToRemove);
      setConfig({ ...config, team: updatedTeam });
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 flex flex-col md:flex-row font-sans selection:bg-red-900 selection:text-white">
      <aside className="w-full md:w-64 bg-gray-900 border-r border-gray-800 flex flex-col shadow-2xl z-10">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <div className="overflow-hidden">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 tracking-tight">
              <Terminal size={20} className="text-red-500 shrink-0" /> VANGUARD
            </h2>
            <div className="mt-1 text-xs text-gray-400 font-mono truncate" title={userEmail}>
              {userEmail} <br/>
              ROLE: <span className={isAdmin ? 'text-red-400 font-bold' : 'text-blue-400 font-bold'}>{roleName.toUpperCase()}</span>
            </div>
          </div>
          <div className="bg-gray-800 rounded-full p-1 border border-gray-700 ml-2 shrink-0">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
        
        <nav className="flex-1 py-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-gray-800 text-white border-r-2 border-red-500' : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'}`}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800 space-y-2">
          <button onClick={onReturnPublic} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm transition-colors border border-gray-700 font-bold uppercase tracking-widest">
            Return Home
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
        <header className="h-16 bg-gray-900/90 backdrop-blur border-b border-gray-800 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2 text-sm text-gray-400 font-mono">
            <span>root</span> <ChevronRight size={14} /> <span className="text-white capitalize">{activeTab}</span>
          </div>
          <button 
            onClick={handleSave}
            className={`flex items-center gap-2 px-6 py-2 text-white text-sm font-bold rounded shadow-lg transition-all active:scale-95 ${savedStatus ? 'bg-green-600 hover:bg-green-500' : 'bg-red-700 hover:bg-red-600'}`}
          >
            {savedStatus ? <CheckCircle size={16} /> : <Database size={16} />}
            {savedStatus ? 'Deployment Success' : 'Deploy Changes'}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-950/50">
          <div className="max-w-4xl mx-auto space-y-8 pb-32">
            
            {/* CONTENT TAB */}
            {activeTab === 'content' && (
              <section className="space-y-6 animate-in fade-in duration-500">
                <div className="flex justify-between items-end border-b border-gray-800 pb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white">Article Manager</h3>
                    <p className="text-xs font-mono text-gray-500 mt-1">Status: Active Dispatches ({articles.length})</p>
                  </div>
                  <button 
                    onClick={addArticle}
                    className="flex items-center gap-2 bg-red-700/20 hover:bg-red-700/40 border border-red-500/50 text-red-100 px-5 py-2.5 rounded-lg transition-all shadow-lg text-sm font-bold"
                  >
                    <Plus size={16} /> New Dispatch
                  </button>
                </div>
                
                <div className="space-y-6">
                  {articles.length === 0 && (
                    <div className="text-center py-12 bg-gray-900 border border-gray-800 rounded-lg border-dashed">
                      <FileText size={48} className="mx-auto text-gray-700 mb-4" />
                      <p className="text-gray-400">No articles found. Click "New Dispatch" to begin.</p>
                    </div>
                  )}

                  {[...articles].sort((a,b) => b.id - a.id).map((article) => {
                    const index = articles.findIndex(a => a.id === article.id);
                    const isPreviewing = previewStates[article.id];
                    const isExpanded = expandedArticleId === article.id;
                    
                    return (
                      <div key={article.id} className={`bg-gray-900 border ${article.featured ? 'border-red-500/50 shadow-[0_0_20px_rgba(220,38,38,0.1)]' : 'border-gray-800'} rounded-xl overflow-hidden transition-all duration-300`}>
                        <div 
                          className="bg-gray-800/50 border-b border-gray-800 p-4 flex justify-between items-center cursor-pointer hover:bg-gray-800 transition-colors"
                          onClick={() => setExpandedArticleId(isExpanded ? null : article.id)}
                        >
                          <div className="flex gap-4 items-center">
                            <span className="text-xs font-mono text-gray-500 bg-black/40 px-2 py-0.5 rounded shrink-0">#{article.id.toString().slice(-6)}</span>
                            <span className="font-bold text-gray-200 truncate pr-4">{article.title || 'Untitled Dispatch'}</span>
                            
                            {isExpanded && (
                              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-300 cursor-pointer hover:text-white transition-colors ml-4" onClick={(e) => e.stopPropagation()}>
                                <input 
                                  type="checkbox" 
                                  checked={article.featured}
                                  onChange={(e) => {
                                    const newArticles = [...articles];
                                    if(e.target.checked) newArticles.forEach(a => a.featured = false);
                                    newArticles[index].featured = e.target.checked;
                                    setArticles(newArticles);
                                  }}
                                  className="accent-red-600 w-4 h-4"
                                /> Featured Headline
                              </label>
                            )}
                          </div>
                          
                          <div className="flex gap-4 items-center shrink-0" onClick={e => e.stopPropagation()}>
                            {isExpanded && (
                              <>
                                <button 
                                  onClick={() => togglePreview(article.id)}
                                  className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-blue-400 hover:text-blue-300 bg-blue-400/10 px-3 py-1 rounded-md"
                                >
                                  {isPreviewing ? <><Edit3 size={14}/> Edit</> : <><Eye size={14}/> Preview</>}
                                </button>
                                <div className="w-px h-4 bg-gray-700"></div>
                              </>
                            )}
                            <button 
                              onClick={() => deleteArticle(article.id)}
                              className="text-gray-500 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-500/10"
                              title="Delete Article"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="p-6">
                            {isPreviewing ? (
                              <div className="bg-white p-6 md:p-8 rounded-lg shadow-inner" style={{ 
                                  backgroundColor: config.theme.background, 
                                  color: config.theme.text,
                                  fontFamily: config.theme.fontFamily === 'serif' ? 'Georgia, serif' : 'system-ui, sans-serif'
                                }}>
                                {article.imageUrl && (
                                  <img 
                                    src={article.imageUrl} 
                                    alt={article.title} 
                                    className="w-full h-56 object-cover mb-6 border-2 border-black/10 rounded" 
                                    style={{ borderColor: config.theme.primary, filter: 'grayscale(100%) contrast(120%)' }} 
                                  />
                                )}
                                <h3 className="text-3xl md:text-4xl font-black uppercase mb-3 leading-tight tracking-tighter">{article.title || 'Untitled Dispatch'}</h3>
                                <div className="text-xs font-bold uppercase tracking-widest mb-6 opacity-60 border-t pt-2 inline-block" style={{ color: config.theme.primary }}>
                                  {article.category} • {article.date}
                                </div>
                                <p className="whitespace-pre-wrap leading-relaxed text-lg">{article.content || article.excerpt || 'No content provided.'}</p>
                              </div>
                            ) : (
                              <div className="space-y-5">
                                <div>
                                  <label className="block text-[10px] font-black uppercase text-gray-500 mb-1 tracking-widest">Dispatch Headline</label>
                                  <input 
                                    type="text" value={article.title}
                                    placeholder="Enter headline..."
                                    onChange={(e) => {
                                      const newArticles = [...articles];
                                      newArticles[index].title = e.target.value;
                                      setArticles(newArticles);
                                    }}
                                    className="bg-gray-950 border border-gray-800 text-lg font-bold text-white w-full p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-all"
                                  />
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                  <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-500 mb-1 tracking-widest">Classification</label>
                                    <select
                                      value={article.category}
                                      onChange={(e) => {
                                        const newArticles = [...articles];
                                        newArticles[index].category = e.target.value;
                                        setArticles(newArticles);
                                      }}
                                      className="bg-gray-950 border border-gray-800 rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-red-500/50 w-full cursor-pointer appearance-none"
                                    >
                                      {config.categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                  </div>
                                  
                                  <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-500 mb-1 tracking-widest">Featured Asset URL</label>
                                    <input 
                                      type="url" value={article.imageUrl || ''}
                                      placeholder="https://images.unsplash.com/..."
                                      onChange={(e) => {
                                        const newArticles = [...articles];
                                        newArticles[index].imageUrl = e.target.value;
                                        setArticles(newArticles);
                                      }}
                                      className="bg-gray-950 border border-gray-800 rounded-lg p-3 text-sm text-gray-300 w-full focus:outline-none focus:ring-1 focus:ring-red-500/50 font-mono"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-black uppercase text-gray-500 mb-1 tracking-widest">Front Page TLDR (Excerpt)</label>
                                  <textarea 
                                    value={article.excerpt}
                                    placeholder="Short summary for the front page grid..."
                                    onChange={(e) => {
                                      const newArticles = [...articles];
                                      newArticles[index].excerpt = e.target.value;
                                      setArticles(newArticles);
                                    }}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-red-500/50 min-h-[80px] leading-relaxed transition-all"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-black uppercase text-gray-500 mb-1 tracking-widest">Full Article Content</label>
                                  <textarea 
                                    value={article.content || ""}
                                    placeholder="Write the full dispatch here..."
                                    onChange={(e) => {
                                      const newArticles = [...articles];
                                      newArticles[index].content = e.target.value;
                                      setArticles(newArticles);
                                    }}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-red-500/50 min-h-[200px] leading-relaxed transition-all"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ANALYTICS TAB */}
            {activeTab === 'analytics' && (
              <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-2xl font-bold text-white border-b border-gray-800 pb-2">Reach & Impact</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-lg">
                    <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Total Reads</div>
                    <div className="text-5xl font-black text-white">42.8k</div>
                    <div className="text-green-500 text-xs mt-3 font-bold flex items-center gap-1">↑ 14% vs last period</div>
                  </div>
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-lg">
                    <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Retention Avg</div>
                    <div className="text-5xl font-black text-white">6m 14s</div>
                    <div className="text-blue-400 text-xs mt-3 font-bold uppercase tracking-widest">Optimal Engagement</div>
                  </div>
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 border-l-4 border-l-red-600 shadow-lg">
                    <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Top Influence</div>
                    <div className="text-4xl font-black text-white uppercase">Theory</div>
                    <div className="text-red-400 text-xs mt-3 font-bold uppercase tracking-widest">Trending Category</div>
                  </div>
                </div>
              </section>
            )}

            {/* TEAM & PERMISSIONS TAB */}
            {activeTab === 'team' && isAdmin && (
              <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-2xl font-bold text-white border-b border-gray-800 pb-2">Access Control</h3>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl">
                  <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest text-gray-400">Authorized Personnel</h4>
                  
                  <div className="space-y-3 mb-8">
                    {(config.team || []).map((member, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-gray-950 p-4 rounded-lg border border-gray-800 group hover:border-gray-700 transition-all">
                        <span className="text-gray-200 font-mono text-sm">{member.email}</span>
                        <div className="flex items-center gap-6">
                          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${member.role === 'admin' ? 'bg-red-900/20 text-red-400 border-red-500/50' : 'bg-blue-900/20 text-blue-400 border-blue-500/50'}`}>
                            {member.role}
                          </span>
                          <button 
                            onClick={() => removeTeamMember(member.email)}
                            className="text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-8 border-t border-gray-800">
                    <h4 className="text-white font-bold mb-4 uppercase text-[10px] tracking-widest text-gray-400">Grant New Clearances</h4>
                    <div className="flex flex-col md:flex-row gap-4">
                      <input 
                        type="email" 
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="comrade@example.com"
                        className="flex-1 bg-gray-950 border border-gray-800 rounded-lg p-3.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500/50"
                      />
                      <select 
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="bg-gray-950 border border-gray-800 rounded-lg p-3.5 text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-red-500/50 md:w-48 cursor-pointer"
                      >
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button 
                        onClick={addTeamMember}
                        className="bg-red-700 hover:bg-red-600 text-white px-8 py-3.5 rounded-lg text-sm font-black shadow-lg transition-all active:scale-95 uppercase tracking-widest"
                      >
                        Grant
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* IDENTITY TAB */}
            {activeTab === 'identity' && isAdmin && (
              <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-2xl font-bold text-white border-b border-gray-800 pb-2">Global Identity</h3>
                <div className="space-y-6 bg-gray-900 border border-gray-800 p-8 rounded-xl shadow-xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest">Masthead Title</label>
                      <input 
                        type="text" value={config.identity.siteName}
                        onChange={(e) => setConfig(prev => ({...prev, identity: {...prev.identity, siteName: e.target.value}}))}
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg p-4 text-white font-bold text-xl focus:outline-none focus:ring-1 focus:ring-red-500/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest">Tagline</label>
                      <input 
                        type="text" value={config.identity.tagline}
                        onChange={(e) => setConfig(prev => ({...prev, identity: {...prev.identity, tagline: e.target.value}}))}
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg p-4 text-white font-bold text-xl focus:outline-none focus:ring-1 focus:ring-red-500/50"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2 pt-2 border-t border-gray-800">
                    <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest">Manifesto Title (Sidebar)</label>
                    <input 
                      type="text" value={config.identity.aboutTitle || 'The Program'}
                      onChange={(e) => setConfig(prev => ({...prev, identity: {...prev.identity, aboutTitle: e.target.value}}))}
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg p-4 text-white font-bold text-lg focus:outline-none focus:ring-1 focus:ring-red-500/50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest">The Program (Manifesto Text)</label>
                    <textarea 
                      value={config.identity.aboutText}
                      onChange={(e) => setConfig(prev => ({...prev, identity: {...prev.identity, aboutText: e.target.value}}))}
                      className="w-full h-48 bg-gray-950 border border-gray-800 rounded-lg p-5 text-white leading-relaxed focus:outline-none focus:ring-1 focus:ring-red-500/50 whitespace-pre-wrap"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* THEME TAB */}
            {activeTab === 'theme' && isAdmin && (
              <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-2xl font-bold text-white border-b border-gray-800 pb-2">Theme Architecture</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-900 border border-gray-800 p-8 rounded-xl shadow-xl">
                  {['primary', 'accent', 'background', 'text'].map(colorKey => (
                    <div key={colorKey} className="space-y-2">
                      <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest">{colorKey} Identity</label>
                      <div className="flex gap-3">
                        <div className="relative group">
                          <input 
                            type="color" value={config.theme[colorKey]}
                            onChange={(e) => setConfig(prev => ({...prev, theme: {...prev.theme, [colorKey]: e.target.value}}))}
                            className="h-12 w-14 bg-gray-950 border border-gray-800 rounded-lg cursor-pointer p-1 active:scale-95 transition-transform"
                          />
                        </div>
                        <input 
                          type="text" value={config.theme[colorKey]}
                          onChange={(e) => setConfig(prev => ({...prev, theme: {...prev.theme, [colorKey]: e.target.value}}))}
                          className="flex-1 bg-gray-950 border border-gray-800 rounded-lg p-3 text-white font-mono text-sm uppercase focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-all"
                        />
                      </div>
                    </div>
                  ))}
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest">Typography Stack</label>
                    <select 
                      value={config.theme.fontFamily}
                      onChange={(e) => setConfig(prev => ({...prev, theme: {...prev.theme, fontFamily: e.target.value}}))}
                      className="w-full h-12 bg-gray-950 border border-gray-800 rounded-lg px-4 text-white focus:outline-none focus:ring-1 focus:ring-red-500/50 appearance-none cursor-pointer"
                    >
                      <option value="serif">Broadsheet (Classic Serif)</option>
                      <option value="sans">Modernist (Clean Sans)</option>
                    </select>
                  </div>
                </div>
              </section>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}