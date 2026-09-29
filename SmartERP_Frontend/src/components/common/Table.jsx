import Loading from "./Loading.jsx";

export default function Table({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = "No records found",
  keyField = "id",
}) {
  if (loading) {
    return (
      <div className="table-container">
        <Loading message="Loading data..." />
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="erp-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th
                key={col.key || idx}
                style={col.style}
                className={col.align ? `text-${col.align}` : ""}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center"
                style={{ padding: "32px 16px", color: "var(--text-muted)" }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr key={row[keyField] ?? rowIdx}>
                {columns.map((col, colIdx) => (
                  <td
                    key={col.key || colIdx}
                    style={col.style}
                    className={col.align ? `text-${col.align}` : ""}
                  >
                    {col.render ? col.render(row, rowIdx) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
