import React from 'react';
import './SudokuBoard.css';

export type SudokuBoard = number[][];

interface SudokuBoardProps {
  board: SudokuBoard;
  onCellChange?: (row: number, col: number, value: number) => void;
  readOnly?: boolean;
  highlightErrors?: boolean;
  errorCells?: Set<string>;
}

export const SudokuBoardComponent: React.FC<SudokuBoardProps> = ({
  board,
  onCellChange,
  readOnly = false,
  highlightErrors = false,
  errorCells = new Set()
}) => {
  const handleInputChange = (row: number, col: number, value: string) => {
    if (readOnly || !onCellChange) return;
    
    const numValue = value === '' ? 0 : parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0 || numValue > 9) return;
    
    onCellChange(row, col, numValue);
  };

  const getCellClassName = (row: number, col: number) => {
    const classes = ['sudoku-cell'];
    
    // Add border classes for 3x3 box separation
    if (row % 3 === 0) classes.push('border-top');
    if (col % 3 === 0) classes.push('border-left');
    if (row % 3 === 2) classes.push('border-bottom');
    if (col % 3 === 2) classes.push('border-right');
    
    // Add error highlighting
    if (highlightErrors && errorCells.has(`${row}-${col}`)) {
      classes.push('error');
    }
    
    // Add readonly class
    if (readOnly || board[row][col] !== 0) {
      classes.push('readonly');
    }
    
    return classes.join(' ');
  };

  return (
    <div className="sudoku-board">
      {board.map((row, rowIndex) => (
        <div key={rowIndex} className="sudoku-row">
          {row.map((cell, colIndex) => (
            <input
              key={`${rowIndex}-${colIndex}`}
              type="text"
              className={getCellClassName(rowIndex, colIndex)}
              value={cell === 0 ? '' : cell.toString()}
              onChange={(e) => handleInputChange(rowIndex, colIndex, e.target.value)}
              maxLength={1}
              readOnly={readOnly}
              inputMode="numeric"
              pattern="[1-9]"
            />
          ))}
        </div>
      ))}
    </div>
  );
};