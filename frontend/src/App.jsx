import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './components/layout/DashboardLayout'

import LoginPage from './pages/auth/LoginPage'
import OverviewPage from './pages/dashboard/OverviewPage'
import AboutPage from './pages/dashboard/AboutPage'
import ExperiencePage from './pages/dashboard/ExperiencePage';
import ProjectsPage from './pages/dashboard/ProjectsPage'
import SkillsPage from './pages/dashboard/SkillsPage'
import SocialLinksPage from './pages/dashboard/SocialLinksPage'
import ContactsPage from './pages/dashboard/ContactsPage'
import CvPage from './pages/dashboard/CvPage';

const APP_NAME = ' CMS'

function Page({ title, children }) {
  useEffect(() => {
    document.title = title ? `${title} | ${APP_NAME}` : APP_NAME
  }, [title])

  return children
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route
            path="/login"
            element={
              <Page title="Login">
                <LoginPage />
              </Page>
            }
          />

          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={
                <Page title="Overview">
                  <OverviewPage />
                </Page>
              }
            />

            <Route
              path="about"
              element={
                <Page title="About">
                  <AboutPage />
                </Page>
              }
            />

            <Route
              path="projects"
              element={
                <Page title="Projects">
                  <ProjectsPage />
                </Page>
              }
            />

            <Route
              path="skills"
              element={
                <Page title="Skills">
                  <SkillsPage />
                </Page>
              }
            />

            <Route
              path="social"
              element={
                <Page title="Social Links">
                  <SocialLinksPage />
                </Page>
              }
            />

            <Route
              path="contacts"
              element={
                <Page title="Contacts">
                  <ContactsPage />
                </Page>
              }
            />

            <Route
              path="cv"
              element={
                <Page title="CV Generator">
                  <CvPage />
                </Page>
              }
            />

            <Route
              path="experience"
              element={
                <Page title="Experience">
                  <ExperiencePage />
                </Page>
              }
            />
          </Route>

          {/* Redirect fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}