import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  CalendarDaysIcon,
  ClockIcon,
  ComputerDesktopIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { formatDateLong } from '../utils/dateUtils'

const ClearBookedSlotsModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  selectedDate,
  pcsByRow,
  loading 
}) => {
  const [clearOptions, setClearOptions] = useState({
    date: selectedDate,
    timeSlot: 'all',
    pcIds: [],
    clearAll: false
  })

  const timeSlots = [
    { value: 'all', label: 'All Time Slots' },
    { value: '09:00-10:30', label: '09:00 AM - 10:30 AM' },
    { value: '10:30-12:00', label: '10:30 AM - 12:00 PM' },
    { value: '12:00-13:30', label: '12:00 PM - 01:30 PM' },
    { value: '14:00-15:30', label: '02:00 PM - 03:30 PM' },
    { value: '15:30-17:00', label: '03:30 PM - 05:00 PM' }
  ]

  const handleConfirm = () => {
    onConfirm({
      ...clearOptions,
      confirmClear: true
    })
  }

  const handlePCSelection = (pcId, checked) => {
    setClearOptions(prev => ({
      ...prev,
      pcIds: checked 
        ? [...prev.pcIds, pcId]
        : prev.pcIds.filter(id => id !== pcId)
    }))
  }

  const handleSelectAllPCs = (checked) => {
    if (checked) {
      const allPCIds = Object.values(pcsByRow).flat().map(pc => pc._id)
      setClearOptions(prev => ({ ...prev, pcIds: allPCIds }))
    } else {
      setClearOptions(prev => ({ ...prev, pcIds: [] }))
    }
  }

  const allPCs = Object.values(pcsByRow).flat()
  const selectedPCCount = clearOptions.pcIds.length
  const allPCsSelected = selectedPCCount === allPCs.length && allPCs.length > 0

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
                    </div>
                    <div className="ml-4">
                      <Dialog.Title
                        as="h3"
                        className="text-xl font-bold leading-6 text-gray-900"
                      >
                        Clear Booked Slots
                      </Dialog.Title>
                      <p className="mt-1 text-sm text-gray-600">
                        Select criteria to clear booked slots in bulk
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cadd-red focus:ring-offset-2"
                    onClick={onClose}
                    disabled={loading}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                {/* Content */}
                <div className="space-y-6">
                  {/* Warning */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                      <div>
                        <h4 className="text-sm font-medium text-red-900">Warning</h4>
                        <p className="text-sm text-red-700 mt-1">
                          This action will permanently delete the selected bookings and cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Date Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <CalendarDaysIcon className="inline h-4 w-4 mr-1" />
                      Date
                    </label>
                    <input
                      type="date"
                      value={clearOptions.date}
                      onChange={(e) => setClearOptions(prev => ({ ...prev, date: e.target.value }))}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cadd-red focus:ring-cadd-red sm:text-sm"
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty to clear bookings for all dates
                    </p>
                  </div>

                  {/* Time Slot Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <ClockIcon className="inline h-4 w-4 mr-1" />
                      Time Slot
                    </label>
                    <select
                      value={clearOptions.timeSlot}
                      onChange={(e) => setClearOptions(prev => ({ ...prev, timeSlot: e.target.value }))}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cadd-red focus:ring-cadd-red sm:text-sm"
                      disabled={loading}
                    >
                      {timeSlots.map(slot => (
                        <option key={slot.value} value={slot.value}>
                          {slot.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* PC Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <ComputerDesktopIcon className="inline h-4 w-4 mr-1" />
                      PCs to Clear ({selectedPCCount} selected)
                    </label>
                    
                    {/* Select All Checkbox */}
                    <div className="mb-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={allPCsSelected}
                          onChange={(e) => handleSelectAllPCs(e.target.checked)}
                          className="rounded border-gray-300 text-cadd-red focus:ring-cadd-red"
                          disabled={loading}
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Select All PCs ({allPCs.length} total)
                        </span>
                      </label>
                    </div>

                    {/* PC Grid */}
                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                      {Object.entries(pcsByRow).map(([rowNumber, pcs]) => (
                        <div key={rowNumber} className="mb-4 last:mb-0">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Row {rowNumber}</h4>
                          <div className="grid grid-cols-4 gap-2">
                            {pcs.map(pc => (
                              <label key={pc._id} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={clearOptions.pcIds.includes(pc._id)}
                                  onChange={(e) => handlePCSelection(pc._id, e.target.checked)}
                                  className="rounded border-gray-300 text-cadd-red focus:ring-cadd-red"
                                  disabled={loading}
                                />
                                <span className="ml-1 text-xs text-gray-700">{pc.pcNumber}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-1">
                      Leave none selected to clear bookings for all PCs
                    </p>
                  </div>

                  {/* Summary */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Clear Summary</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Date: {clearOptions.date ? formatDateLong(new Date(clearOptions.date)) : 'All dates'}</li>
                      <li>• Time Slot: {timeSlots.find(slot => slot.value === clearOptions.timeSlot)?.label}</li>
                      <li>• PCs: {selectedPCCount > 0 ? `${selectedPCCount} selected PCs` : 'All PCs'}</li>
                    </ul>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 transition-colors"
                    onClick={onClose}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleConfirm}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                        Clearing...
                      </>
                    ) : (
                      <>
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Clear Bookings
                      </>
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export default ClearBookedSlotsModal
