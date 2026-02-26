import React, { useState, useEffect } from 'react';
import { ClerkProvider, SignIn, SignedIn, SignedOut, useUser, useClerk, UserButton } from "@clerk/clerk-react";
import { 
  Settings, Terminal, Database, Palette, 
  FileText, LogOut, ChevronRight, CheckCircle,
  Image as ImageIcon, Eye, Edit3, Link as LinkIcon,
  Plus, Trash2, Users, BarChart
} from 'lucide-react';

// --- INITIAL DEFAULT DATA ---
const DEFAULT_CONFIG = {
  identity: {
    siteName: "The Vanguard Dispatch",
    tagline: "Voice of the Red Commune",
    mastheadDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    aboutTitle: "The Program",
    aboutText: "We are the vanguard. Our mission is to dismantle the archaic structures of capital and forge a new paradigm of collective ownership.\n\n1. Abolition of private property.\n2. Heavy progressive income tax.\n3. Centralization of credit."
  },
  theme: { primary: "#990000", accent: "#FFD700", background: "#FDFBF7", text: "#222222", fontFamily: "serif" },
  categories: ["Current Struggle", "Theory & Education", "International", "The Archives"],
  team: [
    { email: "admin@vanguard.dk", role: "admin" }
  ]
};

const INITIAL_ARTICLES = [
  { 
    id: 1, 
    title: "The Strike Wave Spreads", 
    category: "Current Struggle", 
    excerpt: "Port workers across the eastern seaboard have downed tools. The demands are clear: immediate nationalization of logistics networks.", 
    date: "Oct 24, 2026", 
    featured: true,
    imageUrl: "https://images.unsplash.com/photo-1506869640319-ce1a4484c2eb?auto=format&fit=crop&q=80&w=1000"
  },
  { 
    id: 2, 
    title: "Reading Capital Today", 
    category: "Theory & Education", 
    excerpt: "A re-examination of intrinsic value in the modern age.", 
    date: "Oct 22, 2026", 
    featured: false,
    imageUrl: ""
  },
];

