import { useState } from 'react'
import { Routes, Route } from 'react-router'
import { AppContext } from './context/AppContext'
import AppShell from './components/layout/AppShell'
import ScheduleCalendar from './pages/ScheduleCalendar'
import CoachRoster from './pages/CoachRoster'
import DraftManager from './pages/DraftManager'

export default function App() {
  const [coaches, setCoaches] = useState([])
  const [workshops, setWorkshops] = useState([])

  return (
    <AppContext.Provider value={{ coaches, setCoaches, workshops, setWorkshops }}>
      <AppShell>
        <Routes>
          <Route path="/" element={<ScheduleCalendar />} />
          <Route path="/roster" element={<CoachRoster />} />
          <Route path="/drafts" element={<DraftManager />} />
        </Routes>
      </AppShell>
    </AppContext.Provider>
  )
}
