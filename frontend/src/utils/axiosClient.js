// frontend/src/utils/axiosClient.js
import axios from 'axios';
import getBackendUrl from './backendUrl';

const axiosClient = axios.create({
    baseURL: getBackendUrl(),
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

export default axiosClient;
