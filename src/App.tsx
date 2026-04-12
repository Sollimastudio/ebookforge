import React from 'react';
import { EbookProvider } from './context/EbookContext';
import { EbookEditor } from './components/Editor/EbookEditor';
import './index.css';

function App() {
  return (
    <EbookProvider>
      <div className="w-screen h-screen flex bg-bg-color text-text-main overflow-hidden">
        {/* Sidebar (Themes/Chapters) will go here */}
        <aside className="w-64 flex-shrink-0 glass-panel border-r border-glass-border hidden md:block z-20 shadow-2xl">
          <div className="p-6">
            <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">Ebook<span className="text-accent">Forge</span></h1>
            <p className="text-xs text-text-muted">Pro Editor Studio</p>
            
            <div className="mt-8 space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">Ferramentas</div>
              <button className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm">
                📚 Capítulos
              </button>
              <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-text-muted">
                🎨 Temas Premium
              </button>
              <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-text-muted">
                📤 Exportar PDF/EPUB
              </button>
            </div>
          </div>
        </aside>

        {/* Main Editor Area */}
        <main className="flex-1 relative flex">
          <EbookEditor />
        </main>
        
      </div>
    </EbookProvider>
  );
}

export default App;
