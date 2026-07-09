import { apiFetch } from './api';

type BackendPost = {
  _id: string;
  titulo: string;
  conteudo: string;
  disciplina?: string;
  autor?: {
    nome?: string;
  };
  tags?: string[];
  createdAt?: string;
};

export type ContentItem = {
  id: string;
  title: string;
  subject: string;
  className: string;
  teacher: string;
  publishedAt: string;
  text: string;
  related: string[];
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

function mapPost(post: BackendPost): ContentItem {
  return {
    id: post._id,
    title: post.titulo,
    subject: post.disciplina || 'Geral',
    className: 'Todas as turmas',
    teacher: post.autor?.nome || 'Professor',
    publishedAt: formatDate(post.createdAt),
    text: post.conteudo,
    related: post.tags?.length ? post.tags : ['Material complementar'],
  };
}

export async function listPosts() {
  const posts = await apiFetch<BackendPost[]>('/posts');
  return posts.map(mapPost);
}

export async function getPost(id: string) {
  const post = await apiFetch<BackendPost>(`/posts/${id}`);
  return mapPost(post);
}
