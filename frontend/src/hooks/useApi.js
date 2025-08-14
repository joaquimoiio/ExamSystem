import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'

export const useApi = () => {
  const queryClient = useQueryClient()

  const useApiQuery = (key, fetchFn, options = {}) => {
    return useQuery({
      queryKey: key,
      queryFn: fetchFn,
      onError: (error) => {
        if (!options.silent) {
          const message = error.response?.data?.message || 'Erro ao carregar dados'
          toast.error(message)
        }
      },
      ...options
    })
  }

  const useApiMutation = (mutationFn, options = {}) => {
    return useMutation({
      mutationFn,
      onSuccess: (data, variables) => {
        if (options.successMessage) {
          const message = typeof options.successMessage === 'function' 
            ? options.successMessage(data, variables)
            : options.successMessage
          toast.success(message)
        }
        
        if (options.invalidateQueries) {
          options.invalidateQueries.forEach(query => {
            if (typeof query === 'object' && query.queryKey) {
              // Novo padrão: { queryKey: ['subjects'] }
              queryClient.invalidateQueries(query)
            } else if (Array.isArray(query)) {
              // Padrão antigo: ['subjects']
              queryClient.invalidateQueries({ queryKey: query })
            } else {
              // String simples
              queryClient.invalidateQueries({ queryKey: [query] })
            }
          })
        }
        
        if (options.onSuccess) {
          options.onSuccess(data, variables)
        }
      },
      onError: (error) => {
        const message = error.response?.data?.message || options.errorMessage || 'Erro na operação'
        toast.error(message)
        if (options.onError) {
          options.onError(error)
        }
      },
      ...options
    })
  }

  const invalidateQueries = (keys) => {
    if (Array.isArray(keys)) {
      keys.forEach(key => {
        if (typeof key === 'object' && key.queryKey) {
          queryClient.invalidateQueries(key)
        } else {
          queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] })
        }
      })
    } else if (typeof keys === 'object' && keys.queryKey) {
      queryClient.invalidateQueries(keys)
    } else {
      queryClient.invalidateQueries({ queryKey: Array.isArray(keys) ? keys : [keys] })
    }
  }

  const setQueryData = (key, data) => {
    queryClient.setQueryData(key, data)
  }

  const removeQueries = (keys) => {
    if (Array.isArray(keys)) {
      keys.forEach(key => {
        if (typeof key === 'object' && key.queryKey) {
          queryClient.removeQueries(key)
        } else {
          queryClient.removeQueries({ queryKey: Array.isArray(key) ? key : [key] })
        }
      })
    } else if (typeof keys === 'object' && keys.queryKey) {
      queryClient.removeQueries(keys)
    } else {
      queryClient.removeQueries({ queryKey: Array.isArray(keys) ? keys : [keys] })
    }
  }

  const prefetchQuery = (key, fetchFn) => {
    return queryClient.prefetchQuery({
      queryKey: key,
      queryFn: fetchFn
    })
  }

  const refetchQueries = (keys) => {
    if (Array.isArray(keys)) {
      keys.forEach(key => {
        if (typeof key === 'object' && key.queryKey) {
          queryClient.refetchQueries(key)
        } else {
          queryClient.refetchQueries({ queryKey: Array.isArray(key) ? key : [key] })
        }
      })
    } else if (typeof keys === 'object' && keys.queryKey) {
      queryClient.refetchQueries(keys)
    } else {
      queryClient.refetchQueries({ queryKey: Array.isArray(keys) ? keys : [keys] })
    }
  }

  return {
    useApiQuery,
    useApiMutation,
    invalidateQueries,
    setQueryData,
    removeQueries,
    prefetchQuery,
    refetchQueries
  }
}