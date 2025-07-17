import React, { useEffect, useState } from 'react';

const ProgressBar: React.FC = () => {
  const [scroll, setScroll] = useState(0);

  const handleScroll = () => {
    const totalHeight = document.body.scrollHeight - window.innerHeight;
    const scrollPosition = window.scrollY || window.pageYOffset;
    const scrollPercent = scrollPosition / totalHeight;
    setScroll(scrollPercent);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '7px',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        borderRadius: '0 0 12px 12px',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${scroll * 100}%`,
          background: 'linear-gradient(90deg,rgb(255, 255, 255),rgb(253, 105, 0),rgb(253, 105, 0))',
          borderRadius: '0 12px 12px 0',
          transition: 'width 0.2s ease-out',
        }}
      />
    </div>
  );
};

export default ProgressBar;
