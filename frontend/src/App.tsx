import { Routes, Route, NavLink } from 'react-router-dom'
import { BotIcon, SearchIcon, SmileIcon } from 'lucide-react'
import MatcherPage from './pages/MatcherPage'
import SentimentPage from './pages/SentimentPage'

export default function App() {
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-brand-500 text-white'
        : 'text-gray-400 hover:text-white hover:bg-gray-800'
    }`

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top nav */}
      <header className="border-b border-gray-800 bg-gray-900 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-brand-500 p-1.5 rounded-lg">
              <BotIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-white text-lg">HR Agent</span>
          </div>
          <nav className="flex items-center gap-2">
            <NavLink to="/" end className={navClass}>
              <SearchIcon className="w-4 h-4" />
              Candidate Matching
            </NavLink>
            <NavLink to="/sentiment" className={navClass}>
              <SmileIcon className="w-4 h-4" />
              Sentiment Analysis
            </NavLink>
          </nav>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
        <Routes>
          <Route path="/" element={<MatcherPage />} />
          <Route path="/sentiment" element={<SentimentPage />} />
        </Routes>
      </main>
    </div>
  )
}
