import React from 'react';

const GameLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {children}
    </div>
  );
};

export default GameLayout;