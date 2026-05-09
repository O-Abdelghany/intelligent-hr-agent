import { useState } from 'react'
import { SendIcon, ThumbsUpIcon, ThumbsDownIcon, BarChart2Icon } from 'lucide-react'
import { analyzeSentiment, SentimentResult } from '../api'
import Spinner from '../components/Spinner'

const PLACEHOLDER = `I love working here, the environment is great!
The management is terrible and I am very stressed.
The salary is okay but the hours are long.
My team is supportive and I feel valued.
There is no room for growth in this company.`

export default function SentimentPage() {
  const [input, setInput] = useState('')
  const [results, setResults] = useState<SentimentResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAnalyze = async () => {
    const lines = input.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length === 0) return
    setLoading(true)
    setError('')
    setResults([])
    try {
      const data = await analyzeSentiment(lines)
      setResults(data)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Analysis failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const positive = results.filter((r) => r.label === 'POSITIVE')
  const negative = results.filter((r) => r.label === 'NEGATIVE')
  const total = results.length
  const positivePct = total > 0 ? Math.round((positive.length / total) * 100) : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Sentiment Analysis</h1>
        <p className="text-gray-400 mt-1">
          Analyze employee feedback to understand team morale. Enter one piece of feedback per line.
        </p>
      </div>

      {/* Input */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">
          Employee Feedback
        </label>
        <textarea
          className="w-full h-48 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          placeholder={PLACEHOLDER}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="flex justify-end">
          <button
            onClick={handleAnalyze}
            disabled={loading || !input.trim()}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-5 py-2 rounded-lg transition-colors"
          >
            <SendIcon className="w-4 h-4" />
            {loading ? 'Analyzing...' : 'Analyze Sentiment'}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {loading && <Spinner label="Analyzing feedback..." />}

      {/* Summary metrics */}
      {!loading && results.length > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center gap-4">
              <div className="bg-gray-800 p-2.5 rounded-lg">
                <BarChart2Icon className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{total}</p>
                <p className="text-sm text-gray-500">Total Responses</p>
              </div>
            </div>
            <div className="bg-gray-900 border border-emerald-500/20 rounded-xl p-5 flex items-center gap-4">
              <div className="bg-emerald-500/10 p-2.5 rounded-lg">
                <ThumbsUpIcon className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-400">{positive.length}</p>
                <p className="text-sm text-gray-500">Positive</p>
              </div>
            </div>
            <div className="bg-gray-900 border border-red-500/20 rounded-xl p-5 flex items-center gap-4">
              <div className="bg-red-500/10 p-2.5 rounded-lg">
                <ThumbsDownIcon className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-400">{negative.length}</p>
                <p className="text-sm text-gray-500">Negative</p>
              </div>
            </div>
          </div>

          {/* Morale bar */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400 font-medium">Overall Morale</span>
              <span className="font-semibold text-white">{positivePct}% positive</span>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700"
                style={{ width: `${positivePct}%` }}
              />
            </div>
          </div>

          {/* Individual results */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Results</h2>
            {results.map((res, i) => {
              const isPos = res.label === 'POSITIVE'
              return (
                <div
                  key={i}
                  className={`flex items-start gap-4 bg-gray-900 border rounded-xl px-5 py-4 ${
                    isPos ? 'border-emerald-500/20' : 'border-red-500/20'
                  }`}
                >
                  <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${isPos ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                    {isPos
                      ? <ThumbsUpIcon className="w-4 h-4 text-emerald-400" />
                      : <ThumbsDownIcon className="w-4 h-4 text-red-400" />
                    }
                  </div>
                  <p className="flex-1 text-sm text-gray-300 leading-relaxed">{res.text}</p>
                  <div className="shrink-0 text-right">
                    <span className={`text-sm font-semibold ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                      {res.label}
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">{(res.score * 100).toFixed(0)}% confidence</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
