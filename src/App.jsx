import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MayaProvider } from './features/maya/context/MayaContext'
import CommandBar from './features/maya/components/CommandBar'
import AchievementModal from './features/maya/components/AchievementModal'
import { loadProfile } from './features/maya/lib/profile'

// Eager: dashboard (needed immediately)
import MayaDashboard from './features/maya/MayaDashboard'

// Lazy: everything else (shrinks initial bundle)
const MayaSchedule = lazy(() => import('./features/maya/MayaSchedule'))
const MayaProfile = lazy(() => import('./features/maya/MayaProfile'))
const MayaParent = lazy(() => import('./features/maya/MayaParent'))
const MayaLesson = lazy(() => import('./features/maya/MayaLesson'))
const MayaLessons = lazy(() => import('./features/maya/MayaLessons'))
const MayaMemory = lazy(() => import('./features/maya/MayaMemory'))
const MayaRitual = lazy(() => import('./features/maya/MayaRitual'))
const MayaGoals = lazy(() => import('./features/maya/MayaGoals'))
const Onboarding = lazy(() => import('./features/maya/Onboarding'))
const MayaHelp = lazy(() => import('./features/maya/MayaHelp'))

function Loading() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#060c18', color: '#2DD4BF',
      fontFamily: "'IBM Plex Mono', monospace", fontSize: 12,
    }}>
      loading...
    </div>
  )
}

function GatedRoutes() {
  const profile = loadProfile()
  const needsOnboarding = !profile.setupComplete
  const [cmdOpen, setCmdOpen] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCmdOpen(o => !o)
      }
      if (e.key === 'Escape') setCmdOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route
            path="/"
            element={needsOnboarding
              ? <Navigate to="/onboarding" replace />
              : <MayaDashboard onOpenSearch={() => setCmdOpen(true)} />}
          />
          <Route path="/schedule" element={<MayaSchedule />} />
          <Route path="/profile" element={<MayaProfile />} />
          <Route path="/parent" element={<MayaParent />} />
          <Route path="/lesson" element={<MayaLesson />} />
          <Route path="/lessons" element={<MayaLessons />} />
          <Route path="/memory" element={<MayaMemory />} />
          <Route path="/ritual" element={<MayaRitual />} />
          <Route path="/goals" element={<MayaGoals />} />
          <Route path="/help" element={<MayaHelp />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <CommandBar open={cmdOpen} onClose={() => setCmdOpen(false)} />
      <AchievementModal />
    </>
  )
}

export default function App() {
  return (
    <MayaProvider>
      <BrowserRouter>
        <GatedRoutes />
      </BrowserRouter>
    </MayaProvider>
  )
}
