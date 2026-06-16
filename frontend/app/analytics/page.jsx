"use client"

import React, { useEffect, useState } from "react"
import { BarChart3, TrendingUp, Clock, AlertTriangle, ShieldCheck, Filter, RefreshCw, ChevronRight } from "lucide-react"

import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ParkWatchApi } from "@/services/api"

// Recharts imports
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts"

// Elegant sage/emerald green palette for premium branding
const GREEN_SHADES = ["#064e3b", "#0f766e", "#10b981", "#34d399", "#a7f3d0"]

export default function AnalyticsPage() {
  const [selectedStation, setSelectedStation] = useState("")
  const [selectedVehicleType, setSelectedVehicleType] = useState("")
  const [hourlyData, setHourlyData] = useState([])
  const [typesData, setTypesData] = useState({ violation_type_distribution: [], vehicle_type_distribution: [] })
  const [loading, setLoading] = useState(true)

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const filters = {}
      if (selectedStation) filters.police_station = selectedStation
      if (selectedVehicleType) filters.vehicle_type = selectedVehicleType

      const hourly = await ParkWatchApi.getHourlyAnalytics(filters)
      const types = await ParkWatchApi.getTypeBreakdowns(filters)
      
      setHourlyData(hourly)
      setTypesData(types)
    } catch (e) {
      console.error("Failed to load database analytics", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [selectedStation, selectedVehicleType])

  const stations = ["Madivala", "HAL Old Airport", "Cubbon Park", "Indiranagar", "Whitefield"]
  const vehicleTypes = ["CAR", "MOTOR CYCLE", "TRUCK / BUS", "AUTO RICKSHAW"]

  // High-value insights list
  const insights = [
    { metric: "Double Parking", impact: "High", trend: "+3.2%", details: "Primary bottleneck in Silk Board peak hour blockages." },
    { metric: "Pedestrian Encroachment", impact: "Medium", trend: "-1.8%", details: "Footpath parking decreasing in Cubbon Park due to active warden patrol loops." },
    { metric: "Commuter Rush-Hour Peak", impact: "Critical", trend: "+5.1%", details: "Commuter flow delays rise between 08:30 and 10:30 AM." }
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b border-emerald-100/50 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800 font-mono">
            OPERATIONAL INTELLIGENCE
          </h2>
          <p className="text-xs text-slate-500">
            Real-time analytics engine tracking temporal congestion trends, offence categories, and jurisdictional compliance.
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadAnalytics} 
          className="font-mono text-xs hover:border-emerald-600 hover:text-emerald-700 self-start md:self-center"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          <span>RELOAD REPORT</span>
        </Button>
      </div>

      {/* Filter panel */}
      <Card className="border border-emerald-100/40 bg-emerald-50/10 shadow-xs">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex items-center space-x-2 shrink-0 self-start sm:self-center text-emerald-800 text-xs font-bold font-mono">
            <Filter className="h-4 w-4 text-emerald-700" />
            <span>FILTER INDEX:</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
            {/* Station dropdown */}
            <select 
              value={selectedStation} 
              onChange={(e) => setSelectedStation(e.target.value)}
              className="w-full bg-white text-slate-800 border border-emerald-100 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-700 transition-all cursor-pointer"
            >
              <option value="">ALL PRECINCTS</option>
              {stations.map(s => (
                <option key={s} value={s}>{s.toUpperCase()}</option>
              ))}
            </select>

            {/* Vehicle Type dropdown */}
            <select 
              value={selectedVehicleType} 
              onChange={(e) => setSelectedVehicleType(e.target.value)}
              className="w-full bg-white text-slate-800 border border-emerald-100 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-700 transition-all cursor-pointer"
            >
              <option value="">ALL VEHICLE CLASSES</option>
              {vehicleTypes.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Executive stats card matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-emerald-50/20 border-emerald-100/50 shadow-xs">
          <CardContent className="p-4 flex items-center space-x-4">
            <div className="p-3 bg-emerald-100/60 text-emerald-700 rounded-2xl shadow-xs shrink-0">
              <Clock className="h-5 w-5 text-emerald-800" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-bold">Optimal Patrol Window</span>
              <h4 className="text-sm font-bold text-slate-850 font-mono mt-0.5">08:00 - 11:00 AM</h4>
              <p className="text-[10px] text-slate-500 leading-normal">Rush hour peak congestion period</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50/20 border-emerald-100/50 shadow-xs">
          <CardContent className="p-4 flex items-center space-x-4">
            <div className="p-3 bg-emerald-100/60 text-emerald-700 rounded-2xl shadow-xs shrink-0">
              <ShieldCheck className="h-5 w-5 text-emerald-800" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-bold">Auto Validation Rate</span>
              <h4 className="text-sm font-bold text-slate-850 font-mono mt-0.5">99.4% Accuracy</h4>
              <p className="text-[10px] text-slate-500 leading-normal">OCR edge license plate readings</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50/20 border-emerald-100/50 shadow-xs sm:col-span-2 lg:col-span-1">
          <CardContent className="p-4 flex items-center space-x-4">
            <div className="p-3 bg-emerald-100/60 text-emerald-700 rounded-2xl shadow-xs shrink-0">
              <AlertTriangle className="h-5 w-5 text-emerald-800" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-bold">Core Bottleneck Driver</span>
              <h4 className="text-sm font-bold text-slate-850 font-mono mt-0.5">Double Parking</h4>
              <p className="text-[10px] text-slate-500 leading-normal">Represents 30.5% of total backlogs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[350px] font-mono text-xs text-slate-400 py-12 border border-dashed border-emerald-100 rounded-2xl bg-white">
          <div className="h-6 w-6 rounded-full border-2 border-emerald-700 border-t-transparent animate-spin mb-3" />
          <span>QUERYING INTEL SYSTEM DATABASE...</span>
        </div>
      ) : (
        <>
          {/* Hourly Trend (Full Width) */}
          <Card className="shadow-xs border border-emerald-100/60">
            <CardHeader className="p-4 md:p-6 pb-2">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <div>
                  <CardTitle className="text-sm font-bold font-mono text-slate-800">TEMPORAL PROFILE (24H)</CardTitle>
                  <CardDescription className="text-xs">Violation load profile mapped over a 24-hour cycle</CardDescription>
                </div>
                <Badge variant="outline" className="font-mono text-xs text-slate-500 self-start sm:self-center border-emerald-100 bg-emerald-50/20 text-emerald-800">
                  REAL-TIME STATS
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="h-80 p-2 md:p-6 pt-0">
              {hourlyData.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-slate-400 font-mono text-xs">
                  No records matching selected filters.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="hourGradGreen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(h) => `${h}:00`} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <CartesianGrid stroke="#f2f6f4" strokeDasharray="3 3" vertical={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#ffffff", borderColor: "#dcfce7", borderRadius: "14px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.03)" }}
                      labelStyle={{ color: "#475569", fontFamily: "monospace" }}
                      labelFormatter={(h) => `Hour: ${h}:00`}
                    />
                    <Area type="monotone" dataKey="count" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#hourGradGreen)" name="Violations Count" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Two Columns for Category Distributions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Violation Type Distribution */}
            <Card className="shadow-xs border border-emerald-100/60">
              <CardHeader className="p-4 md:p-6 pb-2">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4.5 w-4.5 text-emerald-750" />
                  <CardTitle className="text-sm font-bold font-mono text-slate-800">OFFENCE CLASSIFICATION</CardTitle>
                </div>
                <CardDescription className="text-xs">Distribution of violations by offense category</CardDescription>
              </CardHeader>
              <CardContent className="h-80 p-2 md:p-6 pt-0 flex items-center justify-center">
                {typesData.violation_type_distribution.length === 0 ? (
                  <div className="text-slate-400 font-mono text-xs">No records available.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={typesData.violation_type_distribution}
                        cx="50%"
                        cy="45%"
                        innerRadius={65}
                        outerRadius={92}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="type"
                      >
                        {typesData.violation_type_distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={GREEN_SHADES[index % GREEN_SHADES.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#ffffff", borderColor: "#dcfce7", borderRadius: "14px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.03)" }}
                        labelStyle={{ color: "#475569" }}
                      />
                      <Legend 
                        layout="horizontal" 
                        align="center" 
                        verticalAlign="bottom" 
                        iconSize={8} 
                        iconType="circle"
                        wrapperStyle={{ fontSize: "10px", fontFamily: "monospace", color: "#475569", paddingTop: "10px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Vehicle Class Distribution */}
            <Card className="shadow-xs border border-emerald-100/60">
              <CardHeader className="p-4 md:p-6 pb-2">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4.5 w-4.5 text-emerald-750" />
                  <CardTitle className="text-sm font-bold font-mono text-slate-800">VEHICLE CLASSIFICATION</CardTitle>
                </div>
                <CardDescription className="text-xs">Violation load profile mapped over vehicle types</CardDescription>
              </CardHeader>
              <CardContent className="h-80 p-2 md:p-6 pt-0">
                {typesData.vehicle_type_distribution.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 font-mono text-xs">
                    No records available.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={typesData.vehicle_type_distribution} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <XAxis dataKey="type" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <CartesianGrid stroke="#f2f6f4" strokeDasharray="3 3" vertical={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#ffffff", borderColor: "#dcfce7", borderRadius: "14px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.03)" }}
                        labelStyle={{ color: "#475569", fontFamily: "monospace" }}
                      />
                      <Bar dataKey="count" fill="#059669" radius={[4, 4, 0, 0]} name="Offences Volume">
                        {typesData.vehicle_type_distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={GREEN_SHADES[index % GREEN_SHADES.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Operational Bottlenecks insights table */}
          <Card className="shadow-xs border border-emerald-100/60">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-sm font-bold font-mono text-slate-800">DECISION SUPPORT INSIGHTS</CardTitle>
              <CardDescription className="text-xs">Key metrics compiled from localized spatial queue patterns</CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-emerald-50 bg-emerald-50/10">
                    <TableHead className="font-mono text-xs text-emerald-850 pl-4 md:pl-6">Congestion Trigger</TableHead>
                    <TableHead className="font-mono text-xs text-emerald-850">Impact Index</TableHead>
                    <TableHead className="font-mono text-xs text-emerald-850">Weekly Trend</TableHead>
                    <TableHead className="font-mono text-xs text-emerald-850 pr-4 md:pr-6">Assessment & Recommendation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {insights.map((item, idx) => (
                    <TableRow key={idx} className="hover:bg-slate-50/50">
                      <TableCell className="font-semibold text-xs text-slate-800 pl-4 md:pl-6">{item.metric}</TableCell>
                      <TableCell>
                        <Badge className={`text-[9px] font-mono ${
                          item.impact === "Critical" ? "bg-red-50 text-red-700 border border-red-150" :
                          item.impact === "High" ? "bg-amber-50 text-amber-700 border border-amber-150" :
                          "bg-emerald-50 text-emerald-700 border border-emerald-150"
                        }`}>
                          {item.impact}
                        </Badge>
                      </TableCell>
                      <TableCell className={`font-mono text-xs font-semibold ${
                        item.trend.startsWith("+") ? "text-red-500" : "text-emerald-600"
                      }`}>{item.trend}</TableCell>
                      <TableCell className="text-xs text-slate-500 font-sans pr-4 md:pr-6 py-3 leading-relaxed">{item.details}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

    </div>
  )
}
