import axios from "axios";

const devApiPort = import.meta.env.VITE_API_PORT || "5000";
const isLoopbackHost = (host) => host === "localhost" || host === "127.0.0.1";

const resolveApiBaseURL = () => {
    const envUrl = import.meta.env.VITE_API_URL;
    if (!envUrl) {
        return `http://${window.location.hostname}:${devApiPort}`;
    }

    try {
        const parsed = new URL(envUrl);
        // If env points to localhost but app is opened from LAN/phone, rewrite host automatically.
        if (isLoopbackHost(parsed.hostname) && !isLoopbackHost(window.location.hostname)) {
            parsed.hostname = window.location.hostname;
            return parsed.origin;
        }
        return parsed.origin;
    } catch {
        return envUrl;
    }
};

const apiBaseURL = resolveApiBaseURL();
const fallbackLocalPort = devApiPort === "5000" ? "10000" : "5000";

export const API_BASE_URL = apiBaseURL;
export const API_DEV_PORT = devApiPort;

const axiosClient = axios.create({
    // Use explicit env when provided; otherwise default to current host for local LAN dev.
    baseURL: apiBaseURL,
    withCredentials: true, // This MUST be true for the JWT cookie to be stored
    headers: {
        "Content-Type": "application/json",
    },
});

axiosClient.interceptors.request.use((config) => {
    try {
        const token = localStorage.getItem("codeprep_auth_token");
        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch {
        // Ignore storage failures.
    }
    return config;
});

// In local dev, if one common API port is unreachable, retry once with the other.
axiosClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const shouldRetryLocalFallback =
            error?.code === "ERR_NETWORK" &&
            error?.config &&
            !error.config.__retriedWithFallbackPort;

        if (!shouldRetryLocalFallback) {
            return Promise.reject(error);
        }

        try {
            const fallbackBase = `http://${window.location.hostname}:${fallbackLocalPort}`;
            const retriedConfig = {
                ...error.config,
                __retriedWithFallbackPort: true,
                baseURL: fallbackBase,
            };
            return await axiosClient.request(retriedConfig);
        } catch (retryError) {
            return Promise.reject(retryError);
        }
    }
);

export default axiosClient;