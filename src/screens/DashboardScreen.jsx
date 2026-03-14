import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../services/api'
import { MediaCard } from '../components/MediaCard.jsx'
import { SkeletonCard } from '../components/SkeletonCard.jsx'
import { Download, X } from 'lucide-react'

const FILTERS = ['All', 'Images', 'Videos', 'Edits', 'Pending', 'Failed']
const FILTER_MAP = {
  All: {},
  Images: { mode: 'IMAGE' },
  Videos: { mode: 'VIDEO' },
  Edits: { mode: 'IMAGE_EDIT' },
  Pending: { status: 'pending' },
  Failed: { status: 'failed' }
}

export function DashboardScreen({ navigation }) {
  const [prompts, setPrompts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeFilter, setActiveFilter] = useState('All')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [selectMode, setSelectMode] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const pollRef = useRef(null)

  const fetchPrompts = useCallback(async (pg = 1, reset = false) => {
    if (pg === 1) setLoading(true)
    try {
      const data = await api.getPrompts({ page: pg, limit: 20, ...FILTER_MAP[activeFilter] })
      const newPrompts = data.prompts || []
      setPrompts(prev => reset || pg === 1 ? newPrompts : [...prev, ...newPrompts])
      setHasMore(pg < (data.pagination?.pages || 1))
      setPage(pg)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [activeFilter])

  useEffect(() => {
    fetchPrompts(1, true)
  }, [activeFilter])

  // Poll for pending prompts every 5s
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      const hasPending = prompts.some(p => p.status === 'pending' || p.status === 'processing')
      if (!hasPending) return
      try {
        const data = await api.getPrompts({ page: 1, limit: 20, ...FILTER_MAP[activeFilter] })
        setPrompts(data.prompts || [])
      } catch { }
    }, 5000)
    return () => clearInterval(pollRef.current)
  }, [prompts, activeFilter])

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this media?')) return
    try {
      await api.deletePrompt(id)
      setPrompts(prev => prev.filter(p => p.id !== id))
      setSelectedIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    } catch (err) {
      alert('Delete failed: ' + err.message)
    }
  }

  async function handlePin(id, is_pinned) {
    try {
      await api.pinPrompt(id, !is_pinned)
      setPrompts(prev => prev.map(p => p.id === id ? { ...p, is_pinned: !is_pinned } : p))
    } catch (err) {
      alert('Pin failed: ' + err.message)
    }
  }

  function toggleSelect(id) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function enterSelectMode(id) {
    setSelectMode(true)
    setSelectedIds(new Set([id]))
  }

  function exitSelectMode() {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  async function bulkDownload() {
    const ids = [...selectedIds]
    if (ids.length === 0) return
    try {
      const resp = await api.bulkDownload(ids)
      if (resp?.download_url) {
        const a = document.createElement('a')
        a.href = resp.download_url
        a.download = `autoflow-media-${Date.now()}.zip`
        a.click()
      }
    } catch (e) {
      alert('Download failed: ' + e.message)
    }
    exitSelectMode()
  }

  return (
    <div className="flex flex-col h-full bg-dark-bg text-gray-100 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center px-5 py-4 sticky top-0 z-30 bg-dark-bg/80 backdrop-blur-xl border-b border-white/5">
        <h2 className="text-2xl font-bold font-display text-gradient">My Media</h2>
        {selectMode && (
          <div className="flex gap-4 items-center animate-fade-in">
            <button
              onClick={() => setSelectedIds(new Set(prompts.map(p => p.id)))}
              className="text-primary-light text-sm font-semibold hover:text-white transition-colors"
            >
              Select All
            </button>
            <button onClick={bulkDownload} className="text-primary-light hover:text-white transition-colors">
              <Download size={22} />
            </button>
            <button onClick={exitSelectMode} className="text-dark-text-muted hover:text-white transition-colors">
              <X size={22} />
            </button>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2.5 overflow-x-auto px-5 py-3 sticky top-[65px] z-20 bg-dark-bg/90 backdrop-blur-md border-b border-white/5 scrollbar-hide select-none transition-all">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
              activeFilter === f
                ? 'bg-primary text-white shadow-[0_0_15px_rgba(124,58,237,0.4)] scale-105'
                : 'glass-panel text-dark-text-muted hover:text-white hover:bg-white/10'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading && prompts.length === 0 ? (
          <div className="flex flex-wrap justify-center gap-3 p-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div>
            {prompts.length === 0 ? (
              <div className="flex flex-col items-center justify-center pt-32 gap-4 animate-fade-in">
                <div className="text-6xl filter drop-shadow-[0_0_20px_rgba(124,58,237,0.3)]">✨</div>
                <p className="text-gray-300 font-display font-semibold text-lg">No media yet</p>
                <p className="text-dark-text-muted text-sm text-center max-w-[250px]">
                  Generate your first stunning image or video to see it here!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 p-4 pb-24">
                {prompts.map(item => (
                  <div key={item.id} className="animate-fade-in" style={{ animationDelay: '50ms' }}>
                    <MediaCard
                      item={item}
                      isSelected={selectedIds.has(item.id)}
                      onPin={handlePin}
                      onDelete={handleDelete}
                      onPress={() => selectMode
                        ? toggleSelect(item.id)
                        : navigation.navigate('Detail', { promptId: item.id })
                      }
                      onLongPress={() => enterSelectMode(item.id)}
                    />
                  </div>
                ))}
              </div>
            )}
            {hasMore && !loading && (
              <div className="text-center py-4">
                <button
                  onClick={() => fetchPrompts(page + 1)}
                  className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-light transition-colors"
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selection Bar */}
      {selectMode && selectedIds.size > 0 && (
        <div className="fixed bottom-[85px] left-0 right-0 max-w-md mx-auto flex items-center justify-between px-5 py-4 glass-panel border-primary/50 shadow-[0_10px_40px_rgba(124,58,237,0.2)] rounded-3xl m-4 animate-slide-up z-50">
          <p className="text-white font-semibold flex items-center gap-2">
            <span className="bg-primary/20 text-primary-light px-2 py-0.5 rounded-md">{selectedIds.size}</span> selected
          </p>
          <button
            onClick={bulkDownload}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-light transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/30"
          >
            <Download size={18} />
            Download
          </button>
        </div>
      )}
    </div>
  )
}
