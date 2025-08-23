// client/src/components/BrandLogo.jsx
import React from 'react';

export default function BrandLogo({ size = 56, textSize = 'text-2xl', stacked = false }) {
  return (
    <div className={`flex ${stacked ? 'flex-col items-center' : 'items-center gap-3'}`}>
      <div
        className="relative grid place-items-center rounded-2xl"
        style={{ width: size, height: size, background: 'radial-gradient(120% 120% at 30% 20%, #7C3AED, #06B6D4)' }}
      >
        <svg width={size*0.6} height={size*0.6} viewBox="0 0 24 24" className="text-white">
          <path fill="currentColor" d="M12 2l2.4 6.9h7.2l-5.8 4.2 2.4 6.9L12 15.8 5.8 20l2.4-6.9L2.4 8.9h7.2z"/>
        </svg>
        <div className="absolute inset-0 rounded-2xl ring-1 ring-white/30"></div>
      </div>
      <div className={`${textSize} font-semibold leading-none`}>
        <span className="text-white text-4xl">Future Skills Academy</span>
      </div>
    </div>
  );
}
