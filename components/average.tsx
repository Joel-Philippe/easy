import React, { useRef, useEffect, useState } from 'react';
import { calculateDonutPercentage } from './calculateDonutPercentage';
import { useInView } from 'react-intersection-observer';

interface DonutChartProps {
  stock: number;
  stock_reduc: number;
}

const DonutChart: React.FC<DonutChartProps> = ({ stock, stock_reduc }) => {
  const { ref: inViewRef, inView } = useInView({
    triggerOnce: true, // Trigger only once
    threshold: 0.1, // Trigger when 10% of the component is visible
  });
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    if (inView) {
      setIsAnimated(true);
    }
  }, [inView]);

  const percentage = calculateDonutPercentage(stock, stock_reduc);

  return (
    <div className="skill" ref={inViewRef}>
      <div className="outer">
        <div className="inner">
          <div id="number">{isAnimated ? `${percentage}%` : '0%'}</div>
          <span className="stock_percent">Stock</span>
        </div>
      </div>
      <svg className='donut_svg' xmlns="http://www.w3.org/2000/svg" version="1.1" width="100px" height="100px">
        <defs>
          <linearGradient id="GradientColor">
            <stop offset="0%" stopColor="#aee7b1" />
            <stop offset="100%" stopColor="#00fff7" />
          </linearGradient>
        </defs>
        <circle
          cx="50"
          cy="50"
          r="40"
          stroke="url(#GradientColor)"
          strokeDasharray={`${(percentage * 251.2) / 100} ${251.2 - (percentage * 251.2) / 100}`}
          strokeDashoffset="0"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

export { DonutChart };
