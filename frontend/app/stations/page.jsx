"use client"

import React, { useEffect, useState } from "react"
import { ShieldAlert, BarChart3, TrendingUp, Clock } from "lucide-react"

import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ParkWatchApi, MOCK_STATIONS } from "@/services/api"

// Recharts imports
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

export default function PoliceStationPerformancePage() {
  const [stations, setStations] = useState(MOCK_STATIONS)
  const [loading, setLoading] = useState(false)

  const loadStations = async () => {
    setLoading(true)
    try {
      // Simulate endpoint fetch or fall back to mock data
      await new Promise(resolve => setTimeout(resolve, 300))
      setStations(MOCK_STATIONS)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStations()
  }, [])

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground font-mono">
          PRECINCT PERFORMANCE HEALTH
        </h2>
        <p className="text-xs text-muted-foreground">
          Leaderboard and response delay metrics tracking across traffic police station jurisdictions.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold font-mono">VIOLATIONS BY JURISDICTION</CardTitle>
            <CardDescription className="text-xs">Precinct volumes mapping active backlog loads</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stations} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="station" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <CartesianGrid stroke="#f2f6f4" strokeDasharray="3 3" vertical={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#dcfce7", borderRadius: "14px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.03)" }}
                  labelStyle={{ color: "#475569", fontFamily: "monospace" }}
                />
                <Bar dataKey="count" fill="#059669" radius={[4, 4, 0, 0]} name="Total Offences" />
                <Bar dataKey="active" fill="#ea580c" radius={[4, 4, 0, 0]} name="Active Backlog" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Side KPI Summary Card */}
        <Card className="flex flex-col justify-between border border-emerald-100/60 shadow-xs bg-white">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <ShieldAlert className="h-4.5 w-4.5 text-emerald-800" />
              <CardTitle className="text-sm font-bold font-mono text-slate-850">CRITICAL INCIDENT SECTOR</CardTitle>
            </div>
            <CardDescription className="text-xs">Jurisdiction with highest active backlog</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 flex flex-col justify-center">
            <div className="space-y-1">
              <span className="text-xs font-mono text-slate-400 uppercase font-bold">Highest Backlog Precinct</span>
              <h3 className="text-2xl font-mono font-bold text-slate-800">{stations[0]?.station || "N/A"}</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                Requires immediate asset reallocation. Average warden dispatch response times exceed standard SLAs by 10 minutes.
              </p>
            </div>
            
            <div className="p-3 bg-emerald-50/15 rounded-xl border border-emerald-100/60 space-y-1">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-500">Active Load:</span>
                <span className="text-emerald-800 font-bold">{stations[0]?.active || 0} incidents</span>
              </div>
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-500">Response Delay:</span>
                <span className="text-slate-800 font-semibold">{stations[0]?.avg_delay || 0} mins</span>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Station Leaderboard Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold font-mono">PRECINCT LEADERBOARD</CardTitle>
          <CardDescription className="text-xs">Jurisdictions ranked by violation volume and response efficiency</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-mono">Rank</TableHead>
                <TableHead className="font-mono">Precinct Name</TableHead>
                <TableHead className="font-mono">Total Violations Registered</TableHead>
                <TableHead className="font-mono">Active Backlog</TableHead>
                <TableHead className="font-mono">Avg Response Delay</TableHead>
                <TableHead className="text-right font-mono">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stations.map((row) => {
                const isCrit = row.avg_delay >= 24.0
                return (
                  <TableRow key={row.station}>
                    <TableCell className="font-mono font-bold text-primary">#{row.rank}</TableCell>
                    <TableCell className="font-semibold text-foreground">{row.station}</TableCell>
                    <TableCell className="font-mono">{row.count.toLocaleString()}</TableCell>
                    <TableCell className="font-mono font-semibold text-red-400">{row.active.toLocaleString()}</TableCell>
                    <TableCell className="font-mono flex items-center space-x-1">
                      <Clock className={`h-3.5 w-3.5 ${isCrit ? 'text-red-500' : 'text-slate-400'}`} />
                      <span className={isCrit ? 'text-red-500 font-bold' : ''}>{row.avg_delay.toFixed(1)}m</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={isCrit ? "destructive" : "success"}>
                        {isCrit ? "OVERLOADED" : "HEALTHY"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  )
}
