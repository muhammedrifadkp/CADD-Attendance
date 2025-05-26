// Simple popup utility to replace window.confirm and complex warning dialogs

export const showConfirm = (message, title = 'Confirm Action') => {
  return new Promise((resolve) => {
    // Create modal backdrop
    const backdrop = document.createElement('div')
    backdrop.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    backdrop.style.zIndex = '9999'

    // Create modal content
    const modal = document.createElement('div')
    modal.className = 'bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6'
    modal.innerHTML = `
      <div class="text-center">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">${title}</h3>
        <p class="text-sm text-gray-500 mb-6">${message}</p>
        <div class="flex space-x-3 justify-center">
          <button id="cancel-btn" class="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors">
            Cancel
          </button>
          <button id="confirm-btn" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
            Confirm
          </button>
        </div>
      </div>
    `

    backdrop.appendChild(modal)
    document.body.appendChild(backdrop)

    // Handle button clicks
    const confirmBtn = modal.querySelector('#confirm-btn')
    const cancelBtn = modal.querySelector('#cancel-btn')

    const cleanup = () => {
      document.body.removeChild(backdrop)
    }

    confirmBtn.addEventListener('click', () => {
      cleanup()
      resolve(true)
    })

    cancelBtn.addEventListener('click', () => {
      cleanup()
      resolve(false)
    })

    // Close on backdrop click
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        cleanup()
        resolve(false)
      }
    })

    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        cleanup()
        resolve(false)
        document.removeEventListener('keydown', handleEscape)
      }
    }
    document.addEventListener('keydown', handleEscape)
  })
}

export const showAlert = (message, title = 'Alert', type = 'info') => {
  return new Promise((resolve) => {
    // Create modal backdrop
    const backdrop = document.createElement('div')
    backdrop.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    backdrop.style.zIndex = '9999'

    // Determine icon and colors based on type
    let iconSvg, bgColor, textColor
    switch (type) {
      case 'error':
        bgColor = 'bg-red-100'
        textColor = 'text-red-600'
        iconSvg = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />`
        break
      case 'warning':
        bgColor = 'bg-yellow-100'
        textColor = 'text-yellow-600'
        iconSvg = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />`
        break
      case 'success':
        bgColor = 'bg-green-100'
        textColor = 'text-green-600'
        iconSvg = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />`
        break
      default:
        bgColor = 'bg-blue-100'
        textColor = 'text-blue-600'
        iconSvg = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />`
    }

    // Create modal content
    const modal = document.createElement('div')
    modal.className = 'bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6'
    modal.innerHTML = `
      <div class="text-center">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full ${bgColor} mb-4">
          <svg class="h-6 w-6 ${textColor}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            ${iconSvg}
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">${title}</h3>
        <p class="text-sm text-gray-500 mb-6">${message}</p>
        <button id="ok-btn" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          OK
        </button>
      </div>
    `

    backdrop.appendChild(modal)
    document.body.appendChild(backdrop)

    // Handle button click
    const okBtn = modal.querySelector('#ok-btn')

    const cleanup = () => {
      document.body.removeChild(backdrop)
    }

    okBtn.addEventListener('click', () => {
      cleanup()
      resolve(true)
    })

    // Close on backdrop click
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        cleanup()
        resolve(true)
      }
    })

    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        cleanup()
        resolve(true)
        document.removeEventListener('keydown', handleEscape)
      }
    }
    document.addEventListener('keydown', handleEscape)
  })
}

// Convenience methods
export const showError = (message, title = 'Error') => showAlert(message, title, 'error')
export const showWarning = (message, title = 'Warning') => showAlert(message, title, 'warning')
export const showSuccess = (message, title = 'Success') => showAlert(message, title, 'success')
export const showInfo = (message, title = 'Information') => showAlert(message, title, 'info')
