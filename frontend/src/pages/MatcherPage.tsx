import { useState, useCallback } from 'react'
import { UploadCloudIcon, FolderSyncIcon, SearchIcon, FileTextIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import { matchCandidates, uploadResumes, indexLocalResumes, MatchResult } from '../api'
import ScoreBar from '../components/ScoreBar'
import Spinner from '../components/Spinner'

const DEFAULT_JD = `Senior Python Developer with AI/ML Experience

We are looking for a Senior Python Developer with hands-on experience in machine learning and AI systems.

Requirements:
- 5+ years of Python development experience
- Experience with ML frameworks (PyTorch, TensorFlow, scikit-learn)
- Familiarity with NLP and large language models (LLMs)
- Experience building REST APIs (FastAPI or Flask)
- Experience with vector databases (ChromaDB, Pinecone)
- Familiarity with cloud platforms (AWS, GCP, or Azure)`

export default function MatcherPage() {
  const [jobDesc, setJobDesc] = useState(DEFAULT_JD)
  const [nResults, setNResults] = useState(3)
  const [results, setResults] = useState<MatchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [indexing, setIndexing] = useState(false)
  const [error, setError] = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0)
  const [dragOver, setDragOver] = useState(false)

  const handleSearch = async () => {
    if (!jobDesc.trim()) return
    setLoading(true)
    setError('')
    setResults([])
    try {
      const data = await matchCandidates(jobDesc, nResults)
      setResults(data)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Search failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleIndexLocal = async () => {
    setIndexing(true)
    setStatusMsg('')
    setError('')
    try {
      const data = await indexLocalResumes()
      setStatusMsg(`✅ Indexed ${data.indexed} resumes from local folder`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Indexing failed'
      setError(msg)
    } finally {
      setIndexing(false)
    }
  }

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const pdfs = Array.from(files).filter((f) => f.name.endsWith('.pdf'))
    if (pdfs.length === 0) {
      setError('Only PDF files are supported.')
      return
    }
    setIndexing(true)
    setStatusMsg('')
    setError('')
    try {
      const data = await uploadResumes(pdfs)
      setStatusMsg(`✅ Indexed ${data.indexed} resume(s)${data.errors.length ? ` — ${data.errors.length} skipped` : ''}`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Upload failed'
      setError(msg)
    } finally {
      setIndexing(false)
    }
  }, [])

  const scoreColor = (s: number) =>
    s >= 0.7 ? 'text-emerald-400' : s >= 0.5 ? 'text-yellow-400' : 'text-red-400'

  const scoreBadge = (s: number) =>
    s >= 0.7 ? '🟢' : s >= 0.5 ? '🟡' : '🔴'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Candidate Matching</h1>
        <p className="text-gray-400 mt-1">
          Paste a job description and find the most relevant candidates using semantic search.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: JD input */}
        <div className="lg:col-span-2 space-y-4">
          <label className="block text-sm font-medium text-gray-300">
            Job Description
          </label>
          <textarea
            className="w-full h-64 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            placeholder="Paste the job description here..."
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
          />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-400">Top</label>
              <select
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={nResults}
                onChange={(e) => setNResults(Number(e.target.value))}
              >
                {[1, 2, 3, 5, 7, 10].map((n) => (
                  <option key={n} value={n}>{n} candidates</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !jobDesc.trim()}
              className="ml-auto flex items-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-5 py-2 rounded-lg transition-colors"
            >
              <SearchIcon className="w-4 h-4" />
              {loading ? 'Searching...' : 'Find Candidates'}
            </button>
          </div>
        </div>

        {/* Right: Resume indexing */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-300">Resume Library</label>

          {/* Drag & drop upload */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileUpload(e.dataTransfer.files) }}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
              dragOver ? 'border-brand-500 bg-brand-500/10' : 'border-gray-700 hover:border-gray-500'
            }`}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <UploadCloudIcon className="w-8 h-8 mx-auto text-gray-500 mb-2" />
            <p className="text-sm text-gray-400">
              Drag & drop PDFs here<br />or <span className="text-brand-500">click to upload</span>
            </p>
            <input
              id="file-input"
              type="file"
              accept=".pdf"
              multiple
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
          </div>

          {/* Index local folder */}
          <button
            onClick={handleIndexLocal}
            disabled={indexing}
            className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-200 text-sm font-medium px-4 py-2.5 rounded-lg border border-gray-700 transition-colors"
          >
            <FolderSyncIcon className="w-4 h-4" />
            {indexing ? 'Indexing...' : 'Index Local Resumes'}
          </button>

          {statusMsg && (
            <p className="text-sm text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-3 py-2">
              {statusMsg}
            </p>
          )}
          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>
      </div>

      {/* Results */}
      {loading && <Spinner label="Searching for best matches..." />}

      {!loading && results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">
            Top {results.length} Candidates
          </h2>
          {results.map((res, i) => (
            <div
              key={res.filename}
              className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
            >
              <button
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-800/50 transition-colors text-left"
                onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
              >
                <span className="text-2xl font-bold text-gray-600 w-8 shrink-0">
                  #{i + 1}
                </span>
                <span className="text-lg">{scoreBadge(res.score)}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate flex items-center gap-2">
                    <FileTextIcon className="w-4 h-4 text-gray-500 shrink-0" />
                    {res.filename}
                  </p>
                  <div className="mt-1.5 max-w-xs">
                    <ScoreBar score={res.score} />
                  </div>
                </div>
                <span className={`text-xl font-bold tabular-nums shrink-0 ${scoreColor(res.score)}`}>
                  {(res.score * 100).toFixed(0)}%
                </span>
                {expandedIdx === i
                  ? <ChevronUpIcon className="w-4 h-4 text-gray-500 shrink-0" />
                  : <ChevronDownIcon className="w-4 h-4 text-gray-500 shrink-0" />
                }
              </button>

              {expandedIdx === i && (
                <div className="px-5 pb-5 border-t border-gray-800">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-4 mb-2">
                    Resume Preview
                  </p>
                  <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">
                    {res.preview}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
