# GIS Parcel Analysis Assignment

## Overview

This project is an interactive map-based tool to analyze land parcels with environmental constraints.

Users can:

- Select a parcel directly from the map
- Draw, edit, and delete building footprints
- Automatically crop shapes to avoid restricted regions
- View area breakdowns (buildable, wetlands, built area)

The system computes all geospatial constraints and returns structured GeoJSON for rendering.

---

## Approach

### Data

- Used large-scale Texas **parcels** and **wetlands** datasets (millions of rows)
- Stored in PostGIS to support spatial queries

### Flow

1. User clicks on map → parcel is fetched
2. User draws/edits/removes shapes
3. `/compute/{parcelId}` processes:
   - Parcel geometry
   - Wetlands intersection
   - User-drawn shapes

4. Returns:
   - Buildable area
   - Restricted (wetlands) area
   - Final cropped geometries
   - Area breakdowns

### Geometry Handling

- Backend performs all heavy spatial operations
- Frontend only enforces visual constraints (no building in restricted zones)
- Shape cropping ensures invalid overlaps are removed automatically

---

## Key Decisions & Tradeoffs

### 1. Area Calculation

- Used EPSG:3857 with Shapely
- Faster to implement, but not fully accurate for real-world measurements
- Ignored projection correction due to time constraints

### 2. Dataset Scale

- Designed for large datasets (millions of rows)
- However, wetlands queries are not yet optimized
- Current limitation: many parcels return no wetlands due to query inefficiency

### 3. Backend vs Frontend Logic

- All constraint computation handled in backend
- Frontend kept simple: just rendering + interaction
- Tradeoff: less interactivity flexibility, but cleaner architecture

### 4. Setbacks / Buffers
- Generated inward buffers on parcel boundaries and outward buffers for wetlands
- Subtract wetlands + setbacks from parcel

---

## Performance

- Parcel lookup is responsive for individual clicks
- Compute API handles typical parcel sizes well
- System begins to strain when:
  - Querying large wetlands dataset without indexing/tiling
  - Performing complex geometry operations on very large polygons

---

## What’s Missing / Limitations

- No proper spatial indexing optimization for wetlands
- No caching for repeated parcel queries

---

## Next Steps

- Add spatial indexing + bounding box filtering for wetlands
- Introduce caching for repeated compute calls
- Improve UI with legends (buildable / wetlands / built)

---

## Summary

This implementation focuses on:

- Handling realistic, large-scale geospatial data
- Clean separation of computation (backend) and interaction (frontend)
- Delivering a working system under time constraints

It works well for core parcel analysis, but needs optimization and projection fixes to be production-ready.
