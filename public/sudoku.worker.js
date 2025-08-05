// Sudoku Web Worker
// This worker handles computational tasks for sudoku solving and validation

// Simple sudoku solver using backtracking algorithm
function solveSudoku(board) {
  const size = 9;
  
  function isValid(board, row, col, num) {
    // Check row
    for (let i = 0; i < size; i++) {
      if (board[row][i] === num) return false;
    }
    
    // Check column
    for (let i = 0; i < size; i++) {
      if (board[i][col] === num) return false;
    }
    
    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[boxRow + i][boxCol + j] === num) return false;
      }
    }
    
    return true;
  }
  
  function solve(board) {
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (board[row][col] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isValid(board, row, col, num)) {
              board[row][col] = num;
              if (solve(board)) return true;
              board[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }
  
  const solution = board.map(row => [...row]);
  const solved = solve(solution);
  return { solved, solution };
}

// Validate a sudoku board
function validateSudoku(board) {
  const size = 9;
  
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const num = board[row][col];
      if (num !== 0) {
        board[row][col] = 0; // Temporarily remove the number
        
        // Check if placing the number is valid
        let valid = true;
        
        // Check row
        for (let i = 0; i < size; i++) {
          if (board[row][i] === num) {
            valid = false;
            break;
          }
        }
        
        // Check column
        if (valid) {
          for (let i = 0; i < size; i++) {
            if (board[i][col] === num) {
              valid = false;
              break;
            }
          }
        }
        
        // Check 3x3 box
        if (valid) {
          const boxRow = Math.floor(row / 3) * 3;
          const boxCol = Math.floor(col / 3) * 3;
          for (let i = 0; i < 3 && valid; i++) {
            for (let j = 0; j < 3 && valid; j++) {
              if (board[boxRow + i][boxCol + j] === num) {
                valid = false;
              }
            }
          }
        }
        
        board[row][col] = num; // Put the number back
        
        if (!valid) {
          return { valid: false, row, col };
        }
      }
    }
  }
  
  return { valid: true };
}

// Generate a random sudoku puzzle
function generatePuzzle(difficulty = 'medium') {
  const difficultyLevels = {
    easy: 36,
    medium: 28,
    hard: 20
  };
  
  const cellsToFill = difficultyLevels[difficulty] || 28;
  
  // Start with empty board
  const board = Array(9).fill().map(() => Array(9).fill(0));
  
  // Fill diagonal boxes first (they don't interfere with each other)
  function fillDiagonalBoxes() {
    for (let box = 0; box < 9; box += 3) {
      fillBox(box, box);
    }
  }
  
  function fillBox(row, col) {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const randomIndex = Math.floor(Math.random() * numbers.length);
        board[row + i][col + j] = numbers[randomIndex];
        numbers.splice(randomIndex, 1);
      }
    }
  }
  
  fillDiagonalBoxes();
  
  // Solve the rest
  solveSudoku(board);
  
  // Remove numbers to create puzzle
  const filledCells = [];
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      filledCells.push([i, j]);
    }
  }
  
  // Shuffle and remove cells
  for (let i = filledCells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [filledCells[i], filledCells[j]] = [filledCells[j], filledCells[i]];
  }
  
  const cellsToRemove = 81 - cellsToFill;
  for (let i = 0; i < cellsToRemove; i++) {
    const [row, col] = filledCells[i];
    board[row][col] = 0;
  }
  
  return board;
}

// Message handler
self.onmessage = function(e) {
  const { type, data, id } = e.data;
  
  try {
    let result;
    
    switch (type) {
      case 'solve':
        result = solveSudoku(data.board);
        break;
      case 'validate':
        result = validateSudoku(data.board);
        break;
      case 'generate':
        result = { puzzle: generatePuzzle(data.difficulty) };
        break;
      case 'test':
        result = { message: 'Web worker is working!' };
        break;
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
    
    self.postMessage({
      id,
      type: 'success',
      result
    });
  } catch (error) {
    self.postMessage({
      id,
      type: 'error',
      error: error.message
    });
  }
};

// Send ready message
self.postMessage({
  type: 'ready',
  message: 'Sudoku worker initialized'
});