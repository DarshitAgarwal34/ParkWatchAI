import React from "react"

export function RiskMeter({ score, size = 120 }) {
  const radius = size * 0.4
  const strokeWidth = size * 0.08
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference

  // Color mapping based on category levels
  let color = "text-emerald-500"
  
  if (score > 80) {
    color = "text-red-500"
  } else if (score > 60) {
    color = "text-orange-500"
  } else if (score > 30) {
    color = "text-amber-500"
  }

  return (
    <div className="flex flex-col items-center justify-center relative">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-slate-100"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={`transition-all duration-1000 ease-out ${color}`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      {/* Inner Label */}
      <div className="absolute flex flex-col items-center justify-center">
        <span className="font-mono text-2xl font-black text-foreground">{score.toFixed(1)}</span>
        <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase">RISK</span>
      </div>
    </div>
  )
}
export default RiskMeter
