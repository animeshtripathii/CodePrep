const getBackendUrl = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  if (backendUrl && !backendUrl.includes('vercel.app') && !backendUrl.includes('localhost:5173')) {
    return backendUrl;
  }
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl && !apiUrl.includes('vercel.app') && !apiUrl.includes('localhost:5173')) {
    return apiUrl;
  }
  return 'https://codeprep-1kzd.onrender.com';
};

export default getBackendUrl;
