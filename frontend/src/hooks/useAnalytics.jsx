import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';

const handleAnalyticsError = (error) => {
  const message =
    error?.response?.status === 503
      ? 'Analytics service is temporarily unavailable. Please try again later.'
      : error?.response?.status === 401
        ? 'Session expired. Please log in again.'
        : error?.response?.status === 404
          ? 'Analytics data not found for this link.'
          : error?.message?.includes('Network Error')
            ? 'Unable to reach the server. Check your connection.'
            : 'Failed to load analytics data. Please try again.';
  console.error('[Analytics Error]', message, error?.response?.status, error?.message);
  return { error: true, message };
};

export const useAnalytics = (urlId) => {
  return useQuery({
    queryKey: ['analytics', urlId],
    queryFn: async () => {
      console.log('[Analytics API] Fetching analytics', { urlId });
      const response = await api.get(`/api/analytics/${urlId}`);
      console.log('[Analytics API] Analytics response', {
        urlId,
        totalClicks: response.data?.analytics?.totalClicks,
        visits: response.data?.analytics?.visits?.length || 0,
        lastVisit: response.data?.analytics?.lastVisit || null,
      });
      return response.data.analytics;
    },
    enabled: !!urlId,
    retry: 2,
    staleTime: 30_000,
  });
};

export const useWorkspaceAnalytics = () => {
  return useQuery({
    queryKey: ['analytics', 'workspace'],
    queryFn: async () => {
      console.log('[Analytics API] Fetching workspace analytics');
      const response = await api.get('/api/analytics/workspace');
      console.log('[Analytics API] Workspace analytics response', {
        totalClicks: response.data?.analytics?.totalClicks,
        visits: response.data?.analytics?.visits?.length || 0,
        lastVisit: response.data?.analytics?.lastVisit || null,
      });
      return response.data.analytics;
    }
  });
};

export const useVisits = (urlId) => {
  return useQuery({
    queryKey: ['visits', urlId],
    queryFn: async () => {
      console.log('[Analytics API] Fetching visits', { urlId });
      const response = await api.get(`/api/analytics/${urlId}/visits`);
      console.log('[Analytics API] Visits response', {
        urlId,
        visits: response.data?.visits?.length || 0,
      });
      return response.data.visits;
    },
    enabled: !!urlId
  });
};

export const useTrends = (urlId) => {
  return useQuery({
    queryKey: ['trends', urlId],
    queryFn: async () => {
      console.log('[Trends API] Fetching trends', { urlId });
      const response = await api.get(`/api/analytics/${urlId}/trends`);
      console.log('[Trends API] Trends response', {
        urlId,
        dailyPoints: response.data?.trends?.daily?.length || 0,
        weeklyPoints: response.data?.trends?.weekly?.length || 0,
        monthlyPoints: response.data?.trends?.monthly?.length || 0,
        trends: response.data?.trends,
      });
      return response.data.trends;
    },
    enabled: !!urlId
  });
};

export const useWorkspaceTrends = () => {
  return useQuery({
    queryKey: ['trends', 'workspace'],
    queryFn: async () => {
      console.log('[Trends API] Fetching workspace trends');
      const response = await api.get('/api/analytics/workspace/trends');
      console.log('[Trends API] Workspace trends response', {
        dailyPoints: response.data?.trends?.daily?.length || 0,
        weeklyPoints: response.data?.trends?.weekly?.length || 0,
        monthlyPoints: response.data?.trends?.monthly?.length || 0,
        trends: response.data?.trends,
      });
      return response.data.trends;
    }
  });
};

export const useCountryBreakdown = (urlId) => {
  return useQuery({
    queryKey: ['countryBreakdown', urlId || 'workspace'],
    queryFn: async () => {
      const endpoint = urlId
        ? `/api/analytics/${urlId}/countries`
        : '/api/analytics/workspace/countries';
      const response = await api.get(endpoint);
      return response.data.breakdown;
    }
  });
};

export const useReferrerBreakdown = (urlId) => {
  return useQuery({
    queryKey: ['referrerBreakdown', urlId || 'workspace'],
    queryFn: async () => {
      const endpoint = urlId
        ? `/api/analytics/${urlId}/referrers`
        : '/api/analytics/workspace/referrers';
      const response = await api.get(endpoint);
      return response.data.breakdown;
    }
  });
};
