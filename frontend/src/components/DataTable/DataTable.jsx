import cn from "../../utils/cn";
import "./DataTable.css";

/**
 * Table with a real <caption>, real <th scope>, and a stacked card layout
 * below 700px — the cells keep their headers through `data-label`, so a
 * narrow screen never leaves a number without its column name.
 */
export default function DataTable({
  columns,
  rows,
  caption,
  getRowKey = (row) => row.id,
  captionVisible = false,
  className,
}) {
  return (
    <div className={cn("dt", className)}>
      <table className="dt__table">
        <caption className={captionVisible ? "dt__caption" : "u-sr"}>{caption}</caption>

        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                style={column.align ? { textAlign: column.align } : undefined}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)}>
              {columns.map((column, index) => {
                const content = column.render ? column.render(row) : row[column.key];
                const style = column.align ? { textAlign: column.align } : undefined;

                return index === 0 ? (
                  <th
                    key={column.key}
                    scope="row"
                    data-label={column.label}
                    style={style}
                  >
                    {content}
                  </th>
                ) : (
                  <td key={column.key} data-label={column.label} style={style}>
                    {content}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}