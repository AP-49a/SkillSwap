import React from 'react';
import { useTheme } from '../context/ThemeContext.jsx';

const SkillSwapLogo = ({ className = '' }) => {
  const { theme } = useTheme();
  const mark = theme === 'dark' ? '/skillswap-mark-dark.svg' : '/skillswap-mark.svg';

  return (
    <span className={`skillswap-brand ${className}`.trim()}>
      <img className="skillswap-brand-mark" src={mark} alt="" aria-hidden="true" />
      <span className="skillswap-brand-wordmark" aria-label="SkillSwap">
        <span>Skill</span><span>Swap</span>
      </span>
    </span>
  );
};

export default SkillSwapLogo;
