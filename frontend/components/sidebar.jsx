"use client"

import React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  LayoutDashboard, 
  Map, 
  AlertOctagon, 
  FileSpreadsheet, 
  ShieldAlert, 
  Users, 
  BarChart3, 
  Activity,
  LogOut,
  X
} from "lucide-react"

export function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname()
  const router = useRouter()
  
  const navItems = [
    { name: "Command Center", path: "/", icon: LayoutDashboard },
    { name: "Hotspot Map", path: "/map", icon: Map },
    { name: "Recommendations", path: "/recommendations", icon: AlertOctagon },
    { name: "Violation Records", path: "/records", icon: FileSpreadsheet },
    { name: "Precinct Health", path: "/stations", icon: ShieldAlert },
    { name: "Repeat Offenders", path: "/offenders", icon: Users },
    { name: "Analytics", path: "/analytics", icon: BarChart3 },
  ]

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("officerId")
    localStorage.removeItem("officerName")
    localStorage.removeItem("officerPrecinct")
    router.push("/login")
    if (onClose) onClose()
  }

  return (
    <>
      {/* Backdrop overlay for mobile drawer */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] z-40 md:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar Aside Panel */}
      <aside className={`w-64 bg-white border-r border-slate-200 h-screen fixed md:sticky top-0 left-0 flex flex-col justify-between p-4 z-50 shadow-sm shrink-0 transition-transform duration-300 ease-in-out md:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col space-y-6">
          {/* Logo & Close Button Container */}
          <div className="flex items-center justify-between px-2 pt-1">
            <div className="flex items-center space-x-2.5">
              <Activity className="h-5.5 w-5.5 text-emerald-600 animate-pulse" />
              <span className="font-mono text-base font-bold tracking-tight text-slate-800">
                PARKWATCH <span className="text-emerald-600">AI</span>
              </span>
            </div>
            {/* Close trigger for drawer layout */}
            <button 
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg md:hidden cursor-pointer transition-colors"
              aria-label="Close navigation sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          {/* Navigation links */}
          <nav className="flex flex-col space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.path
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => { if (onClose) onClose() }}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive 
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm" 
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-transparent"
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-slate-100 pt-4 flex flex-col space-y-2">
          <button 
            type="button"
            onClick={handleLogout}
            className="flex items-center space-x-3 px-3 py-2 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg text-sm font-medium transition-all cursor-pointer border border-transparent hover:border-red-100 mb-1 shadow-sm"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>Logout Portal</span>
          </button>
          <div className="flex items-center space-x-2 px-2 text-slate-500">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-wide uppercase">OCR SYNC: ONLINE</span>
          </div>
          <p className="text-[9px] font-mono text-slate-400/80 px-2">v1.1.0 (SQL Aggregations)</p>
        </div>
      </aside>
    </>
  )
}
export default Sidebar
