import React, { useState } from 'react';
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
    siteName: "what you need me to do",
    tagline: "Voice of the Red Commune",
    mastheadDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    aboutTitle: "The Program",
    aboutText: "We are the vanguard. Our mission is to dismantle the archaic structures of capital and forge a new paradigm of collective ownership.\n\n1. Abolition of private property.\n2. Heavy progressive income tax.\n3. Centralization of credit."
  },
  theme: { primary: "#990000", accent: "#FFD700", background: "#FDFBF7", text: "#222222", fontFamily: "serif" },
  categories: ["Current Struggle", "Theory & Education", "International", "The Archives"],
  integrations: { dbEndpoint: "mongodb+srv://cluster.mongodb.net", apiWebhook: "https://api.redcommune.org/publish", cliToken: "rc_sec_8f92a" },
  team: [
    { email: "admin@vanguard.org", role: "admin" },
    { email: "mod@vanguard.org", role: "moderator" }
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
  const getPublishableKey = () => {
    try {
      return import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';
    } catch (e) {
      return '';
    }
  };

  const PUBLISHABLE_KEY = getPublishableKey();

  if (!PUBLISHABLE_KEY) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-10">
         <div className="bg-red-900/20 border border-red-500 text-red-100 p-6 rounded-lg max-w-lg text-center font-mono">
            <h2 className="text-xl font-bold mb-2 uppercase">Missing Clerk API Key</h2>
            <p className="text-sm">Please check your <code>.env.local</code> file.</p>
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
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
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
          {categories.map((cat, idx) => (
            <span 
              key={idx} 
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
                          <img 
                            src={article.imageUrl} 
                            alt={article.title}
                            className="w-full h-64 object-cover mb-4 border-4"
                            style={{ borderColor: theme.text, filter: 'grayscale(100%) contrast(120%)' }}
                          />
                        )}
                        <h3 className="text-3xl font-bold uppercase leading-tight mb-2 group-hover:underline">{article.title}</h3>
                        <div className="text-xs font-bold uppercase tracking-wider mb-4 opacity-70">{article.date}</div>
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
                      <img 
                        src={featuredArticle.imageUrl} 
                        alt={featuredArticle.title}
                        className="w-full h-64 md:h-96 object-cover mb-6 border-4"
                        style={{ borderColor: theme.primary, filter: 'grayscale(100%) contrast(120%)' }}
                      />
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
                        <img 
                          src={article.imageUrl} 
                          alt={article.title}
                          className="w-full h-40 object-cover mb-4 border-2"
                          style={{ borderColor: theme.text, filter: 'grayscale(100%) contrast(120%)' }}
                        />
                      )}
                      <h3 className="text-2xl font-bold uppercase leading-tight mb-2 group-hover:underline">{article.title}</h3>
                      <div className="text-xs font-bold uppercase tracking-wider mb-3 opacity-70" style={{ color: theme.primary }}>{article.category}</div>
                      <p className="leading-snug">{article.excerpt}</p>
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
        <button 
          onClick={onSecretLogin}
          className="text-xs font-mono uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-500 cursor-pointer"
          style={{ color: theme.text }}
        >
           [ TERMINAL ACCESS ] 
        </button>
      </footer>
    </div>
  );
}

