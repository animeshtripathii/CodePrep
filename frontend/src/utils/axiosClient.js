import axios from "axios";

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "https://codeprep-1kzd.onrender.com",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
    },
});

axiosClient.interceptors.request.use(config => {
    if (config.method === 'get') {
        config.params = {
            ...config.params,
            _t: new Date().getTime()
        };
    }
    return config;
});




export default axiosClient;

