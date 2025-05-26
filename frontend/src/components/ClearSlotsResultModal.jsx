import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  XMarkIcon,
  CheckCircleIcon,
  TrashIcon,
  ComputerDesktopIcon,
  ClockIcon,
  UserIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline'

const ClearSlotsResultModal = ({ isOpen, onClose, result }) => {
  if (!result) return null

  const { clearedCount, criteria, clearedBookings } = result

  const getTimeSlotLabel = (slot) => {
    const [start, end] = slot.split('-')
    return `${start} - ${end}`
  }

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
                      <CheckCircleIcon className="h-8 w-8 text-green-500" />
                    </div>
                    <div className="ml-4">
                      <Dialog.Title
                        as="h3"
                        className="text-xl font-bold leading-6 text-gray-900"
                      >
                        Clear Bookings Results
                      </Dialog.Title>
                      <p className="mt-1 text-sm text-gray-600">
                        Successfully cleared {clearedCount} booked slot{clearedCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cadd-red focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                {/* Summary Card */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <TrashIcon className="h-5 w-5 text-green-600 mr-2" />
                    <div>
                      <h4 className="text-sm font-medium text-green-900">
                        Bulk Clear Operation Completed
                      </h4>
                      <p className="text-sm text-green-700 mt-1">
                        {clearedCount} booking{clearedCount !== 1 ? 's were' : ' was'} successfully removed from the system.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Criteria Summary */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Clear Criteria Applied</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center">
                      <CalendarDaysIcon className="h-4 w-4 text-gray-500 mr-2" />
                      <div>
                        <div className="text-xs text-gray-500">Date</div>
                        <div className="text-sm font-medium text-gray-900">{criteria.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 text-gray-500 mr-2" />
                      <div>
                        <div className="text-xs text-gray-500">Time Slot</div>
                        <div className="text-sm font-medium text-gray-900">{criteria.timeSlot}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <ComputerDesktopIcon className="h-4 w-4 text-gray-500 mr-2" />
                      <div>
                        <div className="text-xs text-gray-500">PCs</div>
                        <div className="text-sm font-medium text-gray-900">{criteria.pcCount}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cleared Bookings List */}
                {clearedBookings && clearedBookings.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      Cleared Bookings ({clearedBookings.length})
                    </h4>
                    
                    <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                      <div className="divide-y divide-gray-200">
                        {clearedBookings.map((booking, index) => (
                          <div key={booking.id || index} className="p-4 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center">
                                  <ComputerDesktopIcon className="h-4 w-4 text-gray-400 mr-1" />
                                  <span className="font-medium text-gray-900">{booking.pcNumber}</span>
                                </div>
                                
                                <div className="flex items-center">
                                  <ClockIcon className="h-4 w-4 text-gray-400 mr-1" />
                                  <span className="text-sm text-gray-600">
                                    {getTimeSlotLabel(booking.timeSlot)}
                                  </span>
                                </div>
                                
                                <div className="flex items-center">
                                  <UserIcon className="h-4 w-4 text-gray-400 mr-1" />
                                  <span className="text-sm text-gray-600">{booking.studentName}</span>
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <div className="text-sm text-gray-900">{booking.date}</div>
                                {booking.bookedBy && (
                                  <div className="text-xs text-gray-500">by {booking.bookedBy}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* No Bookings Message */}
                {clearedCount === 0 && (
                  <div className="text-center py-8">
                    <ComputerDesktopIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No Bookings Cleared</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No bookings matched the specified criteria.
                    </p>
                  </div>
                )}

                {/* Success Message */}
                {clearedCount > 0 && (
                  <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                      <div>
                        <h4 className="text-sm font-medium text-green-900">Operation Completed Successfully</h4>
                        <p className="text-sm text-green-700 mt-1">
                          The lab schedule has been updated. All cleared slots are now available for new bookings.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-cadd-red px-4 py-2 text-sm font-medium text-white hover:bg-cadd-pink focus:outline-none focus-visible:ring-2 focus-visible:ring-cadd-red focus-visible:ring-offset-2 transition-colors"
                    onClick={onClose}
                  >
                    Close
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

export default ClearSlotsResultModal
