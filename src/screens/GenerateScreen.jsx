import { useState } from 'react'
import { api } from '../services/api'
import { Zap, Loader, Image as ImageIcon, Monitor, Phone, Pencil, Upload } from 'lucide-react'

export function GenerateScreen({ navigation }) {
  const [prompt, setPrompt] = useState('')
  const [mode, setMode] = useState('IMAGE')
  const [ratio, setRatio] = useState('LANDSCAPE')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [inputImageUrl, setInputImageUrl] = useState('')

  async function handleSubmit() {
    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    if (mode === 'IMAGE_EDIT' && !inputImageUrl.trim()) {
      setError('Please provide a source image URL or upload an image')
      return
    }

    setLoading(true)
    setError('')
    try {
      const body = { prompt: prompt.trim(), mode, ratio }
      if (mode === 'IMAGE_EDIT') {
        body.input_image_url = inputImageUrl.trim()
      }
      await api.createPrompt(body)
      setPrompt('')
      setInputImageUrl('')
      alert('✓ Queued! Your prompt has been added to the queue.')
      navigation.navigate('Dashboard')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 8 * 1024 * 1024) {
      setError('Image must be less than 8MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setInputImageUrl(event.target.result)
    }
    reader.onerror = () => {
      setError('Failed to read file')
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-col h-full bg-dark-bg overflow-y-auto">
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-1">Generate</h1>
        <p className="text-dark-text-muted text-sm mb-8">Describe what you want to create</p>

        <textarea
          placeholder={mode === 'IMAGE_EDIT'
            ? "Describe what to change, e.g. 'make the background blue'..."
            : "A futuristic city at sunset, neon lights reflecting on rain-soaked streets..."}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          maxLength={500}
          className="w-full px-4 py-3 rounded-xl bg-dark-card border border-dark-border text-white placeholder-dark-text-muted focus:outline-none focus:border-primary transition-colors resize-none h-32 mb-6"
        />

        {/* Mode Toggle */}
        <div className="mb-6">
          <label className="text-xs text-dark-text-muted uppercase font-bold tracking-wider mb-2 block">Type</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'IMAGE', label: 'Image', icon: ImageIcon },
              { id: 'VIDEO', label: 'Video', icon: Zap },
              { id: 'IMAGE_EDIT', label: 'Edit Image', icon: Pencil }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all border ${mode === m.id
                  ? 'bg-purple-900 border-primary text-white'
                  : 'bg-dark-card border-dark-border text-dark-text-muted hover:text-white'
                  }`}
              >
                <m.icon size={18} />
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Image URL Input — only for IMAGE_EDIT */}
        {mode === 'IMAGE_EDIT' && (
          <div className="mb-6">
            <label className="text-xs text-dark-text-muted uppercase font-bold tracking-wider mb-2 block">Source Image</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Paste image URL (https://...) or upload"
                value={inputImageUrl.startsWith('data:image') ? '[Local Image Uploaded]' : inputImageUrl}
                onChange={(e) => {
                  if (inputImageUrl.startsWith('data:image')) setInputImageUrl('') // clear local upload if they type
                  else setInputImageUrl(e.target.value)
                }}
                className={`flex-1 px-4 py-3 rounded-xl bg-dark-card border text-white placeholder-dark-text-muted focus:outline-none transition-colors ${inputImageUrl.startsWith('data:image') ? 'border-primary text-primary-light' : 'border-dark-border focus:border-primary'
                  }`}
              />
              <label className="flex items-center justify-center cursor-pointer px-4 bg-dark-card border border-dark-border rounded-xl hover:bg-dark-border transition-colors text-dark-text-muted hover:text-white" title="Upload Image">
                <Upload size={20} />
                <input
                  type="file"
                  accept="image/jpeg, image/png, image/webp"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
              {inputImageUrl && (
                <button
                  onClick={() => setInputImageUrl('')}
                  className="flex items-center justify-center px-4 bg-red-900/20 border border-red-900/50 rounded-xl hover:bg-red-900/40 transition-colors text-red-400"
                  title="Clear Image"
                >
                  Clear
                </button>
              )}
            </div>
            {inputImageUrl.startsWith('data:image') && (
              <p className="text-xs text-primary-light/80 mt-2">✓ Image loaded and ready for upload</p>
            )}
          </div>
        )}

        {/* Ratio Toggle */}
        <div className="mb-8">
          <label className="text-xs text-dark-text-muted uppercase font-bold tracking-wider mb-2 block">Aspect Ratio</label>
          <div className="grid grid-cols-2 gap-3">
            {[{ id: 'LANDSCAPE', label: 'Landscape 16:9', icon: Monitor },
            { id: 'PORTRAIT', label: 'Portrait 9:16', icon: Phone }].map(r => (
              <button
                key={r.id}
                onClick={() => setRatio(r.id)}
                className={`flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all border ${ratio === r.id
                  ? 'bg-purple-900 border-primary text-white'
                  : 'bg-dark-card border-dark-border text-dark-text-muted hover:text-white'
                  }`}
              >
                <r.icon size={18} />
                <span className="text-sm">{r.label}</span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="px-4 py-2 bg-red-900/20 border border-red-900 rounded-lg text-red-400 text-sm mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-4 bg-primary hover:bg-primary-light active:bg-primary-light transition-colors text-white font-bold rounded-xl disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading && <Loader size={20} className="spinner" />}
          <Zap size={20} />
          {mode === 'IMAGE_EDIT' ? 'Edit Image' : 'Generate'}
        </button>
      </div>
    </div>
  )
}
