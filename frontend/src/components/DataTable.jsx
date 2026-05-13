export default function DataTable({ columns, data, onRowClick }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-ms-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left text-xs font-medium text-ms-muted uppercase tracking-wider py-3 px-4"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-12 text-ms-muted">
                No data found
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={row.id || i}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-ms-border/50 transition-colors ${
                  onRowClick ? 'cursor-pointer hover:bg-ms-dark/50' : ''
                }`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="py-3 px-4 text-sm">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
