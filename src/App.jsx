import { useState } from 'react'
import { Routes, Route } from 'react-router'
import { AppContext } from './context/AppContext'
import AppShell from './components/layout/AppShell'
import ScheduleCalendar from './pages/ScheduleCalendar'
import CoachRoster from './pages/CoachRoster'
import DraftManager from './pages/DraftManager'
import { coaches as initialCoaches } from './data/coaches'
import { workshops as initialWorkshops } from './data/workshops'

export default function App() {
  const [coaches, setCoaches] = useState(initialCoaches)
  const [workshops, setWorkshops] = useState(initialWorkshops)

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
