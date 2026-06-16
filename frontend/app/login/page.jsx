"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Activity, ShieldAlert, KeyRound, UserCheck, Shield, ChevronRight, UserPlus, FileText } from "lucide-react"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ParkWatchApi } from "@/services/api"

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState("login") // "login" or "register"
  
  // Form States
  const [officerId, setOfficerId] = useState("8092-BLR")
  const [password, setPassword] = useState("password123")
  const [name, setName] = useState("")
  const [precinct, setPrecinct] = useState("IND-BLR-SOUTH")
  
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      if (mode === "login") {
        if (!officerId.trim() || !password.trim()) {
          setError("All fields are required.")
          setLoading(false)
          return
        }

        const res = await ParkWatchApi.login(officerId.trim(), password)
        if (res.status === "success" || res.user) {
          setSuccess("Authentication granted! Redirecting...")
          // Write to local storage
          localStorage.setItem("isAuthenticated", "true")
          localStorage.setItem("officerId", res.user?.officer_id || officerId)
          localStorage.setItem("officerName", res.user?.name || "Officer Patil")
          localStorage.setItem("officerPrecinct", res.user?.precinct || precinct)
          
          setTimeout(() => {
            router.push("/")
          }, 800)
        } else {
          setError(res.message || "Failed to authenticate.")
        }
      } else {
        if (!officerId.trim() || !password.trim() || !name.trim() || !precinct.trim()) {
          setError("All fields are required.")
          setLoading(false)
          return
        }

        const res = await ParkWatchApi.register({
          officer_id: officerId.trim(),
          name: name.trim(),
          password: password,
          precinct: precinct.trim(),
          role: "officer"
        })

        if (res.status === "success") {
          setSuccess("Account successfully created! Please log in.")
          setTimeout(() => {
            setMode("login")
            setSuccess("")
            setPassword("")
          }, 1500)
        } else {
          setError(res.message || "Registration failed.")
        }
      }
    } catch (err) {
      setError("Server connection error. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#fafdfc] p-4 font-sans overflow-y-auto">
      {/* Soft Ambient Background Decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-50/40 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-50/30 blur-[100px]" />
      
      <Card className="relative w-full max-w-md bg-white border border-emerald-100/60 shadow-[0_8px_30px_rgb(5,150,105,0.04)] rounded-2xl z-10 overflow-hidden my-auto">
        {/* Brand Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600" />
        
        <CardHeader className="text-center pt-8 pb-5 px-6">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-center text-primary mb-3.5 shadow-sm">
            <Shield className="h-6 w-6 text-emerald-700" />
          </div>
          <CardTitle className="text-xl font-bold text-slate-800 tracking-tight">
            PARKWATCH <span className="text-emerald-700">AI</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-1">
            {mode === "login" 
              ? "Operational Hotspot Detection & Decision Interface" 
              : "Register New Operator Unit to Database"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-6 pb-8 pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs font-semibold rounded-xl flex items-center space-x-2 animate-shake">
                <ShieldAlert className="h-4.5 w-4.5 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl flex items-center space-x-2">
                <Activity className="h-4.5 w-4.5 shrink-0 text-emerald-600 animate-pulse" />
                <span>{success}</span>
              </div>
            )}

            {mode === "register" && (
              <div className="space-y-1">
                <label className="text-[10px] tracking-wider text-slate-500 uppercase font-bold">
                  Operator Full Name
                </label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Officer Patil"
                    className="w-full bg-slate-50/50 text-slate-800 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 focus:bg-white transition-all placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] tracking-wider text-slate-500 uppercase font-bold">
                Officer ID / Username
              </label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                <input 
                  type="text" 
                  value={officerId} 
                  onChange={(e) => setOfficerId(e.target.value)}
                  placeholder="e.g. 8092-BLR"
                  className="w-full bg-slate-50/50 text-slate-800 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 focus:bg-white transition-all placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            {mode === "register" && (
              <div className="space-y-1">
                <label className="text-[10px] tracking-wider text-slate-500 uppercase font-bold">
                  Precinct Region / Jurisdiction
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                  <input 
                    type="text" 
                    value={precinct} 
                    onChange={(e) => setPrecinct(e.target.value)}
                    placeholder="e.g. IND-BLR-SOUTH"
                    className="w-full bg-slate-50/50 text-slate-800 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 focus:bg-white transition-all placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] tracking-wider text-slate-500 uppercase font-bold">
                Passphrase Key
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50/50 text-slate-800 border border-slate-200 rounded-xl pl-10 pr-16 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 focus:bg-white transition-all placeholder:text-slate-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400 hover:text-emerald-700 cursor-pointer"
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-10 mt-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold tracking-wide cursor-pointer transition-all shadow-sm flex items-center justify-center space-x-1"
            >
              <span>
                {loading 
                  ? (mode === "login" ? "AUTHENTICATING UNIT..." : "REGISTERING UNIT...") 
                  : (mode === "login" ? "AUTHORIZE ACCESS" : "CREATE NEW ACCOUNT")}
              </span>
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Toggle Modes */}
            <div className="text-center mt-4 pt-1">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login")
                  setError("")
                  setSuccess("")
                }}
                className="text-xs text-emerald-700 hover:text-emerald-850 font-semibold cursor-pointer underline underline-offset-4"
              >
                {mode === "login" 
                  ? "Need to register a new Officer ID?" 
                  : "Already registered? Sign in here"}
              </button>
            </div>
          </form>
        </CardContent>
        
        {/* Footer */}
        <div className="bg-slate-50/50 border-t border-slate-100 py-3.5 text-center text-[10px] font-mono text-slate-400">
          SECURE DB CHANNEL • PRECINCT: BLR SOUTH
        </div>
      </Card>
    </div>
  )
}
