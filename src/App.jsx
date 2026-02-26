import React, { useState, useEffect } from 'react';
import { 
  Globe, Lock, Settings, Terminal, Database, Palette, 
  FileText, Users, LogOut, ChevronRight, CheckCircle,
  AlertTriangle, Image as ImageIcon
} from 'lucide-react';

// --- INITIAL STATE & MOCK DATA ---

const DEFAULT_CONFIG = {
  identity: {
    siteName: "The Vanguard Dispatch",
    tagline: "Voice of the Red Commune",
    mastheadDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
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
  }
};

const INITIAL_ARTICLES = [
  {
    id: 1,
    title: "The Strike Wave Spreads: Port Workers Paralyze Supply Chains",
    category: "Current Struggle",
    excerpt: "In an unprecedented show of solidarity, port workers across the eastern seaboard have downed tools. The demands are clear: immediate nationalization of logistics networks.",
    date: "October 24, 2024",
    featured: true,
  },
  {
    id: 2,
    title: "Reading Capital in the 21st Century",
    category: "Theory & Education",
    excerpt: "A re-examination of intrinsic value in the age of algorithmic trading and digital enclosures.",
    date: "October 22, 2024",
    featured: false,
  },
  {
    id: 3,
    title: "Solidarity with the Global South",
    category: "International",
    excerpt: "Delegates return from the international congress with a renewed mandate for cross-border cooperation against imperial extraction.",
    date: "October 20, 2024",
    featured: false,
  }
];

const INITIAL_USERS = [
  { id: 1, email: 'admin@vanguard.org', password: 'password', role: 'admin', name: 'Comrade Admin' },
  { id: 2, email: 'mod@vanguard.org', password: 'password', role: 'moderator', name: 'Comrade Editor' }
];

// --- MAIN APPLICATION COMPONENT ---

