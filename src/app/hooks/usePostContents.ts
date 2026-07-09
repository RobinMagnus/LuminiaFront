import { useEffect, useState } from 'react';
import { contents as mockContents } from '../data/mockData';
import { ContentItem, getPost, listPosts } from '../services/postService';

export function usePostContents() {
  const [contents, setContents] = useState<ContentItem[]>(mockContents);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    listPosts()
      .then(posts => {
        if (isMounted && posts.length) {
          setContents(posts);
        }
      })
      .catch(() => {
        if (isMounted) {
          setContents(mockContents);
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

  return { contents, isLoading };
}

export function usePostContent(id?: string) {
  const fallback = mockContents.find(item => item.id === id) || mockContents[0];
  const [content, setContent] = useState<ContentItem>(fallback);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    getPost(id)
      .then(post => {
        if (isMounted) {
          setContent(post);
        }
      })
      .catch(() => {
        if (isMounted) {
          setContent(fallback);
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
  }, [fallback, id]);

  return { content, isLoading };
}
