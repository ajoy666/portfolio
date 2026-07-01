import { useQuery } from '@tanstack/react-query'
import {
  FolderKanban,
  Cpu,
  Link2,
  Mail,
  SquareChartGantt,
} from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader';
import { projectApi, skillApi, socialApi, contactApi } from '../../api/services'
import useAuthStore from '../../store/authStore'

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-4 lg:p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-white/30 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl lg:text-3xl font-bold text-white">
            {value ?? <span className="text-white/20 text-lg lg:text-xl">—</span>}
          </p>
        </div>
        <div className={`rounded-lg p-1.5 lg:p-2 ${accent}`}>
          <Icon size={14} className="text-white/70 lg:size-4" />
        </div>
      </div>
    </div>
  )
}

function getGreetingByLocalTime() {
  const hour = new Date().getHours()

  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 15) return 'Good afternoon'
  if (hour >= 15 && hour < 18) return 'Good evening'

  return 'Good night'
}

function getFirstName(user) {
  return (user?.name || 'there').trim().split(' ')[0]
}

export default function OverviewPage() {
  const { user } = useAuthStore()

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectApi.list().then((r) => r.data.data),
  })

  const { data: skills } = useQuery({
    queryKey: ['skills'],
    queryFn: () => skillApi.list().then((r) => r.data.data),
  })

  const { data: socials } = useQuery({
    queryKey: ['socials'],
    queryFn: () => socialApi.list().then((r) => r.data.data),
  })

  const { data: contacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => contactApi.list().then((r) => r.data.data),
  })

  const unread = contacts?.filter((c) => c.status === 'unread').length ?? 0
  const totalProjects = projects?.length ?? 0
  const totalSkills = skills?.reduce((acc, cat) => acc + (cat.skills?.length ?? 0), 0) ?? 0
  const totalSocialLinks = socials?.length ?? 0

  const greeting = getGreetingByLocalTime()
  const firstName = getFirstName(user)

  return (
    <div className="min-h-full">
      {/* Header */}
      <PageHeader
        icon={SquareChartGantt}
        title={`${greeting}, ${firstName} 👋`}
        description="Here's a quick overview of your portfolio content."
      />

      {/* Body */}
      <div className="px-6 py-8 lg:px-10">
        <div className="w-full">
          {/* Stats */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            <StatCard
              icon={FolderKanban}
              label="Projects"
              value={totalProjects}
              accent="bg-blue-500/10"
            />
            <StatCard icon={Cpu} label="Skills" value={totalSkills} accent="bg-emerald-500/10" />
            <StatCard
              icon={Link2}
              label="Social Links"
              value={totalSocialLinks}
              accent="bg-violet-500/10"
            />
            <StatCard icon={Mail} label="Unread Messages" value={unread} accent="bg-amber-500/10" />
          </div>

          {/* Recent Messages */}
          {contacts && contacts.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-4 text-sm font-medium text-white/50 uppercase tracking-wider">
                Recent Messages
              </h2>
              <div className="rounded-xl border border-white/[0.06] bg-[#111111] divide-y divide-white/[0.04]">
                {contacts.slice(0, 5).map((contact) => (
                  <div key={contact.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-xs font-semibold text-white uppercase">
                      {contact.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm text-white/80">{contact.name}</p>
                      <p className="truncate text-xs text-white/30">
                        {contact.subject || contact.message}
                      </p>
                    </div>
                    {contact.status === 'unread' && (
                      <span className="h-2 w-2 rounded-full bg-blue-400 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}