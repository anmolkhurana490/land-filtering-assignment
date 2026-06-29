# GeoSpatial Buildability Analyzer — Backend

## Overview

This backend powers geospatial analysis for evaluating land buildability. It processes parcel, wetland, and user-defined geometries to compute **buildable area** using spatial operations such as buffering, union, and difference.

Built with **FastAPI + PostGIS**, it serves as the source of truth for all spatial computations.

---

## Tech Stack

* **FastAPI** — API framework
* **PostgreSQL + PostGIS** — spatial database
* **GDAL / ogr2ogr (via QGIS)** — data ingestion
* **Shapely / GeoAlchemy (optional)** — geometry processing

---

## Setup Instructions

### 1. Create Python Virtual Environment

```bash
python -m venv venv
```

Activate:

* Windows:

```bash
venv\Scripts\activate
```

* Mac/Linux:

```bash
source venv/bin/activate
```

---

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

---

### 3. Setup PostgreSQL + PostGIS

Create database:

```sql
CREATE DATABASE postgis;
```

Enable extension:

```sql
\c postgis;
CREATE EXTENSION postgis;
```

---

## Dataset Setup

### Install QGIS (required for ogr2ogr)

Download and install QGIS from official website.

---

## 1. Texas Parcels Dataset

Download:
https://data.geographic.texas.gov/0fa04328-872e-481c-b453-126a74777593/resources/stratmap25-landparcels_48_lp.zip

Steps:

* Extract ZIP
* Locate `.gdb` file

Import into PostGIS:

```bash
& "C:\Program Files\QGIS 3.44.11\bin\ogr2ogr.exe" -f "PostgreSQL" PG:"postgresql://postgres:root@localhost:5432/postgis" stratmap25-landparcels_48.gdb stratmap25_landparcels_48 -nln ParcelsLayer -nlt PROMOTE_TO_MULTI -lco GEOMETRY_NAME=geom -lco FID=id -lco SPATIAL_INDEX=GIST -overwrite -progress --config OGR_ORGANIZE_POLYGONS SKIP
```

---

## 2. Texas Wetlands Dataset

Download:
https://documentst.ecosphere.fws.gov/wetlands/data/State-Downloads/TX_geodatabase_wetlands.zip

Steps:

* Extract ZIP
* Locate `.gdb` file

Import into PostGIS:

```bash
& "C:\Program Files\QGIS 3.44.11\bin\ogr2ogr.exe" -f "PostgreSQL" PG:"postgresql://postgres:root@localhost:5432/postgis" TX_geodatabase_wetlands.gdb TX_Wetlands -nln WetlandsLayer -nlt PROMOTE_TO_MULTI -lco GEOMETRY_NAME=geom -lco FID=id -lco SPATIAL_INDEX=GIST -overwrite -progress --config OGR_ORGANIZE_POLYGONS SKIP
```

---

## Running the Backend

Start FastAPI server:

```bash
uvicorn app.main:app --reload
```

API will be available at:

```
http://127.0.0.1:8000
```

Docs:

```
http://127.0.0.1:8000/docs
```

---

## Core Functionality

### Buildable Area Computation

The backend computes buildable land using:

```
buildable = parcel
            - wetlands_buffer
            - setback_buffer
            - existing_buildings
```

### Buffer Logic

* Parcel setback → inward buffer (negative)
* Wetlands → outward buffer (positive)

---

## API Endpoints

### `POST /analysis/buildable`

Computes buildable area and constraint layers.

### `POST /analysis/validate`

Validates user geometries against constraints.

### `GET /wetlands`

Fetch wetlands intersecting a given region.

---

## Notes

* Spatial computations are handled server-side for consistency
* GeoJSON is used as input/output format
* Coordinate system accuracy is simplified (EPSG:3857 assumption)

---

## Future Improvements

* CRS-correct area calculations
* Advanced zoning rule integration
* Performance optimization using spatial indexing
* Persistent user geometry storage

---

## Summary

This backend demonstrates a scalable geospatial analysis pipeline using real-world datasets and spatial databases, enabling accurate and explainable land-use decisions.