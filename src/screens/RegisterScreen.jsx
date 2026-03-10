import { useState } from 'react'
import { api } from '../services/api'
import { useAuthStore } from '../store/useAuthStore'
import { Loader } from 'lucide-react'

export function RegisterScreen({ navigation }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const setAuth = useAuthStore(s => s.setAuth)

  async function handleRegister() {
    if (!name || !email || !password || !confirm) {
      setError('Please fill in all fields')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await api.register(email, password, name)
      setAuth(data.user, data.token)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-dark-bg px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
        <p className="text-dark-text-muted text-sm mb-8">Join the AI media revolution</p>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-4 rounded-xl bg-dark-card border border-dark-border text-white placeholder-dark-text-muted focus:outline-none focus:border-primary transition-colors"
          />
          
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-4 rounded-xl bg-dark-card border border-dark-border text-white placeholder-dark-text-muted focus:outline-none focus:border-primary transition-colors"
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-4 rounded-xl bg-dark-card border border-dark-border text-white placeholder-dark-text-muted focus:outline-none focus:border-primary transition-colors"
          />
          
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full px-4 py-4 rounded-xl bg-dark-card border border-dark-border text-white placeholder-dark-text-muted focus:outline-none focus:border-primary transition-colors"
          />

          {error && (
            <div className="px-4 py-2 bg-red-900/20 border border-red-900 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full py-4 bg-primary hover:bg-primary-light active:bg-primary-light transition-colors text-white font-bold rounded-xl disabled:opacity-60 flex items-center justify-center gap-2 mt-4"
          >
            {loading && <Loader size={18} className="spinner" />}
            Create Account
          </button>

          <button
            onClick={() => navigation.goBack()}
            className="w-full text-center mt-6 text-dark-text-muted text-sm hover:text-primary-light transition-colors"
          >
            Already have an account? <span className="text-primary-light font-semibold">Sign In</span>
          </button>
        </div>
      </div>
    </div>
  )
}
