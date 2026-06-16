"use client"

import React, { useEffect, useState } from "react"
import { AlertOctagon, HelpCircle, User, CheckCircle, ShieldAlert } from "lucide-react"

import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { ParkWatchApi } from "@/services/api"

export default function RecommendationsQueuePage() {
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState(null)
  const [dispatchStatus, setDispatchStatus] = useState("")

  const loadQueue = async () => {
    setLoading(true)
    try {
      const data = await ParkWatchApi.getRecommendations()
      setQueue(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQueue()
  }, [])

  const handleApplyDispatch = async () => {
    if (!selectedItem) return
    setDispatchStatus("routing")
    try {
      const asset = selectedItem.priority === "CRITICAL" ? "TOW-UNIT-04" : "WARDEN-UNIT-11"
      await ParkWatchApi.applyRecommendation(
        selectedItem.hotspot_id,
        selectedItem.recommended_action,
        asset
      )
      setDispatchStatus("success")
      
      // Update local state list to remove or mark dispatched
      setQueue(prev => prev.filter(item => 
        !(item.hotspot_id === selectedItem.hotspot_id && item.recommended_action === selectedItem.recommended_action)
      ))
      
      setTimeout(() => {
        setDispatchStatus("")
        setSelectedItem(null)
      }, 2000)
      
    } catch (e) {
      setDispatchStatus("error")
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] font-mono text-xs text-slate-400">
        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin mb-3" />
        <span>PARSING ACTIVE OPERATIONS QUEUE...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground font-mono">
          RECOMMENDATION QUEUE
        </h2>
        <p className="text-xs text-muted-foreground">
          Dynamic prioritization engine recommending tow trucks, wardens, or infrastructure audits.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-4">
        {queue.length === 0 ? (
          <Card className="border-dashed border-border bg-transparent p-12 text-center text-muted-foreground font-mono text-xs">
            No active enforcement actions recommended. All sectors within safety limits.
          </Card>
        ) : (
          queue.map((item, index) => {
            const isCritical = item.priority === "CRITICAL" || item.priority === "HIGH"
            
            return (
              <Card 
                key={index} 
                className="hover:border-emerald-600/30 hover:shadow-[0_8px_30px_rgb(5,150,105,0.02)] hover:bg-emerald-50/5 transition-all border border-slate-100 cursor-pointer bg-white"
                onClick={() => setSelectedItem(item)}
              >
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant={isCritical ? "destructive" : "warning"} className="font-mono text-[9px]">
                        {item.priority}
                      </Badge>
                      <span className="text-xs font-mono text-muted-foreground">Cluster: {item.hotspot_id}</span>
                      <h4 className="font-semibold text-sm text-foreground">• {item.location}</h4>
                    </div>
                    <p className="text-xs text-foreground font-medium">{item.recommended_action}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1 max-w-3xl">{item.reason}</p>
                    <div className="flex flex-wrap gap-x-4 text-[10px] font-mono text-muted-foreground/80">
                      <span>Violations: <strong className="text-foreground">{item.violation_count}</strong></span>
                      <span>Target Risk: <strong className="text-foreground">{item.composite_risk_score.toFixed(1)}</strong></span>
                      <span>Deploy: <strong className="text-foreground">{item.suggested_deployment_window}</strong></span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center justify-end">
                    <Button variant="outline" size="sm" className="font-mono text-xs hover:border-primary hover:text-primary">
                      DEPLOY UNIT
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Modal/Dialog side drawer detail */}
      {selectedItem && (
        <Dialog open={!!selectedItem} onClose={() => setSelectedItem(null)}>
          <DialogHeader>
            <div className="flex justify-between items-start">
              <Badge variant={selectedItem.priority === "CRITICAL" || selectedItem.priority === "HIGH" ? "destructive" : "warning"}>
                {selectedItem.priority} PRIORITY
              </Badge>
            </div>
            <DialogTitle className="mt-2">{selectedItem.recommended_action}</DialogTitle>
            <DialogDescription className="font-mono text-xs">
              Location Target: {selectedItem.location} ({selectedItem.hotspot_id})
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4 font-mono text-xs">
            {dispatchStatus === "success" && (
              <div className="p-3 bg-emerald-50 border border-emerald-150 text-emerald-800 rounded-xl flex items-center space-x-2">
                <CheckCircle className="h-4.5 w-4.5 text-emerald-700 shrink-0" />
                <span>Asset successfully dispatched and routed.</span>
              </div>
            )}
            {dispatchStatus === "error" && (
              <div className="p-3 bg-red-50 border border-red-150 text-red-700 rounded-xl flex items-center space-x-2">
                <ShieldAlert className="h-4.5 w-4.5 text-red-600 shrink-0" />
                <span>Failed to coordinate dispatch. Verify network.</span>
              </div>
            )}

            <div className="p-4 bg-emerald-50/15 rounded-xl border border-emerald-100/60 space-y-2">
              <span className="text-[10px] text-emerald-800 uppercase block font-bold">AI REASONING INDEX</span>
              <p className="text-xs text-slate-700 font-sans leading-relaxed">{selectedItem.reason}</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100">
                <span className="text-[9px] text-slate-400 block font-bold">EST. RESOLUTION IMPACT</span>
                <span className="text-xs text-slate-800 font-sans font-semibold">{selectedItem.expected_impact}</span>
              </div>
              <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100">
                <span className="text-[9px] text-slate-400 block font-bold">ENFORCEMENT DELAY RISK</span>
                <span className="text-xs text-slate-800 font-sans font-semibold">Capped response required within 30 mins</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSelectedItem(null)} className="font-mono text-xs">
              ABORT
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleApplyDispatch} 
              disabled={dispatchStatus === "routing" || dispatchStatus === "success"}
              className="font-mono text-xs"
            >
              {dispatchStatus === "routing" ? "DISPATCHING..." : "APPROVE & ROUTE"}
            </Button>
          </DialogFooter>
        </Dialog>
      )}

    </div>
  )
}
