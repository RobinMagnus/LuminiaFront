import { apiFetch } from './api';

export type AutorComentario = {
  _id: string;
  nome: string;
  role: 'aluno' | 'professor';
};

export type Comentario = {
  _id: string;
  postId: string;
  conteudo: string;
  autor: AutorComentario;
  criadoEm: string;
  atualizadoEm: string;
  podeEditar: boolean;
  podeExcluir: boolean;
};

type ComentariosResponse = {
  dados: Comentario[];
};

type ComentarioResponse = {
  mensagem: string;
  dados: Comentario;
};

export function listarComentarios(postId: string) {
  return apiFetch<ComentariosResponse>(`/posts/${postId}/comentarios`);
}

export function criarComentario(postId: string, conteudo: string) {
  return apiFetch<ComentarioResponse>(`/posts/${postId}/comentarios`, {
    method: 'POST',
    body: JSON.stringify({ conteudo }),
  });
}

export function atualizarComentario(comentarioId: string, conteudo: string) {
  return apiFetch<ComentarioResponse>(`/comentarios/${comentarioId}`, {
    method: 'PUT',
    body: JSON.stringify({ conteudo }),
  });
}

export function excluirComentario(comentarioId: string) {
  return apiFetch<{ mensagem: string }>(`/comentarios/${comentarioId}`, {
    method: 'DELETE',
  });
}
