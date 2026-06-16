"use client"

import React, { useEffect, useState, use } from "react"
import Link from "next/link"
import { ArrowLeft, Play, ShieldAlert, CheckCircle, Clock } from "lucide-react"

import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import RiskMeter from "@/components/risk-meter"
import { ParkWatchApi } from "@/services/api"

export default function HotspotDetailPage({ params }) {
  // Await params promise for Next.js 15App Router segments
  const resolvedParams = use(params)
  const id = resolvedParams.id

  const [hotspot, setHotspot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dispatchStatus, setDispatchStatus] = useState("")

  useEffect(() => {
    if (id) {
      ParkWatchApi.getHotspotById(id).then(data => {
        setHotspot(data)
        setLoading(false)
      })
    }
  }, [id])

  const handleRouteEnforcement = async (action, priority) => {
    setDispatchStatus("sending")
    try {
      const asset = priority === "CRITICAL" ? "TOW-UNIT-04" : "WARDEN-UNIT-11"
      await ParkWatchApi.applyRecommendation(id, action, asset)
      setDispatchStatus("success")
      setTimeout(() => setDispatchStatus(""), 4000)
    } catch (e) {
      setDispatchStatus("error")
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] font-mono text-xs text-slate-400">
        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin mb-3" />
        <span>RETRIEVING CLUSTER INTEL...</span>
      </div>
    )
  }

  if (!hotspot) {
    return (
      <div className="space-y-4 font-mono text-xs">
        <Link href="/" className="inline-flex items-center text-primary hover:underline">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
        </Link>
        <div className="p-6 border border-border rounded-lg bg-card text-center text-muted-foreground">
          Hotspot record with ID "{id}" was not found.
        </div>
      </div>
    )
  }

  const risk = hotspot.composite_rank_score
  let riskColorClass = "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
  if (risk >= 80) riskColorClass = "border-red-500/20 bg-red-500/5 text-red-400"
  else if (risk >= 60) riskColorClass = "border-orange-500/20 bg-orange-500/5 text-orange-400"
  else if (risk >= 30) riskColorClass = "border-amber-500/20 bg-amber-500/5 text-amber-400"

  return (
    <div className="space-y-6">
      
      {/* Back button */}
      <Link href="/" className="inline-flex items-center text-xs font-mono text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5 mr-1" /> BACK TO PORTAL
      </Link>

      {/* Header and overview block */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Hotspot card details */}
        <Card className="flex-1">
          <CardHeader>
            <div className="flex justify-between items-start">
              <span className="font-mono text-xs text-emerald-800 font-bold">{hotspot.hotspot_id}</span>
              <span className="font-mono text-xs bg-emerald-50 text-emerald-800 border border-emerald-250 px-2 py-0.5 rounded-lg">
                Rank #{hotspot.rank}
              </span>
            </div>
            <CardTitle className="text-xl font-bold text-foreground mt-2">{hotspot.location}</CardTitle>
            <CardDescription className="text-xs">Precinct Jurisdiction: {hotspot.location.includes("Silk") ? "Madivala Precinct" : "HAL Old Airport Precinct"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center py-2 border-b border-border/40">
              <span className="text-muted-foreground">Cumulative Violations:</span>
              <span className="text-foreground font-bold">{hotspot.violation_count} instances</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/40">
              <span className="text-muted-foreground">Cluster Size Area:</span>
              <span className="text-foreground">{hotspot.cluster_size_km2.toFixed(3)} km²</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/40">
              <span className="text-muted-foreground">Dominant Offence Type:</span>
              <span className="text-foreground font-semibold">{hotspot.risk_inputs.dominant_violation_type}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Repeat Offender Rate:</span>
              <span className="text-primary font-bold">{(hotspot.risk_inputs.repeat_vehicle_ratio * 100).toFixed(0)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Risk meter score details */}
        <Card className={`lg:w-80 border ${riskColorClass} flex flex-col items-center justify-center p-6 text-center`}>
          <RiskMeter score={risk} size={150} />
          <h4 className="font-mono text-sm font-bold mt-4">CLUSTER HAZARD STATUS</h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-[200px] leading-relaxed">
            Derived from spatial density weights and historical congestion multipliers.
          </p>
        </Card>
        
      </div>

      {/* AI Recommendations strategies */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold font-mono">ENFORCEMENT RECOMMENDATION ENGINE</CardTitle>
          <CardDescription className="text-xs">Dynamic routing playbooks matched against active cluster metrics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {dispatchStatus === "success" && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono rounded flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span>Recommendation dispatched. Mobile units successfully routed to coordinate zone.</span>
            </div>
          )}

          {dispatchStatus === "error" && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono rounded flex items-center space-x-2">
              <ShieldAlert className="h-4 w-4 text-red-400" />
              <span>Failed to send routing commands. Check gateway connections.</span>
            </div>
          )}

          <div className="flex flex-col space-y-4">
            {hotspot.recommendations?.map((rec, index) => {
              const isCritical = rec.priority === "CRITICAL" || rec.priority === "HIGH"
              return (
                <div 
                  key={index} 
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-900/40 rounded border border-border/80 hover:border-slate-800 transition-all gap-4"
                >
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center space-x-2">
                      <Badge variant={isCritical ? "destructive" : "warning"} className="font-mono text-[9px]">
                        {rec.priority} PRIORITY
                      </Badge>
                      <h4 className="font-bold text-sm text-foreground">{rec.action}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{rec.reason}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-mono text-muted-foreground/80">
                      <span>Confidence: <strong className="text-primary">{(rec.confidence * 100).toFixed(0)}%</strong></span>
                      <span>Window: <strong className="text-foreground">{rec.suggested_deployment_window}</strong></span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center justify-end">
                    <Button 
                      variant={isCritical ? "default" : "outline"}
                      size="sm" 
                      onClick={() => handleRouteEnforcement(rec.action, rec.priority)}
                      disabled={dispatchStatus === "sending"}
                      className="font-mono text-xs"
                    >
                      <Play className="h-3 w-3 mr-1.5 fill-current" />
                      <span>{dispatchStatus === "sending" ? "ROUTING..." : "DISPATCH NOW"}</span>
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
      
    </div>
  )
}
