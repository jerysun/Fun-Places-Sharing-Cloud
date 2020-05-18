import { useState, useCallback, useRef, useEffect } from 'react';

export const useHttpClient = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(); // or useState(undefined); or useState('');

  const activeHttpRequests = useRef([]);

  // wrap it with useCallback to prevent sending a request from being an infinite
  // loop so this function never gets recreated when the component that uses this
  // hook rerenders. This function has no specific dependencies so I add an empty
  // array as a second argument to useCallback(), that means it will never be called
  // again until the next rendering of the component where it stays. Because we 
  // ensure this function never gets recreated, so won't have inefficient rerender
  // cycles or infinite loops at worst.
  const sendRequest = useCallback(async(url, method = 'GET', body = null, headers = {}) => {
    setIsLoading(true);
    const httpAbortCtrl = new AbortController();
    activeHttpRequests.current.push(httpAbortCtrl);

    try {
      const response = await fetch(url, {
        method,
        body,
        headers,
        signal: httpAbortCtrl.signal // we can use it to cancel this http request
      });

      const responseData = await response.json();
      // since we have got the response, canceling/aborting the req is impossible
      // and unnecessary, so we need to kick it out of the array(aka queue)
      activeHttpRequests.current = activeHttpRequests.current.filter(reqCtrl => reqCtrl !== httpAbortCtrl);
      if (!response.ok) {
        throw new Error(responseData.message);
      }

      return responseData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = () => setError(null);

  // called just before component unmount
  useEffect(() => {
    return () => activeHttpRequests.current.forEach(abortCtrl => abortCtrl.abort());
  }, []);

  // equivalent an instance that has 4 public memembers which can be properties or methods
  return { isLoading, error, sendRequest, clearError };
};
