import axios from "axios";

const api = axios.create({
  baseURL: "https://interview-assistant-o0kj.onrender.com",
  withCredentials: true,
  timeout: 30000,
});

export default api;
