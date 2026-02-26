import React, { useState } from 'react';
import { ClerkProvider, SignIn, SignedIn, SignedOut, useUser, useClerk, UserButton } from "@clerk/clerk-react";
import {
  Settings, Terminal, Database, Palette,
  FileText, ChevronRight, CheckCircle,
  ImageIcon, Eye, Edit3, Link as LinkIcon, Plus, Trash2
} from 'lucide-react';

// --- INITIAL DEFAULT DATA ---
const DEFAULT_CONFIG = {
  identity: {
    siteName: "The Vanguard Dispatch",
    tagline: "Voice of the Red Commune",
    mastheadDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    aboutTitle: "The Program",
    aboutText: "We are the vanguard. Our mission is to dismantle the archaic structures of capital..."
  },
  theme: { primary: "#990000", accent: "#FFD700", background: "#FDFBF7", text: "#222222", fontFamily: "serif" },
  categories: ["Current Struggle", "Theory & Education", "International", "The Archives"],
  team: [] // Crucial: Prevents the .find() crash
};

const INITIAL_ARTICLES = [
  { id: 1, title: "The Strike Wave Spreads", category: "Current Struggle", excerpt: "Port workers...", date: "Oct 24, 2026", featured: true, imageUrl: "" }
];

export default function AppWrapper() {
  const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  if (!PUBLISHABLE_KEY) return <div className="p-10 text-red-500">Missing Clerk Key</div>;
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <VanguardApp />
    </ClerkProvider>
  );
}

function VanguardApp() {
  const [view, setView] = useState('public'); 
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('vanguard_config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });
  const [articles, setArticles] = useState(() => {
    const saved = localStorage.getItem('vanguard_articles');
    return saved ? JSON.parse(saved) : INITIAL_ARTICLES;
  });

  return (
    <div className="min-h-screen">
      {view === 'public' ? (
        <PublicSite config={config} articles={articles} onSecretLogin={() => setView('admin')} />
      ) : (
        <AdminAuth config={config} setConfig={setConfig} articles={articles} setArticles={setArticles} onReturn={() => setView('public')} />
      )}
    </div>
  );
}

// Simplified Auth Wrapper to prevent crashes
function AdminAuth(props) {
  return (
    <>
      <SignedOut>
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
          <SignIn routing="hash" />
          <button onClick={props.onReturn} className="mt-4 text-white">Back</button>
        </div>
      </SignedOut>
      <SignedIn>
        <AdminDashboard {...props} />
      </SignedIn>
    </>
  );
}

function PublicSite({ config, articles, onSecretLogin }) {
  return (
    <div style={{ backgroundColor: config.theme.background, color: config.theme.text }}>
      <header className="p-10 text-center">
        <h1 className="text-6xl font-black uppercase" style={{ color: config.theme.primary }}>{config.identity.siteName}</h1>
        <p className="mt-4 italic">{config.identity.tagline}</p>
      </header>
      <main className="max-w-4xl mx-auto p-10">
        {articles.map(a => (
          <div key={a.id} className="mb-10 border-b pb-5">
            <h2 className="text-3xl font-bold">{a.title}</h2>
            <p className="mt-2">{a.excerpt}</p>
          </div>
        ))}
      </main>
      <footer className="p-20 text-center opacity-0 hover:opacity-100 cursor-pointer" onClick={onSecretLogin}>[ ACCESS ]</footer>
    </div>
  );
}

function AdminDashboard({ config, setConfig, articles, setArticles, onReturn }) {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('content');
  const [newEmail, setNewEmail] = useState(''); // Fixed: Defined variable
  const [newRole, setNewRole] = useState('moderator'); // Fixed: Defined variable

  const userEmail = user?.primaryEmailAddress?.emailAddress || '';
  const isAdmin = userEmail.includes('admin') || (config.team || []).some(m => m.email === userEmail);

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <aside className="w-64 bg-gray-900 p-6 border-r border-gray-800">
        <h2 className="text-xl font-bold mb-10 flex items-center gap-2"><Terminal /> VANGUARD</h2>
        <nav className="space-y-4">
          <button onClick={() => setActiveTab('content')} className="block w-full text-left">Articles</button>
          {isAdmin && <button onClick={() => setActiveTab('team')} className="block w-full text-left">Team</button>}
          <button onClick={onReturn} className="mt-10 text-gray-400">Exit CMS</button>
        </nav>
      </aside>
      
      <main className="flex-1 p-10">
        {activeTab === 'content' && (
          <div>
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-bold">Articles</h3>
              <button onClick={() => setArticles([{id: Date.now(), title: "Draft", excerpt: ""}, ...articles])} className="bg-red-700 px-4 py-2 rounded flex items-center gap-2"><Plus size={16}/> New</button>
            </div>
            {articles.map((a, i) => (
              <div key={a.id} className="bg-gray-900 p-4 rounded mb-4 border border-gray-800 flex justify-between">
                <input className="bg-transparent font-bold w-full" value={a.title} onChange={(e) => {
                  const n = [...articles]; n[i].title = e.target.value; setArticles(n);
                }} />
                <button onClick={() => setArticles(articles.filter(item => item.id !== a.id))} className="text-gray-500 hover:text-red-500"><Trash2 size={16}/></button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'team' && (
          <div>
            <h3 className="text-2xl font-bold mb-10">Team Management</h3>
            <div className="flex gap-2 mb-6">
              <input className="bg-gray-900 p-2 rounded flex-1" placeholder="email@test.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
              <button onClick={() => { setConfig({...config, team: [...(config.team || []), {email: newEmail, role: newRole}]}); setNewEmail(''); }} className="bg-red-700 px-4 py-2 rounded">Add</button>
            </div>
            {(config.team || []).map(m => (
              <div key={m.email} className="p-3 bg-gray-900 mb-2 rounded border border-gray-800 flex justify-between">
                <span>{m.email}</span>
                <span className="text-red-500 font-bold">{m.role}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}