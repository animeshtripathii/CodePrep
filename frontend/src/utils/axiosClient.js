import axios from "axios";

const axiosClient = axios.create({
    // Ensure this exactly matches your Render URL
    baseURL: import.meta.env.VITE_API_URL || "https://codeprep-1kzd.onrender.com",
    withCredentials: true, // This MUST be true for the JWT cookie to be stored
    headers: {
        "Content-Type": "application/json",
    },
});

export default axiosClient;