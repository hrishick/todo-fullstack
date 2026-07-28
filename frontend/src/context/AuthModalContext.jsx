import { createContext, useState } from "react";
import AuthModal from "../components/AuthModal";

export const AuthModalContext = createContext();

export function AuthModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialTab, setInitialTab] = useState("login");

  const openAuthModal = (tab = "login") => {
    setInitialTab(tab);
    setIsOpen(true);
  };

  const closeAuthModal = () => {
    setIsOpen(false);
  };

  return (
    <AuthModalContext.Provider value={{ openAuthModal, closeAuthModal, isOpen }}>
      {children}
      <AuthModal
        isOpen={isOpen}
        onClose={closeAuthModal}
        initialTab={initialTab}
        onSuccess={closeAuthModal}
      />
    </AuthModalContext.Provider>
  );
}
