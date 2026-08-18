import React from "react";

export default function ParkflowLogo({ size = 32, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="pf-border-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="45%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
        <linearGradient id="pf-arrow-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="50%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
        <linearGradient id="pf-inner-green" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>

      {/* Cadre externe arrondi avec gradient cyan -> émeraude */}
      <rect
        x="10"
        y="10"
        width="100"
        height="100"
        rx="28"
        stroke="url(#pf-border-grad)"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />

      {/* Coin intérieur vert haut-droit */}
      <path
        d="M 72 26 L 94 26 C 94 26 94 26 94 48"
        stroke="url(#pf-inner-green)"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />

      {/* Flèche d'angle haut-droite interne */}
      <path
        d="M 80 40 L 92 28 M 92 28 L 84 28 M 92 28 L 92 36"
        stroke="url(#pf-inner-green)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Boucle du 'P' */}
      <circle
        cx="60"
        cy="52"
        r="22"
        stroke="url(#pf-border-grad)"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />

      {/* Tige basse du 'P' avec courbure vers la gauche */}
      <path
        d="M 38 52 L 38 80 C 38 88, 28 88, 28 80 C 28 72, 38 72, 38 72"
        stroke="#0284c7"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Flèche montante centrale dynamique traversant le P */}
      <path
        d="M 34 76 L 68 42"
        stroke="url(#pf-arrow-grad)"
        strokeWidth="9"
        strokeLinecap="round"
      />
      {/* Tête de flèche centrale */}
      <path
        d="M 52 42 L 70 40 L 68 58 Z"
        fill="url(#pf-arrow-grad)"
      />
    </svg>
  );
}
