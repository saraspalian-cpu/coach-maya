import { useState, useEffect, useRef } from 'react'

/**
 * Maya Avatar — Animated SVG character
 * States: idle, speaking, celebrating, urgent, sleeping
 * No external assets needed.
 */

const STATES = {
  IDLE: 'idle',
  SPEAKING: 'speaking',
  CELEBRATING: 'celebrating',
  URGENT: 'urgent',
  SLEEPING: 'sleeping',
}

export default function MayaAvatar({ state = 'idle', size = 200, message = '' }) {
  const [blinkOpen, setBlinkOpen] = useState(true)
  const [mouthFrame, setMouthFrame] = useState(0)
  const [bounceY, setBounceY] = useState(0)
  const [sparkles, setSparkles] = useState([])
  const frameRef = useRef(0)

  // Blink cycle
  useEffect(() => {
    if (state === STATES.SLEEPING) return
    const blink = () => {
      setBlinkOpen(false)
      setTimeout(() => setBlinkOpen(true), 150)
    }
    const interval = setInterval(blink, 3000 + Math.random() * 2000)
    return () => clearInterval(interval)
  }, [state])

  // Speaking mouth animation
  useEffect(() => {
    if (state !== STATES.SPEAKING) { setMouthFrame(0); return }
    const interval = setInterval(() => {
      setMouthFrame(f => (f + 1) % 4)
    }, 120)
    return () => clearInterval(interval)
  }, [state])

  // Idle breathing / bounce
  useEffect(() => {
    let raf
    const animate = () => {
      frameRef.current += 0.02
      const base = Math.sin(frameRef.current) * 3
      const extra = state === STATES.CELEBRATING ? Math.sin(frameRef.current * 4) * 6 : 0
      setBounceY(base + extra)
      raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [state])

  // Sparkles for celebrating
  useEffect(() => {
    if (state !== STATES.CELEBRATING) { setSparkles([]); return }
    const interval = setInterval(() => {
      setSparkles(prev => {
        const next = [...prev, {
          id: Date.now(),
          x: 30 + Math.random() * 140,
          y: 20 + Math.random() * 100,
          size: 4 + Math.random() * 8,
        }]
        return next.slice(-8)
      })
    }, 300)
    return () => clearInterval(interval)
  }, [state])

  const s = size
  const cx = s / 2
  const headR = s * 0.22
  const bodyTop = cx + headR * 0.85

  // Colors
  const skinTone = '#F4C28C'
  const skinShadow = '#E8A86C'
  const hairColor = '#5C3A1E'
  const hairHighlight = '#7A4E2A'
  const shirtColor = '#3AAA6D'
  const shirtShadow = '#2D8A56'
  const jeansColor = '#4A7AB5'
  const jeansShadow = '#3A6294'
  const shoeColor = '#F5F5F5'
  const eyeColor = '#2C1810'
  const cheekColor = '#F0907A'
  const mouthColor = '#C75050'

  // Glow ring color based on state
  const glowColor = state === STATES.URGENT ? '#EF4444'
    : state === STATES.CELEBRATING ? '#FFD700'
    : state === STATES.SPEAKING ? '#2DD4BF'
    : '#2DD4BF'

  const glowSpeed = state === STATES.URGENT ? '0.8s' : state === STATES.CELEBRATING ? '1s' : '3s'

  // Eye state
  const eyeScaleY = blinkOpen ? 1 : 0.1
  const eyeStyle = state === STATES.SLEEPING ? 0.05 : eyeScaleY

  // Mouth shapes
  const mouthShapes = {
    idle: `M${cx - 8},${cx + headR * 0.35} Q${cx},${cx + headR * 0.5} ${cx + 8},${cx + headR * 0.35}`,
    speaking: [
      `M${cx - 7},${cx + headR * 0.32} Q${cx},${cx + headR * 0.55} ${cx + 7},${cx + headR * 0.32}`,
      `M${cx - 9},${cx + headR * 0.35} Q${cx},${cx + headR * 0.42} ${cx + 9},${cx + headR * 0.35}`,
      `M${cx - 6},${cx + headR * 0.3} Q${cx},${cx + headR * 0.6} ${cx + 6},${cx + headR * 0.3}`,
      `M${cx - 8},${cx + headR * 0.35} Q${cx},${cx + headR * 0.45} ${cx + 8},${cx + headR * 0.35}`,
    ],
    celebrating: `M${cx - 10},${cx + headR * 0.3} Q${cx},${cx + headR * 0.6} ${cx + 10},${cx + headR * 0.3}`,
    sleeping: `M${cx - 6},${cx + headR * 0.38} Q${cx},${cx + headR * 0.35} ${cx + 6},${cx + headR * 0.38}`,
  }

  const currentMouth = state === STATES.SPEAKING
    ? mouthShapes.speaking[mouthFrame]
    : state === STATES.CELEBRATING
    ? mouthShapes.celebrating
    : state === STATES.SLEEPING
    ? mouthShapes.sleeping
    : mouthShapes.idle

  return (
    <div style={{
      width: s,
      height: s + 20,
      position: 'relative',
      margin: '0 auto',
    }}>
      <svg
        width={s}
        height={s}
        viewBox={`0 0 ${s} ${s}`}
        style={{
          transform: `translateY(${bounceY}px)`,
          transition: 'transform 0.1s ease-out',
          filter: `drop-shadow(0 4px 12px rgba(45, 212, 191, 0.2))`,
        }}
      >
        <defs>
          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Soft shadow */}
          <filter id="shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* ─── Glow Ring ─── */}
        <circle
          cx={cx}
          cy={cx}
          r={s * 0.44}
          fill="none"
          stroke={glowColor}
          strokeWidth="2"
          opacity="0.4"
          style={{
            animation: `mayaPulse ${glowSpeed} ease-in-out infinite`,
          }}
        />
        <circle
          cx={cx}
          cy={cx}
          r={s * 0.47}
          fill="none"
          stroke={glowColor}
          strokeWidth="1"
          opacity="0.15"
          style={{
            animation: `mayaPulse ${glowSpeed} ease-in-out infinite`,
            animationDelay: '0.5s',
          }}
        />

        {/* ─── Body / T-shirt ─── */}
        <g filter="url(#shadow)">
          {/* Torso */}
          <path
            d={`M${cx - 22},${bodyTop} Q${cx - 26},${bodyTop + 35} ${cx - 18},${bodyTop + 45} L${cx + 18},${bodyTop + 45} Q${cx + 26},${bodyTop + 35} ${cx + 22},${bodyTop}`}
            fill={shirtColor}
          />
          {/* Shirt shadow */}
          <path
            d={`M${cx - 5},${bodyTop + 10} Q${cx},${bodyTop + 30} ${cx + 8},${bodyTop + 45} L${cx - 8},${bodyTop + 45} Q${cx - 3},${bodyTop + 25} ${cx - 5},${bodyTop + 10}`}
            fill={shirtShadow}
            opacity="0.3"
          />
          {/* Sleeves */}
          <ellipse cx={cx - 26} cy={bodyTop + 12} rx={8} ry={11} fill={shirtColor} />
          <ellipse cx={cx + 26} cy={bodyTop + 12} rx={8} ry={11} fill={shirtColor} />
          {/* Arms (skin) */}
          <ellipse cx={cx - 30} cy={bodyTop + 25} rx={5} ry={9} fill={skinTone} />
          <ellipse cx={cx + 30} cy={bodyTop + 25} rx={5} ry={9} fill={skinTone} />
          {/* Hands */}
          <circle cx={cx - 30} cy={bodyTop + 35} r={5} fill={skinTone} />
          <circle cx={cx + 30} cy={bodyTop + 35} r={5} fill={skinTone} />
        </g>

        {/* ─── Jeans ─── */}
        <g filter="url(#shadow)">
          <path
            d={`M${cx - 18},${bodyTop + 44} L${cx - 20},${bodyTop + 68} L${cx - 6},${bodyTop + 68} L${cx - 2},${bodyTop + 44}`}
            fill={jeansColor}
          />
          <path
            d={`M${cx + 2},${bodyTop + 44} L${cx + 6},${bodyTop + 68} L${cx + 20},${bodyTop + 68} L${cx + 18},${bodyTop + 44}`}
            fill={jeansColor}
          />
          {/* Jean shadow line */}
          <line x1={cx} y1={bodyTop + 44} x2={cx} y2={bodyTop + 55} stroke={jeansShadow} strokeWidth="1.5" opacity="0.4" />
        </g>

        {/* ─── Shoes ─── */}
        <ellipse cx={cx - 13} cy={bodyTop + 70} rx={9} ry={5} fill={shoeColor} />
        <ellipse cx={cx + 13} cy={bodyTop + 70} rx={9} ry={5} fill={shoeColor} />
        <ellipse cx={cx - 13} cy={bodyTop + 71} rx={9} ry={3} fill="#E0E0E0" />
        <ellipse cx={cx + 13} cy={bodyTop + 71} rx={9} ry={3} fill="#E0E0E0" />

        {/* ─── Neck ─── */}
        <rect x={cx - 6} y={cx + headR * 0.7} width={12} height={10} rx={3} fill={skinTone} />

        {/* ─── Head ─── */}
        <g filter="url(#shadow)">
          <circle cx={cx} cy={cx} r={headR} fill={skinTone} />
          {/* Face shadow */}
          <ellipse cx={cx + 5} cy={cx + headR * 0.2} rx={headR * 0.6} ry={headR * 0.8} fill={skinShadow} opacity="0.15" />
        </g>

        {/* ─── Hair ─── */}
        <g>
          {/* Main hair mass */}
          <ellipse cx={cx} cy={cx - headR * 0.55} rx={headR * 0.9} ry={headR * 0.55} fill={hairColor} />
          {/* Curly volume - top */}
          <circle cx={cx - 12} cy={cx - headR * 0.85} r={9} fill={hairColor} />
          <circle cx={cx + 5} cy={cx - headR * 0.9} r={10} fill={hairColor} />
          <circle cx={cx + 16} cy={cx - headR * 0.75} r={8} fill={hairColor} />
          <circle cx={cx - 18} cy={cx - headR * 0.65} r={7} fill={hairColor} />
          {/* Side hair */}
          <ellipse cx={cx - headR * 0.85} cy={cx - headR * 0.1} rx={7} ry={14} fill={hairColor} />
          <ellipse cx={cx + headR * 0.85} cy={cx - headR * 0.1} rx={7} ry={14} fill={hairColor} />
          {/* Highlight curls */}
          <circle cx={cx - 6} cy={cx - headR * 0.88} r={5} fill={hairHighlight} opacity="0.5" />
          <circle cx={cx + 12} cy={cx - headR * 0.82} r={4} fill={hairHighlight} opacity="0.4" />
        </g>

        {/* ─── Eyes ─── */}
        <g>
          {/* Left eye */}
          <ellipse
            cx={cx - 10}
            cy={cx - headR * 0.05}
            rx={5.5}
            ry={6.5}
            fill="white"
          />
          <ellipse
            cx={cx - 9}
            cy={cx - headR * 0.03}
            rx={3.5}
            ry={3.5 * eyeStyle}
            fill={eyeColor}
          />
          {/* Eye shine */}
          {blinkOpen && state !== STATES.SLEEPING && (
            <circle cx={cx - 8} cy={cx - headR * 0.08} r={1.5} fill="white" />
          )}

          {/* Right eye */}
          <ellipse
            cx={cx + 10}
            cy={cx - headR * 0.05}
            rx={5.5}
            ry={6.5}
            fill="white"
          />
          <ellipse
            cx={cx + 11}
            cy={cx - headR * 0.03}
            rx={3.5}
            ry={3.5 * eyeStyle}
            fill={eyeColor}
          />
          {/* Eye shine */}
          {blinkOpen && state !== STATES.SLEEPING && (
            <circle cx={cx + 12} cy={cx - headR * 0.08} r={1.5} fill="white" />
          )}

          {/* Sleeping Z's */}
          {state === STATES.SLEEPING && (
            <g style={{ animation: 'mayaFloat 2s ease-in-out infinite' }}>
              <text x={cx + 25} y={cx - 20} fontSize="12" fill="#7db8e8" fontFamily="var(--font-mono)" opacity="0.8">z</text>
              <text x={cx + 35} y={cx - 32} fontSize="9" fill="#7db8e8" fontFamily="var(--font-mono)" opacity="0.5">z</text>
              <text x={cx + 42} y={cx - 40} fontSize="7" fill="#7db8e8" fontFamily="var(--font-mono)" opacity="0.3">z</text>
            </g>
          )}
        </g>

        {/* ─── Cheeks ─── */}
        <ellipse cx={cx - 16} cy={cx + headR * 0.2} rx={5} ry={3.5} fill={cheekColor} opacity="0.35" />
        <ellipse cx={cx + 16} cy={cx + headR * 0.2} rx={5} ry={3.5} fill={cheekColor} opacity="0.35" />

        {/* ─── Nose ─── */}
        <ellipse cx={cx} cy={cx + headR * 0.15} rx={3} ry={2.5} fill={skinShadow} opacity="0.4" />

        {/* ─── Mouth ─── */}
        <path
          d={currentMouth}
          fill={state === STATES.SPEAKING || state === STATES.CELEBRATING ? mouthColor : 'none'}
          stroke={mouthColor}
          strokeWidth={1.5}
          strokeLinecap="round"
          style={{ transition: 'all 0.08s ease' }}
        />

        {/* ─── Celebrating Sparkles ─── */}
        {sparkles.map(sp => (
          <g key={sp.id} style={{ animation: 'mayaSparkle 0.8s ease-out forwards' }}>
            <text x={sp.x} y={sp.y} fontSize={sp.size} fill="#FFD700">✦</text>
          </g>
        ))}

        {/* ─── Urgent pulse rings ─── */}
        {state === STATES.URGENT && (
          <>
            <circle cx={cx} cy={cx} r={s * 0.42} fill="none" stroke="#EF4444" strokeWidth="1.5" opacity="0.3"
              style={{ animation: 'mayaRipple 1.5s ease-out infinite' }} />
            <circle cx={cx} cy={cx} r={s * 0.42} fill="none" stroke="#EF4444" strokeWidth="1" opacity="0.2"
              style={{ animation: 'mayaRipple 1.5s ease-out infinite', animationDelay: '0.5s' }} />
          </>
        )}
      </svg>

      {/* ─── CSS Animations ─── */}
      <style>{`
        @keyframes mayaPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.15; transform: scale(1.03); }
        }
        @keyframes mayaFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes mayaSparkle {
          0% { opacity: 1; transform: scale(0.5) translateY(0); }
          100% { opacity: 0; transform: scale(1.5) translateY(-20px); }
        }
        @keyframes mayaRipple {
          0% { r: ${s * 0.42}; opacity: 0.4; }
          100% { r: ${s * 0.52}; opacity: 0; }
        }
      `}</style>
    </div>
  )
}

export { STATES }
