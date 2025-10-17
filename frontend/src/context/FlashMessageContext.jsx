import React, { createContext, useState, useContext } from 'react';

const FlashMessageContext = createContext();

export const useFlashMessage = () => {
  const context = useContext(FlashMessageContext);
  if (!context) {
    throw new Error('useFlashMessage must be used within a FlashMessageProvider');
  }
  return context;
};

export const FlashMessageProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);

  const showMessage = (text, type = 'info') => {
    const id = Date.now() + Math.random();
    const newMessage = { id, text, type };

    setMessages((prev) => [...prev, newMessage]);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      setMessages((prev) => prev.filter((msg) => msg.id !== id));
    }, 3000);
  };

  const removeMessage = (id) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  return (
    <FlashMessageContext.Provider value={{ messages, showMessage, removeMessage }}>
      {children}
    </FlashMessageContext.Provider>
  );
};

