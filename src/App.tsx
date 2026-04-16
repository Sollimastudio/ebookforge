import { useState } from 'react';
import { EbookProvider, useEbook } from './context/EbookContext';
import { TopNav, type NavTab } from './components/Navigation/TopNav';
import { HomePanel } from './components/Panels/HomePanel';
import { EbookEditor } from './components/Editor/EbookEditor';
import { PreviewPanel } from './components/Panels/PreviewPanel';
import { SettingsPanel } from './components/Panels/SettingsPanel';
import { ProcessingOverlay } from './components/Forge/ProcessingOverlay';
import './index.css';

function AppInner() {
  const { activeProject, activeTheme } = useEbook();
  const [activeTab, setActiveTab] = useState<NavTab>('home');

  // Auto-switch to editor when a project is created
  if (activeProject && activeTab === 'home') {
    // Don't auto-switch, let user decide
  }

  const handleTabChange = (tab: NavTab) => {
    setActiveTab(tab);
  };

  return (
    <div className={`app-root theme-${activeTheme}`}>
      <TopNav activeTab={activeTab} onTabChange={handleTabChange} />
      <main className="main-content">
        {activeTab === 'home' && <HomePanel />}
        {activeTab === 'editor' && activeProject && <EbookEditor />}
        {activeTab === 'preview' && activeProject && <PreviewPanel />}
        {activeTab === 'settings' && <SettingsPanel />}
      </main>
      <ProcessingOverlay />
    </div>
  );
}

function App() {
  return (
    <EbookProvider>
      <AppInner />
    </EbookProvider>
  );
}

export default App;
