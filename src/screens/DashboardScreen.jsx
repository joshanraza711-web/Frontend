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
    <div className="flex flex-col h-full bg-dark-bg">
      {/* Header */}
      <div className="flex justify-between items-center px-5 py-3 border-b border-dark-border">
        <h2 className="text-2xl font-bold">My Media</h2>
        {selectMode && (
          <div className="flex gap-3 items-center">
            <button
              onClick={() => setSelectedIds(new Set(prompts.map(p => p.id)))}
              className="text-primary-light text-sm font-semibold hover:opacity-80"
            >
              All
            </button>
            <button onClick={bulkDownload} className="text-primary-light hover:opacity-80">
              <Download size={22} />
            </button>
            <button onClick={exitSelectMode} className="text-dark-text-muted hover:opacity-80">
              <X size={22} />
            </button>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3 border-b border-dark-border scrollbar-hide">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${activeFilter === f
                ? 'bg-primary text-white'
                : 'bg-dark-card text-dark-text-muted hover:text-white'
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
              <div className="flex flex-col items-center justify-center pt-20 gap-2">
                <div className="text-5xl text-gray-700">🖼️</div>
                <p className="text-dark-text-muted font-semibold">No media yet</p>
                <p className="text-dark-text-muted text-sm">Generate your first image or video!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 p-3 pb-20">
                {prompts.map(item => (
                  <MediaCard
                    key={item.id}
                    item={item}
                    isSelected={selectedIds.has(item.id)}
                    onPress={() => selectMode
                      ? toggleSelect(item.id)
                      : navigation.navigate('Detail', { promptId: item.id })
                    }
                    onLongPress={() => enterSelectMode(item.id)}
                  />
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
        <div className="fixed bottom-20 left-0 right-0 max-w-md mx-auto flex items-center justify-between px-4 py-3 bg-dark-card border border-primary rounded-2xl m-4 bg-opacity-95">
          <p className="text-white font-semibold">{selectedIds.size} selected</p>
          <button
            onClick={bulkDownload}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-light transition-colors"
          >
            <Download size={18} />
            Download
          </button>
        </div>
      )}
    </div>
  )
}
