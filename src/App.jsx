import React, { useState, useEffect } from 'react';
import { ClerkProvider, SignIn, SignedIn, SignedOut, useUser, UserButton } from "@clerk/clerk-react";
import ReactGA from "react-ga4";
import { 
  Settings, Terminal, Database, Palette, 
  FileText, ChevronRight, CheckCircle,
  Image as ImageIcon, Eye, Edit3, Link as LinkIcon,
  Plus, Trash2, Users, BarChart
} from 'lucide-react';

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
  team: [{ email: "admin@vanguard.org", role: "admin" }]
};

const INITIAL_ARTICLES = [
  { 
    id: 1, 
    title: "The Strike Wave Spreads", 
    category: "Current Struggle", 
    excerpt: "Port workers across the eastern seaboard have downed tools.", 
    date: "Oct 24, 2026", 
    featured: true,
    imageUrl: "https://images.unsplash.com/photo-1506869640319-ce1a4484c2eb?auto=format&fit=crop&q=80&w=1000"
  }
];

export default function AppWrapper() {
  // Safe environment check
  const isMetaValid = typeof import.meta !== 'undefined' && import.meta.env;
  const PUBLISHABLE_KEY = isMetaValid ? import.meta.env.VITE_CLERK_PUBLISHABLE_KEY : '';
  const GA_ID = isMetaValid ? import.meta.env.VITE_GA_MEASUREMENT_ID : '';

  useEffect(() => {
    if (GA_ID) {
      ReactGA.initialize(GA_ID);
    }
  }, [GA_ID]);

  if (!PUBLISHABLE_KEY) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-10 text-red-500 font-mono text-center border-4 border-red-900">
         <div>
            <h2 className="text-xl font-bold uppercase mb-2">System Key Missing</h2>
            <p className="text-sm opacity-80">Check VITE_CLERK_PUBLISHABLE_KEY in .env.local</p>
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
    } catch (e) { return DEFAULT_CONFIG; }
  });
  
  const [articles, setArticles] = useState(() => {
    try {
      const saved = localStorage.getItem('vanguard_articles');
      return saved ? JSON.parse(saved) : INITIAL_ARTICLES;
    } catch (e) { return INITIAL_ARTICLES; }
  });

  return (
    <div className="min-h-screen relative font-sans transition-colors duration-300">
      {view === 'public' ? (
        <PublicSite config={config} articles={articles} onSecretLogin={() => setView('admin')} />
      ) : (
        <>
          <SignedOut>
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
              <Terminal size={48} className="text-red-600 mb-6" />
              <SignIn routing="hash" />
              <button onClick={() => setView('public')} className="mt-8 text-gray-500 hover:text-white text-sm font-mono">← Return to Dispatch</button>
            </div>
          </SignedOut>
          <SignedIn>
            <AdminDashboard 
              config={config} setConfig={setConfig}
              articles={articles} setArticles={setArticles}
              onReturnPublic={() => setView('public')}
            />
          </SignedIn>
        </>
      )}
    </div>
  );
}

