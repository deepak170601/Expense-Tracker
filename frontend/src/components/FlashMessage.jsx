import React from 'react';
import { useFlashMessage } from '../context/FlashMessageContext';
import './styles/FlashMessage.css';

const FlashMessage = () => {
  const { messages, removeMessage } = useFlashMessage();

  return (
    <div className="flash-message-container">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flash-message flash-message-${message.type}`}
          onClick={() => removeMessage(message.id)}
        >
          <span>{message.text}</span>
          <button
            className="flash-message-close"
            onClick={() => removeMessage(message.id)}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default FlashMessage;

