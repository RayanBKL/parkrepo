import React from "react";

export default function ParkeyaLogo({ size = 36, className = "" }) {
  return (
    <img
      src="/logo.png"
      alt="Parkeya"
      width={size}
      height={size}
      className={`rounded-xl object-contain shrink-0 shadow-md ${className}`}
    />
  );
}

export { ParkeyaLogo as ParkflowLogo };
