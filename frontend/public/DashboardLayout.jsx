import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import {
  LayoutDashboard,
  FolderKanban,
  Cpu,
  Link2,
  Mail,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/dashboard/about', icon: User, label: 'About & CV' },
  { to: '/dashboard/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/dashboard/skills', icon: Cpu, label: 'Skills' },
  { to: '/dashboard/social', icon: Link2, label: 'Social Links' },
  { to: '/dashboard/contacts', icon: Mail, label: 'Contacts' },
]

export default function DashboardLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a] font-sans overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 flex w-60 flex-col
          border-r border-white/[0.06] bg-[#111111]
          transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 border-b border-white/[0.06] px-5">
          <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg bg-white">
            <img
              src="/favicon.svg"
              alt="Portfolio CMS"
              className="h-5 w-5 object-contain"
            />
          </div>

          <span className="text-sm font-semibold tracking-tight text-white">
            Ideas into Reality - CMS
          </span>
          <button
            className="ml-auto text-white/30 hover:text-white lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150 group
                ${isActive
                  ? 'bg-white/[0.08] text-white font-medium'
                  : 'text-white/40 hover:bg-white/[0.04] hover:text-white/80'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={15} strokeWidth={isActive ? 2.5 : 1.8} />
                  <span>{label}</span>
                  {isActive && (
                    <ChevronRight size={13} className="ml-auto opacity-40" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-white/[0.06] p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white uppercase">
              {user?.name?.[0] ?? 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-medium text-white/80">
                {user?.name ?? 'Admin'}
              </p>
              <p className="truncate text-[10px] text-white/30">
                {user?.email ?? ''}
              </p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="text-white/20 hover:text-red-400 transition-colors"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar — mobile only */}
        <header className="flex h-14 items-center gap-4 border-b border-white/[0.06] bg-[#111111] px-5 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white/40 hover:text-white"
          >
            <Menu size={18} />
          </button>
          <span className="text-sm font-semibold text-white">
            Portfolio CMS
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}