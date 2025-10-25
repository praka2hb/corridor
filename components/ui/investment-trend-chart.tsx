"use client"

import { useMemo } from 'react';
import type { GrowthDataPoint } from '@/lib/types/investment';

interface InvestmentTrendChartProps {
  data: GrowthDataPoint[];
  className?: string;
}

export function InvestmentTrendChart({ data, className = '' }: InvestmentTrendChartProps) {
  const { points, minValue, maxValue, width, height } = useMemo(() => {
    if (data.length === 0) return { points: '', minValue: 0, maxValue: 0, width: 600, height: 200 };

    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Add padding to the range
    const range = max - min;
    const paddedMin = min - range * 0.1;
    const paddedMax = max + range * 0.1;

    const w = 600;
    const h = 200;
    const padding = 20;

    // Calculate points for the line
    const pointsStr = data
      .map((d, i) => {
        const x = padding + (i / (data.length - 1)) * (w - 2 * padding);
        const y = h - padding - ((d.value - paddedMin) / (paddedMax - paddedMin)) * (h - 2 * padding);
        return `${x},${y}`;
      })
      .join(' ');

    return {
      points: pointsStr,
      minValue: paddedMin,
      maxValue: paddedMax,
      width: w,
      height: h,
    };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-48 text-slate-400 ${className}`}>
        No data available
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Gradient definition */}
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Area under the line */}
        <polygon
          points={`20,${height - 20} ${points} ${width - 20},${height - 20}`}
          fill="url(#areaGradient)"
        />

        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map((d, i) => {
          const x = 20 + (i / (data.length - 1)) * (width - 40);
          const y = height - 20 - ((d.value - minValue) / (maxValue - minValue)) * (height - 40);
          
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r="4"
                fill="#0ea5e9"
                stroke="white"
                strokeWidth="2"
              />
            </g>
          );
        })}
      </svg>

      {/* Labels */}
      <div className="flex justify-between mt-2 px-2 text-xs text-slate-500">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}
