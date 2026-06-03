import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { toast } from 'sonner';

export const useUrls = () => {
  return useQuery({
    queryKey: ['urls'],
    queryFn: async () => {
      const response = await api.get('/api/urls');
      return response.data.urls;
    }
  });
};

export const useCreateUrl = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (urlData) => {
      const response = await api.post('/api/urls', urlData);
      return response.data.url;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['urls']);
      toast.success('URL shortened successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create URL');
    }
  });
};

export const useDeleteUrl = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, clickTs }) => {
      const requestStart = performance.now();
      console.log('[DELETE TIMING] network_start_ms', Math.round(requestStart - clickTs));
      await api.delete(`/api/urls/${id}`);
      const requestEnd = performance.now();
      console.log('[DELETE TIMING] network_request_ms', Math.round(requestEnd - requestStart));
    },
    onMutate: async ({ id, clickTs }) => {
      const mutateStart = performance.now();
      console.log('[DELETE TIMING] ui_to_mutation_ms', Math.round(mutateStart - clickTs));
      await queryClient.cancelQueries({ queryKey: ['urls'] });
      const previousUrls = queryClient.getQueryData(['urls']);
      queryClient.setQueryData(['urls'], (old = []) => old.filter((url) => url._id !== id));
      return { previousUrls, mutateStart };
    },
    onSuccess: () => {
      toast.success('URL deleted successfully!');
    },
    onError: (error, _variables, context) => {
      if (context?.previousUrls) {
        queryClient.setQueryData(['urls'], context.previousUrls);
      }
      toast.error(error.response?.data?.message || 'Failed to delete URL');
    },
    onSettled: async (_data, _error, _variables, context) => {
      const refetchStart = performance.now();
      await queryClient.invalidateQueries({ queryKey: ['urls'] });
      const refetchEnd = performance.now();
      console.log('[DELETE TIMING] invalidate_refetch_ms', Math.round(refetchEnd - refetchStart));
      if (context?.mutateStart) {
        console.log('[DELETE TIMING] mutation_to_settled_ms', Math.round(refetchEnd - context.mutateStart));
      }
    },
  });
};

export const useBulkUpload = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (urls) => {
      const response = await api.post('/api/bulk/upload', { urls });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['urls'] });
      const created = data.createdUrls?.length ?? 0;
      const failed = data.errors?.length ?? 0;
      if (created > 0) {
        toast.success(`Created ${created} short link${created === 1 ? '' : 's'}`);
      }
      if (failed > 0 && created === 0) {
        toast.error('No links were created');
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Bulk upload failed');
    },
  });
};

export const useUpdateUrl = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/api/urls/${id}`, data);
      return response.data.url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['urls']);
      toast.success('URL updated successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update URL');
    }
  });
};
