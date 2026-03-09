import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

export default function PlanDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        setLoading(true)
        setError(null)
        const resp = await fetch(`/api/plans/${id}`)
        const data = await resp.json().catch(() => null)
        if (!resp.ok) throw new Error(data?.error || `Request failed: ${resp.status}`)
        if (!cancelled) setPlan(data)
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load plan.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [id])

  const imageSrc = useMemo(() => {
    if (!plan?.screenshot_base64 || !plan?.mime_type) return null
    return `data:${plan.mime_type};base64,${plan.screenshot_base64}`
  }, [plan])

  const handleDelete = async () => {
    if (!id) return
    setDeleting(true)
    try {
      const resp = await fetch(`/api/plans/${id}`, { method: 'DELETE' })
      const data = await resp.json().catch(() => null)
      if (!resp.ok) throw new Error(data?.error || `Delete failed: ${resp.status}`)
      navigate('/plans')
    } catch (e) {
      setError(e?.message || 'Failed to delete plan.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <p className="muted">Loading…</p>
  if (error) return <p className="error">{error}</p>
  if (!plan) return <p className="muted">Not found.</p>

  return (
    <section className="section">
      <h2>Plan #{plan.id}</h2>

      <div className="detail-grid">
        <div className="card">
          <div className="list-meta">Goal</div>
          <div className="list-title">{plan.goal}</div>

          <div style={{ height: '0.75rem' }} />

          <div className="list-meta">Model</div>
          <div className="list-title">{plan.model}</div>

          <div style={{ height: '0.75rem' }} />

          <div className="list-meta">Created</div>
          <div className="list-title">{plan.created_at}</div>

          <div style={{ height: '1rem' }} />

          <div className="list-meta">Action</div>
          <div className="action-box" style={{ marginTop: '0.5rem' }}>
            {plan.action}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', alignItems: 'center' }}>
            <Link className="nav-link" to="/plans">
              Back
            </Link>
            <button className="btn btn-no" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>

        <div className="card">
          <div className="list-meta">Stored screenshot</div>
          <div style={{ height: '0.5rem' }} />
          {imageSrc ? (
            <img src={imageSrc} alt="Stored screenshot" className="preview" style={{ maxHeight: '560px' }} />
          ) : (
            <p className="muted">No image data returned.</p>
          )}
        </div>
      </div>
    </section>
  )
}

