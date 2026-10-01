import { useMemo } from 'react';

import { parseDelimitedTable } from '../converters/csv';

interface ISpreadsheetPreviewProps {
  content: string;
}

/**
 * Renders delimited-text (CSV/TSV/SV) artifact content as a read-only HTML
 * table. The CSV parser is the same one the download path uses, so what the
 * user sees matches what they get when they hit Download.
 *
 * Replaces an earlier Univer-based editor that rendered as an empty grid
 * whenever its heavy async bundle failed to mount — the lighter preview
 * either shows the data or an explicit empty state, so a blank card no
 * longer looks like a silent failure.
 */
export const SpreadsheetPreview = ({ content }: ISpreadsheetPreviewProps) => {
  const { rows } = useMemo(() => parseDelimitedTable(content), [content]);

  if (rows.length === 0) {
    return (
      <div className="ea:flex ea:h-full ea:min-h-[120px] ea:items-center ea:justify-center ea:text-sm ea:text-muted-foreground">
        Empty table
      </div>
    );
  }

  const [header, ...body] = rows;

  return (
    <div className="ea:max-h-[60vh] ea:w-full ea:overflow-auto ea:rounded-md ea:border ea:bg-card">
      <table className="ea:w-full ea:text-[13px]">
        <thead className="ea:sticky ea:top-0 ea:bg-muted/40">
          <tr>
            {header.map((cell, columnIndex) => (
              <th
                key={columnIndex}
                scope="col"
                className="ea:border-b ea:px-3 ea:py-1.5 ea:text-left ea:font-medium"
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, rowIndex) => (
            <tr key={rowIndex} className="ea:hover:bg-muted/20">
              {row.map((cell, columnIndex) => (
                <td
                  key={columnIndex}
                  className="ea:border-b ea:px-3 ea:py-1.5 ea:align-top"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
