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
          toast.success(options.successMessage)
        }
        if (options.invalidateQueries) {
          options.invalidateQueries.forEach(key => {
            queryClient.invalidateQueries({ queryKey: key })
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
        queryClient.invalidateQueries({ queryKey: key })
      })
    } else {
      queryClient.invalidateQueries({ queryKey: keys })
    }
  }

  const setQueryData = (key, data) => {
    queryClient.setQueryData(key, data)
  }

  const removeQueries = (keys) => {
    if (Array.isArray(keys)) {
      keys.forEach(key => {
        queryClient.removeQueries({ queryKey: key })
      })
    } else {
      queryClient.removeQueries({ queryKey: keys })
    }
  }

  const prefetchQuery = (key, fetchFn) => {
    return queryClient.prefetchQuery({
      queryKey: key,
      queryFn: fetchFn
    })
  }

  return {
    useApiQuery,
    useApiMutation,
    invalidateQueries,
    setQueryData,
    removeQueries,
    prefetchQuery
  }
}