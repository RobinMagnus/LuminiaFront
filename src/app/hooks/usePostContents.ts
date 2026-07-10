import { useCallback, useEffect, useState } from 'react';
import { getFriendlyErrorMessage } from '../services/api';
import { ContentItem, getPost, listPosts } from '../services/postService';

export function usePostContents() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loadPosts = useCallback(() => {
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
          setError(getFriendlyErrorMessage(error));
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

  useEffect(() => loadPosts(), [loadPosts]);

  return { contents, isLoading, error, setContents, setError, reload: loadPosts };
}

export function usePostContent(id?: string) {
  const [content, setContent] = useState<ContentItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loadPost = useCallback(() => {
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
          setError(getFriendlyErrorMessage(error));
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

  useEffect(() => loadPost(), [loadPost]);

  return { content, isLoading, error, reload: loadPost };
}
