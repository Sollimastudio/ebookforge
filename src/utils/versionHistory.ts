export interface VersionSnapshot {
  id: string;
  timestamp: number;
  content: string;
  title: string;
  description?: string;
}

export interface VersionHistory {
  projectId: string;
  snapshots: VersionSnapshot[];
  maxVersions: number;
}

const VERSION_STORAGE_KEY = 'ebookforge_versions';
const MAX_VERSIONS_PER_PROJECT = 20;

/**
 * Create a new version snapshot
 */
export function createVersionSnapshot(
  _projectId: string,
  content: string,
  title: string,
  description?: string
): VersionSnapshot {
  return {
    id: `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    content,
    title,
    description
  };
}

/**
 * Save a version snapshot to localStorage
 */
export function saveVersionSnapshot(
  projectId: string,
  snapshot: VersionSnapshot
): void {
  try {
    const allVersions = getAllVersionHistories();
    const projectVersions = allVersions[projectId] || {
      projectId,
      snapshots: [],
      maxVersions: MAX_VERSIONS_PER_PROJECT
    };

    // Add new snapshot at the beginning
    projectVersions.snapshots.unshift(snapshot);

    // Keep only the most recent versions
    if (projectVersions.snapshots.length > projectVersions.maxVersions) {
      projectVersions.snapshots = projectVersions.snapshots.slice(0, projectVersions.maxVersions);
    }

    allVersions[projectId] = projectVersions;
    localStorage.setItem(VERSION_STORAGE_KEY, JSON.stringify(allVersions));
  } catch (error) {
    console.warn('Failed to save version snapshot:', error);
  }
}

/**
 * Get version history for a specific project
 */
export function getVersionHistory(projectId: string): VersionHistory | null {
  try {
    const allVersions = getAllVersionHistories();
    return allVersions[projectId] || null;
  } catch (error) {
    console.warn('Failed to get version history:', error);
    return null;
  }
}

/**
 * Get all version histories from localStorage
 */
function getAllVersionHistories(): Record<string, VersionHistory> {
  try {
    const stored = localStorage.getItem(VERSION_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Restore a version snapshot
 */
export function restoreVersionSnapshot(snapshot: VersionSnapshot): {
  content: string;
  title: string;
} {
  return {
    content: snapshot.content,
    title: snapshot.title
  };
}

/**
 * Delete a specific version snapshot
 */
export function deleteVersionSnapshot(projectId: string, snapshotId: string): void {
  try {
    const allVersions = getAllVersionHistories();
    const projectVersions = allVersions[projectId];

    if (projectVersions) {
      projectVersions.snapshots = projectVersions.snapshots.filter(
        s => s.id !== snapshotId
      );
      allVersions[projectId] = projectVersions;
      localStorage.setItem(VERSION_STORAGE_KEY, JSON.stringify(allVersions));
    }
  } catch (error) {
    console.warn('Failed to delete version snapshot:', error);
  }
}

/**
 * Clear all version history for a project
 */
export function clearVersionHistory(projectId: string): void {
  try {
    const allVersions = getAllVersionHistories();
    delete allVersions[projectId];
    localStorage.setItem(VERSION_STORAGE_KEY, JSON.stringify(allVersions));
  } catch (error) {
    console.warn('Failed to clear version history:', error);
  }
}

/**
 * Get formatted timestamp for display
 */
export function formatVersionTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - timestamp;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `Hoje às ${date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })}`;
  } else if (diffDays === 1) {
    return `Ontem às ${date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })}`;
  } else if (diffDays < 7) {
    return `${diffDays} dias atrás`;
  } else {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

/**
 * Auto-save version on content changes (debounced)
 */
let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;

export function autoSaveVersion(
  projectId: string,
  content: string,
  title: string,
  delay: number = 30000 // 30 seconds
): void {
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
  }

  autoSaveTimeout = setTimeout(() => {
    const snapshot = createVersionSnapshot(
      projectId,
      content,
      title,
      'Auto-salvamento automático'
    );
    saveVersionSnapshot(projectId, snapshot);
  }, delay);
}

/**
 * Cancel pending auto-save
 */
export function cancelAutoSave(): void {
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = null;
  }
}