// --- ADMIN DASHBOARD COMPONENT ---
function AdminDashboard({ config, setConfig, articles, setArticles, onReturnPublic }) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [activeTab, setActiveTab] = useState('content');
  const [savedStatus, setSavedStatus] = useState(false);
  
  const [previewStates, setPreviewStates] = useState({});
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('moderator');

  const userEmail = user?.primaryEmailAddress?.emailAddress || '';
  
  // Verify Admin Status: Check hardcoded fallback OR dynamic team list
  const configTeam = config.team || [];
  const teamMember = configTeam.find(m => m.email.toLowerCase() === userEmail.toLowerCase());
  const isAdmin = userEmail.includes('admin') || (teamMember && teamMember.role === 'admin');
  const roleName = isAdmin ? 'Admin' : 'Moderator';

  const tabs = [
    { id: 'content', label: 'Articles & Content', icon: FileText, requireAdmin: false },
    { id: 'analytics', label: 'Reader Analytics', icon: BarChart, requireAdmin: false },
    { id: 'identity', label: 'Identity Settings', icon: Settings, requireAdmin: true },
    { id: 'theme', label: 'Theme & Branding', icon: Palette, requireAdmin: true },
    { id: 'team', label: 'Team & Permissions', icon: Users, requireAdmin: true },
  ].filter(tab => !tab.requireAdmin || isAdmin);

  const handleSave = () => {
    localStorage.setItem('vanguard_config', JSON.stringify(config));
    localStorage.setItem('vanguard_articles', JSON.stringify(articles));
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 3000);
  };

  const togglePreview = (id) => {
    setPreviewStates(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const addArticle = () => {
    const newArticle = {
      id: Date.now(),
      title: "New Dispatch Draft",
      category: config.categories[0],
      excerpt: "Enter your article excerpt here...",
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      featured: false,
      imageUrl: ""
    };
    setArticles([newArticle, ...articles]);
  };

  const deleteArticle = (id) => {
    setArticles(articles.filter(a => a.id !== id));
  };

  const addTeamMember = () => {
    if (!newEmail) return;
    const updatedTeam = [...(config.team || []), { email: newEmail, role: newRole }];
    setConfig({ ...config, team: updatedTeam });
    setNewEmail('');
  };

  const removeTeamMember = (emailToRemove) => {
    const updatedTeam = (config.team || []).filter(m => m.email !== emailToRemove);
    setConfig({ ...config, team: updatedTeam });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2 tracking-tight">
              <Terminal size={20} className="text-red-500" /> VANGUARD
            </h2>
            <div className="mt-1 text-xs text-gray-400 font-mono break-all">
              {userEmail} <br/>
              ROLE: <span className={isAdmin ? 'text-red-400' : 'text-blue-400'}>{roleName.toUpperCase()}</span>
            </div>
          </div>
          <div className="bg-gray-800 rounded-full p-1 border border-gray-700 ml-2">
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
          <button onClick={onReturnPublic} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm transition-colors">
            Return to Public Site
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2 text-sm text-gray-400 font-mono">
            <span>root</span> <ChevronRight size={14} /> <span className="text-white">{activeTab}</span>
          </div>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm font-medium rounded transition-colors shadow-lg"
          >
            {savedStatus ? <CheckCircle size={16} /> : <Database size={16} />}
            {savedStatus ? 'Saved Successfully' : 'Deploy Changes'}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-gray-950">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* CONTENT TAB */}
            {activeTab === 'content' && (
              <section className="space-y-6">
                <div className="flex justify-between items-end border-b border-gray-800 pb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white">Article Management</h3>
                    <p className="text-sm text-gray-400 mt-1">Create and manage your front page dispatches.</p>
                  </div>
                  <button 
                    onClick={addArticle}
                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white px-4 py-2 rounded transition-colors text-sm font-medium"
                  >
                    <Plus size={16} className="text-red-500" /> New Article
                  </button>
                </div>
                
                <div className="space-y-6">
                  {articles.length === 0 && (
                    <div className="text-center py-12 bg-gray-900 border border-gray-800 rounded-lg border-dashed">
                      <FileText size={48} className="mx-auto text-gray-700 mb-4" />
                      <p className="text-gray-400">No articles found. Click "New Article" to begin.</p>
                    </div>
                  )}

                  {articles.map((article, index) => {
                    const isPreviewing = previewStates[article.id];
                    
                    return (
                      <div key={article.id} className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden shadow-xl relative">
                        {/* Article Header & Tools */}
                        <div className="bg-gray-800/50 border-b border-gray-800 p-4 flex justify-between items-center">
                          <div className="flex gap-4 items-center">
                            <span className="text-xs font-mono text-gray-500">ID: {article.id.toString().slice(-6)}</span>
                            {article.featured && <span className="text-xs font-bold text-red-500 uppercase flex items-center gap-1"><CheckCircle size={12}/> Featured</span>}
                            
                            <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer ml-2">
                              <input 
                                type="checkbox" 
                                checked={article.featured}
                                onChange={(e) => {
                                  const newArticles = [...articles];
                                  if(e.target.checked) newArticles.forEach(a => a.featured = false);
                                  newArticles[index].featured = e.target.checked;
                                  setArticles(newArticles);
                                }}
                                className="accent-red-600 w-3 h-3"
                              /> Make Featured
                            </label>
                          </div>
                          
                          <div className="flex gap-4 items-center">
                            <button 
                              onClick={() => togglePreview(article.id)}
                              className="flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              {isPreviewing ? <><Edit3 size={16}/> Edit Mode</> : <><Eye size={16}/> View Preview</>}
                            </button>
                            <div className="w-px h-4 bg-gray-700"></div>
                            <button 
                              onClick={() => deleteArticle(article.id)}
                              className="text-gray-500 hover:text-red-500 transition-colors"
                              title="Delete Article"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="p-5">
                          {isPreviewing ? (
                            // PREVIEW MODE
                            <div className="bg-white p-6 rounded border border-gray-700 shadow-inner" style={{ 
                                backgroundColor: config.theme.background, 
                                color: config.theme.text,
                                fontFamily: config.theme.fontFamily === 'serif' ? 'Georgia, serif' : 'system-ui, sans-serif'
                              }}>
                              {article.imageUrl && (
                                <img 
                                  src={article.imageUrl} 
                                  alt={article.title} 
                                  className="w-full h-48 object-cover mb-4 border-2" 
                                  style={{ borderColor: config.theme.primary, filter: 'grayscale(100%) contrast(120%)' }} 
                                />
                              )}
                              <h3 className="text-3xl font-black uppercase leading-tight mb-2">{article.title || 'Untitled'}</h3>
                              <div className="text-xs font-bold uppercase tracking-wider mb-4 opacity-70" style={{ color: config.theme.primary }}>
                                {article.category} • {article.date}
                              </div>
                              <p className="leading-relaxed text-lg whitespace-pre-wrap">{article.excerpt || 'No content provided.'}</p>
                            </div>
                          ) : (
                            // EDIT MODE
                            <div className="space-y-4">
                              <input 
                                type="text" value={article.title}
                                placeholder="Article Title..."
                                onChange={(e) => {
                                  const newArticles = [...articles];
                                  newArticles[index].title = e.target.value;
                                  setArticles(newArticles);
                                }}
                                className="bg-gray-950 border border-gray-800 text-lg font-bold text-white w-full p-3 rounded focus:outline-none focus:border-red-500"
                              />
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <select
                                  value={article.category}
                                  onChange={(e) => {
                                    const newArticles = [...articles];
                                    newArticles[index].category = e.target.value;
                                    setArticles(newArticles);
                                  }}
                                  className="bg-gray-950 border border-gray-800 rounded p-2 text-sm text-gray-300 focus:outline-none focus:border-red-500"
                                >
                                  {config.categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>

                                <input 
                                  type="text" value={article.date}
                                  placeholder="Date (e.g. Oct 24, 2026)"
                                  onChange={(e) => {
                                    const newArticles = [...articles];
                                    newArticles[index].date = e.target.value;
                                    setArticles(newArticles);
                                  }}
                                  className="bg-gray-950 border border-gray-800 rounded p-2 text-sm text-gray-300 focus:outline-none focus:border-red-500"
                                />
                                
                                <div className="flex items-center gap-2 bg-gray-950 border border-gray-800 rounded p-2 focus-within:border-red-500 transition-colors">
                                  <LinkIcon size={14} className="text-gray-500 ml-1 shrink-0" />
                                  <input 
                                    type="url" value={article.imageUrl || ''}
                                    placeholder="Image URL..."
                                    onChange={(e) => {
                                      const newArticles = [...articles];
                                      newArticles[index].imageUrl = e.target.value;
                                      setArticles(newArticles);
                                    }}
                                    className="bg-transparent text-sm text-gray-300 w-full focus:outline-none"
                                  />
                                </div>
                              </div>

                              <textarea 
                                value={article.excerpt}
                                placeholder="Article excerpt or content..."
                                onChange={(e) => {
                                  const newArticles = [...articles];
                                  newArticles[index].excerpt = e.target.value;
                                  setArticles(newArticles);
                                }}
                                className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-sm text-gray-300 focus:outline-none focus:border-red-500 min-h-[120px]"
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

            {/* ANALYTICS TAB */}
            {activeTab === 'analytics' && (
              <section className="space-y-6">
                <h3 className="text-2xl font-bold text-white border-b border-gray-800 pb-2">Reader Analytics</h3>
                <p className="text-gray-400 text-sm">Real-time metrics for your publications. (Simulated data for this environment)</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                    <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Unique Readers</div>
                    <div className="text-4xl font-black text-white">14,204</div>
                    <div className="text-green-500 text-sm mt-2">↑ 12% from last week</div>
                  </div>
                  <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                    <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Avg Read Time</div>
                    <div className="text-4xl font-black text-white">4m 12s</div>
                    <div className="text-red-500 text-sm mt-2">↓ 2% from last week</div>
                  </div>
                  <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 border-l-4 border-l-red-600">
                    <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Top Category</div>
                    <div className="text-2xl font-black text-white mt-3">Current Struggle</div>
                  </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                  <h4 className="text-white font-bold mb-4 uppercase text-sm border-b border-gray-800 pb-2">Top Performing Articles</h4>
                  <div className="space-y-4">
                    {articles.slice(0, 3).map((a, i) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <span className="text-gray-300 truncate pr-4">{a.title || 'Untitled'}</span>
                        <span className="text-gray-500 font-mono shrink-0">{Math.floor(Math.random() * 5000 + 1000)} views</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* TEAM & PERMISSIONS TAB */}
            {activeTab === 'team' && isAdmin && (
              <section className="space-y-6">
                <h3 className="text-2xl font-bold text-white border-b border-gray-800 pb-2">Team & Permissions</h3>
                <p className="text-gray-400 text-sm mb-6">
                  Manage which Clerk accounts have Moderator or Admin access. <br/>
                  *Note: Users must still sign up/log in via Clerk using these exact email addresses.
                </p>
                
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
                  <h4 className="text-white font-bold mb-4 uppercase text-sm">Authorized Users</h4>
                  
                  <div className="space-y-3 mb-6">
                    {(config.team || []).map((member, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-gray-950 p-3 rounded border border-gray-800">
                        <span className="text-gray-300 font-mono text-sm">{member.email}</span>
                        <div className="flex items-center gap-4">
                          <span className={`text-xs font-bold uppercase tracking-wider ${member.role === 'admin' ? 'text-red-500' : 'text-blue-500'}`}>
                            {member.role}
                          </span>
                          <button 
                            onClick={() => removeTeamMember(member.email)}
                            className="text-gray-600 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {(!config.team || config.team.length === 0) && (
                      <div className="text-gray-500 text-sm italic">No users explicitly defined in config.</div>
                    )}
                  </div>

                  <div className="border-t border-gray-800 pt-4 flex gap-3">
                    <input 
                      type="email" 
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="writer@email.com"
                      className="flex-1 bg-gray-950 border border-gray-800 rounded p-2 text-sm text-white focus:outline-none focus:border-red-500"
                    />
                    <select 
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="bg-gray-950 border border-gray-800 rounded p-2 text-sm text-gray-300 focus:outline-none focus:border-red-500"
                    >
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button 
                      onClick={addTeamMember}
                      className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* IDENTITY TAB */}
            {activeTab === 'identity' && isAdmin && (
              <section className="space-y-6">
                <h3 className="text-2xl font-bold text-white border-b border-gray-800 pb-2">Global Identity</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-mono text-gray-500 uppercase">Site Name</label>
                    <input 
                      type="text" value={config.identity.siteName}
                      onChange={(e) => setConfig(prev => ({...prev, identity: {...prev.identity, siteName: e.target.value}}))}
                      className="w-full bg-gray-900 border border-gray-800 rounded p-3 text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-mono text-gray-500 uppercase">Tagline</label>
                    <input 
                      type="text" value={config.identity.tagline}
                      onChange={(e) => setConfig(prev => ({...prev, identity: {...prev.identity, tagline: e.target.value}}))}
                      className="w-full bg-gray-900 border border-gray-800 rounded p-3 text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2 mt-4 pt-4 border-t border-gray-800">
                    <label className="block text-xs font-mono text-gray-500 uppercase">Sidebar Block Title</label>
                    <input 
                      type="text" value={config.identity.aboutTitle || 'The Program'}
                      onChange={(e) => setConfig(prev => ({...prev, identity: {...prev.identity, aboutTitle: e.target.value}}))}
                      className="w-full bg-gray-900 border border-gray-800 rounded p-3 text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-xs font-mono text-gray-500 uppercase">Sidebar Block Text (The Program)</label>
                    <textarea 
                      value={config.identity.aboutText}
                      onChange={(e) => setConfig(prev => ({...prev, identity: {...prev.identity, aboutText: e.target.value}}))}
                      className="w-full h-32 bg-gray-900 border border-gray-800 rounded p-3 text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* THEME TAB */}
            {activeTab === 'theme' && isAdmin && (
              <section className="space-y-6">
                <h3 className="text-2xl font-bold text-white border-b border-gray-800 pb-2">Theme Architecture</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {['primary', 'accent', 'background', 'text'].map(colorKey => (
                    <div key={colorKey} className="space-y-2">
                      <label className="block text-xs font-mono text-gray-500 uppercase">{colorKey} Color</label>
                      <div className="flex gap-3">
                        <input 
                          type="color" value={config.theme[colorKey]}
                          onChange={(e) => setConfig(prev => ({...prev, theme: {...prev.theme, [colorKey]: e.target.value}}))}
                          className="h-12 w-16 bg-gray-900 border border-gray-800 rounded cursor-pointer p-1"
                        />
                        <input 
                          type="text" value={config.theme[colorKey]}
                          onChange={(e) => setConfig(prev => ({...prev, theme: {...prev.theme, [colorKey]: e.target.value}}))}
                          className="flex-1 bg-gray-900 border border-gray-800 rounded p-3 text-white font-mono text-sm uppercase focus:outline-none focus:border-red-500"
                        />
                      </div>
                    </div>
                  ))}
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-xs font-mono text-gray-500 uppercase">Typography</label>
                    <select 
                      value={config.theme.fontFamily}
                      onChange={(e) => setConfig(prev => ({...prev, theme: {...prev.theme, fontFamily: e.target.value}}))}
                      className="w-full bg-gray-900 border border-gray-800 rounded p-3 text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="serif">Broadsheet (Serif)</option>
                      <option value="sans">Modernist (Sans-Serif)</option>
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