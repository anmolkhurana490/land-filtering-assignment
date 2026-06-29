from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dao import fetch_parcel_by_point, fetch_parcel_by_id, fetch_wetlands_by_parcel
from shapely.geometry import shape, mapping, MultiPolygon
from shapely.ops import unary_union, transform
from shapely.validation import make_valid
from pyproj import Geod, CRS, Transformer
import math

import os
from dotenv import load_dotenv
load_dotenv()

geod = Geod(ellps="WGS84")

# CRS transformer function (EPSG:3857 to EPSG:4326)
transformer_4326 = Transformer.from_crs(CRS('EPSG:3857'), CRS('EPSG:4326'), always_xy=True).transform
transformer_3857 = Transformer.from_crs(CRS('EPSG:3857'), CRS('EPSG:4326'), always_xy=True).transform

FRONTEND_URL = os.getenv("FRONTEND_URL") or "*"

app = FastAPI()

app.add_middleware(
  CORSMiddleware,
  allow_origins=[FRONTEND_URL],
  allow_methods=["*"],
  allow_headers=["*"],
)

# Define Buffer distances
SETBACK_DIST = 30 # 30 metres
BUFFER_DIST = 10 # 10 metres

@app.get('/')
def home():
  return {"message": "app is running"}

@app.get('/parcel')
def get_parcel(lat: float, lng: float):
  parcel = fetch_parcel_by_point(lat, lng)

  return {
    "parcel": parcel
  }

@app.post('/compute/{parcelId}')
def compute_area(parcelId: int, data: dict):
  user_shapes = data["user_polygons"]

  user_polygons = []
  for u in user_shapes:
    geom = u.get("geometry")
    if not geom:
      continue
    
    g = transform(transformer_3857, make_valid(shape(geom)))
    if not g.is_empty:
      user_polygons.append(g)

  parcel = fetch_parcel_by_id(parcelId)
  if not parcel:
    return {"parcel": "None"}
  
  wetlands = fetch_wetlands_by_parcel(parcel["geom"])

  # Convert GeoJSON → Shapely object
  parcel_polygon = shape(parcel["geom"])
  wetland_polygons = [shape(wetland["geom"]) for wetland in wetlands]

  # SetBack/Buffer polygons
  allowed_parcel_polygon = parcel_polygon.buffer(-SETBACK_DIST)
  rest_wetland_polygons = [wetland.buffer(BUFFER_DIST) for wetland in wetland_polygons]

  # Union all wetlands and user shapes
  wetlands_union = unary_union(wetland_polygons) if wetland_polygons else MultiPolygon()
  wetlands_rest_union = (
    unary_union(rest_wetland_polygons).intersection(allowed_parcel_polygon)
    if rest_wetland_polygons else MultiPolygon()
  )
  user_built_union = (
    unary_union(user_polygons).intersection(allowed_parcel_polygon)
    if user_polygons else MultiPolygon()
  )

  # Compute Setback/Buffer restricted Areas
  setback_restricted = parcel_polygon.difference(allowed_parcel_polygon)

  # Buffer restricted geom
  buffer_restricted = wetlands_rest_union.difference(wetlands_union)

  # Union excluded polygons
  excluded_union = wetlands_rest_union.union(user_built_union).union(setback_restricted)

  # Compute Excluded and Buildable Areas
  excluded_polygon = parcel_polygon.intersection(excluded_union)
  buildable_polygon = allowed_parcel_polygon.difference(excluded_polygon)
  total_buildable_polygon = allowed_parcel_polygon.difference(wetlands_rest_union)

  # Compute All Areas
  parcel_acres = abs(parcel_polygon.area) / 4046.86

  wetlands_m2 = wetlands_rest_union.area if wetlands_rest_union else 0
  wetlands_acres = abs(wetlands_m2) / 4046.86

  user_built_m2 = user_built_union.area if user_built_union else 0
  user_built_acres = abs(user_built_m2) / 4046.86

  excluded_m2 = excluded_polygon.area if excluded_polygon else 0
  excluded_acres = abs(excluded_m2) / 4046.86

  buildable_m2 = buildable_polygon.area if buildable_polygon else 0
  buildable_acres = abs(buildable_m2) / 4046.86

  setback_rest_m2 = setback_restricted.area if setback_restricted else 0
  setback_rest_acres = abs(setback_rest_m2) / 4046.86

  buffer_rest_m2 = buffer_restricted.area if buffer_restricted else 0
  buffer_rest_acres = abs(buffer_rest_m2) / 4046.86

  return {
    "buildable": mapping(transform(transformer_4326, buildable_polygon)),
    "excluded": mapping(transform(transformer_4326, excluded_polygon)),
    "total_buildable": mapping(transform(transformer_4326, total_buildable_polygon)),
    "wetlands": mapping(transform(transformer_4326, wetlands_union)),
    "setback_restricted": mapping(transform(transformer_4326, setback_restricted)),
    "buffer_restricted": mapping(transform(transformer_4326, buffer_restricted)),

    "setback_dist": SETBACK_DIST,
    "buffer_dist": BUFFER_DIST,

    "areas": {
      "total_parcel": parcel_acres,
      "buildable": buildable_acres,
      "excluded": excluded_acres,
      "setback_restricted": setback_rest_acres,
      "buffer_restricted": buffer_rest_acres
    },

    "exclusion_breakdown": [
      {
        "type": "wetlands",
        "area": wetlands_acres
      },
      {
        "type": "user_excluded",
        "area": user_built_acres
      },
    ]
  }