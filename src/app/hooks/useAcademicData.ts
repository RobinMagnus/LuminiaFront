import { useCallback, useEffect, useState } from 'react';
import { getFriendlyErrorMessage } from '../services/api';

export function useAcademicData<T>(loader: () => Promise<T>, dependencies: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const reload = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try { setData(await loader()); }
    catch (loadError) { setError(getFriendlyErrorMessage(loadError)); }
    finally { setIsLoading(false); }
  }, dependencies);
  useEffect(() => { void reload(); }, [reload]);
  return { data, setData, isLoading, error, reload };
}
