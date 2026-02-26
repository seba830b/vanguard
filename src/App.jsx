import React, { useState, useEffect } from 'react';
import { ClerkProvider, SignIn, SignedIn, SignedOut, UserButton, useUser } from "@clerk/clerk-react";
import ReactGA from "react-ga4";
import { Terminal, Database, FileText, ChevronRight, Plus, Trash2, Users, BarChart, Eye } from 'lucide-react';

const DEFAULT_CONFIG = {
  identity: { siteName: "The Vanguard Dispatch", tagline: "Voice of the Red Commune" },
  theme: { primary: "#990000", background: "#FDFBF7", text: "#222222" },
  categories: ["Current Struggle", "Theory & Education", "The Archives"]
};

export default function AppWrapper() {
  const PK = typeof import.meta !== 'undefined' ? import.meta.env.VITE_CLERK_PUBLISHABLE_KEY : '';
  const GA = typeof import.meta !== 'undefined' ? import.meta.env.VITE_GA_MEASUREMENT_ID : '';

  useEffect(() => { if (GA) ReactGA.initialize(GA); }, [GA]);

  if (!PK) return <div className="min-h-screen bg-black flex items-center justify-center text-red-500 font-mono p-10 text-center border-4 border-red-900">SYSTEM ERROR: NO CLERK KEY DETECTED</div>;

  return (
    <ClerkProvider publishableKey={PK}>
      <VanguardApp />
    </ClerkProvider>
  );
}

function VanguardApp() {
  const [view, setView] = useState('public');
  const [config, setConfig] = useState(() => JSON.parse(localStorage.getItem('vanguard_config')) || DEFAULT_CONFIG);
  const [articles, setArticles] = useState(() => JSON.parse(localStorage.getItem('vanguard_articles')) || []);

  return (
    <div className="min-h-screen transition-colors duration-500">
      {view === 'public' ? (
        <PublicSite config={config} articles={articles} onAdmin={() => setView('admin')} />
      ) : (
        <AdminPortal config={config} setConfig={setConfig} articles={articles} setArticles={setArticles} onExit={() => setView('public')} />
      )}
    </div>
  );
}

// --- PUBLIC INTERFACE ---
function PublicSite({ config, articles, onAdmin }) {
  const [cat, setCat] = useState(null);
  const filtered = cat ? articles.filter(a => a.category === cat) : articles;

  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: cat ? `/category/${cat}` : "/home" });
  }, [cat]);

  return (
    <div className="min-h-screen p-4 md:p-12" style={{ backgroundColor: config.theme.background, color: config.theme.text, fontFamily: 'serif' }}>
      <header className="max-w-6xl mx-auto border-b-8 border-black pb-8 mb-12">
        <h1 className="text-7xl md:text-9xl font-black uppercase text-center cursor-pointer" style={{ color: config.theme.primary }} onClick={() => setCat(null)}>{config.identity.siteName}</h1>
        <p className="text-center italic text-2xl mt-4 border-t-2 border-black pt-4">{config.identity.tagline}</p>
      </header>

      <nav className="flex justify-center gap-8 mb-12 uppercase font-bold tracking-widest border-y-4 border-black py-4">
        {config.categories.map(c => <span key={c} className={`cursor-pointer hover:underline ${cat === c ? 'underline text-red-700' : ''}`} onClick={() => setCat(c)}>{c}</span>)}
      </nav>

      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
        {filtered.map(a => (
          <article key={a.id} className="border-b-2 border-black pb-8">
            <h2 className="text-4xl font-bold uppercase mb-2">{a.title}</h2>
            <p className="text-lg leading-relaxed">{a.excerpt}</p>
          </article>
        ))}
      </main>

      <footer className="mt-20 py-8 border-t-4 border-black text-center group">
        <button onClick={onAdmin} className="text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity">[ TERMINAL ACCESS ]</button>
      </footer>
    </div>
  );
}

