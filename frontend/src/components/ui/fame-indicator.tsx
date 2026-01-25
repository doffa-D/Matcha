import React from "react";

export const FameIndicator = ({ score }: { score: number }) => {
  const radius = 18; // slightly smaller than half the container
  const strokeWidth = 4;
  const normalizedRadius = radius;
  const circumference = 2 * Math.PI * normalizedRadius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center">
      <svg
        className="w-full h-full transform -rotate-90"
        viewBox={`0 0 ${radius * 2 + strokeWidth * 2} ${
          radius * 2 + strokeWidth * 2
        }`}
      >
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={normalizedRadius}
          stroke="#E8E8E8"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={normalizedRadius}
          stroke="#7CB342"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[13px] font-bold text-matcha">
        {score}
      </span>
    </div>
  );
};
