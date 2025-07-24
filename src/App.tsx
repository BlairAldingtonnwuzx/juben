import React, { useState } from 'react';
import Navigation from './components/Navigation';
import ScriptBrowser from './pages/ScriptBrowser';
import ScriptDetail from './pages/ScriptDetail';
import Ranking from './pages/Ranking';
import Upload from './pages/Upload';
import AdminPanel from './pages/AdminPanel';
import { AuthProvider } from './hooks/useAuth';
import { ThemeProvider } from './contexts/ThemeContext';
import { Script } from './types';

function App() {
  const [currentPage, setCurrentPage] = useState('browser');
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);

  const handleScriptSelect = (script: Script) => {
    setSelectedScript(script);
    setCurrentPage('detail');
  };

  const handleBackToList = () => {
    setSelectedScript(null);
    setCurrentPage('browser');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'browser':
        return <ScriptBrowser onScriptSelect={handleScriptSelect} />;
      case 'detail':
        return selectedScript ? (
          <ScriptDetail script={selectedScript} onBack={handleBackToList} />
        ) : (
          <ScriptBrowser onScriptSelect={handleScriptSelect} />
        );
      case 'ranking':
        return <Ranking onScriptSelect={handleScriptSelect} />;
      case 'upload':
        return <Upload />;
      case 'admin':
        return <AdminPanel onScriptSelect={handleScriptSelect} />;
      default:
        return <ScriptBrowser onScriptSelect={handleScriptSelect} />;
    }
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen bg-gray-900 dark:bg-gray-900 bg-gray-50 transition-colors duration-300">
          <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
          <main>
            {renderPage()}
          </main>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;