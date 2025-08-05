import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import { SudokuBoardComponent } from './components/SudokuBoard';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useSudokuWorker, SudokuBoard, Difficulty } from './hooks/useSudokuWorker';

function App() {
  const [board, setBoard] = useState<SudokuBoard>(Array(9).fill(null).map(() => Array(9).fill(0)));
  const [originalBoard, setOriginalBoard] = useState<SudokuBoard>(Array(9).fill(null).map(() => Array(9).fill(0)));
  const [errorCells, setErrorCells] = useState<Set<string>>(new Set());
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  const {
    solveSudoku,
    validateSudoku,
    generatePuzzle,
    testWorker,
    isWorkerReady,
    isLoading,
    error,
  } = useSudokuWorker();

  useEffect(() => {
    if (isWorkerReady) {
      setStatusMessage('Web Worker ready! 🎉');
      // Test the worker
      testWorker().then((message) => {
        console.log('Worker test:', message);
      }).catch(console.error);
    }
  }, [isWorkerReady, testWorker]);

  const handleCellChange = useCallback((row: number, col: number, value: number) => {
    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = value;
    setBoard(newBoard);
    setErrorCells(new Set()); // Clear errors when user makes changes
  }, [board]);

  const handleGeneratePuzzle = useCallback(async () => {
    try {
      setStatusMessage('Generating new puzzle...');
      const newPuzzle = await generatePuzzle(difficulty);
      setBoard(newPuzzle);
      setOriginalBoard(newPuzzle.map(row => [...row]));
      setErrorCells(new Set());
      setStatusMessage(`New ${difficulty} puzzle generated!`);
    } catch (err) {
      setStatusMessage('Failed to generate puzzle');
      console.error('Generate puzzle error:', err);
    }
  }, [generatePuzzle, difficulty]);

  const handleSolvePuzzle = useCallback(async () => {
    try {
      setStatusMessage('Solving puzzle...');
      const result = await solveSudoku(board);
      
      if (result.solved) {
        setBoard(result.solution);
        setStatusMessage('Puzzle solved! ✨');
      } else {
        setStatusMessage('No solution found for this puzzle');
      }
    } catch (err) {
      setStatusMessage('Failed to solve puzzle');
      console.error('Solve puzzle error:', err);
    }
  }, [solveSudoku, board]);

  const handleValidatePuzzle = useCallback(async () => {
    try {
      setStatusMessage('Validating puzzle...');
      const result = await validateSudoku(board);
      
      if (result.valid) {
        setStatusMessage('Puzzle is valid! ✓');
        setErrorCells(new Set());
      } else {
        setStatusMessage('Puzzle has errors ✗');
        if (result.row !== undefined && result.col !== undefined) {
          setErrorCells(new Set([`${result.row}-${result.col}`]));
        }
      }
    } catch (err) {
      setStatusMessage('Failed to validate puzzle');
      console.error('Validate puzzle error:', err);
    }
  }, [validateSudoku, board]);

  const handleResetPuzzle = useCallback(() => {
    setBoard(originalBoard.map(row => [...row]));
    setErrorCells(new Set());
    setStatusMessage('Puzzle reset');
  }, [originalBoard]);

  const handleClearBoard = useCallback(() => {
    const emptyBoard = Array(9).fill(null).map(() => Array(9).fill(0));
    setBoard(emptyBoard);
    setOriginalBoard(emptyBoard);
    setErrorCells(new Set());
    setStatusMessage('Board cleared');
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Sudoku with Web Workers</h1>
        <p className="subtitle">React + TypeScript + Web Workers Demo</p>
      </header>

      <main className="App-main">
        {!isWorkerReady ? (
          <div className="worker-status">
            <LoadingSpinner size="large" message="Initializing Web Worker..." />
          </div>
        ) : (
          <>
            <div className="status-section">
              {isLoading && <LoadingSpinner size="small" />}
              <p className={`status-message ${error ? 'error' : ''}`}>
                {error || statusMessage}
              </p>
            </div>

            <div className="game-section">
              <SudokuBoardComponent
                board={board}
                onCellChange={handleCellChange}
                highlightErrors={true}
                errorCells={errorCells}
              />
            </div>

            <div className="controls-section">
              <div className="difficulty-section">
                <label htmlFor="difficulty">Difficulty:</label>
                <select
                  id="difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                  disabled={isLoading}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div className="button-grid">
                <button 
                  onClick={handleGeneratePuzzle} 
                  disabled={isLoading}
                  className="primary-button"
                >
                  Generate Puzzle
                </button>
                
                <button 
                  onClick={handleSolvePuzzle} 
                  disabled={isLoading}
                  className="secondary-button"
                >
                  Solve Puzzle
                </button>
                
                <button 
                  onClick={handleValidatePuzzle} 
                  disabled={isLoading}
                  className="secondary-button"
                >
                  Validate
                </button>
                
                <button 
                  onClick={handleResetPuzzle} 
                  disabled={isLoading}
                  className="secondary-button"
                >
                  Reset
                </button>
                
                <button 
                  onClick={handleClearBoard} 
                  disabled={isLoading}
                  className="secondary-button"
                >
                  Clear Board
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="App-footer">
        <p>Powered by Web Workers for background computation</p>
      </footer>
    </div>
  );
}

export default App;
