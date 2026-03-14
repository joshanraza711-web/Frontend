import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../services/api'
import { MediaCard } from '../components/MediaCard.jsx'
import { SkeletonCard } from '../components/SkeletonCard.jsx'
import { Download, X, Search, SlidersHorizontal, Pin, MoreHorizontal } from 'lucide-react'

const FILTERS = ['All', 'Completed', 'Processing', 'Failed']
const FILTER_MAP = {
  All: {},
  Completed: { status: 'completed' },
  Processing: { status: 'pending' },
  Failed: { status: 'failed' }
}

export function DashboardScreen({ navigation, route }) {
  const [pinnedPrompts, setPinnedPrompts] = useState([])
  const [recentPrompts, setRecentPrompts] = useState([])
  const [loadingPinned, setLoadingPinned] = useState(true)
  const [loadingRecent, setLoadingRecent] = useState(true)
  
  const [activeFilter, setActiveFilter] = useState('All')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [selectMode, setSelectMode] = useState(false)
  
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const pollRef = useRef(null)

  // Handle incoming Profile route filters
  useEffect(() => {
    if (route?.params?.filter) {
      const rf = route.params.filter
      if (['Images', 'Videos', 'Edits'].includes(rf)) {
        // If navigating from media type, set filter to All (types are handled implicitly if needed, but the screenshot shows status filters)
        // For now, we will just set it to 'All' or map it if we add type filters back.
        // Assuming the user just wants the status filters now as per screenshot: 'All', 'Completed', 'Processing', 'Failed'
        setActiveFilter('All')
      } else if (FILTERS.includes(rf)) {
        setActiveFilter(rf)
      } else if (rf === 'Pending') {
        setActiveFilter('Processing')
      }
    }
  }, [route?.params?.filter])

  const fetchPinned = async () => {
    try {
      const data = await api.getPrompts({ is_pinned: true, limit: 20 })
      setPinnedPrompts(data.prompts || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingPinned(false)
    }
  }

  const fetchRecent = useCallback(async (pg = 1, reset = false) => {
    if (pg === 1) setLoadingRecent(true)
    try {
      // Fetch recent items matching the selected status filter, but EXCLUDE pinned ones so they don't duplicate
      // (Note: The backend `/prompts` endpoint currently might not support `is_pinned: false` easily without modifying backend route.
      // If `is_pinned` filter is available, we use it. We'll assume the backend can handle `is_pinned: false` or we just filter client-side if needed.
      // Actually, looking at the backend route, it accepts standard exact matching.
      const data = await api.getPrompts({ page: pg, limit: 20, ...FILTER_MAP[activeFilter], is_pinned: false })
      const newPrompts = data.prompts || []
      setRecentPrompts(prev => reset || pg === 1 ? newPrompts : [...prev, ...newPrompts])
      setHasMore(pg < (data.pagination?.pages || 1))
      setPage(pg)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingRecent(false)
    }
  }, [activeFilter])

  useEffect(() => {
    fetchPinned()
  }, [])

  useEffect(() => {
    fetchRecent(1, true)
  }, [activeFilter, fetchRecent])

  // Poll for pending prompts
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      const hasPending = recentPrompts.some(p => p.status === 'pending' || p.status === 'processing') || 
                         pinnedPrompts.some(p => p.status === 'pending' || p.status === 'processing')
      if (!hasPending) return
      
      fetchPinned()
      fetchRecent(1, true)
      
    }, 5000)
    return () => clearInterval(pollRef.current)
  }, [recentPrompts, pinnedPrompts, fetchRecent])

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this media?')) return
    try {
      await api.deletePrompt(id)
      setPinnedPrompts(prev => prev.filter(p => p.id !== id))
      setRecentPrompts(prev => prev.filter(p => p.id !== id))
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
      // Moving between lists
      if (!is_pinned) {
        // Was unpinned -> Now pinned
        const item = recentPrompts.find(p => p.id === id)
        if (item) {
          setRecentPrompts(prev => prev.filter(p => p.id !== id))
          setPinnedPrompts(prev => [{ ...item, is_pinned: true }, ...prev])
        }
      } else {
        // Was pinned -> Now unpinned
        const item = pinnedPrompts.find(p => p.id === id)
        if (item) {
          setPinnedPrompts(prev => prev.filter(p => p.id !== id))
          // Only add to recent if it matches current filter (simplified: just add and let reload sort it if needed)
          setRecentPrompts(prev => [{ ...item, is_pinned: false }, ...prev])
        }
      }
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
    <div className="flex flex-col h-full bg-[#0B0A10] text-gray-100 font-sans">
      
      {/* Header & Search */}
      <div className="px-5 pt-6 pb-2 sticky top-0 z-30 bg-[#0B0A10]/95 backdrop-blur-xl">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-bold font-display tracking-wide">My Media</h2>
          <div className="flex items-center gap-3">
            <button className="p-2.5 rounded-xl border border-white/10 bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition">
              <Search size={18} />
            </button>
            <button className="p-2.5 rounded-xl border border-white/10 bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition">
              <SlidersHorizontal size={18} />
            </button>
          </div>
        </div>

        {/* Search Bar Input (Visual only for now) */}
        <div className="relative mb-2">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search" 
            className="w-full bg-[#15141A] border border-white/5 text-sm rounded-full py-3.5 pl-11 pr-12 outline-none focus:border-primary/50 text-white placeholder-gray-500 transition-all font-medium"
          />
          <button className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
            <SlidersHorizontal size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        
        {/* Pinned Section */}
        {(!loadingPinned && pinnedPrompts.length > 0) && (
          <div className="mt-4 mb-8">
            <div className="flex justify-between items-center px-5 mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Pin size={18} className="text-amber-400 fill-amber-400" />
                Pinned
              </h3>
              <button className="text-gray-500 hover:text-white"><MoreHorizontal size={20} /></button>
            </div>
            
            <div className="flex overflow-x-auto gap-4 px-5 pb-4 snap-x scrollbar-hide">
              {pinnedPrompts.map(item => (
                <div key={item.id} className="w-[160px] flex-none snap-start animate-fade-in">
                  <MediaCard
                    item={item}
                    isSelected={selectedIds.has(item.id)}
                    onPin={handlePin}
                    onDelete={handleDelete}
                    onPress={() => selectMode ? toggleSelect(item.id) : navigation.navigate('Detail', { promptId: item.id })}
                    onLongPress={() => enterSelectMode(item.id)}
                    compact
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Section */}
        <div className="px-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Recent</h3>
            <button className="text-gray-500 hover:text-white"><MoreHorizontal size={20} /></button>
          </div>

          {/* Filter Tabs matching Screenshot exactly */}
          <div className="flex justify-between bg-white/5 rounded-full p-1 border border-white/5 mb-6">
             {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`flex-1 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 ${
                  activeFilter === f
                    ? 'bg-primary text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {loadingRecent && recentPrompts.length === 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : recentPrompts.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-sm">No recent media found for this filter.</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                {recentPrompts.map(item => (
                  <div key={item.id} className="animate-fade-in">
                    <MediaCard
                      item={item}
                      isSelected={selectedIds.has(item.id)}
                      onPin={handlePin}
                      onDelete={handleDelete}
                      onPress={() => selectMode ? toggleSelect(item.id) : navigation.navigate('Detail', { promptId: item.id })}
                      onLongPress={() => enterSelectMode(item.id)}
                      compact
                    />
                  </div>
                ))}
              </div>
              
              {hasMore && (
                <div className="text-center mt-6 mb-4">
                  <button
                    onClick={() => fetchRecent(page + 1)}
                    className="px-6 py-2.5 bg-white/5 border border-white/10 text-gray-300 rounded-lg text-sm font-semibold hover:bg-white/10 transition-colors"
                  >
                    Load More
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* Selection Bar */}
      {selectMode && selectedIds.size > 0 && (
        <div className="fixed bottom-[85px] left-0 right-0 max-w-md mx-auto flex items-center justify-between px-5 py-4 glass-panel border-primary/50 shadow-[0_10px_40px_rgba(124,58,237,0.2)] rounded-3xl m-4 animate-slide-up z-50">
          <p className="text-white font-semibold flex items-center gap-2">
            <span className="bg-primary/20 text-primary-light px-2 py-0.5 rounded-md">{selectedIds.size}</span> selected
          </p>
          <button
            onClick={bulkDownload}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-light transition-all shadow-lg shadow-primary/30"
          >
            <Download size={18} />
            Download
          </button>
        </div>
      )}
    </div>
  )
}
