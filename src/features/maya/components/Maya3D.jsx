import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Environment, Bounds, Center } from '@react-three/drei'

function Model() {
  const ref = useRef()
  const { scene } = useGLTF('/maya.glb')
  useFrame((_, d) => { if (ref.current) ref.current.rotation.y += d * 0.3 })
  return <primitive ref={ref} object={scene} />
}
useGLTF.preload('/maya.glb')

export default function MayaAvatar({ size = 500 }) {
  return (
    <div style={{ width: size, height: size, margin: '0 auto' }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 35 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 5, 5]} intensity={1.2} />
        <Suspense fallback={null}>
          <Bounds fit clip observe margin={1}><Center><Model /></Center></Bounds>
          <Environment preset="studio" />
        </Suspense>
      </Canvas>
    </div>
  )
}
export const STATES = { IDLE: 'idle', SPEAKING: 'speaking', CELEBRATING: 'celebrating', URGENT: 'urgent', SLEEPING: 'sleeping' }
