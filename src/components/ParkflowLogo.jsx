import React from "react";

export default function ParkflowLogo({ size = 36, className = "" }) {
  return (
    <img
      src="/logo-icon.png?v=2"
      alt="ParkFlow"
      width={size}
      height={size}
      className={`object-contain select-none pointer-events-none drop-shadow-[0_0_12px_rgba(6,182,212,0.4)] ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      loading="eager"
    />
  );
}
