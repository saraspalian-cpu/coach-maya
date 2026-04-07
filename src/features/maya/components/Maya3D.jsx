/**
 * Maya 3D Avatar
 * Humanoid features:
 *  - Auto-plays embedded animations from the GLB if any (idle/wave/talk/etc.)
 *  - Falls back to procedural breathing, head tilt, blinking
 *  - State-driven: idle | speaking | celebrating | urgent | sleeping | thinking
 *  - Lip-sync via mouth/jaw morph targets when present (oscillates while speaking)
 *  - Eye tracking toward cursor for "presence"
 *  - Color-coded glow ring
 */
import { Suspense, useRef, useEffect, useMemo, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, useAnimations, Environment, Bounds, Center, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

const STATE_GLOWS = {
  idle:        '#2DD4BF',
  speaking:    '#7db8e8',
  celebrating: '#FFD700',
  urgent:      '#EF4444',
  sleeping:    '#6b7f99',
  thinking:    '#A78BFA',
}

// Pick best-matching animation clip name for a state
function pickClip(names = [], state) {
  if (!names.length) return null
  const match = (keys) => names.find(n => keys.some(k => n.toLowerCase().includes(k)))
  switch (state) {
    case 'celebrating': return match(['jump', 'danc', 'cheer', 'celeb', 'happ', 'yes', 'agree', 'wave']) || match(['idle']) || names[0]
    case 'speaking':    return match(['talk', 'speak', 'wave', 'hello']) || match(['idle']) || names[0]
    case 'urgent':      return match(['afraid', 'scar', 'urgent', 'point', 'angr']) || match(['idle']) || names[0]
    case 'sleeping':    return match(['sleep', 'rest', 'sit']) || match(['idle']) || names[0]
    case 'thinking':    return match(['think', 'wonder', 'ponder']) || match(['idle']) || names[0]
    default:            return match(['idle', 'breath', 'stand']) || names[0]
  }
}

function Model({ state, mouseRef }) {
  const group = useRef()
  const { scene, animations } = useGLTF('/maya.glb')
  const { actions, names } = useAnimations(animations, group)

  // Discover head + jaw + morph targets once
  const rig = useMemo(() => {
    const out = { head: null, jaw: null, leftEye: null, rightEye: null, mouthMesh: null, mouthMorphIndex: -1 }
    scene.traverse((obj) => {
      const n = (obj.name || '').toLowerCase()
      if (!out.head && (n.includes('head') && obj.isBone)) out.head = obj
      if (!out.jaw && n.includes('jaw') && obj.isBone) out.jaw = obj
      if (!out.leftEye && (n.includes('lefteye') || n.includes('eye_l') || n.includes('eyeleft'))) out.leftEye = obj
      if (!out.rightEye && (n.includes('righteye') || n.includes('eye_r') || n.includes('eyeright'))) out.rightEye = obj
      if (obj.isMesh && obj.morphTargetDictionary) {
        const dict = obj.morphTargetDictionary
        const candidates = ['mouthOpen', 'mouth_open', 'jawOpen', 'jaw_open', 'viseme_aa', 'A', 'aa', 'open']
        for (const c of candidates) {
          if (dict[c] !== undefined) {
            out.mouthMesh = obj
            out.mouthMorphIndex = dict[c]
            return
          }
        }
      }
    })
    return out
  }, [scene])

  // Play the right clip when state changes
  useEffect(() => {
    if (!names.length) return
    const target = pickClip(names, state)
    if (!target || !actions[target]) return
    Object.values(actions).forEach(a => a && a !== actions[target] && a.fadeOut(0.3))
    actions[target].reset().fadeIn(0.3).play()
    actions[target].timeScale = state === 'celebrating' ? 1.4 : state === 'sleeping' ? 0.6 : 1
    return () => { actions[target]?.fadeOut(0.3) }
  }, [state, actions, names])

  const blinkRef = useRef({ next: 2, t: 0, closing: false })

  useFrame((three, delta) => {
    if (!group.current) return
    const t = three.clock.elapsedTime

    // Procedural fallback breathing if no animations exist
    if (!names.length) {
      group.current.position.y = Math.sin(t * 1.4) * 0.02
      group.current.rotation.z = Math.sin(t * 0.6) * 0.01
    }

    // Subtle base-rotation ambience (very slow)
    group.current.rotation.y += delta * (state === 'sleeping' ? 0.05 : 0.08)

    // Eye / head tracking toward mouse
    if (rig.head && mouseRef?.current) {
      const targetY = mouseRef.current.x * 0.2
      const targetX = -mouseRef.current.y * 0.15
      rig.head.rotation.y = THREE.MathUtils.lerp(rig.head.rotation.y || 0, targetY, 0.05)
      rig.head.rotation.x = THREE.MathUtils.lerp(rig.head.rotation.x || 0, targetX, 0.05)
    }

    // Blinking (procedural eyelid scale on eye meshes if available)
    blinkRef.current.t += delta
    if (blinkRef.current.t > blinkRef.current.next) {
      blinkRef.current.closing = true
    }
    if (rig.leftEye && rig.rightEye) {
      const target = blinkRef.current.closing ? 0.1 : 1
      rig.leftEye.scale.y = THREE.MathUtils.lerp(rig.leftEye.scale.y || 1, target, 0.4)
      rig.rightEye.scale.y = THREE.MathUtils.lerp(rig.rightEye.scale.y || 1, target, 0.4)
      if (blinkRef.current.closing && rig.leftEye.scale.y < 0.2) {
        blinkRef.current.closing = false
        blinkRef.current.t = 0
        blinkRef.current.next = 2 + Math.random() * 3
      }
    }

    // Lip sync — oscillate mouth morph or jaw bone while speaking
    const speaking = state === 'speaking'
    if (rig.mouthMesh && rig.mouthMorphIndex >= 0) {
      const target = speaking
        ? Math.abs(Math.sin(t * 18)) * 0.6 + Math.abs(Math.sin(t * 11)) * 0.3
        : 0
      const cur = rig.mouthMesh.morphTargetInfluences[rig.mouthMorphIndex] || 0
      rig.mouthMesh.morphTargetInfluences[rig.mouthMorphIndex] = THREE.MathUtils.lerp(cur, target, 0.4)
    } else if (rig.jaw) {
      const target = speaking ? Math.abs(Math.sin(t * 16)) * 0.25 : 0
      rig.jaw.rotation.x = THREE.MathUtils.lerp(rig.jaw.rotation.x || 0, target, 0.4)
    }

    // State-specific body motion overlay
    if (state === 'celebrating') {
      group.current.position.y = Math.abs(Math.sin(t * 6)) * 0.08
    } else if (state === 'urgent') {
      group.current.rotation.z = Math.sin(t * 12) * 0.04
    } else if (state === 'sleeping') {
      group.current.rotation.z = Math.sin(t * 0.8) * 0.03
    } else if (!names.length || state === 'idle' || state === 'speaking') {
      // gentle settle
      group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z || 0, 0, 0.05)
    }
  })

  return <primitive ref={group} object={scene} />
}

