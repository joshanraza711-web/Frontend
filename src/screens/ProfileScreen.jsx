import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { useAuthStore } from '../store/useAuthStore'
import { LogOut, Shield, Loader } from 'lucide-react'

export function ProfileScreen({ navigation }) {
  const { user, clearAuth } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      const [all, completed, failed] = await Promise.all([
        api.getPrompts({ limit: 1 }),
        api.getPrompts({ limit: 1, status: 'completed' }),
        api.getPrompts({ limit: 1, status: 'failed' })
      ])
      setStats({
        total: all.pagination?.total || 0,
        completed: completed.pagination?.total || 0,
        failed: failed.pagination?.total || 0
      })
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  function handleLogout() {
    if (window.confirm('Are you sure you want to logout?')) {
      clearAuth()
    }
  }

  const avatarLetter = user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'

  return (
    <div className="flex flex-col h-full bg-dark-bg overflow-y-auto">
      {/* Header */}
      <div className="text-center py-8 border-b border-dark-border">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl font-bold text-white">{avatarLetter}</span>
        </div>
        <h2 className="text-xl font-bold text-white">{user?.name || 'User'}</h2>
        <p className="text-dark-text-muted text-sm">{user?.email}</p>
      </div>

      {/* Stats */}
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center">
            <Loader className="w-6 h-6 text-primary spinner" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Total', value: stats?.total || 0, icon: '📊', color: 'text-primary' },
              { label: 'Done', value: stats?.completed || 0, icon: '✅', color: 'text-green-500' },
              { label: 'Failed', value: stats?.failed || 0, icon: '❌', color: 'text-red-500' }
            ].map(s => (
              <div key={s.label} className="bg-dark-card rounded-lg p-4 border border-dark-border text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
                <p className="text-lg font-bold text-white">{s.value}</p>
                <p className="text-xs text-dark-text-muted">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Admin Link */}
        {user?.is_admin && (
          <button
            onClick={() => navigation.navigate('Admin')}
            className="w-full flex items-center gap-3 p-4 bg-dark-card border border-dark-border rounded-lg text-primary-light hover:bg-dark-border transition-colors mb-4"
          >
            <Shield size={20} />
            <span className="flex-1 text-left font-semibold">Admin Dashboard</span>
            <span>→</span>
          </button>
        )}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 bg-red-900/20 hover:bg-red-900/30 border border-red-900 rounded-lg text-red-400 font-semibold transition-colors"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  )
}
