/**
 * Component Dependency Resolver
 * Handles component loading, lazy loading, and dependency management
 */

import React, { lazy, Suspense, useState, useEffect } from 'react'

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
  </div>
)

// Error boundary component
class ComponentErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Component Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-medium">Component Error</h3>
          <p className="text-red-600 text-sm mt-1">
            {this.state.error?.message || 'Something went wrong loading this component'}
          </p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Lazy load component with error boundary and loading state
 */
export const createLazyComponent = (importFunction, fallback = <LoadingSpinner />) => {
  const LazyComponent = lazy(importFunction)
  
  return (props) => (
    <ComponentErrorBoundary>
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    </ComponentErrorBoundary>
  )
}

/**
 * Component registry for managing dynamic imports
 */
class ComponentRegistry {
  constructor() {
    this.components = new Map()
    this.loadingStates = new Map()
    this.errors = new Map()
  }

  // Register a component
  register(name, importFunction) {
    this.components.set(name, {
      importFunction,
      component: null,
      loaded: false
    })
  }

  // Load a component
  async load(name) {
    if (!this.components.has(name)) {
      throw new Error(`Component '${name}' not registered`)
    }

    const componentInfo = this.components.get(name)
    
    if (componentInfo.loaded) {
      return componentInfo.component
    }

    if (this.loadingStates.get(name)) {
      // Already loading, wait for it
      return new Promise((resolve, reject) => {
        const checkLoaded = () => {
          const info = this.components.get(name)
          if (info.loaded) {
            resolve(info.component)
          } else if (this.errors.has(name)) {
            reject(this.errors.get(name))
          } else {
            setTimeout(checkLoaded, 100)
          }
        }
        checkLoaded()
      })
    }

    this.loadingStates.set(name, true)
    this.errors.delete(name)

    try {
      const module = await componentInfo.importFunction()
      const component = module.default || module
      
      componentInfo.component = component
      componentInfo.loaded = true
      
      this.loadingStates.set(name, false)
      return component
      
    } catch (error) {
      this.loadingStates.set(name, false)
      this.errors.set(name, error)
      throw error
    }
  }

  // Get component if loaded
  get(name) {
    const componentInfo = this.components.get(name)
    return componentInfo?.loaded ? componentInfo.component : null
  }

  // Check if component is loaded
  isLoaded(name) {
    return this.components.get(name)?.loaded || false
  }

  // Check if component is loading
  isLoading(name) {
    return this.loadingStates.get(name) || false
  }

  // Get loading error
  getError(name) {
    return this.errors.get(name)
  }

  // Preload components
  async preload(names) {
    const promises = names.map(name => this.load(name).catch(err => {
      console.warn(`Failed to preload component '${name}':`, err)
      return null
    }))
    
    return Promise.allSettled(promises)
  }
}

// Global component registry
export const componentRegistry = new ComponentRegistry()

/**
 * Register common components
 */
export const registerCommonComponents = () => {
  // Admin components
  componentRegistry.register('AdminDashboard', () => import('../pages/admin/Dashboard'))
  componentRegistry.register('AdminsList', () => import('../pages/admin/admins/AdminsList'))
  componentRegistry.register('TeachersList', () => import('../pages/admin/teachers/TeachersList'))
  componentRegistry.register('StudentsList', () => import('../pages/admin/students/StudentsList'))
  componentRegistry.register('DepartmentsList', () => import('../pages/admin/departments/DepartmentsList'))
  componentRegistry.register('CoursesList', () => import('../pages/admin/courses/CoursesList'))
  componentRegistry.register('BatchesList', () => import('../pages/teacher/batches/BatchesList'))
  
  // Teacher components
  componentRegistry.register('TeacherDashboard', () => import('../pages/teacher/Dashboard'))
  componentRegistry.register('AttendancePage', () => import('../pages/teacher/AttendancePage'))
  componentRegistry.register('LabAvailability', () => import('../pages/teacher/LabAvailability'))
  
  // Lab components
  componentRegistry.register('LabOverview', () => import('../pages/admin/LabOverview'))
  componentRegistry.register('LabOverviewFixed', () => import('../pages/admin/LabOverviewFixed'))
  componentRegistry.register('LabTeacherDashboard', () => import('../pages/lab-teacher/Dashboard'))
  
  // Form components
  componentRegistry.register('StudentForm', () => import('../pages/teacher/students/StudentForm'))
  componentRegistry.register('BatchForm', () => import('../pages/teacher/batches/BatchForm'))
  componentRegistry.register('TeacherForm', () => import('../pages/admin/teachers/TeacherForm'))
}

/**
 * Dynamic component loader hook
 */
export const useDynamicComponent = (componentName) => {
  const [component, setComponent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadComponent = async () => {
      if (!componentName) return

      // Check if already loaded
      const existingComponent = componentRegistry.get(componentName)
      if (existingComponent) {
        setComponent(existingComponent)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const loadedComponent = await componentRegistry.load(componentName)
        setComponent(loadedComponent)
      } catch (err) {
        console.error(`Failed to load component '${componentName}':`, err)
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    loadComponent()
  }, [componentName])

  return { component, loading, error }
}

/**
 * Component dependency checker
 */
export const checkComponentDependencies = () => {
  const results = {
    missing: [],
    circular: [],
    valid: []
  }

  // Check for missing components in App.jsx routes
  const routeComponents = [
    'AdminDashboard', 'TeacherDashboard', 'Login',
    'AdminsList', 'TeachersList', 'StudentsList',
    'DepartmentsList', 'CoursesList', 'BatchesList',
    'LabOverview', 'LabAvailability'
  ]

  routeComponents.forEach(componentName => {
    if (componentRegistry.isLoaded(componentName)) {
      results.valid.push(componentName)
    } else {
      results.missing.push(componentName)
    }
  })

  return results
}

/**
 * Preload critical components
 */
export const preloadCriticalComponents = async () => {
  const criticalComponents = [
    'AdminDashboard',
    'TeacherDashboard',
    'Login'
  ]

  console.log('Preloading critical components...')
  
  try {
    await componentRegistry.preload(criticalComponents)
    console.log('Critical components preloaded successfully')
  } catch (error) {
    console.warn('Some critical components failed to preload:', error)
  }
}

/**
 * Component performance monitor
 */
export const monitorComponentPerformance = () => {
  const performanceData = {
    loadTimes: new Map(),
    renderCounts: new Map(),
    errorCounts: new Map()
  }

  const startTime = performance.now()
  
  return {
    recordLoadTime: (componentName) => {
      const endTime = performance.now()
      const loadTime = endTime - startTime
      performanceData.loadTimes.set(componentName, loadTime)
      console.log(`Component '${componentName}' loaded in ${loadTime.toFixed(2)}ms`)
    },
    
    recordRender: (componentName) => {
      const count = performanceData.renderCounts.get(componentName) || 0
      performanceData.renderCounts.set(componentName, count + 1)
    },
    
    recordError: (componentName, error) => {
      const count = performanceData.errorCounts.get(componentName) || 0
      performanceData.errorCounts.set(componentName, count + 1)
      console.error(`Component '${componentName}' error #${count + 1}:`, error)
    },
    
    getReport: () => ({
      loadTimes: Object.fromEntries(performanceData.loadTimes),
      renderCounts: Object.fromEntries(performanceData.renderCounts),
      errorCounts: Object.fromEntries(performanceData.errorCounts)
    })
  }
}

// Initialize component registry
registerCommonComponents()

export default {
  createLazyComponent,
  componentRegistry,
  useDynamicComponent,
  checkComponentDependencies,
  preloadCriticalComponents,
  monitorComponentPerformance
}
