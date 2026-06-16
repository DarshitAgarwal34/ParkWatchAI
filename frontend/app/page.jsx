"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { 
  ShieldCheck, 
  Clock, 
  ShieldAlert, 
  CheckCircle, 
  ArrowUpRight, 
  TrendingUp, 
  Activity,
  Layers
} from "lucide-react"

import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ParkWatchApi, MOCK_SUMMARY, MOCK_HOTSPOTS } from "@/services/api"

// Dynamic import of Recharts to prevent SSR hydration mismatches in Next.js
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

const chartData = [
  { time: "08:00", active: 1400, resolved: 800 },
  { time: "10:00", active: 2800, resolved: 1400 },
  { time: "12:00", active: 3100, resolved: 2100 },
  { time: "14:00", active: 2600, resolved: 2300 },
  { time: "16:00", active: 2900, resolved: 2200 },
  { time: "18:00", active: 4200, resolved: 2900 },
  { time: "20:00", active: 3200, resolved: 3300 },
  { time: "22:00", active: 1800, resolved: 2500 }
]

export default function Dashboard() {
  const [summary, setSummary] = useState(MOCK_SUMMARY)
  const [hotspots, setHotspots] = useState(MOCK_HOTSPOTS)
  const [liveTickets, setLiveTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load summary and hotspots from API
    const loadData = async () => {
      try {
        const sum = await ParkWatchApi.getSummary()
        const spots = await ParkWatchApi.getHotspots()
        setSummary(sum)
        setHotspots(spots)
      } catch (e) {
        console.error("Failed to load operations summary", e)
      } finally {
        setLoading(false)
      }
    }
    loadData()

    // Simulate incoming real-time violations (simulated websocket stream)
    const mockLiveViolations = [
      { id: "INC-9082", plate: "KA03HA9876", type: "Double Parking", location: "Silk Board", risk: 92.5, time: "Just now" },
      { id: "INC-8104", plate: "KA05JK5543", type: "Bus Lane Block", location: "Hudson Circle", risk: 84.2, time: "2m ago" },
      { id: "INC-7761", plate: "KA51MC1234", type: "Obstruction", location: "ORR Kadubisanahalli", risk: 75.4, time: "5m ago" }
    ]
    setLiveTickets(mockLiveViolations)

    const interval = setInterval(() => {
      // Push new random mock ticket periodically
      const suffixes = ["HA", "MC", "ND", "EG"]
      const randomPlate = `KA0${Math.floor(Math.random() * 9) + 1}${suffixes[Math.floor(Math.random() * 4)]}${Math.floor(1000 + Math.random() * 9000)}`
      const locations = ["Silk Board", "Hudson Circle", "Marathahalli Bridge", "Koramangala 80ft Road"]
      const types = ["Double Parking", "Obstruction", "Footpath Parking", "No Parking Zone"]
      
      const newTicket = {
        id: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
        plate: randomPlate,
        type: types[Math.floor(Math.random() * 4)],
        location: locations[Math.floor(Math.random() * 4)],
        risk: Math.floor(40 + Math.random() * 55),
        time: "Just now"
      }
      setLiveTickets(prev => [newTicket, ...prev.slice(0, 4)])
    }, 8000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-emerald-100/50 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800 font-mono">
            OPERATIONAL OVERVIEW
          </h2>
          <p className="text-xs text-slate-500">
            Real-time incident dispatch logs and spatial congestion metrics.
          </p>
        </div>
        <div className="self-start sm:self-center">
          <Badge variant="success" className="animate-pulse bg-emerald-50 text-emerald-800 border border-emerald-250 font-mono text-[10px]">
            LIVE FEED ACTIVE
          </Badge>
        </div>
      </div>

      {/* KPI Cards Row - Responsive grid wrapping */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1 */}
        <Card className="border border-emerald-100/40 hover:shadow-md transition-all bg-white">
          <CardContent className="pt-5">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-bold">
                  Active Backlog
                </span>
                <h3 className="font-mono text-2xl font-bold text-red-600">
                  {summary.active_violations.toLocaleString()}
                </h3>
              </div>
              <div className="p-2.5 bg-red-50 text-red-700 rounded-xl border border-red-100">
                <ShieldAlert className="h-4.5 w-4.5 text-red-600" />
              </div>
            </div>
            <div className="mt-3.5 flex items-center space-x-1.5 text-[10px] text-slate-500">
              <TrendingUp className="h-3.5 w-3.5 text-red-650" />
              <span className="text-red-600 font-bold">+4.2%</span>
              <span>increase this hour</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2 */}
        <Card className="border border-emerald-100/40 hover:shadow-md transition-all bg-white">
          <CardContent className="pt-5">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-bold">
                  Resolved (24h)
                </span>
                <h3 className="font-mono text-2xl font-bold text-emerald-600">
                  {summary.resolved_violations.toLocaleString()}
                </h3>
              </div>
              <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                <CheckCircle className="h-4.5 w-4.5 text-emerald-750" />
              </div>
            </div>
            <div className="mt-3.5 flex items-center space-x-1.5 text-[10px] text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-bold">91.4%</span>
              <span>enforcement efficiency</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3 */}
        <Card className="border border-emerald-100/40 hover:shadow-md transition-all bg-white">
          <CardContent className="pt-5">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-bold">
                  Avg. Response Delay
                </span>
                <h3 className="font-mono text-2xl font-bold text-slate-800">
                  {summary.average_action_delay_mins.toFixed(1)}m
                </h3>
              </div>
              <div className="p-2.5 bg-slate-50 text-slate-600 rounded-xl border border-slate-200">
                <Clock className="h-4.5 w-4.5 text-slate-700" />
              </div>
            </div>
            <div className="mt-3.5 flex items-center space-x-1.5 text-[10px] text-slate-500">
              <span className="text-emerald-700 font-bold">-2.1m</span>
              <span>faster than yesterday</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4 */}
        <Card className="border border-emerald-100/40 hover:shadow-md transition-all bg-white">
          <CardContent className="pt-5">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-bold">
                  Peak Traffic Share
                </span>
                <h3 className="font-mono text-2xl font-bold text-amber-600">
                  {(summary.peak_hour_ratio * 100).toFixed(1)}%
                </h3>
              </div>
              <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
                <Layers className="h-4.5 w-4.5 text-amber-600" />
              </div>
            </div>
            <div className="mt-3.5 flex items-center space-x-1.5 text-[10px] text-slate-500">
              <span>Clustered in rush-hour bands</span>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Main Charts & Live Feed Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Analytics area chart */}
        <Card className="lg:col-span-2 border border-emerald-100/60 shadow-xs">
          <CardHeader className="p-4 md:p-6 pb-2">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <div>
                <CardTitle className="text-sm font-bold font-mono text-slate-800">CONGESTION OVERVIEW</CardTitle>
                <CardDescription className="text-xs">Violation ingestion curves vs resolution dispatch latency</CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-[10px] text-slate-500 self-start sm:self-center border-emerald-100 bg-emerald-50/20 text-emerald-800">
                SYSTEM DIAGNOSTICS
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="h-80 p-2 md:p-6 pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <CartesianGrid stroke="#f2f6f4" strokeDasharray="3 3" vertical={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "14px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.03)" }}
                  labelStyle={{ color: "#475569", fontFamily: "monospace" }}
                />
                <Area type="monotone" dataKey="active" stroke="#dc2626" strokeWidth={2.5} fillOpacity={1} fill="url(#activeGrad)" name="Active Backlog" />
                <Area type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#resolvedGrad)" name="Resolved Violations" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Real-time Ingestion Feed */}
        <Card className="border border-emerald-100/60 shadow-xs">
          <CardHeader className="p-4 md:p-6 pb-2">
            <div className="flex items-center space-x-2">
              <Activity className="h-4.5 w-4.5 text-emerald-700 animate-pulse shrink-0" />
              <CardTitle className="text-sm font-bold font-mono text-slate-800">LIVE FEED</CardTitle>
            </div>
            <CardDescription className="text-xs">Incoming violation alerts via CCTV OCR</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="flex flex-col space-y-3 h-[280px] overflow-y-auto pr-1">
              {liveTickets.map((ticket, index) => {
                let riskColor = "bg-emerald-50 text-emerald-700 border-emerald-100"
                if (ticket.risk > 80) riskColor = "bg-red-50 text-red-600 border-red-100"
                else if (ticket.risk > 60) riskColor = "bg-amber-50 text-amber-600 border-amber-100"

                return (
                  <div 
                    key={ticket.id + index} 
                    className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/5 transition-all shadow-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono text-xs font-bold text-slate-850">{ticket.plate}</span>
                        <Badge variant="outline" className="text-[9px] font-mono border-emerald-100 text-emerald-850 px-1 py-0">{ticket.type}</Badge>
                      </div>
                      <p className="text-[10px] text-slate-500 font-sans">{ticket.location} • {ticket.time}</p>
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border ${riskColor}`}>
                      {ticket.risk}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Critical Hotspots Grid - Responsive scrollable table */}
      <Card className="border border-emerald-100/60 shadow-xs">
        <CardHeader className="p-4 md:p-6 pb-2">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <CardTitle className="text-sm font-bold font-mono text-slate-800">CRITICAL SPATIAL HOTSPOTS</CardTitle>
              <CardDescription className="text-xs">Highest ranked parking violation clusters requiring physical routing</CardDescription>
            </div>
            <Link href="/map" className="self-start sm:self-center">
              <Button variant="outline" size="sm" className="font-mono text-xs hover:border-emerald-600 hover:text-emerald-700">
                <span>VIEW SPATIAL MAP</span>
                <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 font-mono text-xs">
              Loading active spatial clusters...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-emerald-50 bg-emerald-50/10">
                  <TableHead className="font-mono text-xs text-emerald-850 pl-4 md:pl-6">Rank</TableHead>
                  <TableHead className="font-mono text-xs text-emerald-850">Location Cluster</TableHead>
                  <TableHead className="font-mono text-xs text-emerald-850">Violation Density</TableHead>
                  <TableHead className="font-mono text-xs text-emerald-850">Repeat Offenders</TableHead>
                  <TableHead className="font-mono text-xs text-emerald-850">Dominant Offence</TableHead>
                  <TableHead className="font-mono text-xs text-emerald-850">Risk Score</TableHead>
                  <TableHead className="text-right font-mono text-xs text-emerald-850 pr-4 md:pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hotspots.slice(0, 4).map((hotspot) => {
                  const risk = hotspot.composite_rank_score
                  let riskBadge = <Badge className="bg-amber-50 text-amber-700 border border-amber-150 text-[10px] font-mono">{risk.toFixed(1)}</Badge>
                  if (risk >= 80) riskBadge = <Badge className="bg-rose-50 text-rose-700 border border-rose-150 text-[10px] font-mono">{risk.toFixed(1)}</Badge>
                  
                  return (
                    <TableRow key={hotspot.hotspot_id} className="hover:bg-slate-50/50">
                      <TableCell className="font-mono font-bold text-emerald-800 pl-4 md:pl-6">#{hotspot.rank}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-bold text-slate-800 text-xs">{hotspot.location}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{hotspot.hotspot_id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-slate-800 text-xs">{hotspot.violation_count}</div>
                        <div className="text-[10px] text-slate-400">{hotspot.cluster_size_km2.toFixed(3)} km² area</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-600">
                        {(hotspot.risk_inputs.repeat_vehicle_ratio * 100).toFixed(0)}%
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[9px] border-emerald-100 text-emerald-800 font-mono">{hotspot.risk_inputs.dominant_violation_type}</Badge>
                      </TableCell>
                      <TableCell>{riskBadge}</TableCell>
                      <TableCell className="text-right pr-4 md:pr-6">
                        <Link href={`/hotspots/${hotspot.hotspot_id}`}>
                          <Button variant="ghost" size="sm" className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50/50">Analyze</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
    </div>
  )
}
