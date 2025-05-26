import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ComputerDesktopIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline'

const ApplyBookingsResultModal = ({ isOpen, onClose, result }) => {
  if (!result) return null

  const { summary, createdBookings, conflicts, unavailablePCs, sourceDate, targetDate } = result

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
              <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
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
                        Booking Application Results
                      </Dialog.Title>
                      <p className="mt-1 text-sm text-gray-600">
                        Applied bookings from {sourceDate} to {targetDate}
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

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{summary.totalPreviousBookings}</div>
                      <div className="text-sm text-blue-700">Total Previous</div>
                    </div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{summary.appliedBookings}</div>
                      <div className="text-sm text-green-700">Successfully Applied</div>
                    </div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{summary.conflicts}</div>
                      <div className="text-sm text-yellow-700">Conflicts</div>
                    </div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{summary.unavailablePCs}</div>
                      <div className="text-sm text-red-700">Unavailable PCs</div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="max-h-96 overflow-y-auto space-y-6">
                  {/* Successfully Applied Bookings */}
                  {createdBookings && createdBookings.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-green-900 mb-3 flex items-center">
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        Successfully Applied Bookings ({createdBookings.length})
                      </h4>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {createdBookings.map((booking, index) => (
                            <div key={index} className="flex items-center justify-between bg-white rounded p-3 border border-green-100">
                              <div className="flex items-center">
                                <ComputerDesktopIcon className="h-4 w-4 text-green-600 mr-2" />
                                <span className="font-medium text-gray-900">{booking.pc?.pcNumber}</span>
                                <ClockIcon className="h-4 w-4 text-gray-400 ml-3 mr-1" />
                                <span className="text-sm text-gray-600">{getTimeSlotLabel(booking.timeSlot)}</span>
                              </div>
                              <div className="flex items-center">
                                <UserIcon className="h-4 w-4 text-gray-400 mr-1" />
                                <span className="text-sm text-gray-700">{booking.studentName || booking.bookedFor}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Conflicts */}
                  {conflicts && conflicts.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-yellow-900 mb-3 flex items-center">
                        <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                        Booking Conflicts ({conflicts.length})
                      </h4>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-700 mb-3">
                          These bookings could not be applied because the time slots were already occupied:
                        </p>
                        <div className="space-y-2">
                          {conflicts.map((conflict, index) => (
                            <div key={index} className="flex items-center justify-between bg-white rounded p-3 border border-yellow-100">
                              <div className="flex items-center">
                                <ComputerDesktopIcon className="h-4 w-4 text-yellow-600 mr-2" />
                                <span className="font-medium text-gray-900">{conflict.pcNumber}</span>
                                <ClockIcon className="h-4 w-4 text-gray-400 ml-3 mr-1" />
                                <span className="text-sm text-gray-600">{getTimeSlotLabel(conflict.timeSlot)}</span>
                              </div>
                              <div className="text-sm text-gray-700">
                                Wanted: {conflict.studentName} | Already booked
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Unavailable PCs */}
                  {unavailablePCs && unavailablePCs.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-red-900 mb-3 flex items-center">
                        <XCircleIcon className="h-5 w-5 mr-2" />
                        Unavailable PCs ({unavailablePCs.length})
                      </h4>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm text-red-700 mb-3">
                          These PCs were not available for booking:
                        </p>
                        <div className="space-y-2">
                          {unavailablePCs.map((pc, index) => (
                            <div key={index} className="flex items-center justify-between bg-white rounded p-3 border border-red-100">
                              <div className="flex items-center">
                                <ComputerDesktopIcon className="h-4 w-4 text-red-600 mr-2" />
                                <span className="font-medium text-gray-900">{pc.pcNumber}</span>
                              </div>
                              <div className="text-sm text-red-700">{pc.reason}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Success Message */}
                  {summary.appliedBookings > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                        <div>
                          <h4 className="text-sm font-medium text-green-900">Operation Completed Successfully</h4>
                          <p className="text-sm text-green-700 mt-1">
                            {summary.appliedBookings} out of {summary.totalPreviousBookings} bookings were successfully applied to {targetDate}.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

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

export default ApplyBookingsResultModal
