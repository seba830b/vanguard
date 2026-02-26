import React, { useState } from 'react';
import { ClerkProvider, SignIn, SignedIn, SignedOut, useUser, useClerk, UserButton } from "@clerk/clerk-react";
import { 
  Globe, Lock, Settings, Terminal, Database, Palette, 
  FileText, Users, LogOut, ChevronRight, CheckCircle,
  AlertTriangle, Image as ImageIcon, Eye, Edit3, Link as LinkIcon, Plus, Trash2, BarChart
} from 'lucide-react';

// --- INITIAL STATE & MOCK DATA ---
const DEFAULT_CONFIG = {
  identity: {
    siteName: "The Vanguard Dispatch",
    tagline: "Voice of the Red Commune",
    mastheadDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    aboutTitle: "The Program",
    aboutText: "We are the vanguard. Our mission is to dismantle the archaic structures of capital and forge a new paradigm of collective ownership. \n\n1. Abolition of private property.\n2. Heavy progressive income tax.\n3. Centralization of credit.\n4. Free education for all in public schools."
  },
  theme: {
    primary: "#990000",
    accent: "#FFD700",
    background: "#FDFBF7",
    text: "#222222",
    fontFamily: "serif"
  },
  categories: ["Current Struggle", "Theory & Education", "International", "The Archives"],
  integrations: {
    dbEndpoint: "mongodb+srv://vanguard-cluster.abc.mongodb.net/prod",
    apiWebhook: "https://api.redcommune.org/v1/publish",
    cliToken: "rc_sec_8f92a1b948c730"
  },
  team: [
    { email: "admin@vanguard.dk", role: "admin" }
  ]
};

const INITIAL_ARTICLES = [
  {
    id: 1,
    title: "The Strike Wave Spreads: Port Workers Paralyze Supply Chains",
    category: "Current Struggle",
    excerpt: "In an unprecedented show of solidarity, port workers across the eastern seaboard have downed tools. The demands are clear: immediate nationalization of logistics networks.",
    date: "October 24, 2024",
    featured: true,
    imageUrl: "https://images.unsplash.com/photo-1506869640319-ce1a4484c2eb?auto=format&fit=crop&q=80&w=1000"
  },
  {
    id: 2,
    title: "Reading Capital in the 21st Century",
    category: "Theory & Education",
    excerpt: "A re-examination of intrinsic value in the age of algorithmic trading and digital enclosures.",
    date: "October 22, 2024",
    featured: false,
    imageUrl: ""
  }
];

// --- MAIN APPLICATION COMPONENT ---
// This is the default export so Vite knows what to load
export default function App() {
  const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (!PUBLISHABLE_KEY) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-10 font-sans">
         <div className="bg-red-900/20 border border-red-500 text-red-100 p-8 rounded-lg max-w-lg text-center font-mono shadow-2xl">
            <h2 className="text-xl font-bold mb-2 uppercase tracking-tight">Missing Clerk API Key</h2>
            <p className="text-sm opacity-80 mb-6">
              The application cannot initialize authentication.
            </p>
            <div className="text-xs text-left bg-black/40 p-4 rounded space-y-3 leading-relaxed border border-red-500/20">
              <p>1. Ensure <code>.env.local</code> is in your project root.</p>
              <p>2. Add: <code>VITE_CLERK_PUBLISHABLE_KEY=pk_test_...</code></p>
              <p>3. If deployed on Cloudflare, add it to <b>Settings &rarr; Environment Variables</b>.</p>
              <p>4. Restart your terminal with <code>npm run dev</code>.</p>
            </div>
         </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <VanguardApp />
    </ClerkProvider>
  );
}