// --- ADMIN INTERFACE ---
function AdminPortal({ config, setConfig, articles, setArticles, onExit }) {
  const [tab, setTab] = useState('articles');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab === 'analytics' && !analytics) {
      setLoading(true);
      fetch('/api/analytics').then(r => r.json()).then(d => d.success && setAnalytics(d.data)).finally(() => setLoading(false));
    }
  }, [tab]);

  const save = () => {
    localStorage.setItem('vanguard_config', JSON.stringify(config));
    localStorage.setItem('vanguard_articles', JSON.stringify(articles));
    alert("SYSTEM UPDATED");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 flex">
      <aside className="w-64 border-r border-zinc-800 p-6 flex flex-col">
        <div className="flex items-center gap-2 text-white font-bold text-xl mb-10"><Terminal className="text-red-600" /> VANGUARD CMS</div>
        <nav className="flex-1 space-y-2 uppercase text-xs font-bold tracking-widest">
          {['articles', 'analytics', 'identity'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`w-full text-left p-3 rounded ${tab === t ? 'bg-red-900 text-white' : 'hover:bg-zinc-900'}`}>{t}</button>
          ))}
        </nav>
        <div className="pt-6 border-t border-zinc-800"><UserButton showName /><button onClick={onExit} className="w-full mt-4 bg-zinc-900 py-2 rounded text-xs">EXIT SYSTEM</button></div>
      </aside>

      <main className="flex-1 flex flex-col h-screen">
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-8 bg-zinc-950/50 backdrop-blur">
          <div className="text-xs font-mono text-zinc-500 flex items-center gap-2">root <ChevronRight size={12} /> {tab}</div>
          <button onClick={save} className="bg-red-700 hover:bg-red-600 text-white px-6 py-2 rounded text-xs font-bold uppercase flex items-center gap-2 transition-all"><Database size={14} /> Commit Changes</button>
        </header>

        <div className="flex-1 overflow-y-auto p-12">
          {tab === 'articles' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <button onClick={() => setArticles([{ id: Date.now(), title: "New Dispatch", excerpt: "", category: config.categories[0] }, ...articles])} className="bg-zinc-800 p-3 rounded text-xs font-bold">+ NEW ARTICLE</button>
              {articles.map(a => (
                <div key={a.id} className="bg-zinc-900 p-6 rounded-lg border border-zinc-800 space-y-4">
                  <input className="w-full bg-black border border-zinc-800 p-3 rounded font-bold text-white" value={a.title} onChange={e => setArticles(articles.map(art => art.id === a.id ? { ...art, title: e.target.value } : art))} />
                  <textarea className="w-full bg-black border border-zinc-800 p-3 rounded h-24" value={a.excerpt} onChange={e => setArticles(articles.map(art => art.id === a.id ? { ...art, excerpt: e.target.value } : art))} />
                  <button onClick={() => setArticles(articles.filter(art => art.id !== a.id))} className="text-zinc-600 hover:text-red-500"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          )}

          {tab === 'analytics' && (
            <div className="max-w-4xl mx-auto">
              {loading ? <div className="text-center py-20 animate-pulse font-mono">ENCRYPTING CONNECTION TO GOOGLE CLOUD...</div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-zinc-900 p-10 rounded border border-zinc-800 shadow-2xl">
                    <div className="text-xs text-zinc-500 font-bold uppercase mb-2">Total Page Views</div>
                    <div className="text-6xl font-black text-white">{analytics?.rows?.reduce((acc, r) => acc + parseInt(r.metricValues[1].value), 0) || 0}</div>
                  </div>
                  <div className="bg-zinc-900 p-10 rounded border border-zinc-800 shadow-2xl">
                    <div className="text-xs text-zinc-500 font-bold uppercase mb-2">Active Readers</div>
                    <div className="text-6xl font-black text-white">{analytics?.rows?.reduce((acc, r) => acc + parseInt(r.metricValues[0].value), 0) || 0}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'identity' && (
            <div className="max-w-3xl mx-auto bg-zinc-900 p-10 rounded-lg border border-zinc-800 space-y-8">
              <div><label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Dispatch Title</label><input className="w-full bg-black border border-zinc-800 p-4 rounded text-2xl font-black text-red-600" value={config.identity.siteName} onChange={e => setConfig({ ...config, identity: { ...config.identity, siteName: e.target.value } })} /></div>
              <div><label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Masthead Tagline</label><input className="w-full bg-black border border-zinc-800 p-4 rounded italic" value={config.identity.tagline} onChange={e => setConfig({ ...config, identity: { ...config.identity, tagline: e.target.value } })} /></div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}