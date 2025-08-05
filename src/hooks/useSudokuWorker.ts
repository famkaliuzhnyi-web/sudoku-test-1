import { useState, useCallback } from 'react';
import { useWebWorker } from './useWebWorker';

export type SudokuBoard = number[][];
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface SudokuSolution {
  solved: boolean;
  solution: SudokuBoard;
}

export interface SudokuValidation {
  valid: boolean;
  row?: number;
  col?: number;
}

export function useSudokuWorker() {
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onReady = useCallback(() => {
    setIsWorkerReady(true);
    setError(null);
  }, []);

  const onError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setIsWorkerReady(false);
  }, []);

  const { sendMessage, isReady, terminate } = useWebWorker({
    workerPath: '/sudoku.worker.js',
    onReady,
    onError
  });

  const solveSudoku = useCallback(async (board: SudokuBoard): Promise<SudokuSolution> => {
    if (!isReady()) {
      throw new Error('Worker not ready');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await sendMessage('solve', { board });
      return response.result as SudokuSolution;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to solve sudoku';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [sendMessage, isReady]);

  const validateSudoku = useCallback(async (board: SudokuBoard): Promise<SudokuValidation> => {
    if (!isReady()) {
      throw new Error('Worker not ready');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await sendMessage('validate', { board });
      return response.result as SudokuValidation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate sudoku';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [sendMessage, isReady]);

  const generatePuzzle = useCallback(async (difficulty: Difficulty = 'medium'): Promise<SudokuBoard> => {
    if (!isReady()) {
      throw new Error('Worker not ready');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await sendMessage('generate', { difficulty });
      return response.result.puzzle as SudokuBoard;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate puzzle';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [sendMessage, isReady]);

  const testWorker = useCallback(async (): Promise<string> => {
    if (!isReady()) {
      throw new Error('Worker not ready');
    }

    try {
      const response = await sendMessage('test');
      return response.result.message as string;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Worker test failed';
      setError(errorMessage);
      throw err;
    }
  }, [sendMessage, isReady]);

  return {
    solveSudoku,
    validateSudoku,
    generatePuzzle,
    testWorker,
    isWorkerReady,
    isLoading,
    error,
    terminate
  };
}