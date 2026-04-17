/**
 * Reading Tracker — books Vasco reads, pages logged, rating.
 * Separate reading streak. Maya nudges daily reading.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const C = {
  bg: '#0a0a14', surface: 'rgba(255,255,255,0.04)', surfaceLight: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.12)', text: '#f0f0f5', muted: '#6b6b8a',
  dim: '#3a3a55', teal: '#2DD4BF', green: '#34D399', gold: '#FFD700', amber: '#FBBF24',
  mono: "'IBM Plex Mono', monospace", display: "'Bebas Neue', sans-serif",
}

const READING_KEY = 'maya_reading'
function loadReading() {
  try { return JSON.parse(localStorage.getItem(READING_KEY)) || { books: [], logs: [] } }
  catch { return { books: [], logs: [] } }
}
function saveReading(data) {
  try { localStorage.setItem(READING_KEY, JSON.stringify(data)) } catch {}
}

export default function MayaReading() {
  const navigate = useNavigate()
  const [data, setData] = useState(loadReading())
  const [adding, setAdding] = useState(false)
  const [logging, setLogging] = useState(null)
  const [form, setForm] = useState({})

  const persist = (next) => { setData(next); saveReading(next) }

  const addBook = () => {
    if (!form.title) return
    const book = {
      id: `book_${Date.now()}`, title: form.title,
      author: form.author || '', totalPages: parseInt(form.totalPages) || 0,
      pagesRead: 0, rating: 0, startedAt: new Date().toISOString(), finishedAt: null, status: 'reading',
    }
    persist({ ...data, books: [book, ...data.books] })
    setForm({}); setAdding(false)
  }

  const logPages = (bookId) => {
    const pages = parseInt(form.pages) || 0
    if (!pages) return
    const book = data.books.find(b => b.id === bookId)
    if (!book) return
    const newPagesRead = Math.min(book.pagesRead + pages, book.totalPages || 99999)
    const finished = book.totalPages && newPagesRead >= book.totalPages
    const updatedBooks = data.books.map(b =>
      b.id === bookId ? { ...b, pagesRead: newPagesRead, status: finished ? 'finished' : 'reading', finishedAt: finished ? new Date().toISOString() : null } : b
    )
    const log = { bookId, pages, date: new Date().toISOString() }
    persist({ books: updatedBooks, logs: [log, ...data.logs] })
    setForm({}); setLogging(null)
  }

  const rateBook = (bookId, rating) => {
    const updatedBooks = data.books.map(b => b.id === bookId ? { ...b, rating } : b)
    persist({ ...data, books: updatedBooks })
  }

  const removeBook = (id) => {
    if (!confirm('Remove this book?')) return
    persist({ books: data.books.filter(b => b.id !== id), logs: data.logs.filter(l => l.bookId !== id) })
  }

  const totalPages = data.logs.reduce((s, l) => s + (l.pages || 0), 0)
  const reading = data.books.filter(b => b.status === 'reading')
  const finished = data.books.filter(b => b.status === 'finished')

  // Reading streak: consecutive days with a log
  const logDays = new Set(data.logs.map(l => l.date.slice(0, 10)))
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i)
    if (logDays.has(d.toISOString().slice(0, 10))) streak++
    else break
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: C.mono, paddingBottom: 80 }}>
      <Header onBack={() => navigate('/')} />
      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          <Stat label="Books" value={data.books.length} color={C.teal} />
          <Stat label="Pages" value={totalPages} color={C.gold} />
          <Stat label="Streak" value={`${streak}d`} color={streak > 0 ? C.green : C.muted} />
        </div>

        {!adding && (
          <button onClick={() => { setAdding(true); setForm({}) }} style={btn}>+ Add book</button>
        )}

        {adding && (
          <div style={{ padding: 14, background: C.surfaceLight, borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 12 }}>
            <Inp label="Title" value={form.title || ''} onChange={v => setForm({...form, title: v})} />
            <Inp label="Author" value={form.author || ''} onChange={v => setForm({...form, author: v})} />
            <Inp label="Total pages" value={form.totalPages || ''} onChange={v => setForm({...form, totalPages: v})} type="number" />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setAdding(false)} style={secBtn}>Cancel</button>
              <button onClick={addBook} style={btn}>Save</button>
            </div>
          </div>
        )}

        {reading.length > 0 && (
          <>
            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 12 }}>Currently reading</div>
            {reading.map(b => (
              <BookCard key={b.id} book={b} onLog={() => { setLogging(b.id); setForm({}) }} onRate={(r) => rateBook(b.id, r)} onRemove={() => removeBook(b.id)} logging={logging === b.id} logForm={form} setLogForm={setForm} onSubmitLog={() => logPages(b.id)} onCancelLog={() => setLogging(null)} />
            ))}
          </>
        )}

        {finished.length > 0 && (
          <>
            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 }}>Finished</div>
            {finished.map(b => (
              <BookCard key={b.id} book={b} onRate={(r) => rateBook(b.id, r)} onRemove={() => removeBook(b.id)} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}

function BookCard({ book, onLog, onRate, onRemove, logging, logForm, setLogForm, onSubmitLog, onCancelLog }) {
  const pct = book.totalPages ? Math.round((book.pagesRead / book.totalPages) * 100) : 0
  return (
    <div style={{ padding: 14, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>📖 {book.title}</div>
          {book.author && <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{book.author}</div>}
        </div>
        <button onClick={onRemove} style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 14 }}>×</button>
      </div>
      {book.totalPages > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.muted, marginBottom: 4 }}>
            <span>{book.pagesRead} / {book.totalPages} pages</span>
            <span>{pct}%</span>
          </div>
          <div style={{ height: 6, background: C.dim, borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? C.gold : C.teal, transition: 'width 400ms' }} />
          </div>
        </div>
      )}
      {/* Rating */}
      <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
        {[1,2,3,4,5].map(r => (
          <button key={r} onClick={() => onRate(r)} style={{
            background: 'none', border: 'none', cursor: 'pointer', fontSize: 16,
            opacity: r <= book.rating ? 1 : 0.25,
          }}>⭐</button>
        ))}
      </div>
      {/* Log pages */}
      {book.status === 'reading' && !logging && (
        <button onClick={onLog} style={{ marginTop: 8, padding: '6px 12px', background: C.teal + '22', border: `1px solid ${C.teal}44`, borderRadius: 8, color: C.teal, fontSize: 10, fontFamily: C.mono, cursor: 'pointer' }}>
          + Log pages
        </button>
      )}
      {logging && (
        <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
          <input value={logForm.pages || ''} onChange={e => setLogForm({...logForm, pages: e.target.value})} placeholder="Pages read" type="number" style={{
            flex: 1, padding: '8px 10px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 11, fontFamily: C.mono, outline: 'none',
          }} />
          <button onClick={onSubmitLog} style={{ padding: '8px 12px', background: C.teal, border: 'none', borderRadius: 8, color: C.bg, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Save</button>
          <button onClick={onCancelLog} style={{ padding: '8px 10px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, fontSize: 10, cursor: 'pointer' }}>✕</button>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div style={{ padding: 14, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, textAlign: 'center' }}>
      <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color, marginTop: 2 }}>{value}</div>
    </div>
  )
}
function Inp({ label, value, onChange, type = 'text' }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>{label}</div>
      <input value={value} onChange={e => onChange(e.target.value)} type={type} style={{
        width: '100%', padding: '10px 12px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12, fontFamily: C.mono, outline: 'none', boxSizing: 'border-box',
      }} />
    </div>
  )
}
function Header({ onBack }) {
  return (
    <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, background: C.surface, display: 'flex', alignItems: 'center', gap: 12 }}>
      <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: C.muted, fontSize: 18, cursor: 'pointer', padding: 0 }}>←</button>
      <div style={{ fontFamily: C.display, fontSize: 22, color: C.teal, letterSpacing: 2 }}>READING</div>
    </div>
  )
}
const btn = { width: '100%', padding: '12px 18px', background: C.teal, color: C.bg, border: 'none', borderRadius: 12, fontSize: 13, fontFamily: C.mono, fontWeight: 700, cursor: 'pointer', marginBottom: 12 }
const secBtn = { flex: 1, padding: '12px 18px', background: 'transparent', color: C.muted, border: `1px solid ${C.border}`, borderRadius: 12, fontSize: 13, fontFamily: C.mono, cursor: 'pointer' }
