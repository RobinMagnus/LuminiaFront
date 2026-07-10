import React, { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../services/api';
import {
  Comentario,
  atualizarComentario,
  criarComentario,
  excluirComentario,
  listarComentarios,
} from '../services/comentarioService';
import { useAuth } from '../contexts/AuthContext';
import { Badge, Button, Card } from './ui';

const LIMITE_COMENTARIO = 1000;

function formatarData(data: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(data));
}

function mensagemErro(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return 'Sua sessão expirou. Faça login novamente.';
    }

    if (error.status === 403) {
      return 'Você não possui permissão para esta ação.';
    }

    if (error.status === 404) {
      return 'O recurso solicitado não existe ou foi removido.';
    }

    return error.message;
  }

  return 'Não foi possível conectar à API. Verifique sua conexão e tente novamente.';
}

export const ComentariosSection = ({ postId }: { postId: string }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [novoComentario, setNovoComentario] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comentarioEditando, setComentarioEditando] = useState<string | null>(null);
  const [textoEdicao, setTextoEdicao] = useState('');
  const [acaoEmAndamento, setAcaoEmAndamento] = useState<string | null>(null);

  const tratarErro = (error: unknown) => {
    const texto = mensagemErro(error);
    setErro(texto);

    if (error instanceof ApiError && error.status === 401) {
      logout();
      navigate('/', { replace: true });
    }
  };

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    setErro('');

    listarComentarios(postId)
      .then(response => {
        if (isMounted) {
          setComentarios(response.dados);
        }
      })
      .catch(error => {
        if (isMounted) {
          tratarErro(error);
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
  }, [postId]);

  const handleCriarComentario = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const conteudo = novoComentario.trim();
    setErro('');
    setSucesso('');

    if (!conteudo) {
      setErro('O conteúdo do comentário é obrigatório.');
      return;
    }

    if (conteudo.length > LIMITE_COMENTARIO) {
      setErro('O comentário deve ter no máximo 1000 caracteres.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await criarComentario(postId, conteudo);
      setComentarios(items => [...items, response.dados]);
      setNovoComentario('');
      setSucesso(response.mensagem);
    } catch (error) {
      tratarErro(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const iniciarEdicao = (comentario: Comentario) => {
    setComentarioEditando(comentario._id);
    setTextoEdicao(comentario.conteudo);
    setErro('');
    setSucesso('');
  };

  const salvarEdicao = async (comentarioId: string) => {
    const conteudo = textoEdicao.trim();
    setErro('');
    setSucesso('');

    if (!conteudo) {
      setErro('O conteúdo do comentário é obrigatório.');
      return;
    }

    if (conteudo.length > LIMITE_COMENTARIO) {
      setErro('O comentário deve ter no máximo 1000 caracteres.');
      return;
    }

    setAcaoEmAndamento(comentarioId);

    try {
      const response = await atualizarComentario(comentarioId, conteudo);
      setComentarios(items => items.map(item => item._id === comentarioId ? response.dados : item));
      setComentarioEditando(null);
      setTextoEdicao('');
      setSucesso(response.mensagem);
    } catch (error) {
      tratarErro(error);
    } finally {
      setAcaoEmAndamento(null);
    }
  };

  const removerComentario = async (comentarioId: string) => {
    const confirmou = window.confirm('Excluir este comentário? Esta ação não pode ser desfeita.');

    if (!confirmou) {
      return;
    }

    setErro('');
    setSucesso('');
    setAcaoEmAndamento(comentarioId);

    try {
      const response = await excluirComentario(comentarioId);
      setComentarios(items => items.filter(item => item._id !== comentarioId));
      setSucesso(response.mensagem);
    } catch (error) {
      tratarErro(error);
    } finally {
      setAcaoEmAndamento(null);
    }
  };

  return (
    <Card>
      <div className="mb-5">
        <h2 className="font-medium text-lg text-foreground">Comentários</h2>
        <p className="text-sm text-muted-foreground">Envie dúvidas ou contribuições sobre este conteúdo.</p>
      </div>

      <form onSubmit={handleCriarComentario} className="space-y-3 mb-6">
        <label htmlFor="novo-comentario" className="block text-sm font-medium text-foreground">
          Novo comentário
        </label>
        <textarea
          id="novo-comentario"
          value={novoComentario}
          onChange={event => setNovoComentario(event.target.value.slice(0, LIMITE_COMENTARIO))}
          maxLength={LIMITE_COMENTARIO}
          required
          aria-describedby="contador-comentario mensagem-comentarios"
          className="w-full bg-card border border-border rounded-xl p-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Escreva seu comentário."
        />
        <div className="flex items-center justify-between gap-3">
          <span id="contador-comentario" className="text-xs text-muted-foreground">
            {novoComentario.length}/{LIMITE_COMENTARIO}
          </span>
          <Button type="submit" disabled={isSubmitting || !novoComentario.trim()} className="!w-auto !px-5">
            {isSubmitting ? 'Enviando...' : 'Enviar'}
          </Button>
        </div>
      </form>

      <div id="mensagem-comentarios" aria-live="polite" className="space-y-2 mb-4">
        {erro ? <p className="text-sm text-accent">{erro}</p> : null}
        {sucesso ? <p className="text-sm text-primary">{sucesso}</p> : null}
        {isLoading ? <p className="text-sm text-muted-foreground">Carregando comentários...</p> : null}
      </div>

      {!isLoading && comentarios.length === 0 ? (
        <div className="rounded-xl bg-input-background p-4 text-center">
          <p className="font-medium text-foreground">Ainda não há comentários neste post.</p>
          <p className="text-sm text-muted-foreground">Seja a primeira pessoa a comentar.</p>
        </div>
      ) : null}

      <div className="space-y-4">
        {comentarios.map(comentario => {
          const editando = comentarioEditando === comentario._id;
          const bloqueado = acaoEmAndamento === comentario._id;

          return (
            <article key={comentario._id} className="rounded-xl border border-border bg-input-background p-4">
              <header className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-foreground">{comentario.autor.nome}</h3>
                    <Badge variant={comentario.autor.role === 'professor' ? 'primary' : 'default'}>
                      {comentario.autor.role === 'professor' ? 'Professor' : 'Aluno'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatarData(comentario.criadoEm)}</p>
                </div>
              </header>

              {editando ? (
                <div className="space-y-3">
                  <label htmlFor={`editar-${comentario._id}`} className="sr-only">Editar comentário</label>
                  <textarea
                    id={`editar-${comentario._id}`}
                    value={textoEdicao}
                    onChange={event => setTextoEdicao(event.target.value.slice(0, LIMITE_COMENTARIO))}
                    maxLength={LIMITE_COMENTARIO}
                    className="w-full bg-card border border-border rounded-xl p-3 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">{textoEdicao.length}/{LIMITE_COMENTARIO}</span>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" disabled={bloqueado} className="!w-auto !py-2 !px-3" onClick={() => setComentarioEditando(null)}>
                        Cancelar
                      </Button>
                      <Button type="button" disabled={bloqueado || !textoEdicao.trim()} className="!w-auto !py-2 !px-3" onClick={() => salvarEdicao(comentario._id)}>
                        {bloqueado ? 'Salvando...' : 'Salvar'}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-base leading-relaxed text-foreground whitespace-pre-wrap">{comentario.conteudo}</p>
              )}

              {!editando && (comentario.podeEditar || comentario.podeExcluir) ? (
                <footer className="flex gap-2 mt-4">
                  {comentario.podeEditar ? (
                    <Button type="button" variant="outline" disabled={bloqueado} className="!w-auto !py-2 !px-3 text-sm" onClick={() => iniciarEdicao(comentario)}>
                      Editar
                    </Button>
                  ) : null}
                  {comentario.podeExcluir ? (
                    <Button type="button" variant="ghost" disabled={bloqueado} className="!w-auto !py-2 !px-3 text-sm" onClick={() => removerComentario(comentario._id)}>
                      {bloqueado ? 'Excluindo...' : 'Excluir'}
                    </Button>
                  ) : null}
                </footer>
              ) : null}
            </article>
          );
        })}
      </div>
    </Card>
  );
};
