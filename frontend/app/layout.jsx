"use client"

import React, { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import "./globals.css"
import Sidebar from "@/components/sidebar"
import { Cpu, Bell, Shield, Menu } from "lucide-react"

export default function RootLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated") === "true"
    if (!isAuth && pathname !== "/login") {
      router.push("/login")
    } else if (isAuth && pathname === "/login") {
      router.push("/")
    } else {
      setAuthChecked(true)
    }
  }, [pathname, router])

  // Close mobile drawer on route navigation
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [pathname])

  // If auth state is not yet checked, render a clean loading spinner to avoid layout flash
  if (!authChecked && pathname !== "/login") {
    return (
      <html lang="en">
        <body className="flex items-center justify-center bg-slate-50 h-screen font-mono text-xs text-slate-500">
          <div className="flex flex-col items-center space-y-2">
            <div className="h-5 w-5 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
            <span>VERIFYING CREDENTIALS...</span>
          </div>
        </body>
      </html>
    )
  }

  // Standalone Login page layout (no sidebar or header)
  if (pathname === "/login") {
    return (
      <html lang="en">
        <body className="antialiased bg-slate-50">
          <main>{children}</main>
        </body>
      </html>
    )
  }

  return (
    <html lang="en">
      <body className="antialiased flex bg-slate-50 text-slate-900 h-screen overflow-hidden font-sans">
        {/* Sidebar Navigation */}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        {/* Main Work Area */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
          
          {/* Header */}
          <header className="h-14 border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 md:px-6 flex items-center justify-between z-30 shrink-0 shadow-sm">
            <div className="flex items-center space-x-3">
              {/* Hamburger Toggle Button (mobile only) */}
              <button 
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg md:hidden cursor-pointer border border-slate-200 transition-colors"
                aria-label="Open navigation sidebar"
              >
                <Menu className="h-4 w-4" />
              </button>
              <h1 className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-black">
                OPERATIONS CENTER
              </h1>
              <div className="h-4 w-px bg-slate-200 hidden sm:block" />
              <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-600 font-semibold hidden sm:inline-block">
                PRECINCT REGION: IND-BLR-SOUTH
              </span>
            </div>
            
            <div className="flex items-center space-x-3 md:space-x-4">
              {/* CPU status mock indicator (hidden on mobile) */}
              <div className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                <Cpu className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
                <span>INFERENCE: 14ms</span>
              </div>
              
              {/* Alert Indicator */}
              <button className="relative p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer transition-colors">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
              </button>
              
              {/* User profile info mock */}
              <div className="flex items-center space-x-2">
                <div className="h-7 w-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-xs font-mono font-bold text-emerald-700 shadow-sm">
                  OP
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-bold leading-none text-slate-800">Officer Patil</span>
                  <span className="text-[10px] font-mono text-slate-400 mt-0.5">Precinct ID: 8092-BLR</span>
                </div>
              </div>
            </div>
          </header>
          
          {/* Scrollable Page Canvas */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 relative">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