// --- MAIN APPLICATION COMPONENT ---
export default function AppWrapper() {
  // Use a fallback for the publishable key to prevent errors in environments without import.meta.env
  const PUBLISHABLE_KEY = (typeof import.meta !== 'undefined' && import.meta.env) 
    ? import.meta.env.VITE_CLERK_PUBLISHABLE_KEY 
    : '';

  if (!PUBLISHABLE_KEY) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-10 font-sans">
         <div className="bg-red-900/20 border border-red-500 text-red-100 p-8 rounded-lg max-w-lg text-center font-mono">
            <h2 className="text-xl font-bold mb-2 uppercase tracking-tight">Missing Clerk API Key</h2>
            <p className="text-sm opacity-80 mb-6">
              The application cannot initialize authentication without a valid publishable key.
            </p>
            <div className="text-xs text-left bg-black/40 p-4 rounded space-y-3 leading-relaxed border border-red-500/20">
              <p>1. Ensure <code>.env.local</code> is in your project root.</p>
              <p>2. Add: <code>VITE_CLERK_PUBLISHABLE_KEY=pk_test_...</code></p>
              <p>3. If deployed on Cloudflare, add it to <b>Settings {'->'} Environment Variables</b>.</p>
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
  
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('vanguard_config');
      if (!saved) return DEFAULT_CONFIG;
      const parsed = JSON.parse(saved);
      // Safety Merge: Ensures all nested objects exist even if storage is old
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        identity: { ...DEFAULT_CONFIG.identity, ...(parsed.identity || {}) },
        theme: { ...DEFAULT_CONFIG.theme, ...(parsed.theme || {}) }
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
              <div className="mb-8 text-center">
                <Terminal size={48} className="mx-auto mb-4" style={{ color: config.theme.primary }} />
                <h2 className="text-2xl text-white font-bold uppercase tracking-wider">Vanguard CMS Access</h2>
                <p className="text-gray-400 text-sm mt-2 mb-6">Authorized personnel only.</p>
              </div>
              <SignIn routing="hash" />
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

  const featuredArticle = articles.find(a => a.featured) || articles[0] || null;
  const otherArticles = articles.filter(a => featuredArticle ? a.id !== featuredArticle.id : true);
  const categoryArticles = articles.filter(a => a.category === activeCategory);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: theme.background, color: theme.text, fontFamily: theme.fontFamily === 'serif' ? 'Georgia, serif' : 'system-ui, sans-serif' }}>
      <div className="w-full text-center py-1 text-xs tracking-widest uppercase font-bold text-white" style={{ backgroundColor: theme.primary }}>
        Workers of the world, unite!
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 w-full">
        <header className="py-8 border-b-8 mb-8" style={{ borderColor: theme.text }}>
          <div className="flex justify-between items-end border-b-2 pb-2 mb-4" style={{ borderColor: theme.text }}>
            <span className="text-sm font-bold uppercase tracking-wider">{identity.mastheadDate}</span>
            <span className="text-sm font-bold uppercase tracking-wider">Issue No. 48</span>
          </div>
          <h1 
            onClick={() => setActiveCategory(null)}
            className="text-6xl md:text-8xl lg:text-9xl font-black text-center uppercase tracking-tighter leading-none mb-4 cursor-pointer hover:opacity-90 transition-opacity" 
            style={{ color: theme.primary }}
          >
            {identity.siteName}
          </h1>
          <p className="text-center text-xl md:text-2xl italic font-semibold border-t-2 pt-4" style={{ borderColor: theme.text }}>{identity.tagline}</p>
        </header>

        <nav className="border-y-4 py-3 mb-12 flex flex-wrap justify-center gap-6 md:gap-12" style={{ borderColor: theme.text }}>
          {categories.map((cat) => (
            <span 
              key={cat} 
              onClick={() => setActiveCategory(cat)}
              className={`uppercase font-bold tracking-widest text-sm hover:underline cursor-pointer transition-colors ${activeCategory === cat ? 'underline' : 'opacity-80 hover:opacity-100'}`}
              style={{ color: activeCategory === cat ? theme.primary : theme.text }}
            >
              {cat}
            </span>
          ))}
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <main className="lg:col-span-8">
            {activeCategory ? (
              <div className="mb-16 animate-in fade-in duration-500">
                <h2 className="text-4xl md:text-5xl font-black uppercase mb-8 border-b-4 pb-2" style={{ borderColor: theme.text }}>
                  Dispatch: {activeCategory}
                </h2>
                <div className="space-y-12">
                  {categoryArticles.length > 0 ? (
                    categoryArticles.map(article => (
                      <article key={article.id} className="group cursor-pointer border-b-2 pb-8 last:border-0" style={{ borderColor: theme.text }}>
                        {article.imageUrl && (
                          <img src={article.imageUrl} alt={article.title} className="w-full h-64 object-cover mb-4 border-4 grayscale hover:grayscale-0 transition-all duration-500" style={{ borderColor: theme.text }} />
                        )}
                        <h3 className="text-3xl font-bold uppercase leading-tight mb-2 group-hover:underline">{article.title}</h3>
                        <div className="text-xs font-bold uppercase tracking-wider mb-4 opacity-70" style={{ color: theme.primary }}>{article.date}</div>
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
                      <img src={featuredArticle.imageUrl} alt={featuredArticle.title} className="w-full h-64 md:h-96 object-cover mb-6 border-4 grayscale hover:grayscale-0 transition-all duration-500 shadow-xl" style={{ borderColor: theme.primary }} />
                    ) : (
                      <div className="w-full h-64 md:h-96 mb-6 flex items-center justify-center border-4" style={{ backgroundColor: `${theme.primary}20`, borderColor: theme.primary, mixBlendMode: 'multiply' }}>
                        <div className="text-center" style={{ color: theme.primary }}>
                          <ImageIcon size={64} className="mx-auto mb-4 opacity-80" />
                          <p className="font-bold uppercase tracking-widest opacity-80">[ ARCHIVAL WOODCUT ]</p>
                        </div>
                      </div>
                    )}
                    <h2 className="text-4xl md:text-6xl font-black uppercase leading-none mb-4 tracking-tight">{featuredArticle.title}</h2>
                    <div className="flex items-center gap-4 mb-6 text-sm font-bold uppercase tracking-wider" style={{ color: theme.primary }}>
                      <span onClick={() => setActiveCategory(featuredArticle.category)} className="cursor-pointer hover:underline">{featuredArticle.category}</span>
                      <span>•</span>
                      <span>{featuredArticle.date}</span>
                    </div>
                    <p className="text-xl leading-relaxed font-medium">{featuredArticle.excerpt}</p>
                  </article>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t-4 pt-8" style={{ borderColor: theme.text }}>
                  {otherArticles.map(article => (
                    <article key={article.id} className="group cursor-pointer">
                      {article.imageUrl && (
                        <img src={article.imageUrl} alt={article.title} className="w-full h-40 object-cover mb-4 border-2 grayscale group-hover:grayscale-0 transition-all duration-500" style={{ borderColor: theme.text }} />
                      )}
                      <h3 className="text-2xl font-bold uppercase leading-tight mb-2 group-hover:underline">{article.title}</h3>
                      <div className="text-xs font-bold uppercase tracking-wider mb-3 opacity-70" style={{ color: theme.primary }}>{article.category}</div>
                      <p className="leading-snug line-clamp-3">{article.excerpt}</p>
                    </article>
                  ))}
                </div>
              </>
            )}
          </main>

          <aside className="lg:col-span-4 space-y-12">
            <div className="p-6 border-4 shadow-[8px_8px_0px_0px]" style={{ borderColor: theme.text, shadowColor: theme.primary, backgroundColor: theme.background }}>
              <h3 className="text-2xl font-black uppercase mb-4 border-b-2 pb-2" style={{ borderColor: theme.text }}>
                {identity.aboutTitle || "The Program"}
              </h3>
              <div className="whitespace-pre-wrap text-sm leading-relaxed font-medium">{identity.aboutText}</div>
            </div>
          </aside>
        </div>
      </div>

      <footer className="mt-20 py-8 border-t-4 text-center group" style={{ borderColor: theme.text }}>
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
  const [activeTab, setActiveTab] = useState('content');
  const [savedStatus, setSavedStatus] = useState(false);
  const [previewStates, setPreviewStates] = useState({});
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('moderator');

  // Loading state safety check
  if (!isLoaded) return <div className="min-h-screen bg-gray-950 flex items-center justify-center font-mono text-red-500">INITIALIZING VANGUARD_OS...</div>;

  const userEmail = user?.primaryEmailAddress?.emailAddress || '';
  const isAdmin = userEmail.includes('admin') || (config.team || []).find(m => m.email.toLowerCase() === userEmail.toLowerCase() && m.role === 'admin');
  const roleName = isAdmin ? 'Admin' : 'Moderator';

  const tabs = [
    { id: 'content', label: 'Article Manager', icon: FileText, requireAdmin: false },
    { id: 'analytics', label: 'Reader Analytics', icon: BarChart, requireAdmin: false },
    { id: 'identity', label: 'Identity Settings', icon: Settings, requireAdmin: true },
    { id: 'team', label: 'Team & Permissions', icon: Users, requireAdmin: true },
    { id: 'theme', label: 'Theme & Branding', icon: Palette, requireAdmin: true },
  ].filter(tab => !tab.requireAdmin || isAdmin);

  const handleSave = () => {
    localStorage.setItem('vanguard_config', JSON.stringify(config));
    localStorage.setItem('vanguard_articles', JSON.stringify(articles));
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 3000);
  };

  const addArticle = () => {
    const newArticle = {
      id: Date.now(),
      title: "New Dispatch Draft",
      category: config.categories[0],
      excerpt: "Content goes here...",
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      featured: false,
      imageUrl: ""
    };
    setArticles(prev => [newArticle, ...prev]);
  };

  // Safe Immutable Article Updates
  const updateArticle = (id, updates) => {
    setArticles(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const toggleFeatured = (id, isChecked) => {
    setArticles(prev => prev.map(a => {
      if (a.id === id) return { ...a, featured: isChecked };
      if (isChecked) return { ...a, featured: false }; // Enforce single headline
      return a;
    }));
  };

  const deleteArticle = (id) => {
    if (window.confirm("Delete this dispatch? This cannot be undone.")) {
      setArticles(prev => prev.filter(a => a.id !== id));
    }
  };

  const addTeamMember = () => {
    if (!newEmail) return;
    setConfig(prev => ({
      ...prev,
      team: [...(prev.team || []), { email: newEmail.toLowerCase(), role: newRole }]
    }));
    setNewEmail('');
  };

  const removeTeamMember = (email) => {
    if (window.confirm(`Remove ${email} access?`)) {
      setConfig(prev => ({
        ...prev,
        team: (prev.team || []).filter(m => m.email !== email)
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-64 bg-gray-900 border-r border-gray-800 flex flex-col shadow-2xl">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <div className="overflow-hidden">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 tracking-tight">
              <Terminal size={20} className="text-red-500" /> VANGUARD
            </h2>
            <div className="mt-1 text-xs text-gray-400 font-mono truncate" title={userEmail}>
              {userEmail} <br/> 
              ROLE: <span className={isAdmin ? 'text-red-500 font-bold' : 'text-blue-400 font-bold'}>{roleName.toUpperCase()}</span>
            </div>
          </div>
          <div className="ml-2 bg-gray-800 rounded-full p-1 shrink-0"><UserButton afterSignOutUrl="/" /></div>
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
          <button onClick={onReturnPublic} className="w-full text-center py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm transition-colors border border-gray-700 font-bold">Return Home</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-gray-900/50 backdrop-blur border-b border-gray-800 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2 text-sm text-gray-400 font-mono">
            <span>root</span> <ChevronRight size={14} /> <span className="text-white capitalize">{activeTab}</span>
          </div>
          <button 
            onClick={handleSave} 
            className={`flex items-center gap-2 px-6 py-2 text-white text-sm font-bold rounded transition-all shadow-lg ${savedStatus ? 'bg-green-600' : 'bg-red-700 hover:bg-red-600'}`}
          >
            {savedStatus ? <CheckCircle size={16} /> : <Database size={16} />}
            {savedStatus ? 'Changes Saved' : 'Deploy Changes'}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-gray-950">
          <div className="max-w-4xl mx-auto space-y-8 pb-20">
            
            {activeTab === 'content' && (
              <section className="space-y-6">
                <div className="flex justify-between items-center border-b border-gray-800 pb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white">Article Manager</h3>
                    <p className="text-xs text-gray-500 font-mono mt-1">Total Dispatches: {articles.length}</p>
                  </div>
                  <button onClick={addArticle} className="flex items-center gap-2 bg-red-700/20 border border-red-500/50 hover:bg-red-700/40 text-red-100 px-4 py-2 rounded text-sm font-bold transition-all shadow-lg">
                    <Plus size={16} /> New Dispatch
                  </button>
                </div>
                <div className="space-y-6">
                  {articles.map((article) => {
                    const isPreviewing = previewStates[article.id];
                    return (
                      <div key={article.id} className={`bg-gray-900 border ${article.featured ? 'border-red-500/50' : 'border-gray-800'} rounded-lg overflow-hidden shadow-xl transition-all`}>
                        <div className="bg-gray-800/50 border-b border-gray-800 p-4 flex justify-between items-center">
                          <div className="flex gap-4 items-center">
                            <span className="text-xs font-mono text-gray-500">ID: {article.id.toString().slice(-6)}</span>
                            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer font-bold uppercase tracking-wider">
                              <input type="checkbox" checked={article.featured} onChange={(e) => toggleFeatured(article.id, e.target.checked)} className="accent-red-600" /> 
                              Featured Headline
                            </label>
                          </div>
                          <div className="flex gap-3">
                            <button 
                              onClick={() => setPreviewStates(p => ({ ...p, [article.id]: !p[article.id] }))} 
                              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-blue-400 hover:text-blue-300"
                            >
                              {isPreviewing ? <><Edit3 size={14}/> Edit</> : <><Eye size={14}/> Preview</>}
                            </button>
                            <div className="w-px h-4 bg-gray-700 mx-1"></div>
                            <button onClick={() => deleteArticle(article.id)} className="text-gray-500 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                          </div>
                        </div>
                        <div className="p-5">
                          {isPreviewing ? (
                            <div className="bg-white p-6 rounded shadow-inner" style={{ backgroundColor: config.theme.background, color: config.theme.text, fontFamily: config.theme.fontFamily === 'serif' ? 'Georgia, serif' : 'sans-serif' }}>
                               {article.imageUrl && <img src={article.imageUrl} className="w-full h-48 object-cover mb-4 border-2 border-black/10" />}
                               <h3 className="text-3xl font-black uppercase mb-2 leading-tight">{article.title || 'Untitled'}</h3>
                               <p className="whitespace-pre-wrap leading-relaxed">{article.excerpt || 'No content drafted.'}</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <input 
                                type="text" value={article.title} 
                                placeholder="Dispatch Headline..."
                                onChange={(e) => updateArticle(article.id, { title: e.target.value })} 
                                className="bg-gray-950 border border-gray-800 text-white w-full p-3 rounded focus:outline-none focus:border-red-500 font-bold text-lg" 
                              />
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <select 
                                  value={article.category} 
                                  onChange={(e) => updateArticle(article.id, { category: e.target.value })} 
                                  className="bg-gray-950 border border-gray-800 rounded p-3 text-sm text-gray-200 focus:outline-none"
                                >
                                  {config.categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                                <input 
                                  type="url" value={article.imageUrl || ''} 
                                  placeholder="Image URL (Unsplash/Imgur)..." 
                                  onChange={(e) => updateArticle(article.id, { imageUrl: e.target.value })} 
                                  className="bg-gray-950 border border-gray-800 rounded p-3 text-sm text-gray-300 focus:outline-none" 
                                />
                              </div>
                              <textarea 
                                value={article.excerpt} 
                                placeholder="Article body/excerpt..."
                                onChange={(e) => updateArticle(article.id, { excerpt: e.target.value })} 
                                className="w-full bg-gray-950 border border-gray-800 rounded p-4 text-sm text-gray-300 h-40 focus:outline-none leading-relaxed" 
                              />
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
                <h3 className="text-2xl font-bold text-white border-b border-gray-800 pb-2">Platform Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-900 border border-gray-800 p-6 rounded-lg">
                    <div className="text-gray-500 text-xs font-bold uppercase mb-2">Total Reads</div>
                    <div className="text-4xl font-black text-white">42.8k</div>
                    <div className="text-green-500 text-xs mt-2 font-bold">↑ 14% vs last period</div>
                  </div>
                  <div className="bg-gray-900 border border-gray-800 p-6 rounded-lg">
                    <div className="text-gray-500 text-xs font-bold uppercase mb-2">Session Avg</div>
                    <div className="text-4xl font-black text-white">6m 14s</div>
                    <div className="text-blue-400 text-xs mt-2 font-bold">Optimal user retention</div>
                  </div>
                  <div className="bg-gray-900 border border-gray-800 p-6 rounded-lg border-l-4 border-l-red-600">
                    <div className="text-gray-500 text-xs font-bold uppercase mb-2">Primary Reach</div>
                    <div className="text-4xl font-black text-white">Theory</div>
                    <div className="text-red-400 text-xs mt-2 font-bold uppercase">Trending category</div>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'team' && isAdmin && (
              <section className="space-y-6 animate-in fade-in duration-500">
                <h3 className="text-2xl font-bold text-white border-b border-gray-800 pb-2">Access Control</h3>
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                  <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest text-gray-400">Current Staff</h4>
                  <div className="space-y-3 mb-8">
                    {(config.team || []).map((member, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-gray-950 p-4 rounded border border-gray-800">
                        <span className="text-gray-200 font-mono text-sm">{member.email}</span>
                        <div className="flex items-center gap-4">
                          <span className={`text-[10px] font-black uppercase px-2 py-1 rounded border ${member.role === 'admin' ? 'bg-red-900/20 text-red-400 border-red-500/50' : 'bg-blue-900/20 text-blue-400 border-blue-500/50'}`}>
                            {member.role}
                          </span>
                          <button onClick={() => removeTeamMember(member.email)} className="text-gray-600 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 border-t border-gray-800">
                    <h4 className="text-white font-bold mb-3 uppercase text-xs tracking-widest text-gray-400">Grant Permission</h4>
                    <div className="flex flex-col md:flex-row gap-3">
                      <input 
                        type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} 
                        placeholder="comrade@email.com" 
                        className="flex-1 bg-gray-950 border border-gray-800 rounded p-3 text-sm text-white focus:outline-none focus:border-red-500" 
                      />
                      <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="bg-gray-950 border border-gray-800 rounded p-3 text-sm text-gray-300 focus:outline-none">
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button onClick={addTeamMember} className="bg-red-700 hover:bg-red-600 text-white px-6 py-3 rounded text-sm font-bold shadow-lg transition-colors">Grant</button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'identity' && isAdmin && (
               <section className="space-y-6 animate-in fade-in duration-500">
                 <h3 className="text-2xl font-bold text-white border-b border-gray-800 pb-2">Global Identity</h3>
                 <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-mono text-gray-500 uppercase mb-2">Masthead Title</label>
                      <input type="text" value={config.identity.siteName} onChange={(e) => setConfig(prev => ({...prev, identity: {...prev.identity, siteName: e.target.value}}))} className="w-full bg-gray-950 border border-gray-800 rounded p-4 text-white font-bold text-xl" />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-gray-500 uppercase mb-2">Sidebar Manifesto (Program)</label>
                      <textarea value={config.identity.aboutText} onChange={(e) => setConfig(prev => ({...prev, identity: {...prev.identity, aboutText: e.target.value}}))} className="w-full h-48 bg-gray-950 border border-gray-800 rounded p-4 text-white leading-relaxed" />
                    </div>
                 </div>
               </section>
            )}

            {activeTab === 'theme' && isAdmin && (
               <section className="space-y-6 animate-in fade-in duration-500">
                 <h3 className="text-2xl font-bold text-white border-b border-gray-800 pb-2">Theme Architecture</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {['primary', 'background', 'text'].map(colorKey => (
                     <div key={colorKey} className="space-y-2">
                       <label className="block text-xs font-mono text-gray-400 uppercase">{colorKey} Color</label>
                       <div className="flex gap-3">
                         <input 
                           type="color" value={config.theme[colorKey]}
                           onChange={(e) => setConfig(prev => ({...prev, theme: {...prev.theme, [colorKey]: e.target.value}}))}
                           className="h-12 w-16 bg-gray-900 border border-gray-800 rounded cursor-pointer p-1"
                         />
                         <input 
                           type="text" value={config.theme[colorKey]}
                           onChange={(e) => setConfig(prev => ({...prev, theme: {...prev.theme, [colorKey]: e.target.value}}))}
                           className="flex-1 bg-gray-950 border border-gray-800 rounded p-3 text-white font-mono text-sm uppercase focus:outline-none focus:border-red-500 transition-colors"
                         />
                       </div>
                     </div>
                   ))}
                 </div>
               </section>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}