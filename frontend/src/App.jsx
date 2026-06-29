import { useEffect, useRef, useState } from 'react';
import { getParcelAPI, computeAreaAPI } from './repositories';
import MapContainer from './components/MapContainer';
import ResultContainer from './components/ResultContainer';
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import './App.css'

function App() {
  const [results, setResults] = useState(null);

  const handlePostShapeEvent = async (drawnLayer, parcelId) => {
    const drawn_polygons = drawnLayer.toGeoJSON().features;
    // const geojson = layer.toGeoJSON();
    console.log("DRAWN:", drawn_polygons);

    if (!parcelId) return;

    // Send to backend
    try {
      const res = await computeAreaAPI(parcelId, drawn_polygons);
      console.log("RESULT:", res);
      setResults(res);
    }
    catch (err) {
      console.error("Error:", err);
    }
  }

  return (
    <div className='relative'>
      <ResultContainer results={results} />
      <MapContainer handlePostShapeEvent={handlePostShapeEvent} results={results} />
    </div>
  );
}

export default App;