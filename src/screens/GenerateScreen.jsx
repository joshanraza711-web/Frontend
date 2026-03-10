import { useState } from 'react'
import { api } from '../services/api'
import { Zap, Loader, Image as ImageIcon, Monitor, Phone } from 'lucide-react'

export function GenerateScreen({ navigation }) {
  const [prompt, setPrompt] = useState('')
  const [mode, setMode] = useState('IMAGE')
  const [ratio, setRatio] = useState('LANDSCAPE')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    setLoading(true)
    setError('')
    try {
      await api.createPrompt({ prompt: prompt.trim(), mode, ratio })
      setPrompt('')
      alert('✓ Queued! Your prompt has been added to the queue.')
      navigation.navigate('Dashboard')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-dark-bg overflow-y-auto">
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-1">Generate</h1>
        <p className="text-dark-text-muted text-sm mb-8">Describe what you want to create</p>

        <textarea
          placeholder="A futuristic city at sunset, neon lights reflecting on rain-soaked streets..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          maxLength={500}
          className="w-full px-4 py-3 rounded-xl bg-dark-card border border-dark-border text-white placeholder-dark-text-muted focus:outline-none focus:border-primary transition-colors resize-none h-32 mb-6"
        />

        {/* Mode Toggle */}
        <div className="mb-6">
          <label className="text-xs text-dark-text-muted uppercase font-bold tracking-wider mb-2 block">Type</label>
          <div className="grid grid-cols-2 gap-3">
            {['IMAGE', 'VIDEO'].map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all border ${
                  mode === m
                    ? 'bg-purple-900 border-primary text-white'
                    : 'bg-dark-card border-dark-border text-dark-text-muted hover:text-white'
                }`}
              >
                {m === 'IMAGE' ? <ImageIcon size={18} /> : <Zap size={18} />}
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Ratio Toggle */}
        <div className="mb-8">
          <label className="text-xs text-dark-text-muted uppercase font-bold tracking-wider mb-2 block">Aspect Ratio</label>
          <div className="grid grid-cols-2 gap-3">
            {[{ id: 'LANDSCAPE', label: 'Landscape 16:9', icon: Monitor }, 
              { id: 'PORTRAIT', label: 'Portrait 9:16', icon: Phone }].map(r => (
              <button
                key={r.id}
                onClick={() => setRatio(r.id)}
                className={`flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all border ${
                  ratio === r.id
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
          Generate
        </button>
      </div>
    </div>
  )
}
