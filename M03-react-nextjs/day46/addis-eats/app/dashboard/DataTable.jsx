// Day 46. The numbers behind a chart, as a table beneath it.
//
// A screen reader cannot read an SVG's bars, a keyboard cannot hover a
// tooltip, and nobody can copy a value out of a picture. The sheet's honest
// fix is the same data as a table — and most sighted people use it too, to
// check the exact figure the chart only shows the shape of.
//
// A server component: it is plain markup with no state, rendered from the
// same summarised rows the chart is given, so the two can never disagree.
// `columns` says what each column is called, whether it is a number (right
// aligned) and how to print it.
export default function DataTable({ caption, columns, rows, rowKey }) {
  const [rowHeader, ...rest] = columns;
  return (
    <table className="data-table">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.key} scope="col" className={column.numeric ? "num" : undefined}>
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row[rowKey]}>
            <th scope="row">{row[rowHeader.key]}</th>
            {rest.map((column) => (
              <td key={column.key} className={column.numeric ? "num" : undefined}>
                {column.format ? column.format(row[column.key]) : row[column.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