export default function App() {
  // State Management
  const [view, setView] = useState('public'); // 'public', 'admin', 'login'
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [articles, setArticles] = useState(INITIAL_ARTICLES);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState(null);

  // Handlers
  const toggleView = () => {
    if (view === 'public') {
      setView(currentUser ? 'admin' : 'login');
    } else {
      setView('public');
    }
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    setView('admin');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('public');
  };

  // Render Router
  return (
    <div className="min-h-screen relative font-sans transition-colors duration-300">
      {view === 'public' && (
        <PublicSite config={config} articles={articles} />
      )}
      
      {view === 'login' && (
        <LoginScreen 
          users={users} 
          onLogin={handleLogin} 
          onCancel={() => setView('public')} 
          theme={config.theme} 
        />
      )}
      
      {view === 'admin' && currentUser && (
        <AdminDashboard 
          config={config} 
          setConfig={setConfig}
          articles={articles}
          setArticles={setArticles}
          users={users}
          setUsers={setUsers}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}

      {/* The Toggle FAB */}
      <button
        onClick={toggleView}
        className="fixed bottom-6 right-6 p-4 rounded-full shadow-2xl text-white transition-transform hover:scale-110 z-50 flex items-center justify-center"
        style={{ backgroundColor: view === 'public' ? '#111' : config.theme.primary }}
        title={view === 'public' ? 'Admin Access' : 'View Public Site'}
      >
        {view === 'public' ? <Lock size={24} /> : <Globe size={24} />}
      </button>
    </div>
  );
}

// --- PUBLIC SITE COMPONENT ---

function PublicSite({ config, articles }) {
  const { identity, theme, categories } = config;
  const featuredArticle = articles.find(a => a.featured) || articles[0];
  const otherArticles = articles.filter(a => a.id !== featuredArticle.id);

  return (
    <div 
      className="min-h-screen pb-20"
      style={{ 
        backgroundColor: theme.background, 
        color: theme.text,
        fontFamily: theme.fontFamily === 'serif' ? 'Georgia, Cambria, "Times New Roman", Times, serif' : 'ui-sans-serif, system-ui, sans-serif'
      }}
    >
      {/* Top Banner */}
      <div 
        className="w-full text-center py-1 text-xs tracking-widest uppercase font-bold text-white"
        style={{ backgroundColor: theme.primary }}
      >
        Workers of the world, unite!
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Masthead */}
        <header className="py-8 border-b-8 mb-8" style={{ borderColor: theme.text }}>
          <div className="flex justify-between items-end border-b-2 pb-2 mb-4" style={{ borderColor: theme.text }}>
            <span className="text-sm font-bold uppercase tracking-wider">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            <span className="text-sm font-bold uppercase tracking-wider">Issue No. 47</span>
          </div>
          <h1 
            className="text-6xl md:text-8xl lg:text-9xl font-black text-center uppercase tracking-tighter leading-none mb-4"
            style={{ color: theme.primary }}
          >
            {identity.siteName}
          </h1>
          <p className="text-center text-xl md:text-2xl italic font-semibold border-t-2 pt-4" style={{ borderColor: theme.text }}>
            {identity.tagline}
          </p>
        </header>

        {/* Categories Nav */}
        <nav className="border-y-4 py-3 mb-12 flex flex-wrap justify-center gap-6 md:gap-12" style={{ borderColor: theme.text }}>
          {categories.map((cat, idx) => (
            <span key={idx} className="uppercase font-bold tracking-widest text-sm hover:underline cursor-pointer">
              {cat}
            </span>
          ))}
        </nav>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Main Content */}
          <main className="lg:col-span-8">
            {/* Featured Article */}
            <article className="mb-16">
              <div 
                className="w-full h-64 md:h-96 mb-6 flex items-center justify-center border-4"
                style={{ 
                  backgroundColor: `${theme.primary}20`, // 20% opacity hex
                  borderColor: theme.primary,
                  mixBlendMode: 'multiply' 
                }}
              >
                {/* Mock Woodcut/High Contrast Image Placeholder */}
                <div className="text-center" style={{ color: theme.primary }}>
                  <ImageIcon size={64} className="mx-auto mb-4 opacity-80" />
                  <p className="font-bold uppercase tracking-widest opacity-80">[ ARCHIVAL WOODCUT ]</p>
                </div>
              </div>
              
              <h2 className="text-4xl md:text-6xl font-black uppercase leading-none mb-4 tracking-tight">
                {featuredArticle.title}
              </h2>
              <div className="flex items-center gap-4 mb-6 text-sm font-bold uppercase tracking-wider" style={{ color: theme.primary }}>
                <span>{featuredArticle.category}</span>
                <span>•</span>
                <span>{featuredArticle.date}</span>
              </div>
              <p className="text-xl leading-relaxed font-medium">
                {featuredArticle.excerpt}
              </p>
            </article>

            {/* Other Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t-4 pt-8" style={{ borderColor: theme.text }}>
              {otherArticles.map(article => (
                <article key={article.id} className="group cursor-pointer">
                  <h3 className="text-2xl font-bold uppercase leading-tight mb-2 group-hover:underline">
                    {article.title}
                  </h3>
                  <div className="text-xs font-bold uppercase tracking-wider mb-3 opacity-70">
                    {article.category}
                  </div>
                  <p className="leading-snug">{article.excerpt}</p>
                </article>
              ))}
            </div>
          </main>

          {/* Right Column: Sidebar */}
          <aside className="lg:col-span-4 space-y-12">
            
            {/* About Box */}
            <div 
              className="p-6 border-4 shadow-[8px_8px_0px_0px]"
              style={{ 
                borderColor: theme.text,
                shadowColor: theme.primary,
                backgroundColor: theme.background
              }}
            >
              <h3 className="text-2xl font-black uppercase mb-4 border-b-2 pb-2" style={{ borderColor: theme.text }}>
                The Program
              </h3>
              <div className="whitespace-pre-wrap text-sm leading-relaxed font-medium">
                {identity.aboutText}
              </div>
            </div>

            {/* Newsletter */}
            <div className="p-6 border-4" style={{ borderColor: theme.text, backgroundColor: `${theme.accent}20` }}>
              <h3 className="text-xl font-black uppercase mb-2">Subscribe to the Dispatch</h3>
              <p className="text-sm mb-4">Receive untethered reports from the frontline of the class struggle.</p>
              <input 
                type="email" 
                placeholder="EMAIL ADDRESS" 
                className="w-full p-3 mb-3 border-2 focus:outline-none focus:ring-2 font-sans text-sm uppercase"
                style={{ borderColor: theme.text, backgroundColor: theme.background, color: theme.text }}
              />
              <button 
                className="w-full p-3 font-bold uppercase tracking-widest text-white transition-colors"
                style={{ backgroundColor: theme.primary }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#111'}
                onMouseOut={(e) => e.target.style.backgroundColor = theme.primary}
              >
                Join the Vanguard
              </button>
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
}

// --- LOGIN SCREEN COMPONENT ---

function LoginScreen({ users, onLogin, onCancel, theme }) {
  const [email, setEmail] = useState('admin@vanguard.org');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      onLogin(user);
    } else {
      setError('Invalid credentials. Access denied.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-100 p-4">
      <div className="w-full max-w-md bg-gray-800 p-8 rounded-lg shadow-2xl border border-gray-700">
        <div className="flex justify-center mb-6">
          <Lock size={48} style={{ color: theme.primary }} />
        </div>
        <h2 className="text-2xl font-bold text-center mb-2 uppercase tracking-wider">System Override</h2>
        <p className="text-center text-gray-400 mb-8 text-sm">Enter credentials to access the central dispatch terminal.</p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 text-red-200 rounded text-sm flex items-center gap-2">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-gray-400 mb-1">IDENTIFIER (EMAIL)</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:outline-none focus:border-red-500 transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-gray-400 mb-1">PASSPHRASE</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:outline-none focus:border-red-500 transition-colors"
              required
            />
          </div>
          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 rounded text-sm font-bold uppercase transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 py-3 px-4 text-white rounded text-sm font-bold uppercase transition-colors"
              style={{ backgroundColor: theme.primary }}
            >
              Authenticate
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-xs text-gray-500 font-mono text-center">
          Available roles for testing: <br/>
          admin@vanguard.org / password <br/>
          mod@vanguard.org / password
        </div>
      </div>
    </div>
  );
}

// --- ADMIN DASHBOARD COMPONENT ---

function AdminDashboard({ config, setConfig, articles, setArticles, users, setUsers, currentUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('content');
  const [savedStatus, setSavedStatus] = useState(false);

  const isAdmin = currentUser.role === 'admin';

  // Available tabs based on role
  const tabs = [
    { id: 'content', label: 'Articles & Content', icon: FileText, requireAdmin: false },
    { id: 'identity', label: 'Identity Settings', icon: Settings, requireAdmin: true },
    { id: 'theme', label: 'Theme & Branding', icon: Palette, requireAdmin: true },
    { id: 'integrations', label: 'CLI & Database', icon: Database, requireAdmin: true },
    { id: 'users', label: 'Access Control', icon: Users, requireAdmin: true },
  ].filter(tab => !tab.requireAdmin || isAdmin);

  const handleSave = () => {
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 3000);
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
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 tracking-tight">
            <Terminal size={20} className="text-red-500" />
            VANGUARD_OS
          </h2>
          <div className="mt-2 text-xs text-gray-400 font-mono">
            USER: {currentUser.name} <br/>
            ROLE: <span className={isAdmin ? 'text-red-400' : 'text-blue-400'}>{currentUser.role.toUpperCase()}</span>
          </div>
        </div>
        
        <nav className="flex-1 py-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'bg-gray-800 text-white border-r-2 border-red-500' 
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm transition-colors"
          >
            <LogOut size={16} /> Disconnect
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2 text-sm text-gray-400 font-mono">
            <span>root</span> <ChevronRight size={14} /> <span>{activeTab}</span>
          </div>
          <button 
            onClick={handleSave}
            disabled={!isAdmin && activeTab !== 'content'}
            className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors"
          >
            {savedStatus ? <CheckCircle size={16} /> : <Database size={16} />}
            {savedStatus ? 'Changes Deployed' : 'Deploy Changes'}
          </button>
        </header>

        {/* Scrollable Workspace */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-950">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* CONTENT TAB (Available to Admin & Mod) */}
            {activeTab === 'content' && (
              <section className="space-y-6">
                <h3 className="text-2xl font-bold text-white border-b border-gray-800 pb-2">Article Management</h3>
                <p className="text-gray-400 text-sm mb-6">Create, edit, and flag articles for the front page dispatch.</p>
                
                <div className="space-y-4">
                  {articles.map((article, index) => (
                    <div key={article.id} className="bg-gray-900 border border-gray-800 rounded-lg p-5">
                      <div className="flex justify-between items-start mb-4">
                        <input 
                          type="text" 
                          value={article.title}
                          onChange={(e) => {
                            const newArticles = [...articles];
                            newArticles[index].title = e.target.value;
                            setArticles(newArticles);
                          }}
                          className="bg-transparent text-lg font-bold text-white w-full focus:outline-none focus:border-b focus:border-gray-600"
                        />
                        <label className="flex items-center gap-2 text-sm ml-4 shrink-0 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={article.featured}
                            onChange={(e) => {
                              const newArticles = [...articles];
                              // Only one featured at a time for this design
                              if(e.target.checked) {
                                newArticles.forEach(a => a.featured = false);
                              }
                              newArticles[index].featured = e.target.checked;
                              setArticles(newArticles);
                            }}
                            className="accent-red-600 w-4 h-4"
                          />
                          <span className="text-gray-400">Featured</span>
                        </label>
                      </div>
                      <textarea 
                        value={article.excerpt}
                        onChange={(e) => {
                          const newArticles = [...articles];
                          newArticles[index].excerpt = e.target.value;
                          setArticles(newArticles);
                        }}
                        className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-sm text-gray-300 focus:outline-none focus:border-red-500 mb-3 h-24"
                      />
                      <div className="flex gap-4">
                        <select 
                          value={article.category}
                          onChange={(e) => {
                            const newArticles = [...articles];
                            newArticles[index].category = e.target.value;
                            setArticles(newArticles);
                          }}
                          className="bg-gray-950 border border-gray-800 rounded p-2 text-sm text-gray-300 focus:outline-none focus:border-red-500"
                        >
                          {config.categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input 
                          type="text" 
                          value={article.date}
                          onChange={(e) => {
                            const newArticles = [...articles];
                            newArticles[index].date = e.target.value;
                            setArticles(newArticles);
                          }}
                          className="bg-gray-950 border border-gray-800 rounded p-2 text-sm text-gray-300 focus:outline-none focus:border-red-500"
                        />
                      </div>
                    </div>
                  ))}
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
                      type="text" 
                      value={config.identity.siteName}
                      onChange={(e) => updateIdentity('siteName', e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 rounded p-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-mono text-gray-500 uppercase">Tagline</label>
                    <input 
                      type="text" 
                      value={config.identity.tagline}
                      onChange={(e) => updateIdentity('tagline', e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 rounded p-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-xs font-mono text-gray-500 uppercase">Masthead Date Override</label>
                    <input 
                      type="text" 
                      value={config.identity.mastheadDate}
                      onChange={(e) => updateIdentity('mastheadDate', e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 rounded p-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-xs font-mono text-gray-500 uppercase">About / The Program</label>
                    <textarea 
                      value={config.identity.aboutText}
                      onChange={(e) => updateIdentity('aboutText', e.target.value)}
                      className="w-full h-48 bg-gray-900 border border-gray-800 rounded p-3 text-white focus:outline-none focus:border-red-500 transition-colors whitespace-pre-wrap"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* THEME TAB */}
            {activeTab === 'theme' && isAdmin && (
              <section className="space-y-6">
                <h3 className="text-2xl font-bold text-white border-b border-gray-800 pb-2">Theme Architecture</h3>
                
                <div className="bg-blue-900/20 border border-blue-900 text-blue-300 p-4 rounded-lg flex gap-3 text-sm">
                  <AlertTriangle size={20} className="shrink-0" />
                  <p>Maintain high contrast between Background and Text colors. The primary color is heavily utilized for borders, mastheads, and structural elements in the public view.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Color Inputs */}
                  {['primary', 'accent', 'background', 'text'].map(colorKey => (
                    <div key={colorKey} className="space-y-2">
                      <label className="block text-xs font-mono text-gray-500 uppercase">{colorKey} Color</label>
                      <div className="flex gap-3">
                        <input 
                          type="color" 
                          value={config.theme[colorKey]}
                          onChange={(e) => updateTheme(colorKey, e.target.value)}
                          className="h-12 w-16 bg-gray-900 border border-gray-800 rounded cursor-pointer p-1"
                        />
                        <input 
                          type="text" 
                          value={config.theme[colorKey]}
                          onChange={(e) => updateTheme(colorKey, e.target.value)}
                          className="flex-1 bg-gray-900 border border-gray-800 rounded p-3 text-white focus:outline-none focus:border-red-500 font-mono text-sm uppercase"
                        />
                      </div>
                    </div>
                  ))}

                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-xs font-mono text-gray-500 uppercase">Typography Stack</label>
                    <select
                      value={config.theme.fontFamily}
                      onChange={(e) => updateTheme('fontFamily', e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 rounded p-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                    >
                      <option value="serif">Classic Broadsheet (Serif)</option>
                      <option value="sans">Modernist (Sans-Serif)</option>
                    </select>
                  </div>
                </div>
              </section>
            )}

            {/* INTEGRATIONS TAB */}
            {activeTab === 'integrations' && isAdmin && (
              <section className="space-y-6">
                <h3 className="text-2xl font-bold text-white border-b border-gray-800 pb-2">Systems & Integration</h3>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-mono text-gray-500 uppercase">Database Endpoint (URI)</label>
                    <input 
                      type="password" 
                      value={config.integrations.dbEndpoint}
                      onChange={(e) => updateIntegration('dbEndpoint', e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 rounded p-3 text-white focus:outline-none focus:border-red-500 font-mono text-sm"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-xs font-mono text-gray-500 uppercase">API Webhook URL</label>
                    <input 
                      type="text" 
                      value={config.integrations.apiWebhook}
                      onChange={(e) => updateIntegration('apiWebhook', e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 rounded p-3 text-white focus:outline-none focus:border-red-500 font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-mono text-gray-500 uppercase">CLI Authentication Token</label>
                    <input 
                      type="text" 
                      value={config.integrations.cliToken}
                      onChange={(e) => updateIntegration('cliToken', e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 rounded p-3 text-white focus:outline-none focus:border-red-500 font-mono text-sm"
                    />
                  </div>

                  {/* Terminal Mockup */}
                  <div className="mt-8">
                    <label className="block text-xs font-mono text-gray-500 uppercase mb-2">CLI Publishing Simulation</label>
                    <div className="bg-black border border-gray-800 rounded-lg p-4 font-mono text-sm overflow-x-auto shadow-inner">
                      <div className="text-green-500 mb-1">$ rc-cli login --token="{config.integrations.cliToken.substring(0, 8)}..."</div>
                      <div className="text-gray-400 mb-3">✓ Authenticated as Vanguard System Admin</div>
                      
                      <div className="text-green-500 mb-1">$ rc-cli publish --source="./drafts/latest.md" --webhook="{config.integrations.apiWebhook}"</div>
                      <div className="text-gray-400">Deploying dispatch...</div>
                      <div className="text-gray-400">Parsing markdown... Done.</div>
                      <div className="text-gray-400">Updating MongoDB at {config.integrations.dbEndpoint.split('@')[1] || 'cluster'}... Done.</div>
                      <div className="text-blue-400 mt-2">✓ Dispatch successfully transmitted to public nodes.</div>
                      <div className="text-green-500 mt-3 flex items-center"><span className="animate-pulse mr-2">█</span></div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* USERS TAB */}
            {activeTab === 'users' && isAdmin && (
              <section className="space-y-6">
                <h3 className="text-2xl font-bold text-white border-b border-gray-800 pb-2">Access Control</h3>
                <p className="text-gray-400 text-sm mb-6">Manage system operatives and their clearance levels.</p>

                <div className="space-y-4">
                  {users.map(user => (
                    <div key={user.id} className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg p-4">
                      <div>
                        <div className="text-white font-bold">{user.name}</div>
                        <div className="text-gray-500 text-sm font-mono">{user.email}</div>
                      </div>
                      <div>
                        <select 
                          value={user.role}
                          onChange={(e) => {
                            setUsers(users.map(u => u.id === user.id ? { ...u, role: e.target.value } : u));
                            // If user demoted themselves, they might lose access on next render/action
                          }}
                          disabled={user.id === currentUser.id} // Prevent locking oneself out
                          className="bg-gray-800 border border-gray-700 rounded p-2 text-sm text-gray-300 focus:outline-none focus:border-red-500 disabled:opacity-50"
                        >
                          <option value="admin">Administrator</option>
                          <option value="moderator">Moderator</option>
                        </select>
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