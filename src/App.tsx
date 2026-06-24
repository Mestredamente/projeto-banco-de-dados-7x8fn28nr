import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Layout from './components/Layout'
import IndexBase from './pages/Index'
import SecretaryDashboard from './components/dashboard/SecretaryDashboard'
import { useAuth } from './hooks/use-auth'

const Index = () => {
  const { user } = useAuth()
  if (user?.role === 'secretaria') return <SecretaryDashboard />
  return <IndexBase />
}
import PatientDashboard from './pages/patient/PatientDashboard'
import PatientAgenda from './pages/patient/PatientAgenda'
import PatientDiary from './pages/patient/PatientDiary'
import PatientFinancial from './pages/patient/PatientFinancial'
import PatientEvolutions from './pages/patient/PatientEvolutions'
import Login from './pages/Login'
import ConfirmAppointment from './pages/ConfirmAppointment'
import Signup from './pages/Signup'
import Agenda from './pages/Agenda'
import Patients from './pages/Patients'
import PatientProfile from './pages/PatientProfile'
import PatientForm from './pages/PatientForm'
import Clinics from './pages/Clinics'
import Financial from './pages/Financial'
import SessionNotes from './pages/SessionNotes'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import ClinicAdmin from './pages/ClinicAdmin'
import Secretaries from './pages/Secretaries'
import Referrals from './pages/Referrals'
import Supervisions from './pages/Supervisions'
import Academy from './pages/Academy'
import AcademyCourse from './pages/AcademyCourse'
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
          <Route path="/confirmar" element={<ConfirmAppointment />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/patient-portal" element={<PatientDashboard />} />
            <Route path="/patient-portal/agenda" element={<PatientAgenda />} />
            <Route path="/patient-portal/diary" element={<PatientDiary />} />
            <Route path="/patient-portal/financial" element={<PatientFinancial />} />
            <Route path="/patient-portal/evolutions" element={<PatientEvolutions />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/patients/new" element={<PatientForm />} />
            <Route path="/patients/:id" element={<PatientProfile />} />
            <Route path="/patients/:id/edit" element={<PatientForm />} />
            <Route path="/clinics" element={<Clinics />} />
            <Route path="/financeiro" element={<Financial />} />
            <Route path="/notes" element={<SessionNotes />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/secretaries" element={<Secretaries />} />
            <Route path="/clinic-admin" element={<ClinicAdmin />} />
            <Route path="/referrals" element={<Referrals />} />
            <Route path="/supervisions" element={<Supervisions />} />
            <Route path="/academy" element={<Academy />} />
            <Route path="/academy/:id" element={<AcademyCourse />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
