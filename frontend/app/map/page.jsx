"use client"

import React, { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { Layers, MapPin, RefreshCw } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ParkWatchApi, MOCK_HOTSPOTS, MOCK_HEATMAP_GEOJSON } from "@/services/api"

// Dynamic import of the map client to prevent server-side compilation issues with window (Leaflet relies on DOM)
const MapClient = dynamic(() => import("@/components/map-client"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] bg-emerald-50/10 rounded-xl flex items-center justify-center border border-emerald-100">
      <div className="flex flex-col items-center space-y-3 font-mono text-xs text-slate-500">
        <div className="h-5 w-5 rounded-full border-2 border-emerald-700 border-t-transparent animate-spin" />
        <span>LOADING GEOSPATIAL TILES...</span>
      </div>
    </div>
  )
})

export default function HotspotMapPage() {
  const [hotspots, setHotspots] = useState(MOCK_HOTSPOTS)
  const [heatmap, setHeatmap] = useState(MOCK_HEATMAP_GEOJSON)
  const [loading, setLoading] = useState(false)
  const [selectedStation, setSelectedStation] = useState("")
  const [selectedHotspotId, setSelectedHotspotId] = useState(null)

  const loadMapData = async () => {
    setLoading(true)
    try {
      const filters = selectedStation ? { police_station: selectedStation } : {}
      const spotsData = await ParkWatchApi.getHotspots(filters)
      const heatGeo = await ParkWatchApi.getHeatmapGeojson(4, filters) // Pass filters for map data sync!
      setHotspots(spotsData)
      setHeatmap(heatGeo)
    } catch (e) {
      console.error("Failed to load spatial map layers", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMapData()
  }, [selectedStation])

  const stations = ["Madivala", "HAL Old Airport", "Cubbon Park", "Indiranagar", "Whitefield"]
  
  // Find currently selected hotspot details for overlay
  const activeSpot = hotspots.find(h => h.hotspot_id === selectedHotspotId)

  return (
    <div className="space-y-6 h-full flex flex-col max-w-7xl mx-auto pb-12">
      
      {/* Title section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-emerald-100/50 pb-5 shrink-0">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800 font-mono">
            SPATIAL INGESTION MAP
          </h2>
          <p className="text-xs text-slate-500">
            DBSCAN location clusters and vector polygons mapped directly against active traffic segments.
          </p>
        </div>
        
        <div className="flex items-center space-x-2 self-start sm:self-center">
          {/* Precinct filter dropdown */}
          <select 
            value={selectedStation} 
            onChange={(e) => setSelectedStation(e.target.value)}
            className="bg-white text-slate-800 border border-emerald-100 rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-700 cursor-pointer"
          >
            <option value="">ALL PRECINCTS</option>
            {stations.map(s => (
              <option key={s} value={s}>{s.toUpperCase()}</option>
            ))}
          </select>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadMapData} 
            className="font-mono text-xs hover:border-emerald-600 hover:text-emerald-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            <span>REFRESH</span>
          </Button>
        </div>
      </div>

      {/* Map Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        
        {/* Left Side Info Panel */}
        <div className="lg:col-span-1 flex flex-col space-y-4">
          
          <Card className="flex flex-col border border-emerald-100/60 shadow-xs">
            <CardHeader className="p-4">
              <div className="flex items-center space-x-2">
                <Layers className="h-4.5 w-4.5 text-emerald-800" />
                <CardTitle className="text-sm font-bold font-mono text-slate-800">MAP LAYERS</CardTitle>
              </div>
              <CardDescription className="text-[11px]">Dynamic overlays showing coordinate indices</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-emerald-50">
                <span className="text-slate-400">Active Clusters:</span>
                <span className="text-emerald-800 font-bold">{hotspots.length}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-emerald-50">
                <span className="text-slate-400">Aggregated Nodes:</span>
                <span className="text-slate-850 font-semibold">{heatmap.metadata?.grid_cells || 0}</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-400">Search Radius:</span>
                <span className="text-slate-850">150 meters</span>
              </div>
            </CardContent>
          </Card>

          {/* Active Hotspot Details Overlay card */}
          {activeSpot ? (
            <Card className="border border-emerald-200 bg-emerald-50/10 shadow-xs">
              <CardHeader className="p-4">
                <div className="flex justify-between items-start">
                  <Badge className="text-[9px] font-mono bg-emerald-100 text-emerald-800 border border-emerald-200">SELECTED HOTSPOT</Badge>
                  <button 
                    onClick={() => setSelectedHotspotId(null)}
                    className="text-[10px] font-bold text-slate-400 hover:text-emerald-800 cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
                <CardTitle className="text-sm font-bold mt-2 text-slate-800">{activeSpot.location}</CardTitle>
                <CardDescription className="text-[10px] font-mono text-slate-400">{activeSpot.hotspot_id}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center py-1 border-b border-emerald-50">
                  <span className="text-slate-400">Violations:</span>
                  <span className="text-slate-800 font-bold">{activeSpot.violation_count}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-emerald-50">
                  <span className="text-slate-400">Risk Rating:</span>
                  <span className="text-emerald-800 font-bold">{activeSpot.composite_rank_score.toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-emerald-50">
                  <span className="text-slate-400">Dominant Offence:</span>
                  <span className="text-emerald-800 text-[10px] font-bold">
                    {activeSpot.risk_inputs.dominant_violation_type}
                  </span>
                </div>
                {activeSpot.recommendations?.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[9px] font-bold text-slate-400 block mb-1">AI DISPATCH STRATEGY:</span>
                    <p className="text-[11px] text-emerald-850 leading-relaxed font-sans font-semibold">
                      {activeSpot.recommendations[0].action}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="flex-1 flex items-center justify-center p-6 text-center border-dashed border-emerald-100 bg-white/40 min-h-[150px]">
              <div className="flex flex-col items-center space-y-2 text-slate-400 font-mono text-[11px]">
                <MapPin className="h-5 w-5 text-emerald-600/40" />
                <span>Select a polygon on the map to review details and dispatch actions.</span>
              </div>
            </Card>
          )}

        </div>

        {/* Map Container View */}
        <div className="lg:col-span-3 h-[450px] lg:h-[550px] relative rounded-xl overflow-hidden border border-emerald-100/60 shadow-xs">
          <MapClient
            hotspots={hotspots}
            heatmap={heatmap}
            selectedHotspotId={selectedHotspotId}
            onSelectHotspot={setSelectedHotspotId}
          />
        </div>

      </div>

    </div>
  )
}
