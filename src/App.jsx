import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MayaProvider } from './features/maya/context/MayaContext'
import MayaDashboard from './features/maya/MayaDashboard'
import MayaSchedule from './features/maya/MayaSchedule'
import MayaProfile from './features/maya/MayaProfile'
import MayaParent from './features/maya/MayaParent'
import MayaLesson from './features/maya/MayaLesson'
import Onboarding from './features/maya/Onboarding'
import { loadProfile } from './features/maya/lib/profile'

function GatedRoutes() {
  const profile = loadProfile()
  const needsOnboarding = !profile.setupComplete
  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/" element={needsOnboarding ? <Navigate to="/onboarding" replace /> : <MayaDashboard />} />
      <Route path="/schedule" element={<MayaSchedule />} />
      <Route path="/profile" element={<MayaProfile />} />
      <Route path="/parent" element={<MayaParent />} />
      <Route path="/lesson" element={<MayaLesson />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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