function VanguardApp() {
  const [view, setView] = useState('public'); 
  
  // Safe deep merge to prevent white screen crashes from missing object keys
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('vanguard_config');
      if (!saved) return DEFAULT_CONFIG;
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        identity: { ...DEFAULT_CONFIG.identity, ...(parsed?.identity || {}) },
        theme: { ...DEFAULT_CONFIG.theme, ...(parsed?.theme || {}) },
        integrations: { ...DEFAULT_CONFIG.integrations, ...(parsed?.integrations || {}) },
        categories: parsed?.categories || DEFAULT_CONFIG.categories,
        team: parsed?.team || DEFAULT_CONFIG.team
      };
    } catch (e) {
      return DEFAULT_CONFIG;
    }
  });
  
  const [articles, setArticles] = useState(() => {
    try {
      const saved = localStorage.getItem('vanguard_articles');
      return saved ? JSON.parse(saved) : INITIAL_ARTICLES;
    } catch (e) {
      return INITIAL_ARTICLES;
    }
  });

  return (
    <div className="min-h-screen relative font-sans transition-colors duration-300">
      {view === 'public' && (
        <PublicSite 
          config={config} 
          articles={articles} 
          onSecretLogin={() => setView('admin')} 
        />
      )}
      
      {view === 'admin' && (
        <>
          <SignedOut>
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
              <div className="mb-8 text-center animate-in fade-in duration-500">
                <Terminal size={48} className="mx-auto mb-4 text-red-500" />
                <h2 className="text-2xl text-white font-bold uppercase tracking-wider">System Override</h2>
                <p className="text-gray-400 text-sm mt-2 mb-6">Central dispatch terminal access.</p>
              </div>
              
              {/* Simplified SignIn to prevent routing conflicts */}
              <SignIn />
              
              <button 
                onClick={() => setView('public')}
                className="mt-8 text-gray-500 hover:text-white text-sm transition-colors font-mono"
              >
                &larr; Return to Public Dispatch
              </button>
            </div>
          </SignedOut>
          
          <SignedIn>
            <AdminDashboard 
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
  const { identity, theme, categories } = config || DEFAULT_CONFIG;
  const safeArticles = articles || [];
  const activeCategories = categories || [];

  const [activeCategory, setActiveCategory] = useState(null);

  const featuredArticle = safeArticles.find(a => a.featured) || safeArticles[0] || null;
  const otherArticles = safeArticles.filter(a => featuredArticle ? a.id !== featuredArticle.id : true);
  const categoryArticles = safeArticles.filter(a => a.category === activeCategory);

  return (
    <div className="min-h-screen pb-20 selection:bg-red-900 selection:text-white" style={{ backgroundColor: theme?.background || '#fff', color: theme?.text || '#000', fontFamily: theme?.fontFamily === 'serif' ? 'Georgia, serif' : 'system-ui, sans-serif' }}>
      <div className="w-full text-center py-1 text-xs tracking-widest uppercase font-bold text-white" style={{ backgroundColor: theme?.primary || '#900' }}>
        Workers of the world, unite!
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 w-full">
        <header className="py-8 border-b-8 mb-8" style={{ borderColor: theme?.text }}>
          <div className="flex justify-between items-end border-b-2 pb-2 mb-4" style={{ borderColor: theme?.text }}>
            <span className="text-sm font-bold uppercase tracking-wider">{identity?.mastheadDate}</span>
            <span className="text-sm font-bold uppercase tracking-wider">Issue No. 48</span>
          </div>
          <h1 
            onClick={() => setActiveCategory(null)}
            className="text-6xl md:text-8xl lg:text-9xl font-black text-center uppercase tracking-tighter leading-none mb-4 cursor-pointer hover:opacity-90 transition-opacity" 
            style={{ color: theme?.primary }}
          >
            {identity?.siteName}
          </h1>
          <p className="text-center text-xl md:text-2xl italic font-semibold border-t-2 pt-4" style={{ borderColor: theme?.text }}>{identity?.tagline}</p>
        </header>

        <nav className="border-y-4 py-3 mb-12 flex flex-wrap justify-center gap-6 md:gap-12" style={{ borderColor: theme?.text }}>
          {activeCategories.map((cat, idx) => (
            <span 
              key={idx} 
              onClick={() => setActiveCategory(cat)}
              className={`uppercase font-bold tracking-widest text-sm hover:underline cursor-pointer transition-colors ${activeCategory === cat ? 'underline' : 'opacity-80 hover:opacity-100'}`}
              style={{ color: activeCategory === cat ? theme?.primary : theme?.text }}
            >
              {cat}
            </span>
          ))}
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <main className="lg:col-span-8">
            {activeCategory ? (
              <div className="mb-16 animate-in fade-in duration-500">
                <h2 className="text-4xl md:text-5xl font-black uppercase mb-8 border-b-4 pb-2" style={{ borderColor: theme?.text }}>
                  Dispatch: {activeCategory}
                </h2>
                <div className="space-y-12">
                  {categoryArticles.length > 0 ? (
                    categoryArticles.map(article => (
                      <article key={article.id} className="group cursor-pointer border-b-2 pb-8 last:border-0" style={{ borderColor: theme?.text }}>
                        {article.imageUrl && (
                          <img src={article.imageUrl} alt={article.title} className="w-full h-64 object-cover mb-4 border-4 grayscale hover:grayscale-0 transition-all duration-500 shadow-lg" style={{ borderColor: theme?.text }} />
                        )}
                        <h3 className="text-3xl font-bold uppercase leading-tight mb-2 group-hover:underline">{article.title}</h3>
                        <div className="text-xs font-bold uppercase tracking-wider mb-4 opacity-70" style={{ color: theme?.primary }}>{article.date}</div>
                        <p className="leading-relaxed text-lg">{article.excerpt}</p>
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
                  <article className="mb-16">
                    {featuredArticle.imageUrl ? (
                      <img src={featuredArticle.imageUrl} alt={featuredArticle.title} className="w-full h-64 md:h-96 object-cover mb-6 border-4 grayscale hover:grayscale-0 transition-all duration-500 shadow-xl" style={{ borderColor: theme?.primary }} />
                    ) : (
                      <div className="w-full h-64 md:h-96 mb-6 flex items-center justify-center border-4 shadow-xl" style={{ backgroundColor: `${theme?.primary}20`, borderColor: theme?.primary, mixBlendMode: 'multiply' }}>
                        <div className="text-center" style={{ color: theme?.primary }}>
                          <ImageIcon size={64} className="mx-auto mb-4 opacity-80" />
                          <p className="font-bold uppercase tracking-widest opacity-80">[ ARCHIVAL WOODCUT ]</p>
                        </div>
                      </div>
                    )}
                    <h2 className="text-4xl md:text-6xl font-black uppercase leading-none mb-4 tracking-tight">{featuredArticle.title}</h2>
                    <div className="flex items-center gap-4 mb-6 text-sm font-bold uppercase tracking-wider" style={{ color: theme?.primary }}>
                      <span onClick={() => setActiveCategory(featuredArticle.category)} className="cursor-pointer hover:underline">{featuredArticle.category}</span>
                      <span>•</span>
                      <span>{featuredArticle.date}</span>
                    </div>
                    <p className="text-xl leading-relaxed font-medium">{featuredArticle.excerpt}</p>
                  </article>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t-4 pt-8" style={{ borderColor: theme?.text }}>
                  {otherArticles.map(article => (
                    <article key={article.id} className="group cursor-pointer">
                      {article.imageUrl && (
                        <img src={article.imageUrl} alt={article.title} className="w-full h-40 object-cover mb-4 border-2 grayscale group-hover:grayscale-0 transition-all duration-500 shadow-md" style={{ borderColor: theme?.text }} />
                      )}
                      <h3 className="text-2xl font-bold uppercase leading-tight mb-2 group-hover:underline">{article.title}</h3>
                      <div className="text-xs font-bold uppercase tracking-wider mb-3 opacity-70" style={{ color: theme?.primary }}>{article.category}</div>
                      <p className="leading-snug line-clamp-3">{article.excerpt}</p>
                    </article>
                  ))}
                </div>
              </>
            )}
          </main>

          <aside className="lg:col-span-4 space-y-12">
            <div className="p-6 border-4 shadow-[8px_8px_0px_0px] transition-all hover:shadow-[12px_12px_0px_0px]" style={{ borderColor: theme?.text, shadowColor: theme?.primary, backgroundColor: theme?.background }}>
              <h3 className="text-2xl font-black uppercase mb-4 border-b-2 pb-2" style={{ borderColor: theme?.text }}>
                {identity?.aboutTitle || "The Program"}
              </h3>
              <div className="whitespace-pre-wrap text-sm leading-relaxed font-medium">{identity?.aboutText}</div>
            </div>
          </aside>
        </div>
      </div>

      {/* Secret Login Button mapped directly to Clerk View transition */}
      <footer className="mt-20 py-8 border-t-4 text-center group" style={{ borderColor: theme?.text }}>
        <button onClick={onSecretLogin} className="text-xs font-mono uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-500 cursor-pointer">
           [ TERMINAL ACCESS ] 
        </button>
      </footer>
    </div>
  );
}

// --- ADMIN DASHBOARD COMPONENT ---
function AdminDashboard({ config, setConfig, articles, setArticles, onReturnPublic }) {
  const { isLoaded, user } = useUser();
  const { signOut } = useClerk();
  
  const [activeTab, setActiveTab] = useState('content');
  const [savedStatus, setSavedStatus] = useState(false);
  const [previewStates, setPreviewStates] = useState({});
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('moderator');

  // Prevent crashes if Clerk is still thinking
  if (!isLoaded) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center font-mono text-red-500">
      <Terminal size={48} className="animate-pulse mb-4" />
      <div className="tracking-widest">INITIALIZING VANGUARD_OS...</div>
    </div>
  );

  // Deeply safe checks for emails to avoid white screen
  const userEmail = (user?.primaryEmailAddress?.emailAddress || '').toLowerCase();
  const safeTeam = config?.team || [];
  
  const isAdmin = userEmail.includes('admin') || safeTeam.some(m => m?.email?.toLowerCase() === userEmail && m?.role === 'admin');
  const roleName = isAdmin ? 'Admin' : 'Moderator';

  const tabs = [
    { id: 'content', label: 'Article Manager', icon: FileText, requireAdmin: false },
    { id: 'analytics', label: 'Reader Analytics', icon: BarChart, requireAdmin: false },
    { id: 'identity', label: 'Identity Settings', icon: Settings, requireAdmin: true },
    { id: 'team', label: 'Access Control', icon: Users, requireAdmin: true },
    { id: 'theme', label: 'Theme Architecture', icon: Palette, requireAdmin: true },
    { id: 'integrations', label: 'CLI Integrations', icon: Database, requireAdmin: true },
  ].filter(tab => !tab.requireAdmin || isAdmin);

  const handleSave = () => {
    localStorage.setItem('vanguard_config', JSON.stringify(config));
    localStorage.setItem('vanguard_articles', JSON.stringify(articles));
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 3000);
  };

  // Safe State Updates
  const addArticle = () => {
    const newArticle = {
      id: Date.now(),
      title: "New Dispatch Draft",
      category: (config?.categories || ['Draft'])[0],
      excerpt: "Content goes here...",
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      featured: false,
      imageUrl: ""
    };
    setArticles(prev => [newArticle, ...(prev || [])]);
  };

  const updateArticle = (id, updates) => {
    setArticles(prev => (prev || []).map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const toggleFeatured = (id, isChecked) => {
    setArticles(prev => (prev || []).map(a => {
      if (a.id === id) return { ...a, featured: isChecked };
      if (isChecked) return { ...a, featured: false }; 
      return a;
    }));
  };

  const deleteArticle = (id) => {
    if (window.confirm("Permanently delete this dispatch?")) {
      setArticles(prev => (prev || []).filter(a => a.id !== id));
    }
  };

  const addTeamMember = () => {
    if (!newEmail) return;
    setConfig(prev => ({
      ...prev,
      team: [...(prev?.team || []), { email: newEmail.toLowerCase(), role: newRole }]
    }));
    setNewEmail('');
  };

  const removeTeamMember = (email) => {
    if (window.confirm(`Revoke access for ${email}?`)) {
      setConfig(prev => ({
        ...prev,
        team: (prev?.team || []).filter(m => m.email !== email)
      }));
    }
  };

  const updateIdentity = (key, value) => {
    setConfig(prev => ({ ...prev, identity: { ...prev.identity, [key]: value } }));
  };

  const updateTheme = (key, value) => {
    setConfig(prev => ({ ...prev, theme: { ...prev.theme, [key]: value } }));
  };

  const updateIntegration = (key, value) => {
    setConfig(prev => ({ ...prev, integrations: { ...prev.integrations, [key]: value } }));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-64 bg-gray-900 border-r border-gray-800 flex flex-col shadow-2xl relative z-10">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <div className="overflow-hidden">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 tracking-tight">
              <Terminal size={20} className="text-red-500 shrink-0" /> VANGUARD
            </h2>
            <div className="mt-1 text-xs text-gray-400 font-mono truncate" title={userEmail}>
              {userEmail} <br/> 
              ROLE: <span className={isAdmin ? 'text-red-500 font-bold' : 'text-blue-400 font-bold'}>{roleName.toUpperCase()}</span>
            </div>
          </div>
          <div className="ml-2 bg-gray-800 rounded-full p-1 shrink-0 shadow-inner">
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
        <div className="p-4 border-t border-gray-800">
          <button onClick={onReturnPublic} className="w-full text-center py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm transition-colors border border-gray-700 font-bold uppercase tracking-widest">Return Home</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-gray-950">
        <header className="h-16 bg-gray-900/80 backdrop-blur border-b border-gray-800 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2 text-sm text-gray-400 font-mono">
            <span>root</span> <ChevronRight size={14} /> <span className="text-white capitalize">{activeTab}</span>
          </div>
          <button 
            onClick={handleSave} 
            className={`flex items-center gap-2 px-6 py-2 text-white text-sm font-bold rounded transition-all shadow-lg active:scale-95 ${savedStatus ? 'bg-green-600' : 'bg-red-700 hover:bg-red-600'}`}
          >
            {savedStatus ? <CheckCircle size={16} /> : <Database size={16} />}
            {savedStatus ? 'Deployment Success' : 'Deploy Changes'}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-8 pb-32">
            
            {activeTab === 'content' && (
              <section className="space-y-6 animate-in fade-in duration-500">
                <div className="flex justify-between items-center border-b border-gray-800 pb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white">Article Manager</h3>
                  </div>
                  <button onClick={addArticle} className="flex items-center gap-2 bg-red-700/20 border border-red-500/50 hover:bg-red-700/40 text-red-100 px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg">
                    <Plus size={16} /> New Dispatch
                  </button>
                </div>
                <div className="space-y-6">
                  {(articles || []).map((article) => {
                    const isPreviewing = previewStates[article.id];
                    return (
                      <div key={article.id} className={`bg-gray-900 border ${article.featured ? 'border-red-500/50 shadow-[0_0_20px_rgba(220,38,38,0.1)]' : 'border-gray-800'} rounded-xl overflow-hidden transition-all duration-300`}>
                        <div className="bg-gray-800/50 border-b border-gray-800 p-4 flex justify-between items-center">
                          <div className="flex gap-4 items-center">
                            <span className="text-xs font-mono text-gray-500 bg-black/40 px-2 py-0.5 rounded">#{article.id.toString().slice(-6)}</span>
                            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer font-bold uppercase tracking-wider hover:text-white">
                              <input type="checkbox" checked={article.featured} onChange={(e) => toggleFeatured(article.id, e.target.checked)} className="accent-red-600 w-4 h-4" /> 
                              Featured Headline
                            </label>
                          </div>
                          <div className="flex gap-4 items-center">
                            <button onClick={() => setPreviewStates(p => ({ ...p, [article.id]: !p[article.id] }))} className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-blue-400 hover:text-blue-300 bg-blue-400/10 px-3 py-1 rounded-md">
                              {isPreviewing ? <><Edit3 size={14}/> Edit</> : <><Eye size={14}/> Preview</>}
                            </button>
                            <button onClick={() => deleteArticle(article.id)} className="text-gray-500 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-500/10"><Trash2 size={18} /></button>
                          </div>
                        </div>
                        <div className="p-6">
                          {isPreviewing ? (
                            <div className="bg-white p-6 md:p-8 rounded-lg shadow-inner" style={{ backgroundColor: config?.theme?.background || '#fff', color: config?.theme?.text || '#000', fontFamily: config?.theme?.fontFamily === 'serif' ? 'Georgia, serif' : 'sans-serif' }}>
                               {article.imageUrl && <img src={article.imageUrl} className="w-full h-56 object-cover mb-6 border-2 border-black/10 rounded" alt="Preview" />}
                               <h3 className="text-3xl md:text-4xl font-black uppercase mb-3 leading-tight tracking-tighter">{article.title || 'Untitled Dispatch'}</h3>
                               <div className="text-xs font-bold uppercase tracking-widest mb-6 opacity-60 border-t pt-2 inline-block">{article.category} • {article.date}</div>
                               <p className="whitespace-pre-wrap leading-relaxed text-lg">{article.excerpt || 'No content drafted for this issue.'}</p>
                            </div>
                          ) : (
                            <div className="space-y-5">
                              <div>
                                <label className="block text-[10px] font-black uppercase text-gray-500 mb-1 tracking-widest">Dispatch Headline</label>
                                <input type="text" value={article.title} onChange={(e) => updateArticle(article.id, { title: e.target.value })} className="bg-gray-950 border border-gray-800 text-white w-full p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500/50 font-bold text-lg" />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                  <label className="block text-[10px] font-black uppercase text-gray-500 mb-1 tracking-widest">Classification</label>
                                  <select value={article.category} onChange={(e) => updateArticle(article.id, { category: e.target.value })} className="bg-gray-950 border border-gray-800 rounded-lg p-3 text-sm text-gray-200 focus:outline-none w-full">
                                    {(config?.categories || []).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-black uppercase text-gray-500 mb-1 tracking-widest">Featured Asset URL</label>
                                  <input type="url" value={article.imageUrl || ''} placeholder="https://..." onChange={(e) => updateArticle(article.id, { imageUrl: e.target.value })} className="bg-gray-950 border border-gray-800 rounded-lg p-3 text-sm text-gray-300 focus:outline-none w-full font-mono" />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-black uppercase text-gray-500 mb-1 tracking-widest">Main Body Content</label>
                                <textarea value={article.excerpt} onChange={(e) => updateArticle(article.id, { excerpt: e.target.value })} className="w-full bg-gray-950 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 h-48 focus:outline-none focus:ring-1 focus:ring-red-500/50 leading-relaxed" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {activeTab === 'analytics' && (
              <section className="space-y-6 animate-in fade-in duration-500">
                <h3 className="text-2xl font-bold text-white border-b border-gray-800 pb-2">Reach & Impact</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-900 border border-gray-800 p-8 rounded-xl shadow-lg">
                    <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Total Reads</div>
                    <div className="text-5xl font-black text-white">42.8k</div>
                  </div>
                  <div className="bg-gray-900 border border-gray-800 p-8 rounded-xl shadow-lg">
                    <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Retention Avg</div>
                    <div className="text-5xl font-black text-white">6m 14s</div>
                  </div>
                  <div className="bg-gray-900 border border-gray-800 p-8 rounded-xl shadow-lg border-l-4 border-l-red-600">
                    <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Top Influence</div>
                    <div className="text-4xl font-black text-white uppercase">Theory</div>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'team' && isAdmin && (
              <section className="space-y-6 animate-in fade-in duration-500">
                <h3 className="text-2xl font-bold text-white border-b border-gray-800 pb-2">Access Control</h3>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl">
                  <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest text-gray-400">Authorized Personnel</h4>
                  <div className="space-y-3 mb-8">
                    {(config?.team || []).map((member, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-gray-950 p-4 rounded-lg border border-gray-800">
                        <span className="text-gray-200 font-mono text-sm">{member.email}</span>
                        <div className="flex items-center gap-6">
                          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${member.role === 'admin' ? 'bg-red-900/20 text-red-400 border-red-500/50' : 'bg-blue-900/20 text-blue-400 border-blue-500/50'}`}>
                            {member.role}
                          </span>
                          <button onClick={() => removeTeamMember(member.email)} className="text-gray-600 hover:text-red-500"><Trash2 size={18} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-8 border-t border-gray-800">
                    <h4 className="text-white font-bold mb-4 uppercase text-[10px] tracking-widest text-gray-400">Grant New Clearances</h4>
                    <div className="flex flex-col md:flex-row gap-4">
                      <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="comrade@example.com" className="flex-1 bg-gray-950 border border-gray-800 rounded-lg p-3.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500/50" />
                      <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="bg-gray-950 border border-gray-800 rounded-lg p-3.5 text-sm text-gray-300 focus:outline-none md:w-48">
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button onClick={addTeamMember} className="bg-red-700 hover:bg-red-600 text-white px-8 py-3.5 rounded-lg text-sm font-black shadow-lg">Grant</button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'identity' && isAdmin && (
               <section className="space-y-6 animate-in fade-in duration-500">
                 <h3 className="text-2xl font-bold text-white border-b border-gray-800 pb-2">Global Identity</h3>
                 <div className="space-y-6 bg-gray-900 border border-gray-800 p-8 rounded-xl shadow-xl">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-gray-500 mb-2 tracking-widest">Masthead Title</label>
                        <input type="text" value={config?.identity?.siteName || ''} onChange={(e) => updateIdentity('siteName', e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-lg p-4 text-white font-bold text-xl focus:outline-none focus:ring-1 focus:ring-red-500/50" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-gray-500 mb-2 tracking-widest">Tagline</label>
                        <input type="text" value={config?.identity?.tagline || ''} onChange={(e) => updateIdentity('tagline', e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-lg p-4 text-white font-bold text-xl focus:outline-none focus:ring-1 focus:ring-red-500/50" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-500 mb-2 tracking-widest">Manifesto Title (Sidebar)</label>
                      <input type="text" value={config?.identity?.aboutTitle || 'The Program'} onChange={(e) => updateIdentity('aboutTitle', e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-lg p-4 text-white font-bold text-lg focus:outline-none focus:ring-1 focus:ring-red-500/50" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-500 mb-2 tracking-widest">The Program (Manifesto Text)</label>
                      <textarea value={config?.identity?.aboutText || ''} onChange={(e) => updateIdentity('aboutText', e.target.value)} className="w-full h-48 bg-gray-950 border border-gray-800 rounded-lg p-5 text-white leading-relaxed focus:outline-none focus:ring-1 focus:ring-red-500/50" />
                    </div>
                 </div>
               </section>
            )}

            {activeTab === 'theme' && isAdmin && (
               <section className="space-y-6 animate-in fade-in duration-500">
                 <h3 className="text-2xl font-bold text-white border-b border-gray-800 pb-2">Theme Architecture</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-900 border border-gray-800 p-8 rounded-xl shadow-xl">
                   {['primary', 'background', 'text', 'accent'].map(colorKey => (
                     <div key={colorKey} className="space-y-2">
                       <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest">{colorKey} Identity</label>
                       <div className="flex gap-3">
                         <input type="color" value={config?.theme?.[colorKey] || '#000000'} onChange={(e) => updateTheme(colorKey, e.target.value)} className="h-12 w-14 bg-gray-950 border border-gray-800 rounded-lg cursor-pointer p-1" />
                         <input type="text" value={config?.theme?.[colorKey] || '#000000'} onChange={(e) => updateTheme(colorKey, e.target.value)} className="flex-1 bg-gray-950 border border-gray-800 rounded-lg p-3 text-white font-mono text-sm uppercase focus:outline-none focus:ring-1 focus:ring-red-500/50" />
                       </div>
                     </div>
                   ))}
                   <div className="space-y-2 md:col-span-2">
                     <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest">Typography Stack</label>
                     <select value={config?.theme?.fontFamily || 'serif'} onChange={(e) => updateTheme('fontFamily', e.target.value)} className="w-full h-12 bg-gray-950 border border-gray-800 rounded-lg px-4 text-white focus:outline-none focus:ring-1 focus:ring-red-500/50 cursor-pointer">
                        <option value="serif">Broadsheet (Classic Serif)</option>
                        <option value="sans">Modernist (Clean Sans)</option>
                     </select>
                   </div>
                 </div>
               </section>
            )}

            {activeTab === 'integrations' && isAdmin && (
              <section className="space-y-6 animate-in fade-in duration-500">
                <h3 className="text-2xl font-bold text-white border-b border-gray-800 pb-2">Systems & Integration</h3>
                <div className="space-y-6 bg-gray-900 border border-gray-800 p-8 rounded-xl shadow-xl">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest">Database Endpoint</label>
                    <input type="password" value={config?.integrations?.dbEndpoint || ''} onChange={(e) => updateIntegration('dbEndpoint', e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-red-500 font-mono text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest">API Webhook</label>
                    <input type="text" value={config?.integrations?.apiWebhook || ''} onChange={(e) => updateIntegration('apiWebhook', e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-red-500 font-mono text-sm" />
                  </div>
                  <div className="mt-8">
                    <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2">CLI Publishing Output</label>
                    <div className="bg-black border border-gray-800 rounded-lg p-4 font-mono text-xs overflow-x-auto text-gray-400 space-y-1">
                      <div><span className="text-green-500">$</span> rc-cli login --token="********"</div>
                      <div>&gt; Authenticated as Admin</div>
                      <div className="mt-2"><span className="text-green-500">$</span> rc-cli publish</div>
                      <div>&gt; Deploying dispatches to main node... <span className="text-blue-400">OK</span></div>
                    </div>
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