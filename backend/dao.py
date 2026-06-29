from sqlalchemy import text
from db_session import SessionLocal
import json

db = SessionLocal()

def fetch_parcel_by_id(parcelId: int):
  query = text("""
    SELECT
      id,
      ST_AsGeoJSON(geom)::jsonb as geom,
      ST_AsGeoJSON(ST_Transform(geom, 4326))::jsonb as geom4326
    FROM parcelslayer
    WHERE id = :id
  """)

  res = db.execute(query, {"id": parcelId}).fetchone()

  if not res:
    return None
  
  return res._asdict()

def fetch_parcel_by_point(lat: float, lng: float):
  query = text("""
    SELECT
      id,
      ST_AsGeoJSON(geom)::jsonb as geom,
      ST_AsGeoJSON(ST_Transform(geom, 4326))::jsonb as geom4326
    FROM parcelslayer
    WHERE ST_Contains(
      geom,
      ST_Transform(
        ST_SetSRID(ST_Point(:lng, :lat), 4326),
        3857
      )
    )
  """)

  res = db.execute(query, {"lat": lat, "lng": lng}).fetchone()
  
  if not res:
    return None
  
  return res._asdict()

def fetch_wetlands_by_parcel(parcelGeo: dict):
  parcel_geojson_str = json.dumps(parcelGeo)

  # query = text("""
  #   SELECT
  #     id,
  #     ST_AsGeoJSON(ST_SetSRID(geom, 3857))::jsonb as geom,
  #     ST_AsGeoJSON(ST_Transform(geom, 4326))::jsonb as geom4326
    
  #   FROM wetlandslayer limit 10000;
  # """)

  query = text("""
    WITH parcel as (
      SELECT 
        ST_SetSRID(ST_GeomFromGeoJSON(:parcelGeo), 3857)
        as geom
    )
    
    SELECT
      w.id,
      ST_AsGeoJSON(ST_Transform(ST_SetSRID(w.geom, 3857), 4326))::jsonb as geom4326
    
    FROM wetlandslayer w, parcel p
    
    where ST_SetSRID(w.geom, 3857) && p.geom
    and ST_Intersects(ST_SetSRID(w.geom, 3857), p.geom);
  """)

  res = db.execute(query, {"parcelGeo": parcel_geojson_str}).fetchall()
  
  return [row._asdict() for row in res]