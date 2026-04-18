/**
 * Trophy Room — Vasco's complete achievement history.
 * Pre-loaded from CV + user can add new ones.
 */
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

const C = {
  bg: '#0a0a14', surface: 'rgba(255,255,255,0.04)', surfaceLight: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.12)', glassBorder: 'rgba(255,255,255,0.14)',
  text: '#f0f0f5', muted: '#6b6b8a', dim: '#3a3a55',
  teal: '#2DD4BF', gold: '#FFD700', amber: '#FBBF24',
  green: '#34D399', red: '#F87171', blue: '#93C5FD',
  purple: '#A78BFA', pink: '#F472B6', orange: '#FB923C',
  glass: 'rgba(255,255,255,0.08)', blur: 'blur(20px)',
  mono: "'IBM Plex Mono', monospace", display: "'Bebas Neue', sans-serif",
}

const TROPHY_KEY = 'maya_trophies_custom'

const CATS = {
  math: { label: 'Math', icon: '🧮', color: C.blue },
  piano: { label: 'Piano', icon: '🎹', color: C.purple },
  tennis: { label: 'Tennis', icon: '🎾', color: C.green },
  coding: { label: 'Coding', icon: '💻', color: C.teal },
  speech: { label: 'Speech', icon: '🎤', color: C.pink },
  academic: { label: 'Academic', icon: '🎓', color: C.amber },
  music_theory: { label: 'Music Theory', icon: '🎵', color: C.purple },
  acting: { label: 'Acting', icon: '🎭', color: C.orange },
  other: { label: 'Other', icon: '🏅', color: C.muted },
}

const MEDAL = {
  gold: { emoji: '🥇', label: 'Gold', color: C.gold, rank: 1 },
  platinum: { emoji: '💎', label: 'Platinum', color: '#E5E4E2', rank: 0 },
  silver: { emoji: '🥈', label: 'Silver', color: '#C0C0C0', rank: 2 },
  bronze: { emoji: '🥉', label: 'Bronze', color: '#CD7F32', rank: 3 },
  distinction: { emoji: '⭐', label: 'Distinction', color: C.amber, rank: 2 },
  honour: { emoji: '🏅', label: 'Honour', color: C.purple, rank: 3 },
  merit: { emoji: '📜', label: 'Merit', color: C.teal, rank: 4 },
  laureate: { emoji: '🌿', label: 'Laureate', color: C.green, rank: 2 },
  finalist: { emoji: '🎯', label: 'Finalist', color: C.teal, rank: 4 },
  winner: { emoji: '🏆', label: 'Winner', color: C.gold, rank: 1 },
  scholarship: { emoji: '🎓', label: 'Scholarship', color: C.gold, rank: 1 },
  second: { emoji: '🥈', label: '2nd Prize', color: '#C0C0C0', rank: 2 },
  fourth: { emoji: '4️⃣', label: '4th Prize', color: C.muted, rank: 5 },
  special: { emoji: '✨', label: 'Special Mention', color: C.pink, rank: 3 },
  proficiency: { emoji: '📋', label: 'Proficiency', color: C.muted, rank: 5 },
  honourable: { emoji: '📜', label: 'Hon. Mention', color: C.teal, rank: 4 },
  participant: { emoji: '✓', label: 'Participated', color: C.dim, rank: 6 },
  semifinal: { emoji: '🎯', label: 'Semifinal', color: C.teal, rank: 4 },
  quarterfinal: { emoji: '🎯', label: 'Quarterfinal', color: C.teal, rank: 4 },
}

