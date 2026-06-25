import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Layout from './components/Layout'
import IndexBase from './pages/Index'
import SecretaryDashboard from './components/dashboard/SecretaryDashboard'
import { ClinicHomeDashboard } from './components/dashboard/ClinicHomeDashboard'
import PatientDashboard from './pages/patient/PatientDashboard'
import PatientAgenda from './pages/patient/PatientAgenda'
import SaasAdmin from './pages/SaasAdmin'
import { SaasBlocker } from './components/saas/SaasBlocker'
import PatientDiary from './pages/patient/PatientDiary'
import PatientFinancial from './pages/patient/PatientFinancial'
import PatientEvolutions from './pages/patient/PatientEvolutions'
import PatientConsents from './pages/patient/PatientConsents'
import { PatientPortalGuard } from './components/patient/PatientPortalGuard'
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
import Research from './pages/Research'
import HelpManual from './pages/HelpManual'
import AiAlerts from './pages/AiAlerts'
import NotFound from './pages/NotFound'
import ListaGrupos from './pages/grupos/ListaGrupos'
import FormularioGrupo from './pages/grupos/FormularioGrupo'
import DetalhesGrupo from './pages/grupos/DetalhesGrupo'
import { AuthProvider } from './hooks/use-auth'
import { BrandingProvider } from './hooks/use-branding'
import { ProfileProvider, useProfile } from './hooks/use-profile'
import { RouteGuard } from './components/RouteGuard'
import { OnboardingGuard } from './components/OnboardingGuard'
import ClinicProfile from './pages/ClinicProfile'
import { SystemToastContainer } from '@/components/system'

const RootRedirect = () => {
  const { getHomeRoute, activeProfile } = useProfile()
  return <Navigate to={getHomeRoute(activeProfile?.id)} replace />
}

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <ProfileProvider>
        <BrandingProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <SystemToastContainer />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/confirmar" element={<ConfirmAppointment />} />

              <Route
                element={
                  <SaasBlocker>
                    <RouteGuard />
                  </SaasBlocker>
                }
              >
                <Route element={<OnboardingGuard />}>
                  <Route element={<Layout />}>
                    <Route path="/" element={<RootRedirect />} />

                    <Route element={<RouteGuard allowedModules={['dashboard']} />}>
                      <Route path="/dashboard" element={<IndexBase />} />
                    </Route>
                    <Route
                      element={<RouteGuard allowedModules={['gestao_clinica', 'dashboard']} />}
                    >
                      <Route path="/clinica/home" element={<ClinicHomeDashboard />} />
                    </Route>
                    <Route element={<RouteGuard allowedModules={['agenda', 'dashboard']} />}>
                      <Route path="/secretaria/home" element={<SecretaryDashboard />} />
                    </Route>
                    <Route element={<RouteGuard allowedModules={['gestao_assinantes']} />}>
                      <Route path="/gestao" element={<SaasAdmin />} />
                    </Route>

                    <Route element={<RouteGuard allowedModules={['paciente_portal']} />}>
                      <Route element={<PatientPortalGuard />}>
                        <Route path="/patient-portal" element={<PatientDashboard />} />
                        <Route path="/patient-portal/agenda" element={<PatientAgenda />} />
                        <Route path="/patient-portal/diary" element={<PatientDiary />} />
                        <Route path="/patient-portal/financial" element={<PatientFinancial />} />
                        <Route path="/patient-portal/evolutions" element={<PatientEvolutions />} />
                        <Route path="/patient-portal/consents" element={<PatientConsents />} />
                      </Route>
                    </Route>

                    <Route element={<RouteGuard allowedModules={['gestao_clinica']} />}>
                      <Route path="/clinic-profile" element={<ClinicProfile />} />
                      <Route path="/clinics" element={<Clinics />} />
                      <Route path="/clinic-admin" element={<ClinicAdmin />} />
                    </Route>

                    <Route element={<RouteGuard allowedModules={['agenda']} />}>
                      <Route path="/agenda" element={<Agenda />} />
                    </Route>

                    <Route element={<RouteGuard allowedModules={['pacientes']} />}>
                      <Route path="/patients" element={<Patients />} />
                      <Route path="/patients/new" element={<PatientForm />} />
                      <Route path="/patients/:id" element={<PatientProfile />} />
                      <Route path="/patients/:id/edit" element={<PatientForm />} />
                      <Route path="/referrals" element={<Referrals />} />
                      <Route path="/grupos" element={<ListaGrupos />} />
                      <Route path="/grupos/novo" element={<FormularioGrupo />} />
                      <Route path="/grupos/:id" element={<DetalhesGrupo />} />
                      <Route path="/grupos/:id/editar" element={<FormularioGrupo />} />
                    </Route>

                    <Route element={<RouteGuard allowedModules={['financeiro']} />}>
                      <Route path="/financeiro" element={<Financial />} />
                    </Route>

                    <Route element={<RouteGuard allowedModules={['prontuario']} />}>
                      <Route path="/notes" element={<SessionNotes />} />
                    </Route>

                    <Route element={<RouteGuard allowedModules={['relatorios']} />}>
                      <Route path="/reports" element={<Reports />} />
                    </Route>

                    <Route element={<RouteGuard allowedModules={['secretarias']} />}>
                      <Route path="/secretaries" element={<Secretaries />} />
                    </Route>

                    <Route element={<RouteGuard allowedModules={['supervisao']} />}>
                      <Route path="/supervisions" element={<Supervisions />} />
                    </Route>

                    <Route element={<RouteGuard allowedModules={['pd']} />}>
                      <Route path="/research" element={<Research />} />
                    </Route>

                    <Route element={<RouteGuard allowedModules={['academy']} />}>
                      <Route path="/academy" element={<Academy />} />
                      <Route path="/academy/:id" element={<AcademyCourse />} />
                    </Route>

                    <Route
                      element={<RouteGuard allowedModules={['dashboard', 'gestao_clinica']} />}
                    >
                      <Route path="/ai-alerts" element={<AiAlerts />} />
                    </Route>

                    <Route path="/settings" element={<Settings />} />
                    <Route path="/ajuda" element={<HelpManual />} />
                  </Route>
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </BrandingProvider>
      </ProfileProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
