import { useRef, useCallback, useEffect } from 'react';

export interface WorkerMessage {
  id: string;
  type: string;
  data?: any;
}

export interface WorkerResponse {
  id: string;
  type: 'success' | 'error' | 'ready';
  result?: any;
  error?: string;
  message?: string;
}

export interface UseWebWorkerOptions {
  workerPath: string;
  onReady?: () => void;
  onError?: (error: string) => void;
}

export function useWebWorker({ workerPath, onReady, onError }: UseWebWorkerOptions) {
  const workerRef = useRef<Worker | null>(null);
  const pendingMessages = useRef<Map<string, (response: WorkerResponse) => void>>(new Map());
  const messageIdCounter = useRef(0);

  // Initialize worker
  useEffect(() => {
    if (!workerRef.current) {
      try {
        workerRef.current = new Worker(workerPath);
        
        workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
          const response = event.data;
          
          if (response.type === 'ready') {
            onReady?.();
          } else if (response.id) {
            const callback = pendingMessages.current.get(response.id);
            if (callback) {
              callback(response);
              pendingMessages.current.delete(response.id);
            }
          }
        };
        
        workerRef.current.onerror = (error) => {
          const errorMessage = error.message || 'Worker error occurred';
          onError?.(errorMessage);
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create worker';
        onError?.(errorMessage);
      }
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
      pendingMessages.current.clear();
    };
  }, [workerPath, onReady, onError]);

  // Send message to worker
  const sendMessage = useCallback((type: string, data?: any): Promise<WorkerResponse> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const id = `msg_${++messageIdCounter.current}`;
      const message: WorkerMessage = { id, type, data };

      // Set up timeout (30 seconds)
      const timeoutId = setTimeout(() => {
        pendingMessages.current.delete(id);
        reject(new Error(`Worker timeout: no response received for ${type} after 30 seconds`));
      }, 30000);

      pendingMessages.current.set(id, (response: WorkerResponse) => {
        clearTimeout(timeoutId);
        if (response.type === 'error') {
          reject(new Error(response.error || 'Worker error'));
        } else {
          resolve(response);
        }
      });

      workerRef.current.postMessage(message);
    });
  }, []);

  // Check if worker is ready
  const isReady = useCallback(() => {
    return workerRef.current !== null;
  }, []);

  return {
    sendMessage,
    isReady,
    terminate: () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      pendingMessages.current.clear();
    }
  };
}