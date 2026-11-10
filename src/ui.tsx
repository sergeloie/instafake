import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { CreateUserModal } from './components/CreateUserModal';

interface UiContextValue {
  openNewUser: () => void;
}

const UiContext = createContext<UiContextValue | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const [newUserOpen, setNewUserOpen] = useState(false);
  const value = useMemo<UiContextValue>(
    () => ({
      openNewUser: () => setNewUserOpen(true),
    }),
    [],
  );
  return (
    <UiContext.Provider value={value}>
      {children}
      {newUserOpen ? <CreateUserModal onClose={() => setNewUserOpen(false)} /> : null}
    </UiContext.Provider>
  );
}

export function useUi(): UiContextValue {
  const context = useContext(UiContext);
  if (!context) throw new Error('useUi должен вызываться внутри UiProvider');
  return context;
}
