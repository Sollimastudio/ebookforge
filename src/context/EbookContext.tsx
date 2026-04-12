import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Theme = 'obsidian-noir' | 'clean-minimalist' | 'royal-burgundy' | 'ocean-breeze' | 'forest-sage' | 'sunset-gradient' | 'nordic-frost' | 'vintage-paper';

interface EbookContextType {
  activeTheme: Theme;
  setActiveTheme: (theme: Theme) => void;
  // TODO: we will add chapter management and content state here
}

const EbookContext = createContext<EbookContextType | undefined>(undefined);

export const EbookProvider = ({ children }: { children: ReactNode }) => {
  const [activeTheme, setActiveTheme] = useState<Theme>('obsidian-noir');

  return (
    <EbookContext.Provider value={{ activeTheme, setActiveTheme }}>
      {children}
    </EbookContext.Provider>
  );
};

export const useEbook = () => {
  const context = useContext(EbookContext);
  if (context === undefined) {
    throw new Error('useEbook must be used within an EbookProvider');
  }
  return context;
};
