import React from 'react';

export const GlassCard = ({ children, className = '', style = {}, onClick }) => {
  return (
    <div
      className={`glass-panel ${className}`}
      style={{
        padding: '24px',
        ...style,
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default GlassCard;