// ─── Pre-loaded achievements from CV ───
const CV_ACHIEVEMENTS = [
  // ── Math Olympiads ──
  { year: 2020, cat: 'math', name: 'Singapore Math Kangaroo Contest', result: 'bronze', grade: 'Grade 2' },
  { year: 2020, cat: 'math', name: 'American Mathematics Olympiad', result: 'bronze', grade: 'Grade 2' },
  { year: 2021, cat: 'math', name: 'Singapore & Asian Schools Math Olympiad', result: 'silver', grade: 'Grade 3' },
  { year: 2021, cat: 'math', name: 'Singapore Math Kangaroo Contest', result: 'bronze', grade: 'Grade 3' },
  { year: 2021, cat: 'math', name: 'SIMOC Mind Sports', result: 'silver', grade: 'Grade 3' },
  { year: 2022, cat: 'math', name: 'American Mathematics Olympiad', result: 'bronze', grade: 'Grade 4' },
  { year: 2022, cat: 'math', name: 'Singapore & Asian Schools Math Olympiad', result: 'gold', grade: 'Grade 4' },
  { year: 2022, cat: 'math', name: 'Singapore Math Kangaroo Contest', result: 'silver', grade: 'Grade 4' },
  { year: 2022, cat: 'math', name: 'International Junior Math Olympiad', result: 'bronze', grade: 'Grade 4' },
  { year: 2022, cat: 'math', name: 'ICAS Mathematics Assessment', result: 'distinction', grade: 'Grade 4' },
  { year: 2023, cat: 'math', name: 'Singapore Kangaroo Math Contest', result: 'bronze', grade: 'Grade 5' },
  { year: 2023, cat: 'math', name: 'Singapore & Asian Schools Math Olympiad', result: 'silver', grade: 'Grade 5' },
  { year: 2023, cat: 'math', name: 'American Mathematics Olympiad', result: 'bronze', grade: 'Grade 5' },
  { year: 2023, cat: 'math', name: 'Singapore Math Global Finals', result: 'honourable', grade: 'Grade 5' },
  { year: 2024, cat: 'math', name: 'SASMO Asian School Math Olympiad', result: 'bronze', grade: 'Grade 6' },
  { year: 2024, cat: 'math', name: 'Singapore Math Global Finals', result: 'honourable', grade: 'Grade 6' },
  { year: 2024, cat: 'math', name: 'Australian Mathematics Competition', result: 'proficiency', grade: 'Grade 6' },
  { year: 2024, cat: 'math', name: 'Singapore Math Challenge', result: 'honourable', grade: 'Grade 6' },
  { year: 2024, cat: 'math', name: 'Mustang Math Tournament — Individual', result: 'silver', grade: 'Grade 6' },
  { year: 2024, cat: 'math', name: 'American Mathematics Olympiad', result: 'bronze', grade: 'Grade 6' },
  { year: 2025, cat: 'math', name: 'International Math Competition, Round 1', result: 'gold', grade: 'Grade 7' },
  { year: 2025, cat: 'math', name: 'Singapore Math Global Final', result: 'bronze', grade: 'Grade 7' },
  { year: 2025, cat: 'math', name: 'Singapore & Asian Schools Math Olympiad', result: 'bronze', grade: 'Grade 7' },
  { year: 2025, cat: 'math', name: 'Singapore Kangaroo Math Competition', result: 'bronze', grade: 'Grade 7' },
  { year: 2025, cat: 'math', name: 'Mustang Math Global Solo Competition', result: 'gold', grade: 'Grade 7' },
  { year: 2025, cat: 'math', name: 'Australian Mathematics Competition', result: 'distinction', grade: 'Grade 7' },
  { year: 2025, cat: 'math', name: 'Singapore Math Challenge', result: 'bronze', grade: 'Grade 7' },
  // Grade 8 — current
  { year: 2025, cat: 'coding', name: 'Machine Learning I', result: 'participant', grade: 'Grade 7' },

  // ── Coding ──
  { year: 2023, cat: 'coding', name: 'Bebras Computational Thinking Challenge', result: 'bronze', grade: 'Grade 5' },
  { year: 2024, cat: 'coding', name: 'BEBRAS Coding Challenge', result: 'merit', grade: 'Grade 6' },
  { year: 2024, cat: 'coding', name: 'International STEM Olympiad — Coding', result: 'participant', grade: 'Grade 6' },
  { year: 2025, cat: 'coding', name: 'BEBRAS Coding Challenge', result: 'participant', grade: 'Grade 7' },
  { year: 2025, cat: 'coding', name: 'National Junior Informatics Olympiad', result: 'honourable', grade: 'Grade 7' },

  // ── Piano Performance ──
  { year: 2019, cat: 'piano', name: 'ABRSM Piano Grade 1', result: 'distinction', grade: '' },
  { year: 2021, cat: 'piano', name: 'ABRSM Piano Grade 2', result: 'distinction', grade: '' },
  { year: 2021, cat: 'piano', name: 'Mandeville Music Awards — Intermediate', result: 'silver', grade: '' },
  { year: 2022, cat: 'piano', name: 'ABRSM Piano Grade 3', result: 'distinction', grade: '' },
  { year: 2022, cat: 'piano', name: 'Lemagnifique Music Competitions', result: 'finalist', grade: '' },
  { year: 2022, cat: 'piano', name: 'Premia Int\'l Young Artist Music Festival', result: 'gold', grade: '' },
  { year: 2023, cat: 'piano', name: 'Best Classical Musicians Awards', result: 'silver', grade: 'Age 11-13' },
  { year: 2023, cat: 'piano', name: 'London Young Musician', result: 'silver', grade: 'Age 12 & Under' },
  { year: 2023, cat: 'piano', name: 'Int\'l Piano Competition Ad Libitum', result: 'laureate', grade: 'Junior & Beethoven' },
  { year: 2023, cat: 'piano', name: 'Medici Int\'l Music Competition', result: 'special', grade: 'Piano Junior' },
  { year: 2023, cat: 'piano', name: 'Beethoven Young Musician Competition', result: 'second', grade: '' },
  { year: 2023, cat: 'piano', name: 'Amadeus Int\'l Music Award', result: 'honour', grade: 'Intermediate' },
  { year: 2023, cat: 'piano', name: 'Euterpe Music Award', result: 'honour', grade: 'Young Piano A' },
  { year: 2023, cat: 'piano', name: 'BTHVN Wien Piano Competition', result: 'fourth', grade: 'Category 1' },
  { year: 2024, cat: 'piano', name: 'Clara Schumann Int\'l Piano Competition', result: 'honour', grade: 'Young Piano A' },
  { year: 2024, cat: 'piano', name: 'Birmingham Int\'l Music Competition', result: 'honourable', grade: '' },
  { year: 2024, cat: 'piano', name: 'European Summer Music Competition', result: 'platinum', grade: '' },
  { year: 2024, cat: 'piano', name: 'WPTA Singapore Int\'l Piano Competition', result: 'silver', grade: 'Junior 11-13' },
  { year: 2024, cat: 'piano', name: 'Joyeux Music Int\'l Singapore Festival', result: 'merit', grade: 'Rising Star III' },
  { year: 2024, cat: 'piano', name: 'Tiziano Lugano Piano Academy', result: 'scholarship', grade: '' },
  { year: 2024, cat: 'piano', name: 'American Classical Music Awards', result: 'special', grade: 'Piano' },
  { year: 2024, cat: 'piano', name: '4th Staccato Int\'l Piano & Violin Competition', result: 'second', grade: 'Piano 10-14' },
  { year: 2024, cat: 'piano', name: 'European Classical Virtuoso Award', result: 'silver', grade: 'Talent 11-13' },
  { year: 2024, cat: 'piano', name: 'European Winter Music Competition', result: 'gold', grade: 'Talent' },
  { year: 2024, cat: 'piano', name: 'Singapore World Piano Competition', result: 'silver', grade: 'Junior A' },
  { year: 2024, cat: 'piano', name: 'ABRSM Piano Grade 5', result: 'distinction', grade: '' },
  { year: 2025, cat: 'piano', name: '5th Staccato Int\'l Piano & Violin Competition', result: 'gold', grade: '' },
  { year: 2025, cat: 'piano', name: 'WPTA Singapore Int\'l Piano Competition', result: 'bronze', grade: 'Junior 11-13' },
  { year: 2025, cat: 'piano', name: 'ABRSM Piano Grade 6', result: 'distinction', grade: '' },

  // ── Music Theory ──
  { year: 2022, cat: 'music_theory', name: 'ABRSM Music Theory Grade 3', result: 'distinction', grade: '' },
  { year: 2024, cat: 'music_theory', name: 'ABRSM Music Theory Grade 5', result: 'distinction', grade: '' },

  // ── Tennis ──
  { year: 2022, cat: 'tennis', name: 'Spex Singapore Tennis Tournament U10', result: 'finalist', grade: '' },
  { year: 2023, cat: 'tennis', name: 'JTTL Tennis Tournament U12B', result: 'winner', grade: 'Team' },
  { year: 2023, cat: 'tennis', name: 'U12 Doubles Tennis Tournament', result: 'semifinal', grade: '' },
  { year: 2024, cat: 'tennis', name: 'Spex Singapore Tennis Tournament U12', result: 'finalist', grade: '' },
  { year: 2024, cat: 'tennis', name: 'JTTL Tennis Tournament U12 Red A', result: 'winner', grade: 'Team' },
  { year: 2024, cat: 'tennis', name: 'Pesta Sukan Tennis Tournament U12', result: 'finalist', grade: '' },
  { year: 2024, cat: 'tennis', name: 'Spex Singapore Tennis Tournament U14', result: 'participant', grade: '4th Round' },
  { year: 2025, cat: 'tennis', name: 'Spex Singapore Tennis Tournament U14', result: 'semifinal', grade: '' },
  { year: 2025, cat: 'tennis', name: 'ATF Tennis Tournament U14', result: 'quarterfinal', grade: '' },

  // ── Speech & Communication ──
  { year: 2019, cat: 'speech', name: 'Trinity Communication Skills — Entry Level 3', result: 'distinction', grade: '' },
  { year: 2022, cat: 'speech', name: 'Trinity Communication Skills Grade 3', result: 'distinction', grade: '' },
  { year: 2023, cat: 'speech', name: 'Trinity Communication Skills Grade 4', result: 'distinction', grade: '' },
  { year: 2025, cat: 'speech', name: 'Trinity Acting (Solo) Grade 4', result: 'merit', grade: '' },

  // ── Academic ──
  { year: 2020, cat: 'academic', name: 'CTY Honors Grade 4 Mathematics', result: 'distinction', grade: 'Grade A' },
  { year: 2021, cat: 'academic', name: 'CTY Honors Grade 5 Mathematics', result: 'distinction', grade: 'Grade A' },
  { year: 2022, cat: 'academic', name: 'CTY Honors Grade 6 Mathematics', result: 'distinction', grade: 'Grade A' },
  { year: 2023, cat: 'academic', name: 'CTY Honors Grade 7 Mathematics', result: 'distinction', grade: 'Grade A' },
  { year: 2024, cat: 'academic', name: 'CTY Honors Grade 8 Mathematics', result: 'distinction', grade: 'Grade A' },
  { year: 2025, cat: 'academic', name: 'CTY High School Competitive Math Prep', result: 'distinction', grade: 'Grade A' },
]

