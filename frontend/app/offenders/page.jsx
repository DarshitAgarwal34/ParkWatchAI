"use client"

import React, { useEffect, useState } from "react"
import { Users, AlertOctagon, UserX, AlertTriangle } from "lucide-react"

import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ParkWatchApi, MOCK_OFFENDERS } from "@/services/api"

export default function RepeatOffendersPage() {
  const [offenders, setOffenders] = useState(MOCK_OFFENDERS)
  const [loading, setLoading] = useState(false)

  const loadOffenders = async () => {
    setLoading(true)
    try {
      // Simulate API loading
      await new Promise(resolve => setTimeout(resolve, 200))
      setOffenders(MOCK_OFFENDERS)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOffenders()
  }, [])

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground font-mono">
          REPEAT OFFENDERS LOG
        </h2>
        <p className="text-xs text-muted-foreground">
          Chronic parking violators tracked by OCR license plate matching, flagged for boot or impound sweeps.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Offenders Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold font-mono">CHRONIC VIOLATING VEHICLES</CardTitle>
            <CardDescription className="text-xs">Vehicles with highest violation incidence in the past 30 days</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-mono">Vehicle Plate</TableHead>
                  <TableHead className="font-mono">Vehicle Type</TableHead>
                  <TableHead className="font-mono">Offence Count</TableHead>
                  <TableHead className="font-mono">Unpaid Tickets</TableHead>
                  <TableHead className="text-right font-mono">Escalation Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offenders.map((row) => {
                  let badgeVar = "warning"
                  if (row.status.includes("TOW")) badgeVar = "destructive"
                  else if (row.status.includes("IMPOUND")) badgeVar = "destructive"
                  
                  return (
                    <TableRow key={row.vehicle_number}>
                      <TableCell className="font-mono font-bold text-foreground text-sm">
                        {row.vehicle_number}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{row.type}</TableCell>
                      <TableCell className="font-mono font-semibold">{row.count} incidents</TableCell>
                      <TableCell className="font-mono text-red-400 font-bold">{row.unpaid_tickets}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={badgeVar} className="text-[9px] font-mono">
                          {row.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Policy Summary Card */}
        <Card className="flex flex-col justify-between border-amber-100 bg-amber-50/10 text-amber-900 shadow-xs">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <UserX className="h-4.5 w-4.5 text-amber-700 shrink-0" />
              <CardTitle className="text-sm font-bold font-mono text-slate-850">REPEAT OFFENDER SECTOR POLICY</CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500">Escalating penalties for chronic plate triggers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 flex flex-col justify-center font-sans text-xs leading-relaxed text-slate-600">
            <p>
              Vehicles exceeding **3 active violations** are automatically flagged for direct physical boot alerts during warden scans.
            </p>
            <p>
              Vehicles with **5+ unpaid citations** receive dynamic tow recommendations to physical impound lots. Plates are synced with the SCITA registration database for blocking transfer approvals.
            </p>
            <div className="p-3 bg-amber-50 text-amber-800 rounded-xl border border-amber-150 text-xs font-mono flex items-center space-x-2 mt-2">
              <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
              <span>Chronic rates represent 32.4% of backlogs.</span>
            </div>
          </CardContent>
        </Card>

      </div>

    </div>
  )
}
