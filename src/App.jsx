import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router'
import { Toaster, toast } from 'sonner'
import { AppContext } from './context/AppContext'
import { getBrowserTimezone } from './utils/timezone'
import AppShell from './components/layout/AppShell'
import ScheduleCalendar from './pages/ScheduleCalendar'
import CoachRoster from './pages/CoachRoster'
import DraftManager from './pages/DraftManager'
import Login from './pages/Login'
import { coaches as initialCoaches } from './data/coaches'
import { workshops as initialWorkshops } from './data/workshops'

export default function App() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('authenticated') === 'true')
  const [coaches, setCoaches] = useState(initialCoaches)
  const [workshops, setWorkshops] = useState(initialWorkshops)
  const [filters, setFilters] = useState({
    coaches: [],
    types: [],
    statuses: [],
    markets: [],
  })
  const [highlightedIds, setHighlightedIds] = useState(new Set())
  const highlightTimer = useRef(null)
  const [userTimezone, setUserTimezone] = useState(() => localStorage.getItem('ww-tz') || getBrowserTimezone())

  useEffect(() => {
    localStorage.setItem('ww-tz', userTimezone)
  }, [userTimezone])

  const highlightWorkshops = useCallback((ids) => {
    if (highlightTimer.current) clearTimeout(highlightTimer.current)
    setHighlightedIds(new Set(ids))
    highlightTimer.current = setTimeout(() => setHighlightedIds(new Set()), 3500)
  }, [])

  function login() {
    sessionStorage.setItem('authenticated', 'true')
    setAuthed(true)
  }

  function logout() {
    sessionStorage.removeItem('authenticated')
    setAuthed(false)
  }

  const contextValue = useMemo(
    () => ({ coaches, setCoaches, workshops, setWorkshops, filters, setFilters, toast, logout, highlightedIds, highlightWorkshops, userTimezone, setUserTimezone }),
    [coaches, workshops, filters, highlightedIds, highlightWorkshops, userTimezone]
  )

  return (
    <AppContext.Provider value={contextValue}>
      <Toaster
        position="bottom-right"
        duration={3500}
        visibleToasts={3}
        expand={false}
        toastOptions={{
          style: {
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '14px',
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login onLogin={login} />} />
        <Route path="/*" element={
          authed ? (
            <AppShell>
              <Routes>
                <Route path="/" element={<ScheduleCalendar />} />
                <Route path="/roster" element={<CoachRoster />} />
                <Route path="/drafts" element={<DraftManager />} />
              </Routes>
            </AppShell>
          ) : (
            <Navigate to="/login" replace />
          )
        } />
      </Routes>
    </AppContext.Provider>
  )
}