function PublicSite({ config, articles, onSecretLogin }) {
  const { identity, theme, categories } = config;
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    const path = activeCategory ? `/category/${activeCategory.toLowerCase().replace(/\s+/g, '-')}` : '/home';
    ReactGA.send({ hitType: "pageview", page: path, title: identity.siteName });
  }, [activeCategory, identity.siteName]);

  const featured = articles.find(a => a.featured) || articles[0];
  const others = articles.filter(a => a.id !== featured?.id);
  const displayList = activeCategory ? articles.filter(a => a.category === activeCategory) : others;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: theme.background, color: theme.text, fontFamily: theme.fontFamily === 'serif' ? 'serif' : 'sans-serif' }}>
      <header className="max-w-7xl mx-auto px-4 py-8 border-b-8 mb-8 w-full" style={{ borderColor: theme.text }}>
        <h1 className="text-6xl md:text-9xl font-black text-center uppercase tracking-tighter cursor-pointer" style={{ color: theme.primary }} onClick={() => setActiveCategory(null)}>{identity.siteName}</h1>
        <p className="text-center text-xl italic font-semibold border-t-2 pt-4 mt-4" style={{ borderColor: theme.text }}>{identity.tagline}</p>
      </header>

      <nav className="border-y-4 py-3 mb-12 flex justify-center gap-8 max-w-7xl mx-auto w-full" style={{ borderColor: theme.text }}>
        {categories.map((cat) => (
          <span key={cat} onClick={() => setActiveCategory(cat)} className={`uppercase font-bold cursor-pointer hover:underline ${activeCategory === cat ? 'underline' : 'opacity-80'}`}>{cat}</span>
        ))}
      </nav>

      <main className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-12 flex-1 w-full pb-20">
        <div className="lg:col-span-8">
          {!activeCategory && featured && (
            <article className="mb-16">
              {featured.imageUrl && <img src={featured.imageUrl} className="w-full h-96 object-cover mb-6 border-4 grayscale contrast-125" style={{ borderColor: theme.primary }} />}
              <h2 className="text-4xl md:text-7xl font-black uppercase leading-none mb-4">{featured.title}</h2>
              <p className="text-xl leading-relaxed font-medium">{featured.excerpt}</p>
            </article>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t-4 pt-8" style={{ borderColor: theme.text }}>
            {displayList.map(a => (
              <article key={a.id} className="group">
                <h3 className="text-2xl font-bold uppercase leading-tight mb-2 group-hover:underline cursor-pointer">{a.title}</h3>
                <div className="text-xs font-bold uppercase mb-2" style={{ color: theme.primary }}>{a.category}</div>
                <p className="leading-snug">{a.excerpt}</p>
              </article>
            ))}
          </div>
        </div>
        <aside className="lg:col-span-4">
          <div className="p-6 border-4 shadow-[8px_8px_0px_0px]" style={{ borderColor: theme.text, backgroundColor: theme.background }}>
            <h3 className="text-2xl font-black uppercase mb-4 border-b-2 pb-2" style={{ borderColor: theme.text }}>{identity.aboutTitle}</h3>
            <div className="whitespace-pre-wrap text-sm leading-relaxed font-medium">{identity.aboutText}</div>
          </div>
        </aside>
      </main>

      <footer className="py-8 border-t-4 text-center group" style={{ borderColor: theme.text }}>
        <button onClick={onSecretLogin} className="text-xs font-mono uppercase opacity-0 group-hover:opacity-100 transition-opacity">[ TERMINAL ACCESS ]</button>
      </footer>
    </div>
  );
}

