import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'react-hot-toast'

/**
 * Enhanced data fetching hook with caching, error handling, and retry logic
 */
export const useDataFetching = (
  fetchFunction,
  dependencies = [],
  options = {}
) => {
  const {
    initialData = null,
    enableCache = true,
    cacheKey = null,
    retryAttempts = 3,
    retryDelay = 1000,
    showErrorToast = true,
    showSuccessToast = false,
    onSuccess = null,
    onError = null,
    immediate = true
  } = options

  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastFetch, setLastFetch] = useState(null)
  
  const retryCountRef = useRef(0)
  const cacheRef = useRef(new Map())
  const abortControllerRef = useRef(null)

  // Generate cache key
  const getCacheKey = useCallback(() => {
    if (cacheKey) return cacheKey
    return `${fetchFunction.name || 'fetch'}-${JSON.stringify(dependencies)}`
  }, [cacheKey, fetchFunction, dependencies])

  // Check cache
  const getCachedData = useCallback(() => {
    if (!enableCache) return null
    const key = getCacheKey()
    const cached = cacheRef.current.get(key)
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutes cache
      return cached.data
    }
    return null
  }, [enableCache, getCacheKey])

  // Set cache
  const setCachedData = useCallback((newData) => {
    if (!enableCache) return
    const key = getCacheKey()
    cacheRef.current.set(key, {
      data: newData,
      timestamp: Date.now()
    })
  }, [enableCache, getCacheKey])

  // Fetch data with retry logic
  const fetchData = useCallback(async (showLoading = true) => {
    // Check cache first
    const cachedData = getCachedData()
    if (cachedData) {
      setData(cachedData)
      setError(null)
      return cachedData
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    if (showLoading) {
      setLoading(true)
    }
    setError(null)

    try {
      let result
      
      // Handle different function signatures
      if (typeof fetchFunction === 'function') {
        if (dependencies.length > 0) {
          result = await fetchFunction(...dependencies, {
            signal: abortControllerRef.current.signal
          })
        } else {
          result = await fetchFunction({
            signal: abortControllerRef.current.signal
          })
        }
      } else {
        throw new Error('fetchFunction must be a function')
      }

      // Handle different response formats
      const responseData = result?.data || result
      
      setData(responseData)
      setCachedData(responseData)
      setLastFetch(Date.now())
      retryCountRef.current = 0

      if (showSuccessToast) {
        toast.success('Data loaded successfully')
      }

      if (onSuccess) {
        onSuccess(responseData)
      }

      return responseData

    } catch (err) {
      // Don't handle aborted requests
      if (err.name === 'AbortError') {
        return
      }

      console.error('Data fetching error:', err)
      
      // Retry logic
      if (retryCountRef.current < retryAttempts) {
        retryCountRef.current++
        console.log(`Retrying... Attempt ${retryCountRef.current}/${retryAttempts}`)
        
        setTimeout(() => {
          fetchData(false) // Don't show loading on retry
        }, retryDelay * retryCountRef.current)
        
        return
      }

      // Set error after all retries failed
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch data'
      setError(errorMessage)

      if (showErrorToast) {
        toast.error(errorMessage)
      }

      if (onError) {
        onError(err)
      }

      throw err

    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }, [
    fetchFunction,
    dependencies,
    getCachedData,
    setCachedData,
    retryAttempts,
    retryDelay,
    showErrorToast,
    showSuccessToast,
    onSuccess,
    onError
  ])

  // Refresh data (bypass cache)
  const refresh = useCallback(async () => {
    // Clear cache
    if (enableCache) {
      const key = getCacheKey()
      cacheRef.current.delete(key)
    }
    
    return await fetchData(true)
  }, [fetchData, enableCache, getCacheKey])

  // Manual trigger
  const trigger = useCallback(async (...args) => {
    // Update dependencies if provided
    if (args.length > 0) {
      dependencies.splice(0, dependencies.length, ...args)
    }
    return await fetchData(true)
  }, [fetchData, dependencies])

  // Effect to fetch data on mount and dependency changes
  useEffect(() => {
    if (immediate && fetchFunction) {
      fetchData(true)
    }

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchFunction, immediate, ...dependencies])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    data,
    loading,
    error,
    lastFetch,
    refresh,
    trigger,
    fetchData
  }
}

/**
 * Hook for fetching multiple data sources
 */
export const useMultipleDataFetching = (fetchConfigs = []) => {
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const newResults = {}
    const newErrors = {}

    try {
      const promises = fetchConfigs.map(async (config) => {
        const { key, fetchFunction, dependencies = [], options = {} } = config
        
        try {
          let result
          if (dependencies.length > 0) {
            result = await fetchFunction(...dependencies)
          } else {
            result = await fetchFunction()
          }
          
          newResults[key] = result?.data || result
          return { key, success: true, data: result?.data || result }
        } catch (error) {
          console.error(`Error fetching ${key}:`, error)
          newErrors[key] = error.message || 'Failed to fetch data'
          newResults[key] = options.fallbackData || null
          return { key, success: false, error }
        }
      })

      await Promise.allSettled(promises)
      
    } catch (error) {
      console.error('Error in batch fetch:', error)
    } finally {
      setResults(newResults)
      setErrors(newErrors)
      setLoading(false)
    }
  }, [fetchConfigs])

  useEffect(() => {
    if (fetchConfigs.length > 0) {
      fetchAll()
    }
  }, [fetchAll])

  return {
    results,
    loading,
    errors,
    refetch: fetchAll
  }
}

/**
 * Hook for paginated data fetching
 */
export const usePaginatedDataFetching = (
  fetchFunction,
  initialParams = {},
  options = {}
) => {
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchPage = useCallback(async (page = 1, params = {}) => {
    setLoading(true)
    setError(null)

    try {
      const result = await fetchFunction({
        ...initialParams,
        ...params,
        page,
        limit: pagination.limit
      })

      const responseData = result?.data || result
      
      if (Array.isArray(responseData)) {
        setData(responseData)
      } else if (responseData?.data && Array.isArray(responseData.data)) {
        setData(responseData.data)
        setPagination(prev => ({
          ...prev,
          page: responseData.page || page,
          total: responseData.total || responseData.data.length,
          totalPages: responseData.totalPages || Math.ceil((responseData.total || responseData.data.length) / prev.limit)
        }))
      }

    } catch (err) {
      console.error('Paginated fetch error:', err)
      setError(err.message || 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [fetchFunction, initialParams, pagination.limit])

  const nextPage = useCallback(() => {
    if (pagination.page < pagination.totalPages) {
      fetchPage(pagination.page + 1)
    }
  }, [fetchPage, pagination.page, pagination.totalPages])

  const prevPage = useCallback(() => {
    if (pagination.page > 1) {
      fetchPage(pagination.page - 1)
    }
  }, [fetchPage, pagination.page])

  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchPage(page)
    }
  }, [fetchPage, pagination.totalPages])

  useEffect(() => {
    fetchPage(1)
  }, [])

  return {
    data,
    pagination,
    loading,
    error,
    nextPage,
    prevPage,
    goToPage,
    refresh: () => fetchPage(pagination.page)
  }
}

export default useDataFetching
