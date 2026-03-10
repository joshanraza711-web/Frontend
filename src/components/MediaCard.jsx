import { StatusBadge } from './StatusBadge'
import { Play, Image as ImageIcon, Check } from 'lucide-react'

export function MediaCard({ item, onPress, onLongPress, isSelected }) {
  const thumbnail = item.output_urls?.[0]
  const isVideo = item.mode === 'VIDEO'

  return (
    <button
      onClick={onPress}
      onContextMenu={(e) => {
        e.preventDefault()
        onLongPress?.()
      }}
      className={`relative w-full h-40 rounded-lg overflow-hidden border transition-all ${
        isSelected 
          ? 'border-2 border-primary' 
          : 'border border-dark-border'
      } bg-dark-card hover:opacity-90 flex flex-col`}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 z-10">
          <div className="relative w-7 h-7 flex items-center justify-center bg-black/50 rounded-full">
            <Check size={20} className="text-primary" />
          </div>
        </div>
      )}
      
      <div className="w-full h-24 bg-dark-border relative flex items-center justify-center">
        {thumbnail ? (
          <img 
            src={thumbnail} 
            alt={item.prompt} 
            className="w-full h-full object-cover"
          />
        ) : (
          <ImageIcon size={32} className="text-gray-600" />
        )}
        
        {isVideo && (
          <div className="absolute bottom-1 right-1 bg-black/60 rounded-full p-1">
            <Play size={16} className="text-white fill-white" />
          </div>
        )}
      </div>
      
      <div className="flex-1 flex flex-col gap-1 p-2 overflow-hidden">
        <StatusBadge status={item.status} />
        <p className="text-xs text-gray-300 line-clamp-2 leading-tight">{item.prompt}</p>
        <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString()}</p>
      </div>
    </button>
  )
}
