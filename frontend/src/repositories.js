import axios from 'axios';

const BASE_URL = "http://localhost:8000";

export const getParcelAPI = async (lat, lng) => {
  const res = await axios.get(`${BASE_URL}/parcel?lat=${lat}&lng=${lng}`);
  return res.data;
}

export const computeAreaAPI = async (parcelId, user_polygons) => {
  const res = await axios.post(`${BASE_URL}/compute/${parcelId}`, { user_polygons });
  return res.data;
}