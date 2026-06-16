"use client"

import React, { useEffect, useState } from "react"
import { FileSpreadsheet, Search, RefreshCw, Eye } from "lucide-react"

import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { ParkWatchApi, MOCK_RECORDS } from "@/services/api"

export default function ViolationRecordsPage() {
  const [records, setRecords] = useState(MOCK_RECORDS)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [selectedRecord, setSelectedRecord] = useState(null)
  
  // Pagination
  const [page, setPage] = useState(1)
  const limit = 25

  const loadRecords = async () => {
    setLoading(true)
    try {
      const filters = {}
      if (selectedStatus) filters.validation_status = selectedStatus
      
      const data = await ParkWatchApi.getViolations(filters)
      setRecords(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRecords()
  }, [selectedStatus])

  // Filter records locally for search bar matching
  const filteredRecords = records.filter(row => {
    const term = searchQuery.toLowerCase().trim()
    if (!term) return true
    return (
      row.vehicle_number?.toLowerCase().includes(term) ||
      row.location?.toLowerCase().includes(term) ||
      row.id?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground font-mono">
            VIOLATION RECORDS
          </h2>
          <p className="text-xs text-muted-foreground">
            Audit log of all registered parking offenses and validation status.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadRecords} className="font-mono text-xs">
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
          <span>SYNC METRIC</span>
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center shrink-0">
        
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search license plate, location name, incident ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card text-foreground border border-border rounded pl-9 pr-4 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
          />
        </div>
        
        {/* Status Dropdown */}
        <select 
          value={selectedStatus} 
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="w-full md:w-48 bg-card text-foreground border border-border rounded px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">ALL STATUSES</option>
          <option value="PENDING">PENDING</option>
          <option value="APPROVED">APPROVED</option>
          <option value="DISPATCHED">DISPATCHED</option>
        </select>
        
      </div>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-mono">ID</TableHead>
                <TableHead className="font-mono">Vehicle Plate</TableHead>
                <TableHead className="font-mono">Time Registered</TableHead>
                <TableHead className="font-mono">Location Segment</TableHead>
                <TableHead className="font-mono">Precinct</TableHead>
                <TableHead className="font-mono">Validation Status</TableHead>
                <TableHead className="font-mono">Risk Rating</TableHead>
                <TableHead className="text-right font-mono">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center p-8 text-muted-foreground font-mono text-xs">
                    No violation records matching criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((row) => {
                  let statusVar = "secondary"
                  if (row.validation_status === "APPROVED") statusVar = "success"
                  else if (row.validation_status === "PENDING") statusVar = "warning"
                  else if (row.validation_status === "DISPATCHED") statusVar = "info"
                  
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-xs text-slate-400">{row.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-bold text-foreground text-xs">{row.vehicle_number}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{row.vehicle_type}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {new Date(row.created_datetime).toLocaleString()}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-xs">{row.location}</TableCell>
                      <TableCell className="font-semibold text-xs">{row.police_station}</TableCell>
                      <TableCell>
                        <Badge variant={statusVar} className="text-[9px] font-mono">{row.validation_status}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono font-semibold text-xs">{row.risk_score?.toFixed(1) || "N/A"}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setSelectedRecord(row)}
                          className="h-8 w-8 cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Record details popup modal */}
      {selectedRecord && (
        <Dialog open={!!selectedRecord} onClose={() => setSelectedRecord(null)}>
          <DialogHeader>
            <div className="flex justify-between items-start">
              <span className="font-mono text-xs text-primary font-bold">{selectedRecord.id}</span>
              <Badge variant={
                selectedRecord.validation_status === "APPROVED" ? "success" : 
                selectedRecord.validation_status === "PENDING" ? "warning" : "info"
              }>
                {selectedRecord.validation_status}
              </Badge>
            </div>
            <DialogTitle className="mt-2 text-foreground font-bold">
              License Plate: {selectedRecord.vehicle_number}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Offence Registered by OCR Sensor Device
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-4 font-mono text-xs">
            <div className="p-3 bg-emerald-50/15 rounded-xl border border-emerald-100/60 space-y-1">
              <span className="text-[10px] text-emerald-800 font-bold uppercase">Incident Description</span>
              <p className="text-xs text-slate-700 font-sans">{selectedRecord.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-2.5 bg-slate-50/60 rounded-xl border border-slate-100">
                <span className="text-[9px] text-slate-400 block font-bold">VEHICLE CLASS</span>
                <span className="text-xs text-slate-800 font-semibold">{selectedRecord.vehicle_type}</span>
              </div>
              <div className="p-2.5 bg-slate-50/60 rounded-xl border border-slate-100">
                <span className="text-[9px] text-slate-400 block font-bold">LAW CODE / SECTION</span>
                <span className="text-xs text-slate-800 font-semibold">Section {selectedRecord.offence_code}</span>
              </div>
              <div className="p-2.5 bg-slate-50/60 rounded-xl border border-slate-100">
                <span className="text-[9px] text-slate-400 block font-bold">PRECINCT</span>
                <span className="text-xs text-slate-800 font-semibold">{selectedRecord.police_station}</span>
              </div>
              <div className="p-2.5 bg-slate-50/60 rounded-xl border border-slate-100">
                <span className="text-[9px] text-slate-400 block font-bold">INTERSECTION JUNCTION</span>
                <span className="text-xs text-slate-800 font-semibold">{selectedRecord.junction_name}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100 space-y-1.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase">RISK INTEL ASSESSMENT</span>
              <div className="flex justify-between items-center text-xs">
                <span>Threat Index: <strong className="text-slate-800">{selectedRecord.risk_score?.toFixed(1) || "N/A"} / 100</strong></span>
                <span>Category: <strong className="text-emerald-705 font-bold">{selectedRecord.risk_category}</strong></span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans italic mt-1 leading-relaxed">
                "{selectedRecord.risk_explanation}"
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSelectedRecord(null)} className="font-mono text-xs">
              CLOSE
            </Button>
          </DialogFooter>
        </Dialog>
      )}

    </div>
  )
}
