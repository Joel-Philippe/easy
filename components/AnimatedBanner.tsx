// components/AnimatedBanner.tsx
'use client';
import React from 'react';
import '../app/video-banner.css';

interface AnimatedBannerProps {
  onEnd: () => void;
}

const AnimatedBanner: React.FC<AnimatedBannerProps> = ({ onEnd }) => {
  return (
    <div className="animated-video-container">
      <video
        autoPlay
        muted
        playsInline
        className="animated-video"
        style={{ backgroundColor: '#f6eee2' }}
      >
        <source src="/video-6.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="animated-video-overlay" />
    </div>
  );
};

export default AnimatedBanner;
