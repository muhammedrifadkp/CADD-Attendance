import React from 'react'

const ResponsiveTable = ({ 
  headers, 
  data, 
  className = '',
  striped = true,
  hover = true,
  compact = false,
  renderRow,
  emptyMessage = 'No data available'
}) => {
  const tableClasses = compact 
    ? 'min-w-full divide-y divide-gray-200 text-sm'
    : 'min-w-full divide-y divide-gray-200'

  const headerClasses = compact
    ? 'px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
    : 'px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'

  const cellClasses = compact
    ? 'px-3 py-2 whitespace-nowrap text-sm'
    : 'px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm'

  const rowClasses = hover 
    ? 'hover:bg-gray-50 transition-colors duration-200'
    : ''

  return (
    <div className="table-container overflow-x-auto -webkit-overflow-scrolling-touch">
      <table className={`mobile-table ${tableClasses} ${className}`}>
        <thead className="bg-gray-50">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className={`table-cell ${headerClasses}`}
                scope="col"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={`bg-white divide-y divide-gray-200 ${striped ? 'divide-y divide-gray-200' : ''}`}>
          {data.length === 0 ? (
            <tr>
              <td 
                colSpan={headers.length} 
                className={`${cellClasses} text-center text-gray-500 py-8`}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr 
                key={index} 
                className={`table-row ${rowClasses} ${striped && index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
              >
                {renderRow ? renderRow(row, index) : (
                  Object.values(row).map((cell, cellIndex) => (
                    <td key={cellIndex} className={`table-cell ${cellClasses}`}>
                      {cell}
                    </td>
                  ))
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default ResponsiveTable
