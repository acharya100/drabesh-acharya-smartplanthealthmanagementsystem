
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000/api/",
});

// Add a request interceptor to attach the token
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export const login = (formData) => API.post("auth/login/", formData);
export const register = (formData) => API.post("auth/register/", formData);

export default API;
