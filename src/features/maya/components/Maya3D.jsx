import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Environment, ContactShadows } from '@react-three/drei'

function Model({ state }) {
  const ref = useRef()
  const { scene } = useGLTF('/maya.glb')
  useFrame((_, delta) => {
    if (!ref.current) return
    const t = performance.now() / 1000
    if (state === 'idle') ref.current.position.y = -1.5 + Math.sin(t * 1.5) * 0.03
    else if (state === 'celebrating') ref.current.position.y = -1.5 + Math.abs(Math.sin(t * 5)) * 0.15
    else if (state === 'urgent') ref.current.rotation.z = Math.sin(t * 8) * 0.05
    else if (state === 'sleeping') ref.current.position.y = -1.5 + Math.sin(t * 0.8) * 0.02
    else ref.current.position.y = -1.5
    ref.current.rotation.y += delta * 0.15
  })
  return <primitive ref={ref} object={scene} scale={2} position={[0, -1.5, 0]} />
}

useGLTF.preload('/maya.glb')

export default function MayaAvatar({ state = 'idle', size = 220 }) {
  const glow = state === 'urgent' ? '#EF4444' : state === 'celebrating' ? '#FFD700' : '#2DD4BF'
  return (
    <div style={{ width: size, height: size, margin: '0 auto', filter: 'drop-shadow(0 0 20px ' + glow + '55)' }}>
      <Canvas camera={{ position: [0, 0.3, 3.5], fov: 35 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 5, 5]} intensity={1.2} />
        <directionalLight position={[-3, 2, -2]} intensity={0.4} color={glow} />
        <Suspense fallback={null}>
          <Model state={state} />
          <Environment preset="studio" />
          <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={5} blur={2.5} />
        </Suspense>
      </Canvas>
    </div>
  )
}
export const STATES = { IDLE: 'idle', SPEAKING: 'speaking', CELEBRATING: 'celebrating', URGENT: 'urgent', SLEEPING: 'sleeping' }
