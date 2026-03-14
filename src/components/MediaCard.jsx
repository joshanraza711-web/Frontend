import { StatusBadge } from './StatusBadge'
import { Play, Image as ImageIcon, Check, Trash2, Pin } from 'lucide-react'

export function MediaCard({ item, onPress, onLongPress, isSelected, onPin, onDelete, compact }) {
  const thumbnail = item.output_urls?.[0]
  const isVideo = item.mode === 'VIDEO'
  const isPinned = item.is_pinned

  // Calculate expiration (24h from created_at)
  let expiresText = null
  if (!isPinned && item.status !== 'failed') {
    const createdDate = new Date(item.created_at).getTime()
    const expiresAt = createdDate + 24 * 60 * 60 * 1000
    const hoursLeft = Math.max(0, Math.floor((expiresAt - Date.now()) / (1000 * 60 * 60)))
    if (hoursLeft > 0) {
      expiresText = `auto delete in ${hoursLeft}h`
    } else {
      expiresText = 'Expiring soon'
    }
  }

  // Dimension classes based on compact mode
  const containerClass = compact ? 'h-36' : 'h-44'
  const imageContainerClass = compact ? 'h-full absolute inset-0' : 'h-28'
  const textContainerClass = compact 
    ? 'absolute bottom-0 left-0 right-0 p-3 pt-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent'
    : 'flex-1 flex flex-col gap-1.5 p-3 overflow-hidden bg-gradient-to-b from-[#15141A] to-[#0B0A10]'

  return (
    <div
      className={`relative w-full ${containerClass} rounded-2xl overflow-hidden transition-all duration-300 ${
        isSelected 
          ? 'border-2 border-primary shadow-[0_0_15px_rgba(124,58,237,0.3)]' 
          : 'border border-white/5 shadow-lg'
      } bg-[#15141A] group flex flex-col cursor-pointer hover:shadow-2xl hover:-translate-y-1`}
      onClick={onPress}
      onContextMenu={(e) => {
        e.preventDefault()
        onLongPress?.()
      }}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 z-30">
          <div className="relative w-7 h-7 flex items-center justify-center bg-primary rounded-full shadow-lg border border-white/20">
            <Check size={18} className="text-white" />
          </div>
        </div>
      )}

      {/* Action Buttons Overlay */}
      <div className="absolute top-2 right-2 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {!isSelected && (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); onPin?.(item.id, isPinned) }}
              className={`p-1.5 rounded-full backdrop-blur-xl border shadow-md transition-colors ${
                isPinned ? 'bg-amber-400/20 text-amber-400 border-amber-400/30 hover:bg-amber-400/30' : 'bg-black/40 border-white/10 text-gray-300 hover:bg-black/60 hover:text-white'
              }`}
              title={isPinned ? 'Unpin snippet' : 'Pin to keep forever'}
            >
              <Pin size={14} className={isPinned ? 'fill-amber-400' : ''} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete?.(item.id) }}
              className="p-1.5 rounded-full bg-black/40 border border-white/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 backdrop-blur-xl shadow-md transition-colors"
              title="Delete immediately"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>

      <div className={`w-full ${imageContainerClass} bg-[#0C0C14] relative flex items-center justify-center overflow-hidden`}>
        {thumbnail ? (
          <img 
            src={thumbnail} 
            alt={item.prompt} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <ImageIcon size={32} className="text-gray-700" />
        )}
        
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
            <div className="bg-white/20 backdrop-blur-md rounded-full p-2 shadow-lg">
              <Play size={20} className="text-white fill-white" />
            </div>
          </div>
        )}

        {/* Top-Left Pinned Badge (Screenshot style) */}
        {isPinned && compact && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[9px] font-bold text-gray-200 border border-white/10 shadow-lg tracking-wider">
            <Pin size={10} className="text-amber-400 fill-amber-400" />
            PINNED
          </div>
        )}
      </div>
      
      <div className={`${textContainerClass} z-10 flex flex-col justify-end`}>
        {!compact && (
          <div className="flex justify-between items-start mb-1">
            <StatusBadge status={item.status} />
            {isPinned && <Pin size={12} className="text-amber-400 fill-amber-400" />}
          </div>
        )}

        {/* Expiration text styling based on screenshot */}
        <div className="flex items-center gap-1.5">
          {expiresText ? (
             <>
               <Pin size={10} className="text-amber-400 fill-amber-400 rotate-45" />
               <span className="text-[10px] text-gray-300 font-medium tracking-wide">{expiresText}</span>
             </>
          ) : (
            compact ? <span className="text-[10px] text-gray-300 font-medium tracking-wide truncate">{item.prompt}</span> : <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed font-medium">{item.prompt}</p>
          )}
        </div>
      </div>
    </div>
  )
}
