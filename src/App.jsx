import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MayaProvider } from './features/maya/context/MayaContext'
import CommandBar from './features/maya/components/CommandBar'
import AchievementModal from './features/maya/components/AchievementModal'
import LiveLessonBanner from './features/maya/components/LiveLessonBanner'
import BottomNav from './features/maya/components/BottomNav'
import VoiceFab from './features/maya/components/VoiceFab'
import ErrorBoundary from './features/maya/components/ErrorBoundary'
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
const MayaShop = lazy(() => import('./features/maya/MayaShop'))
const MayaInsights = lazy(() => import('./features/maya/MayaInsights'))
const MayaJournal = lazy(() => import('./features/maya/MayaJournal'))
const MayaStory = lazy(() => import('./features/maya/MayaStory'))
const MayaFocus = lazy(() => import('./features/maya/MayaFocus'))
const MayaNews = lazy(() => import('./features/maya/MayaNews'))
const MayaHomework = lazy(() => import('./features/maya/MayaHomework'))
const MayaTennis = lazy(() => import('./features/maya/MayaTennis'))
const MayaReading = lazy(() => import('./features/maya/MayaReading'))
const MayaFlashcards = lazy(() => import('./features/maya/MayaFlashcards'))
const MayaScreenTime = lazy(() => import('./features/maya/MayaScreenTime'))
const MayaPiano = lazy(() => import('./features/maya/MayaPiano'))
const MayaRecords = lazy(() => import('./features/maya/MayaRecords'))
const MayaVocab = lazy(() => import('./features/maya/MayaVocab'))
const MayaExplain = lazy(() => import('./features/maya/MayaExplain'))
const MayaTimer = lazy(() => import('./features/maya/MayaTimer'))
const MayaHabits = lazy(() => import('./features/maya/MayaHabits'))
const MayaMathDrill = lazy(() => import('./features/maya/MayaMathDrill'))
const MayaTyping = lazy(() => import('./features/maya/MayaTyping'))

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
          <Route path="/" element={<MayaDashboard onOpenSearch={() => setCmdOpen(true)} />} />
          <Route path="/schedule" element={<MayaSchedule />} />
          <Route path="/profile" element={<MayaProfile />} />
          <Route path="/parent" element={<MayaParent />} />
          <Route path="/lesson" element={<MayaLesson />} />
          <Route path="/lessons" element={<MayaLessons />} />
          <Route path="/memory" element={<MayaMemory />} />
          <Route path="/ritual" element={<MayaRitual />} />
          <Route path="/goals" element={<MayaGoals />} />
          <Route path="/help" element={<MayaHelp />} />
          <Route path="/shop" element={<MayaShop />} />
          <Route path="/insights" element={<MayaInsights />} />
          <Route path="/journal" element={<MayaJournal />} />
          <Route path="/story" element={<MayaStory />} />
          <Route path="/focus" element={<MayaFocus />} />
          <Route path="/news" element={<MayaNews />} />
          <Route path="/homework" element={<MayaHomework />} />
          <Route path="/tennis" element={<MayaTennis />} />
          <Route path="/reading" element={<MayaReading />} />
          <Route path="/flashcards" element={<MayaFlashcards />} />
          <Route path="/screentime" element={<MayaScreenTime />} />
          <Route path="/piano" element={<MayaPiano />} />
          <Route path="/records" element={<MayaRecords />} />
          <Route path="/vocab" element={<MayaVocab />} />
          <Route path="/explain" element={<MayaExplain />} />
          <Route path="/timer" element={<MayaTimer />} />
          <Route path="/habits" element={<MayaHabits />} />
          <Route path="/mathdrill" element={<MayaMathDrill />} />
          <Route path="/typing" element={<MayaTyping />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <CommandBar open={cmdOpen} onClose={() => setCmdOpen(false)} />
      <AchievementModal />
      <LiveLessonBanner />
      <BottomNav />
      <VoiceFab />
    </>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <MayaProvider>
        <BrowserRouter>
          <GatedRoutes />
        </BrowserRouter>
      </MayaProvider>
    </ErrorBoundary>
  )
}
