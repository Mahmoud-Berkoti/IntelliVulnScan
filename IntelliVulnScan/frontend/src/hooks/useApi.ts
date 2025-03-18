import { useState, useEffect, useCallback } from 'react';
import { AxiosResponse, AxiosError } from 'axios';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface ApiHook<T> extends ApiState<T> {
  execute: (...args: any[]) => Promise<T | void>;
  reset: () => void;
}

interface ErrorResponse {
  detail?: string;
  message?: string;
}

/**
 * Custom hook for making API calls with loading, error, and data states
 * @param apiFunction - The API function to call
 * @param immediate - Whether to call the API function immediately
 * @param initialArgs - Initial arguments to pass to the API function
 * @returns Object containing data, loading, error states and execute/reset functions
 */
function useApi<T>(
  apiFunction: (...args: any[]) => Promise<AxiosResponse<T>>,
  immediate: boolean = false,
  initialArgs: any[] = []
): ApiHook<T> {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const execute = useCallback(
    async (...args: any[]) => {
      setState((prevState: ApiState<T>) => ({ ...prevState, loading: true, error: null }));
      
      try {
        const response = await apiFunction(...args);
        setState({
          data: response.data,
          loading: false,
          error: null,
        });
        return response.data;
      } catch (err) {
        const error = err as AxiosError<ErrorResponse>;
        const errorMessage = 
          error.response?.data?.detail || 
          error.response?.data?.message || 
          error.message || 
          'An unexpected error occurred';
        
        setState({
          data: null,
          loading: false,
          error: errorMessage,
        });
        
        throw error;
      }
    },
    [apiFunction]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  useEffect(() => {
    if (immediate) {
      execute(...initialArgs);
    }
  }, [execute, immediate, initialArgs]);

  return {
    ...state,
    execute,
    reset,
  };
}

export default useApi; 