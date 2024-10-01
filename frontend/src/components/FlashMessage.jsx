// FlashMessage.js
import React from 'react';

const FlashMessage = ({ message, type, onClose }) => {
  return (
    <div className={`flash-message ${type}`}>
      <p>{message}</p>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default FlashMessage;
