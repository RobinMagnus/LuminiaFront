import { apiFetch } from './api';
import { Post } from '../types/api';

export type ContentItem = {
  id: string;
  authorId?: string;
  title: string;
  subject: string;
  className: string;
  teacher: string;
  publishedAt: string;
  text: string;
  related: string[];
  visibility: 'todos' | 'alunos' | 'professores';
  tags: string[];
};

export type PostPayload = {
  titulo: string;
  conteudo: string;
  disciplina?: string;
  tags?: string[];
  visivelPara?: 'todos' | 'alunos' | 'professores';
};

type PostMutationResponse = {
  mensagem: string;
  post: Post;
};

type PostsResponse = {
  dados: Post[];
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    itens: number;
    totalPaginas: number;
  };
};

function formatDate(value?: string) {
  if (!value) {
    return 'Hoje';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(value));
}

function mapPost(post: Post): ContentItem {
  return {
    id: post._id,
    authorId: post.autor?._id,
    title: post.titulo,
    subject: post.disciplina || 'Geral',
    className: 'Todas as turmas',
    teacher: post.autor?.nome || 'Professor',
    publishedAt: formatDate(post.createdAt),
    text: post.conteudo,
    related: post.tags?.length ? post.tags : ['Material complementar'],
    visibility: post.visivelPara || 'todos',
    tags: post.tags || [],
  };
}

export async function listPosts() {
  const response = await apiFetch<PostsResponse>('/posts');
  return response.dados.map(mapPost);
}

export async function getPost(id: string) {
  const post = await apiFetch<Post>(`/posts/${id}`);
  return mapPost(post);
}

export async function createPost(payload: PostPayload) {
  const response = await apiFetch<PostMutationResponse>('/posts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return {
    mensagem: response.mensagem,
    post: mapPost(response.post),
  };
}

export async function updatePost(id: string, payload: PostPayload) {
  const response = await apiFetch<PostMutationResponse>(`/posts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  return {
    mensagem: response.mensagem,
    post: mapPost(response.post),
  };
}

export function deletePost(id: string) {
  return apiFetch<{ mensagem: string }>(`/posts/${id}`, {
    method: 'DELETE',
  });
}
