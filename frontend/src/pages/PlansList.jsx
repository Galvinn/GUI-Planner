import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export default function PlansList() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        setLoading(true)
        setError(null)
        const resp = await fetch('/api/plans')
        const data = await resp.json().catch(() => null)
        if (!resp.ok) throw new Error(data?.error || `Request failed: ${resp.status}`)
        if (!cancelled) setPlans(Array.isArray(data) ? data : [])
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load plans.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <p className="muted">Loading…</p>
  if (error) return <p className="error">{error}</p>

  return (
    <section className="section">
      <h2>All plans</h2>
      {plans.length === 0 ? (
        <div className="card">
          <p className="muted">No plans yet. Create one in the Planner.</p>
        </div>
      ) : (
        <div className="list">
          {plans.map((p) => (
            <Link key={p.id} to={`/plans/${p.id}`} className="list-item">
              <div className="list-title">#{p.id} — {p.goal}</div>
              <div className="list-meta">{p.model} · {p.created_at}</div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

