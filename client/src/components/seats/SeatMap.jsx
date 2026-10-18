import React from 'react';
import SeatCell from './SeatCell';
import SeatLegend from './SeatLegend';
import { formatPaise } from '../../lib/currency';

export default function SeatMap({
  layout,
  seats = [],
  selectedSeats = [],
  onToggleSeat,
  selectable = true,
  showDetails = false,
  pricing = {},
}) {
  if (!layout || !layout.cells || layout.cells.length === 0) {
    return <div className="text-secondary text-center py-5">Screen layout not available.</div>;
  }

  // Create a fast lookup map for seats by seatLabel
  const seatMap = new Map();
  seats.forEach((s) => {
    seatMap.set(s.seatLabel, s);
  });

  // Group cells by row
  const rowLetters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const rowGroups = [];

  for (let r = 1; r <= layout.rows; r++) {
    const rowChar = rowLetters[r - 1] || `R${r}`;
    const cellsInRow = layout.cells.filter((c) => c.row === r).sort((a, b) => a.col - b.col);

    // Identify dominant category for this row
    const firstSeat = cellsInRow.find((c) => c.kind === 'SEAT' && c.label);
    const category = firstSeat ? firstSeat.category : 'REGULAR';

    rowGroups.push({
      rowNum: r,
      rowChar,
      category,
      cells: cellsInRow,
    });
  }

  // Detect category transitions to insert category dividers
  let lastCategory = null;

  return (
    <div className="seat-map-wrapper w-100 d-flex flex-column align-items-center py-4">
      {/* Screen Indicator */}
      <div className="w-100 text-center mb-5" style={{ maxWidth: '680px' }}>
        <div
          className="mx-auto"
          style={{
            height: '10px',
            borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
            backgroundColor: 'rgba(229, 9, 20, 0.4)',
            boxShadow: '0 -4px 20px rgba(229, 9, 20, 0.6)',
            width: '85%',
          }}
        />
        <div className="small text-secondary fw-bold text-uppercase letter-spacing-2 mt-2" style={{ letterSpacing: '4px', fontSize: '11px' }}>
          SCREEN THIS WAY
        </div>
      </div>

      {/* Seat Grid */}
      <div className="overflow-x-auto w-100 d-flex justify-content-center px-2 py-2">
        <div className="d-flex flex-column align-items-center" style={{ minWidth: 'max-content' }}>
          {rowGroups.map((group) => {
            const isNewCategory = group.category !== lastCategory;
            lastCategory = group.category;

            const categoryPrice = pricing[group.category];

            return (
              <React.Fragment key={`row-${group.rowNum}`}>
                {isNewCategory && (
                  <div className="w-100 d-flex align-items-center justify-content-center gap-3 my-3">
                    <div style={{ height: '1px', flex: 1, backgroundColor: 'var(--border-subtle)' }} />
                    <span className="badge bg-dark border border-secondary text-secondary px-3 py-1 text-uppercase fw-bold" style={{ fontSize: '10px', letterSpacing: '1px' }}>
                      {group.category} {categoryPrice ? `— ${formatPaise(categoryPrice)}` : ''}
                    </span>
                    <div style={{ height: '1px', flex: 1, backgroundColor: 'var(--border-subtle)' }} />
                  </div>
                )}

                <div className="d-flex align-items-center justify-content-center mb-1">
                  {/* Left Row Label */}
                  <span
                    className="text-secondary fw-bold me-3 text-center"
                    style={{ width: '22px', fontSize: '12px' }}
                    aria-hidden="true"
                  >
                    {group.rowChar}
                  </span>

                  {/* Cells */}
                  <div className="d-flex align-items-center">
                    {group.cells.map((cell) => (
                      <SeatCell
                        key={`cell-${cell.row}-${cell.col}`}
                        cell={cell}
                        seatData={seatMap.get(cell.label)}
                        isSelected={selectedSeats.includes(cell.label)}
                        onToggle={onToggleSeat}
                        selectable={selectable}
                        showDetails={showDetails}
                      />
                    ))}
                  </div>

                  {/* Right Row Label */}
                  <span
                    className="text-secondary fw-bold ms-3 text-center"
                    style={{ width: '22px', fontSize: '12px' }}
                    aria-hidden="true"
                  >
                    {group.rowChar}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <SeatLegend />
    </div>
  );
}
