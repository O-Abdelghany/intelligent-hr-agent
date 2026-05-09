interface ScoreBarProps {
  score: number // 0 to 1
}

export default function ScoreBar({ score }: ScoreBarProps) {
  const pct = Math.min(Math.max(score, 0), 1)
  const color =
    pct >= 0.7 ? 'bg-emerald-500' : pct >= 0.5 ? 'bg-yellow-400' : 'bg-red-500'

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <span className="text-sm font-semibold w-12 text-right tabular-nums">
        {(pct * 100).toFixed(0)}%
      </span>
    </div>
  )
}
