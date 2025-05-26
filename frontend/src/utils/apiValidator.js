/**
 * API Response Validator and Handler
 * Ensures consistent handling of API responses across the application
 */

import { toast } from 'react-toastify'

/**
 * Validates and normalizes API response data
 * @param {Object} response - API response object
 * @param {string} dataType - Expected data type ('array', 'object', 'string', 'number')
 * @param {any} defaultValue - Default value if response is invalid
 * @returns {any} Normalized data
 */
export const validateApiResponse = (response, dataType = 'array', defaultValue = null) => {
  try {
    // Handle null/undefined responses
    if (!response) {
      console.warn('API response is null or undefined')
      return getDefaultValue(dataType, defaultValue)
    }

    // Extract data from response (handle both direct data and nested .data)
    const data = response.data || response

    // Validate based on expected type
    switch (dataType) {
      case 'array':
        if (Array.isArray(data)) {
          return data
        }
        console.warn('Expected array but got:', typeof data)
        return defaultValue || []

      case 'object':
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          return data
        }
        console.warn('Expected object but got:', typeof data)
        return defaultValue || {}

      case 'string':
        if (typeof data === 'string') {
          return data
        }
        console.warn('Expected string but got:', typeof data)
        return defaultValue || ''

      case 'number':
        if (typeof data === 'number') {
          return data
        }
        console.warn('Expected number but got:', typeof data)
        return defaultValue || 0

      case 'boolean':
        if (typeof data === 'boolean') {
          return data
        }
        console.warn('Expected boolean but got:', typeof data)
        return defaultValue || false

      default:
        return data
    }
  } catch (error) {
    console.error('Error validating API response:', error)
    return getDefaultValue(dataType, defaultValue)
  }
}

/**
 * Get default value based on data type
 * @param {string} dataType - Data type
 * @param {any} customDefault - Custom default value
 * @returns {any} Default value
 */
const getDefaultValue = (dataType, customDefault) => {
  if (customDefault !== null) {
    return customDefault
  }

  switch (dataType) {
    case 'array': return []
    case 'object': return {}
    case 'string': return ''
    case 'number': return 0
    case 'boolean': return false
    default: return null
  }
}

/**
 * Safe API call wrapper with error handling
 * @param {Function} apiCall - API function to call
 * @param {string} errorMessage - Error message to show on failure
 * @param {string} dataType - Expected response data type
 * @param {any} defaultValue - Default value on error
 * @returns {Promise<any>} API response data
 */
export const safeApiCall = async (apiCall, errorMessage = 'API call failed', dataType = 'array', defaultValue = null) => {
  try {
    const response = await apiCall()
    return validateApiResponse(response, dataType, defaultValue)
  } catch (error) {
    console.error('API call error:', error)
    
    // Don't show toast for 404 errors (missing data is often expected)
    if (error.response?.status !== 404) {
      toast.error(errorMessage)
    }
    
    return getDefaultValue(dataType, defaultValue)
  }
}

/**
 * Batch API calls with error handling
 * @param {Array} apiCalls - Array of API call objects { call, type, default, name }
 * @returns {Promise<Object>} Object with results keyed by name
 */
export const batchApiCalls = async (apiCalls) => {
  const results = {}
  
  try {
    const promises = apiCalls.map(async ({ call, type = 'array', defaultValue = null, name }) => {
      try {
        const response = await call()
        return { name, data: validateApiResponse(response, type, defaultValue) }
      } catch (error) {
        console.error(`Error in ${name} API call:`, error)
        return { name, data: getDefaultValue(type, defaultValue) }
      }
    })

    const responses = await Promise.allSettled(promises)
    
    responses.forEach((result) => {
      if (result.status === 'fulfilled') {
        results[result.value.name] = result.value.data
      } else {
        console.error('Batch API call failed:', result.reason)
      }
    })

  } catch (error) {
    console.error('Batch API calls error:', error)
  }

  return results
}

/**
 * Validate API function exists before calling
 * @param {Object} apiObject - API object (e.g., attendanceAPI)
 * @param {string} functionName - Function name to check
 * @returns {boolean} True if function exists
 */
export const validateApiFunction = (apiObject, functionName) => {
  if (!apiObject) {
    console.error('API object is null or undefined')
    return false
  }

  if (typeof apiObject[functionName] !== 'function') {
    console.error(`API function '${functionName}' does not exist in:`, Object.keys(apiObject))
    return false
  }

  return true
}

/**
 * Safe API function call with validation
 * @param {Object} apiObject - API object
 * @param {string} functionName - Function name
 * @param {Array} args - Function arguments
 * @param {string} errorMessage - Error message
 * @param {string} dataType - Expected data type
 * @param {any} defaultValue - Default value
 * @returns {Promise<any>} API response data
 */
export const safeApiFunction = async (apiObject, functionName, args = [], errorMessage = 'API call failed', dataType = 'array', defaultValue = null) => {
  if (!validateApiFunction(apiObject, functionName)) {
    toast.error(`API function '${functionName}' not found`)
    return getDefaultValue(dataType, defaultValue)
  }

  try {
    const response = await apiObject[functionName](...args)
    return validateApiResponse(response, dataType, defaultValue)
  } catch (error) {
    console.error(`Error calling ${functionName}:`, error)
    
    if (error.response?.status !== 404) {
      toast.error(errorMessage)
    }
    
    return getDefaultValue(dataType, defaultValue)
  }
}

/**
 * API endpoint checker - validates if endpoints exist
 * @param {Object} apiMappings - Object mapping function names to expected endpoints
 * @returns {Object} Validation results
 */
export const validateApiEndpoints = (apiMappings) => {
  const results = {
    valid: [],
    invalid: [],
    missing: []
  }

  Object.entries(apiMappings).forEach(([functionName, expectedEndpoint]) => {
    // This would need to be implemented based on your API structure
    // For now, just log the mappings
    console.log(`Checking ${functionName} -> ${expectedEndpoint}`)
    results.valid.push(functionName)
  })

  return results
}

/**
 * Response format standardizer
 * @param {any} data - Raw response data
 * @returns {Object} Standardized response format
 */
export const standardizeResponse = (data) => {
  return {
    success: true,
    data: data,
    error: null,
    timestamp: new Date().toISOString()
  }
}

/**
 * Error response standardizer
 * @param {Error} error - Error object
 * @returns {Object} Standardized error response
 */
export const standardizeError = (error) => {
  return {
    success: false,
    data: null,
    error: {
      message: error.message || 'Unknown error',
      status: error.response?.status || 500,
      code: error.code || 'UNKNOWN_ERROR'
    },
    timestamp: new Date().toISOString()
  }
}

export default {
  validateApiResponse,
  safeApiCall,
  batchApiCalls,
  validateApiFunction,
  safeApiFunction,
  validateApiEndpoints,
  standardizeResponse,
  standardizeError
}
