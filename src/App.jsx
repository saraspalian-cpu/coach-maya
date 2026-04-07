import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MayaProvider } from './features/maya/context/MayaContext'
import MayaDashboard from './features/maya/MayaDashboard'
import MayaSchedule from './features/maya/MayaSchedule'

export default function App() {
  return (
    <MayaProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MayaDashboard />} />
          <Route path="/schedule" element={<MayaSchedule />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </MayaProvider>
  )
}
