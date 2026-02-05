import { NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { LogOut, Ticket, ListChecks, Calculator, Settings as Cog, UserCog } from 'lucide-react'
import { receptionApi } from '../../utils/api'

type Item = { to: string; label: string; icon: any; end?: boolean }

const nav: Item[] = [
  { to: '/reception/token-generator', label: 'Token Generator', icon: Ticket },
  { to: "/reception/today-tokens", label: "Today's Tokens", icon: ListChecks },
  { to: '/reception/ipd-billing', label: 'IPD Billing', icon: Ticket },
  { to: '/reception/ipd-transactions', label: 'Recent IPD Payments', icon: ListChecks },
  { to: '/reception/diagnostic/token-generator', label: 'Diagnostic Token Generator', icon: Ticket },
  { to: '/reception/diagnostic/sample-tracking', label: 'Diagnostic Sample Tracking', icon: ListChecks },
  { to: '/reception/lab/sample-intake', label: 'Lab Sample Intake', icon: Ticket },
  { to: '/reception/lab/sample-tracking', label: 'Lab Sample Tracking', icon: ListChecks },
  { to: '/reception/lab/manager-cash-count', label: ' Manager Cash Count', icon: Calculator },
  { to: '/reception/sidebar-permissions', label: 'Sidebar Permissions', icon: Cog },
  { to: '/reception/user-management', label: 'User Management', icon: UserCog },
]

export const receptionSidebarNav = nav

export default function Reception_Sidebar({ collapsed = false }: { collapsed?: boolean }){
  const navigate = useNavigate()
  const width = collapsed ? 'md:w-16' : 'md:w-64'
  const [role, setRole] = useState<string>('receptionist')
  const [username, setUsername] = useState<string>('')
  const [items, setItems] = useState<Item[]>(nav)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('reception.user') || localStorage.getItem('reception.session')
      if (raw) {
        const u = JSON.parse(raw)
        if (u?.role) setRole(String(u.role).toLowerCase())
        if (u?.username) setUsername(String(u.username))
      }
    } catch {}
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res: any = await (receptionApi as any).listSidebarPermissions?.(role)
        const doc = Array.isArray(res) ? res[0] : res
        const map = new Map<string, any>()
        const perms = (doc?.permissions || []) as Array<{ path: string; visible?: boolean; order?: number }>
        for (const p of perms) map.set(p.path, p)
        const isAdmin = String(role || '').toLowerCase() === 'admin'
        const computed = nav
          .filter(item => {
            if (item.to === '/reception/sidebar-permissions' && !isAdmin) return false
            const perm = map.get(item.to)
            return perm ? perm.visible !== false : true
          })
          .sort((a, b) => {
            const oa = map.get(a.to)?.order ?? Number.MAX_SAFE_INTEGER
            const ob = map.get(b.to)?.order ?? Number.MAX_SAFE_INTEGER
            if (oa !== ob) return oa - ob
            const ia = nav.findIndex(n => n.to === a.to)
            const ib = nav.findIndex(n => n.to === b.to)
            return ia - ib
          })
        if (mounted) setItems(computed)
      } catch {
        if (mounted) setItems(nav)
      }
    })()
    return () => { mounted = false }
  }, [role])

  async function logout(){
    try { await receptionApi.logout() } catch {}
    try { localStorage.removeItem('reception.token'); localStorage.removeItem('token'); localStorage.removeItem('reception.user'); localStorage.removeItem('reception.session') } catch {}
    navigate('/reception/login')
  }
  return (
    <aside
      className={`hidden md:flex ${width} md:flex-col md:border-r md:text-white`}
      style={{ background: 'linear-gradient(180deg, var(--navy) 0%, var(--navy-700) 100%)', borderColor: 'rgba(255,255,255,0.12)' }}
    >
      <div className="h-16 px-4 flex items-center border-b" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
        {!collapsed && <div className="font-semibold">Reception</div>}
        <div className={`ml-auto text-xs opacity-80 ${collapsed?'hidden':''}`}>{username || 'front desk'}</div>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {items.map((it)=>{
          const Icon = it.icon
          return (
            <NavLink key={it.to} to={it.to} end={it.end}
              className={({ isActive }) => `rounded-md px-3 py-2 text-sm font-medium flex items-center ${collapsed?'justify-center gap-0':'gap-2'} ${isActive ? 'bg-white/10 text-white' : 'text-white/80 hover:bg-white/5'}`}
              title={collapsed ? it.label : undefined}
            >
              <Icon className="h-4 w-4" />
              {!collapsed && <span>{it.label}</span>}
            </NavLink>
          )
        })}
      </nav>
      <div className="p-3">
        <button onClick={logout} className="w-full inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium" style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.14)' }}>
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>
    </aside>
  )
}
