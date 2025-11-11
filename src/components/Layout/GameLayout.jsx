import React from 'react';

const GameLayout = ({ children }) => {
  return (
    <div className="min-h-screen overflow-hidden">
      {children}
    </div>
  );
};

export default GameLayout;