useGLTF.preload('/maya.glb')

function MouseTracker({ mouseRef }) {
  const { size } = useThree()
  useEffect(() => {
    const handler = (e) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      }
    }
    window.addEventListener('pointermove', handler)
    return () => window.removeEventListener('pointermove', handler)
  }, [size])
  return null
}

function GlowRing({ state }) {
  const color = STATE_GLOWS[state] || STATE_GLOWS.idle
  return (
    <mesh position={[0, -0.9, -0.5]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.9, 1.05, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.5} />
    </mesh>
  )
}

export default function MayaAvatar({ state = 'idle', size = 320 }) {
  const mouseRef = useRef({ x: 0, y: 0 })
  const glow = STATE_GLOWS[state] || STATE_GLOWS.idle

  return (
    <div
      style={{
        width: '100%',
        maxWidth: size,
        height: size,
        margin: '0 auto',
        position: 'relative',
        filter: `drop-shadow(0 6px 24px ${glow}55)`,
        transition: 'filter 400ms ease',
      }}
    >
      <Canvas
        camera={{ position: [0, 0.1, 5.4], fov: 30 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false }}
      >
        <color attach="background" args={['transparent']} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 4, 5]} intensity={1.4} />
        <directionalLight position={[-3, 2, -2]} intensity={0.6} color={glow} />
        <Suspense fallback={null}>
          <Bounds fit clip observe margin={1.05}>
            <Center disableY={false}>
              <Model state={state} mouseRef={mouseRef} />
            </Center>
          </Bounds>
          <Environment preset="studio" />
          <ContactShadows position={[0, -1.2, 0]} opacity={0.45} blur={2.6} scale={5} />
          <GlowRing state={state} />
        </Suspense>
        <MouseTracker mouseRef={mouseRef} />
      </Canvas>
    </div>
  )
}

export const STATES = {
  IDLE: 'idle',
  SPEAKING: 'speaking',
  CELEBRATING: 'celebrating',
  URGENT: 'urgent',
  SLEEPING: 'sleeping',
  THINKING: 'thinking',
}
