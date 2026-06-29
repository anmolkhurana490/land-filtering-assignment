import React, { useEffect, useRef, useState } from 'react'
import { getParcelAPI } from '../repositories';
import * as turf from "@turf/turf";

const MapContainer = ({ handlePostShapeEvent, results }) => {
  // Center of the map [Latitude, Longitude]
  // lower lat -> south, lower long -> west
  const [position, setPosition] = useState({ lat: 30, lng: -100 });
  const isDrawActiveRef = useRef(false);

  const currParcelId = useRef(null);
  const resultsRef = useRef(results);

  // Layers Refs with styling
  const parcelsLayerRef = useRef(L.geoJSON(null, { color: "green" }));
  const restrictedLayerRef = useRef(L.geoJSON(null, { color: "red" }));
  const wetlandsLayerRef = useRef(L.geoJSON(null, { color: "blue" }));
  const drawnLayerRef = useRef(new L.FeatureGroup());

  useEffect(() => {
    resultsRef.current = results;
    if (results) {
      restrictedLayerRef.current.clearLayers();
      wetlandsLayerRef.current.clearLayers();

      results.setback_restricted.coordinates.forEach((res) => restrictedLayerRef.current.addData(res));
      results.buffer_restricted.coordinates.forEach((res) => restrictedLayerRef.current.addData(res));
      wetlandsLayerRef.current.addData(results.wetlands.coordinates);
    }
  }, [results]);

  useEffect(() => {
    // Create map
    const map = L.map("map").setView(position, 7);

    // Load tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")
      .addTo(map);

    // Layer groups
    parcelsLayerRef.current.addTo(map);
    restrictedLayerRef.current.addTo(map);
    wetlandsLayerRef.current.addTo(map);
    drawnLayerRef.current.addTo(map);

    // Draw control
    const drawControl = new L.Control.Draw({
      edit: {
        featureGroup: drawnLayerRef.current
      },
      draw: {
        polygon: { shapeOptions: { color: "brown" } },
        rectangle: false,
        circle: false,
        marker: false,
        polyline: false
      }
    });

    map.addControl(drawControl);

    map.on("draw:drawstart draw:editstart draw:deletestart", (e) => { isDrawActiveRef.current = true });
    map.on("draw:drawstop draw:editstop draw:deletestop", (e) => { isDrawActiveRef.current = false });

    // Shape Events
    map.on(L.Draw.Event.CREATED, (e) => {
      const results = resultsRef.current;
      if (!results) return;

      const shape_geodata = e.layer.toGeoJSON().geometry;

      const turf_shape = turf.polygon(shape_geodata.coordinates);
      const turf_buildable = turf.multiPolygon(results.buildable.coordinates);

      const croppedShape = turf.intersect(turf.featureCollection([turf_buildable, turf_shape]));
      if (!croppedShape) return;

      // Add cropped shapes to drawn layer
      L.geoJSON(croppedShape, { style: { color: "brown" } })
        .eachLayer((layer) => {
          drawnLayerRef.current.addLayer(layer);
        });

      handlePostShapeEvent(drawnLayerRef.current, currParcelId.current);
    });

    map.on(L.Draw.Event.EDITED, () => {
      const results = resultsRef.current;
      if (!results) return;

      const edited_shapes = [];
      drawnLayerRef.current.eachLayer((layer) => {
        const shape_geodata = layer.toGeoJSON().geometry;
        edited_shapes.push(shape_geodata);
      });

      const turf_shapes = turf.polygons(edited_shapes.map((shape) => shape.coordinates));
      const turf_total_buildable = turf.multiPolygon(results.total_buildable.coordinates);

      const turf_shapes_union = turf_shapes.features.length > 1 ? turf.union(turf_shapes) : turf_shapes.features[0];
      const croppedShape = turf.intersect(turf.featureCollection([turf_total_buildable, turf_shapes_union]));

      drawnLayerRef.current.clearLayers();
      if (!croppedShape) return;

      const shapes_list = croppedShape.geometry.type === "MultiPolygon" ? croppedShape.geometry.coordinates : [croppedShape.geometry.coordinates];

      // Add cropped shapes to drawn layer
      shapes_list.forEach((shape) => {
        L.geoJSON(turf.polygon(shape), { style: { color: "brown" } })
          .eachLayer((layer) => {
            drawnLayerRef.current.addLayer(layer);
          })
      });

      handlePostShapeEvent(drawnLayerRef.current, currParcelId.current);
    });

    map.on(L.Draw.Event.DELETED, () => handlePostShapeEvent(drawnLayerRef.current, currParcelId.current));

    map.on('click', (e) => {
      if (!isDrawActiveRef.current) {
        // Extract latitude and longitude
        console.log(e.latlng);
        setPosition(e.latlng);
      }
    })

    return () => {
      map.remove();
    }
  }, []);

  useEffect(() => {
    const setCurrParcel = async (pos) => {
      parcelsLayerRef.current.clearLayers();

      const data = await getParcelAPI(pos.lat, pos.lng);
      console.log(data);

      if (!data.parcel) return;
      parcelsLayerRef.current.addData(data.parcel.geom4326);

      currParcelId.current = data.parcel.id;
      handlePostShapeEvent(drawnLayerRef.current, currParcelId.current);
    }

    setCurrParcel(position);
  }, [position]);

  return (
    <div id="map" style={{ height: "100vh" }} />
  )
}

export default MapContainer