import React from "react";

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export const VidyoraLogo: React.FC<LogoProps> = ({ className = "h-8 w-8", ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      {...props}
    >
      <defs>
        <linearGradient id="techhimGrad1" x1="10" y1="20" x2="50" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366f1" /> {/* Indigo */}
          <stop offset="100%" stopColor="#0ea5e9" /> {/* Light Blue */}
        </linearGradient>
        <linearGradient id="techhimGrad2" x1="90" y1="20" x2="50" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#14b8a6" /> {/* Teal */}
          <stop offset="100%" stopColor="#0ea5e9" /> {/* Light Blue */}
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Stylized V - Left Wing (Book Page) */}
      <path
        d="M20 30 C30 25, 45 40, 50 85 C40 60, 25 45, 20 30 Z"
        fill="url(#techhimGrad1)"
        filter="url(#glow)"
      />
      {/* Stylized V - Right Wing (Book Page) */}
      <path
        d="M80 30 C70 25, 55 40, 50 85 C60 60, 75 45, 80 30 Z"
        fill="url(#techhimGrad2)"
        filter="url(#glow)"
      />

      {/* Nodes / Network Dots representing ecosystem */}
      <circle cx="20" cy="30" r="5" fill="#6366f1" />
      <circle cx="80" cy="30" r="5" fill="#14b8a6" />
      <circle cx="50" cy="85" r="6" fill="#0ea5e9" />
      
      {/* Center Top Node */}
      <circle cx="50" cy="15" r="4" fill="#0ea5e9" opacity="0.6" />
      
      {/* Connecting subtle line (Network) */}
      <path d="M20 30 Q35 15 50 15 Q65 15 80 30" stroke="#0ea5e9" strokeWidth="1.5" opacity="0.4" strokeDasharray="3 3" />
    </svg>
  );
};