function AdminDashboard({ config, setConfig, articles, setArticles, onReturnPublic }) {
  const [activeTab, setActiveTab] = useState('content');
  const [savedStatus, setSavedStatus] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);

  useEffect(() => {
    if (activeTab === 'analytics' && !analyticsData) {
      setIsLoadingAnalytics(true);
      fetch('/api/analytics')
        .then(res => res.json())
        .then(data => data.success ? setAnalyticsData(data.data) : setAnalyticsError(data.error))
        .catch(err => setAnalyticsError(err.message))
        .finally(() => setIsLoadingAnalytics(false));
    }
  }, [activeTab, analyticsData]);

  const handleSave = () => {
    localStorage.setItem('vanguard_config', JSON.stringify(config));
    localStorage.setItem('vanguard_articles', JSON.stringify(articles));
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 3000);
  };

  const updateArticle = (id, updates) => {
    setArticles(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-gray-900 border-r border-gray-800 p-6 flex flex-col">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-8 text-white"><Terminal className="text-red-600" /> VANGUARD</h2>
        <nav className="flex-1 space-y-2">
          {['content', 'analytics', 'identity', 'theme'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full text-left px-4 py-2 rounded capitalize ${activeTab === tab ? 'bg-red-900 text-white' : 'text-gray-400'}`}>
              {tab === 'content' ? 'Articles' : tab}
            </button>
          ))}
        </nav>
        <div className="pt-6 border-t border-gray-800">
          <UserButton showName />
          <button onClick={onReturnPublic} className="w-full mt-4 bg-gray-800 py-2 rounded text-sm hover:bg-gray-700 transition">Exit Terminal</button>
        </div>
      </aside>

      <main className="flex-1 h-screen overflow-hidden flex flex-col">
        <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-8">
          <div className="text-sm font-mono text-gray-500">root / {activeTab}</div>
          <button onClick={handleSave} className="flex items-center gap-2 bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded transition shadow-lg">
            {savedStatus ? <CheckCircle size={16} /> : <Database size={16} />}
            {savedStatus ? 'Changes Saved' : 'Deploy Changes'}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'content' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <button onClick={() => setArticles([{id: Date.now(), title: 'New Dispatch', excerpt: '', category: config.categories[0], featured: false}, ...articles])} className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded text-sm flex items-center gap-2">
                <Plus size={16}/> New Dispatch
              </button>
              {articles.map(a => (
                <div key={a.id} className="bg-gray-900 p-6 rounded-lg border border-gray-800 space-y-4 shadow-2xl">
                  <input className="w-full bg-black border border-gray-800 p-3 rounded font-bold text-xl text-white" value={a.title} onChange={e => updateArticle(a.id, {title: e.target.value})} />
                  <textarea className="w-full bg-black border border-gray-800 p-3 rounded text-gray-300 h-32" value={a.excerpt} onChange={e => updateArticle(a.id, {excerpt: e.target.value})} />
                  <div className="flex justify-between items-center">
                    <label className="text-xs flex items-center gap-2 cursor-pointer text-gray-500">
                      <input type="checkbox" checked={a.featured} onChange={e => setArticles(articles.map(art => ({...art, featured: art.id === a.id ? e.target.checked : (e.target.checked ? false : art.featured)})))} /> Featured
                    </label>
                    <button onClick={() => setArticles(prev => prev.filter(art => art.id !== a.id))} className="text-gray-600 hover:text-red-500 transition"><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="max-w-4xl mx-auto">
              {isLoadingAnalytics ? <div className="text-center py-20 animate-pulse">Establishing Secure Uplink to Google...</div> : 
               analyticsError ? <div className="p-6 bg-red-900/20 border border-red-500 text-red-200 font-mono text-sm">{analyticsError}</div> : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-gray-900 p-8 rounded border border-gray-800 shadow-xl">
                      <div className="text-xs text-gray-500 font-bold uppercase mb-2">Views (30d)</div>
                      <div className="text-5xl font-black text-white">{analyticsData?.rows?.reduce((acc, r) => acc + parseInt(r.metricValues[1].value), 0) || 0}</div>
                    </div>
                    <div className="bg-gray-900 p-8 rounded border border-gray-800 shadow-xl">
                      <div className="text-xs text-gray-500 font-bold uppercase mb-2">Active Readers</div>
                      <div className="text-5xl font-black text-white">{analyticsData?.rows?.reduce((acc, r) => acc + parseInt(r.metricValues[0].value), 0) || 0}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'identity' && (
            <div className="max-w-4xl mx-auto bg-gray-900 p-10 rounded-lg border border-gray-800 shadow-2xl space-y-8">
              <div><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Dispatch Name</label><input className="w-full bg-black border border-gray-800 p-4 rounded text-2xl font-black text-red-600" value={config.identity.siteName} onChange={e => setConfig({...config, identity: {...config.identity, siteName: e.target.value}})} /></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase block mb-2">About / Manifesto</label><textarea className="w-full bg-black border border-gray-800 p-4 rounded text-gray-300 h-64" value={config.identity.aboutText} onChange={e => setConfig({...config, identity: {...config.identity, aboutText: e.target.value}})} /></div>
            </div>
          )}

          {activeTab === 'theme' && (
            <div className="max-w-4xl mx-auto bg-gray-900 p-8 rounded-lg border border-gray-800 shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {['primary', 'accent', 'background', 'text'].map(key => (
                  <div key={key}>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">{key} Color</label>
                    <div className="flex gap-4">
                      <input type="color" value={config.theme[key]} onChange={e => setConfig({...config, theme: {...config.theme, [key]: e.target.value}})} className="h-12 w-16 bg-black border border-gray-800 rounded p-1" />
                      <input value={config.theme[key]} onChange={e => setConfig({...config, theme: {...config.theme, [key]: e.target.value}})} className="flex-1 bg-black border border-gray-800 p-3 rounded font-mono uppercase" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}