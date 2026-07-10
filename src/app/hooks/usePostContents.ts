import { useEffect, useState } from 'react';
import { ContentItem, getPost, listPosts } from '../services/postService';

export function usePostContents() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    setError('');
    listPosts()
      .then(posts => {
        if (isMounted) {
          setContents(posts);
        }
      })
      .catch(error => {
        if (isMounted) {
          setError(error instanceof Error ? error.message : 'Não foi possível carregar os conteúdos.');
          setContents([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { contents, isLoading, error, setContents, setError };
}

export function usePostContent(id?: string) {
  const [content, setContent] = useState<ContentItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError('');

    getPost(id)
      .then(post => {
        if (isMounted) {
          setContent(post);
        }
      })
      .catch(error => {
        if (isMounted) {
          setContent(null);
          setError(error instanceof Error ? error.message : 'Não foi possível carregar o conteúdo.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  return { content, isLoading, error };
}
