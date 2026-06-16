"use client"

import React, { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

export default function MapClient({
  hotspots = [],
  heatmap = { features: [] },
  center = [12.95, 77.62],
  zoom = 12,
  selectedHotspotId = null,
  onSelectHotspot
}) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const shapesGroupRef = useRef(null)

  // 1. Initialize Map Instance on Mount and Clean up on Unmount
  useEffect(() => {
    // Fix default marker icon asset paths
    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    })

    if (mapContainerRef.current && !mapRef.current) {
      // Create native map instance
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true
      }).setView(center, zoom)

      // Add CartoDB Positron tile layer (elegant white/light-mode theme matching branding)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; OpenStreetMap &copy; CARTO'
      }).addTo(mapRef.current)

      // Add layers group
      shapesGroupRef.current = L.featureGroup().addTo(mapRef.current)
    }

    return () => {
      // Synchronous destruction of the Leaflet instance on component unmount
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null;
        shapesGroupRef.current = null;
      }
    }
  }, []) // Empty array -> runs exactly once on mount, cleans up on unmount

  // 2. Keep Map Viewport Sync'ed with Center/Zoom prop changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(center, zoom)
    }
  }, [center, zoom])

  // 3. Draw Heatmap Coordinates and Hotspot Polygons dynamically
  useEffect(() => {
    if (!mapRef.current || !shapesGroupRef.current) return

    // Clear previous layers
    shapesGroupRef.current.clearLayers()

    // A. Draw Heatmap Nodes in shades of Emerald/Green
    if (heatmap && heatmap.features) {
      heatmap.features.forEach((node) => {
        if (!node.geometry || !node.geometry.coordinates) return
        const [lon, lat] = node.geometry.coordinates
        const weight = node.properties.weight

        // Shading maps to green palette, reserving orange/red for extreme aggregates
        let color = "#34d399" // light green
        if (weight > 2000) color = "#dc2626" // red (extreme alert)
        else if (weight > 1000) color = "#ea580c" // orange (high)
        else if (weight > 400) color = "#047857" // forest green
        else if (weight > 100) color = "#059669" // emerald

        const circle = L.circleMarker([lat, lon], {
          radius: Math.min(15, Math.max(4, weight / 100)),
          fillColor: color,
          fillOpacity: 0.2,
          color: "transparent",
          weight: 0
        })
        circle.addTo(shapesGroupRef.current)
      })
    }

    // B. Draw Hotspot Polygons
    if (hotspots) {
      hotspots.forEach((hotspot) => {
        if (!hotspot.polygon_vertices || hotspot.polygon_vertices.length < 3) return

        const isSelected = selectedHotspotId === hotspot.hotspot_id
        const isHighRisk = hotspot.composite_rank_score >= 80
        
        // Green outlines, orange highlight only for high composite risk zones
        const color = isSelected 
          ? "#047857" // Selected high-contrast forest green
          : (isHighRisk ? "#ea580c" : "#10b981") // Orange warning vs emerald green

        const polygon = L.polygon(
          hotspot.polygon_vertices.map(v => [v[0], v[1]]),
          {
            color: color,
            weight: isSelected ? 3.5 : 1.5,
            fillColor: color,
            fillOpacity: isSelected ? 0.3 : 0.1,
            dashArray: isSelected ? undefined : "4"
          }
        )

        // Light mode custom popup markup
        const isCritical = hotspot.composite_rank_score >= 80
        const badgeBg = isCritical ? "rgba(239, 68, 68, 0.08)" : "rgba(5, 150, 105, 0.08)"
        const badgeColor = isCritical ? "#b91c1c" : "#047857"

        const popupContent = `
          <div style="font-family: sans-serif; font-size: 12px; color: #374151; line-height: 1.45; min-width: 170px; padding: 2px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
              <span style="font-family: monospace; color: #047857; font-weight: bold; font-size: 11px;">${hotspot.hotspot_id}</span>
              <span style="font-family: monospace; background-color: ${badgeBg}; color: ${badgeColor}; padding: 2px 6px; border-radius: 6px; font-weight: bold; font-size: 9.5px;">
                Score: ${hotspot.composite_rank_score.toFixed(1)}
              </span>
            </div>
            <h4 style="font-weight: bold; margin: 4px 0; font-size: 12.5px; color: #1f2937;">${hotspot.location}</h4>
            <div style="display: flex; justify-content: space-between; font-size: 10.5px; color: #6b7280; margin-top: 6px; border-bottom: 1px solid #f3f4f6; padding-bottom: 6px;">
              <span>Citations: <strong style="color: #111827;">${hotspot.violation_count}</strong></span>
              <span>Area: <strong style="color: #111827;">${hotspot.cluster_size_km2.toFixed(3)} km²</strong></span>
            </div>
            ${
              hotspot.recommendations && hotspot.recommendations.length > 0
                ? `<div style="margin-top: 6px; font-size: 10.5px; color: #0369a1; line-height: 1.3;">
                     <strong style="color: #047857;">AI Dispatch:</strong> ${hotspot.recommendations[0].action}
                   </div>`
                : ""
            }
          </div>
        `
        polygon.bindPopup(popupContent)

        // Bind polygon click to trigger component state update
        polygon.on("click", () => {
          if (onSelectHotspot) onSelectHotspot(hotspot.hotspot_id)
        })

        polygon.addTo(shapesGroupRef.current)
      })
    }
  }, [hotspots, heatmap, selectedHotspotId])

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-full min-h-[500px] bg-slate-50 border border-emerald-100/60 shadow-inner relative z-10"
    />
  )
}
