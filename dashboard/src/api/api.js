import axios from 'axios';

const API_BASE_URL=import.meta?.env?.VITE_API_BASE_URL ?? '/api';

const api=axios.create({
    baseURL: API_BASE_URL,
    headers:{
        'Content-Type':'application/json'
    },
    withCredentials:true  //this means we can transfer the cookies from the backend to the frontend
    
});

api.interceptors.response.use(
(responce)=>responce,
(error)=>
{   
    const isAuthRoute=error.config?.url?.includes('/auth');
    if(error.response?.status===401 && !isAuthRoute)
    {
        //dispatch an event to notify the application that the user is unauthorized
        window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error)
});

export const authApi={
    login:async (credentials)=>
    {
        const responce=await api.post('/auth/login',credentials);
        return responce.data;
    },

    register:async (userData)=>
    {
        const responce=await api.post('/auth/register',userData);
        return responce.data;
    },

    getProfile:async (options)=>
    {
        const responce=await api.get('/auth/profile',{signal:options?.signal});
        return responce.data;
    },
    logout:async ()=>
    {
        const responce=await api.post('/auth/logout');
        return responce.data;
    },

    updateProfile:async (profileData)=>
    {
        const responce=await api.put('/auth/profile',profileData);
        return responce.data;
    }
};

export const analyticsApi={
    getDashboard:async ()=>
    {
        const responce=await api.get('/analytics/dashboard');
        const payload=responce.data || {};

        payload.data=payload.data || {};

        payload.data.stats=payload.data.stats ?? {
            totalHits:0,
            avgLatency:0,
            errorRate:0,
            errorHits:0,
            successHits:0,
            uniqueServices:0,
            uniqueEndpoints:0,
        }
        payload.data.topEndpoints=payload.data.topEndpoints ?? [];
        payload.data.recentActivity=payload.data.recentActivity ?? payload.data.recentActivity ?? [];
        return payload;
    },
    getStats:async (params)=>
    {
        const responce=await api.get('/analytics/stats',{params});
        return responce.data;
    },

    getTopEndpoints:async (params)=>
    {
        const responce=await api.get('/analytics/top-endpoints',{params});
        return responce.data;
    },
    getTimeSeries:async (params)=>
    {
        const responce=await api.get('/analytics/time-series',{params});
        return responce.data;
    }
}

export const clientApi={
    getCurrentClient:async ()=>
    {
        const responce=await api.get("/clients/current");
        return responce.data;
    },

    getClientDashboard:async (clientId)=>
    {
        const params=clientId ? {clientId}:{};
        const responce=await api.get('/clients/dashboard',{params});
        return responce.data;
    },
     createClient: async (clientData) => {
        const response = await api.post('/admin/clients', clientData);
        return response.data;
    },
    getClients: async (params) => {
        const response = await api.get('/admin/clients', { params });
        return response.data;
    },
    createApiKey: async (clientId, keyData) => {
        const response = await api.post(`/admin/clients/${clientId}/api-keys`, keyData);
        return response.data;
    },
    getClientApiKeys: async (clientId) => {
        const response = await api.get(`/admin/clients/${clientId}/api-keys`);
        return response.data;
    },
}

export default api;