function loadCustom() {
  try { return JSON.parse(localStorage.getItem(TROPHY_KEY)) || [] } catch { return [] }
}
function saveCustom(data) {
  try { localStorage.setItem(TROPHY_KEY, JSON.stringify(data)) } catch {}
}

export default function MayaTrophyRoom() {
  const navigate = useNavigate()
  const [custom, setCustom] = useState(loadCustom())
  const [filterCat, setFilterCat] = useState('all')
  const [filterYear, setFilterYear] = useState('all')

  const allAchievements = useMemo(() => {
    const combined = [...CV_ACHIEVEMENTS, ...custom.map(c => ({ ...c, isCustom: true }))]
    return combined.sort((a, b) => b.year - a.year || a.name.localeCompare(b.name))
  }, [custom])

  const filtered = useMemo(() => {
    let list = allAchievements
    if (filterCat !== 'all') list = list.filter(a => a.cat === filterCat)
    if (filterYear !== 'all') list = list.filter(a => a.year === parseInt(filterYear))
    return list
  }, [allAchievements, filterCat, filterYear])

  const years = useMemo(() => [...new Set(allAchievements.map(a => a.year))].sort((a, b) => b - a), [allAchievements])

  // Stats
  const totalCount = allAchievements.length
  const goldCount = allAchievements.filter(a => ['gold', 'winner', 'platinum', 'scholarship'].includes(a.result)).length
  const silverCount = allAchievements.filter(a => ['silver', 'second', 'laureate'].includes(a.result)).length
  const bronzeCount = allAchievements.filter(a => a.result === 'bronze').length
  const distinctionCount = allAchievements.filter(a => a.result === 'distinction').length

  // By category counts
  const catCounts = {}
  allAchievements.forEach(a => { catCounts[a.cat] = (catCounts[a.cat] || 0) + 1 })

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', color: C.text, fontFamily: C.mono, paddingBottom: 80, position: 'relative' }}>
      {/* Ambient */}
      <div style={{ position: 'fixed', top: -40, left: -40, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,215,0,0.3) 0%, transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: 200, right: -60, width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.25) 0%, transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none', zIndex: 0 }} />

      <Header onBack={() => navigate('/')} />
      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Hero stats */}
        <div style={{
          textAlign: 'center', padding: 24,
          background: C.glass, backdropFilter: C.blur, WebkitBackdropFilter: C.blur,
          borderRadius: 20, border: `1px solid ${C.glassBorder}`, marginBottom: 16,
        }}>
          <div style={{ fontFamily: C.display, fontSize: 48, color: C.gold, lineHeight: 1 }}>{totalCount}</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>achievements & counting</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16 }}>
            <MedalStat emoji="🥇" count={goldCount} label="Gold" />
            <MedalStat emoji="🥈" count={silverCount} label="Silver" />
            <MedalStat emoji="🥉" count={bronzeCount} label="Bronze" />
            <MedalStat emoji="⭐" count={distinctionCount} label="Dist." />
          </div>
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 12, paddingBottom: 4 }}>
          <FilterPill label="All" active={filterCat === 'all'} onClick={() => setFilterCat('all')} count={totalCount} />
          {Object.entries(CATS).filter(([k]) => catCounts[k]).map(([k, v]) => (
            <FilterPill key={k} label={`${v.icon} ${v.label}`} active={filterCat === k} onClick={() => setFilterCat(k)} count={catCounts[k]} color={v.color} />
          ))}
        </div>

        {/* Year filter */}
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', marginBottom: 16, paddingBottom: 4 }}>
          <FilterPill label="All years" active={filterYear === 'all'} onClick={() => setFilterYear('all')} />
          {years.map(y => (
            <FilterPill key={y} label={String(y)} active={filterYear === String(y)} onClick={() => setFilterYear(String(y))} />
          ))}
        </div>

        {/* Results count */}
        <div style={{ fontSize: 10, color: C.muted, marginBottom: 8 }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </div>

        {/* Achievement list */}
        {filtered.map((a, i) => {
          const cat = CATS[a.cat] || CATS.other
          const medal = MEDAL[a.result] || { emoji: '✓', label: a.result, color: C.dim, rank: 6 }
          return (
            <div key={`${a.name}-${a.year}-${i}`} style={{
              padding: '12px 14px',
              background: C.glass, backdropFilter: C.blur, WebkitBackdropFilter: C.blur,
              borderRadius: 12, border: `1px solid ${C.glassBorder}`, marginBottom: 6,
              borderLeft: `3px solid ${medal.color}`,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{ fontSize: 22, flexShrink: 0 }}>{medal.emoji || cat.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>{a.name}</div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                  {a.year} {a.grade && `· ${a.grade}`} · <span style={{ color: medal.color }}>{medal.label}</span>
                </div>
              </div>
              <div style={{ fontSize: 14, flexShrink: 0 }}>{cat.icon}</div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: C.dim, fontSize: 12, marginTop: 32 }}>
            No achievements in this filter.
          </div>
        )}
      </div>
    </div>
  )
}

function MedalStat({ emoji, count, label }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 22 }}>{emoji}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{count}</div>
      <div style={{ fontSize: 8, color: C.muted, textTransform: 'uppercase' }}>{label}</div>
    </div>
  )
}

function FilterPill({ label, active, onClick, count, color }) {
  return (
    <button onClick={onClick} style={{
      flex: '0 0 auto', padding: '6px 12px',
      background: active ? (color || C.teal) + '18' : C.surface,
      border: `1px solid ${active ? (color || C.teal) + '55' : C.border}`,
      borderRadius: 20, color: active ? (color || C.teal) : C.muted,
      fontSize: 10, fontFamily: C.mono, cursor: 'pointer',
      whiteSpace: 'nowrap',
    }}>
      {label}{count !== undefined ? ` (${count})` : ''}
    </button>
  )
}

function Header({ onBack }) {
  return (
    <div style={{
      padding: '14px 16px', borderBottom: `1px solid ${C.glassBorder}`,
      background: C.glass, backdropFilter: C.blur, WebkitBackdropFilter: C.blur,
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: C.muted, fontSize: 18, cursor: 'pointer', padding: 0 }}>←</button>
      <div style={{ fontFamily: C.display, fontSize: 22, color: C.gold, letterSpacing: 2 }}>TROPHY ROOM</div>
    </div>
  )
}
