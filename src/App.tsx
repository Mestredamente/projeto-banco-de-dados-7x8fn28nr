import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Layout from './components/Layout'
import Index from './pages/Index'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Agenda from './pages/Agenda'
import Patients from './pages/Patients'
import PatientProfile from './pages/PatientProfile'
import PatientForm from './pages/PatientForm'
import Clinics from './pages/Clinics'
import SessionNotes from './pages/SessionNotes'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'
import { AuthProvider } from './hooks/use-auth'

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/patients/new" element={<PatientForm />} />
            <Route path="/patients/:id" element={<PatientProfile />} />
            <Route path="/patients/:id/edit" element={<PatientForm />} />
            <Route path="/clinics" element={<Clinics />} />
            <Route path="/notes" element={<SessionNotes />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
