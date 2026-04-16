import React, { useState, useEffect } from 'react';
import { useEbook } from '../../context/EbookContext';
import {
  formatVersionTimestamp, getVersionHistory, restoreVersionSnapshot,
  deleteVersionSnapshot, type VersionSnapshot
} from '../../utils/versionHistory';
import { History, RotateCcw, Trash2, Clock, FileText } from 'lucide-react';

interface VersionHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({ isOpen, onClose }) => {
  const { activeProject } = useEbook();
  const [versions, setVersions] = useState<VersionSnapshot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && activeProject) {
      setLoading(true);
      const history = getVersionHistory(activeProject.id);
      setVersions(history?.snapshots || []);
      setLoading(false);
    }
  }, [isOpen, activeProject]);

  const handleRestore = (snapshot: VersionSnapshot) => {
    if (window.confirm(`Restaurar versão de ${formatVersionTimestamp(snapshot.timestamp)}?`)) {
      restoreVersionSnapshot(snapshot);
      onClose();
    }
  };

  const handleDelete = (snapshot: VersionSnapshot) => {
    if (window.confirm('Excluir esta versão permanentemente?')) {
      if (activeProject) {
        deleteVersionSnapshot(activeProject.id, snapshot.id);
        setVersions(prev => prev.filter(v => v.id !== snapshot.id));
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-glass-bg border border-glass-border rounded-xl shadow-glass max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-glass-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <History className="w-6 h-6 text-accent" />
              <h2 className="text-xl font-semibold text-text">Histórico de Versões</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-glass-bg rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-text-2 text-sm mt-2">
            {activeProject?.title} • {versions.length} versões salvas
          </p>
        </div>

        <div className="p-6 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-pulse text-text-2">Carregando versões...</div>
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-2">Nenhuma versão salva ainda</p>
              <p className="text-text-muted text-sm mt-1">
                As versões são salvas automaticamente a cada 30 segundos
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((snapshot, index) => (
                <div
                  key={snapshot.id}
                  className="p-4 bg-bg-2 rounded-lg border border-glass-border hover:border-accent-2 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-accent" />
                        <span className="text-text font-medium truncate">
                          {snapshot.title}
                        </span>
                        {index === 0 && (
                          <span className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-full">
                            Mais recente
                          </span>
                        )}
                      </div>
                      <p className="text-text-2 text-sm mb-2">
                        {formatVersionTimestamp(snapshot.timestamp)}
                      </p>
                      {snapshot.description && (
                        <p className="text-text-muted text-sm">
                          {snapshot.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleRestore(snapshot)}
                        className="p-2 hover:bg-accent/10 text-accent rounded-lg transition-colors"
                        title="Restaurar esta versão"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(snapshot)}
                        className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
                        title="Excluir versão"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-glass-border bg-bg-2">
          <div className="flex items-center justify-between text-sm text-text-muted">
            <span>Máximo de 20 versões por projeto</span>
            <span>Auto-salvamento a cada 30s</span>
          </div>
        </div>
      </div>
    </div>
  );
};