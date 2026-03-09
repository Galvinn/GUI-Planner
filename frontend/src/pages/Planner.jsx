import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const MODELS = [
  { value: 'glm-4.6v-flash', label: 'GLM-4.6V-Flash' },
  { value: 'gemma-3-4b-it', label: 'Gemma-3-4b-it' },
]

export default function Planner() {
  const [image, setImage] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [goal, setGoal] = useState('')
  const [model, setModel] = useState('glm-4.6v-flash')
  const [action, setAction] = useState(null)
  const [createdPlanId, setCreatedPlanId] = useState(null)
  const [feedbackGiven, setFeedbackGiven] = useState(false)
  const [showThanksPopup, setShowThanksPopup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImage(reader.result)
        setImageFile(file)
        setAction(null)
        setCreatedPlanId(null)
        setFeedbackGiven(false)
        setError(null)
      }
      reader.readAsDataURL(file)
    }
    e.target.value = ''
  }

  const handlePlan = async () => {
    if (!imageFile || !goal.trim()) {
      setError('Please upload an image and enter a goal.')
      return
    }
    setLoading(true)
    setError(null)
    setAction(null)
    setCreatedPlanId(null)
    setFeedbackGiven(false)
    try {
      const formData = new FormData()
      formData.append('image', imageFile)
      formData.append('goal', goal.trim())
      formData.append('model', model)

      const response = await fetch('/api/plans', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error || `Request failed: ${response.status}`)
      }

      setAction(data?.action ?? null)
      setCreatedPlanId(data?.id ?? null)
    } catch (err) {
      setError(err?.message || 'Failed to create plan.')
    } finally {
      setLoading(false)
    }
  }

  const handleFeedback = (isGood) => {
    console.log('User feedback:', isGood ? 'good' : 'bad')
    setFeedbackGiven(true)
    setShowThanksPopup(true)
    setTimeout(() => setShowThanksPopup(false), 2500)
  }

  return (
    <>
      <section className="section">
        <h2>Screenshot</h2>
        <div className="upload-area">
          {!image ? (
            <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
              Upload image
            </button>
          ) : (
            <div className="image-wrapper">
              <img src={image} alt="Screenshot preview" className="preview" />
              <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
                Upload another image
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>
      </section>

      <section className="section">
        <h2>Goal</h2>
        <input
          type="text"
          className="input"
          placeholder="e.g. open YouTube app"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handlePlan()}
        />
      </section>

      <section className="section section-inline">
        <h2>Model</h2>
        <select className="select" value={model} onChange={(e) => setModel(e.target.value)}>
          {MODELS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </section>

      <button className="btn btn-plan" onClick={handlePlan} disabled={loading}>
        {loading ? 'Planning…' : 'Plan'}
      </button>

      {error && <p className="error">{error}</p>}

      {action && (
        <section className="section action-section">
          <h2>Next action</h2>
          <div className="action-box">{action}</div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', alignItems: 'center' }}>
            {createdPlanId ? (
              <>
                <button className="btn btn-secondary" onClick={() => navigate(`/plans/${createdPlanId}`)}>
                  Open saved plan
                </button>
                <Link className="muted" to="/plans">
                  View all
                </Link>
              </>
            ) : (
              <span className="muted">Saved plan id missing from response.</span>
            )}
          </div>

          {!feedbackGiven && (
            <div className="feedback">
              <button className="btn btn-feedback btn-yes" onClick={() => handleFeedback(true)}>
                Yes
              </button>
              <button className="btn btn-feedback btn-no" onClick={() => handleFeedback(false)}>
                No
              </button>
            </div>
          )}
        </section>
      )}

      {showThanksPopup && (
        <div className="popup-overlay" role="alert">
          <div className="popup">Thanks for your feedback</div>
        </div>
      )}
    </>
  )
}

