import React, { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, CalendarDays, CheckSquare, FileText, PenTool, Users } from 'lucide-react';
import { teacher } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';
import { usePostContent, usePostContents } from '../hooks/usePostContents';
import { getFriendlyErrorMessage } from '../services/api';
import { createPost, deletePost, updatePost } from '../services/postService';
import { getMeuPerfilProfessor } from '../services/profileService';
import { createAtividade, getAtividade, getCorrecao, getTurma, listAtividades, listDisciplinas, listEntregasAtividade, listTurmas, saveCorrecao } from '../services/academicService';
import { useAcademicData } from '../hooks/useAcademicData';
import { Professor } from '../types/api';
import { ComentariosSection } from './ComentariosSection';
import { EmptyState, ErrorState, FeedbackMessage, LoadingState } from './feedback';
import { Badge, Button, Card, ProfileHeader, ReadAloudButton, SectionHeader } from './ui';

const BackButton = ({ to }: { to?: string }) => {
  const navigate = useNavigate();
  return (
    <button onClick={() => to ? navigate(to) : navigate(-1)} className="text-muted-foreground p-2 -ml-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary" aria-label="Voltar">
      ←
    </button>
  );
};

const StatCard = ({ icon: Icon, value, label, tone = "primary" }: any) => (
  <Card className="p-4 text-center focus:outline-none focus:ring-2 focus:ring-primary" tabIndex={0}>
    <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2 ${tone === "coral" ? "bg-[#FFE8E8] text-accent" : "bg-primary-light text-primary"}`}>
      <Icon size={20} aria-hidden="true" />
    </div>
    <span className="block text-2xl font-medium text-foreground">{value}</span>
    <span className="text-sm text-muted-foreground">{label}</span>
  </Card>
);

export const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const firstName = user?.nome.split(' ')[0] || 'Professor';
  return (
    <div className="space-y-6">
      <SectionHeader title={`Olá, Prof. ${firstName}`} subtitle="Resumo das suas turmas hoje." />
      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={FileText} value="28" label="Atividades enviadas" />
        <StatCard icon={CheckSquare} value="17" label="Correções pendentes" tone="coral" />
        <StatCard icon={BookOpen} value="8" label="Conteúdos publicados" />
        <StatCard icon={Users} value="2" label="Turmas atribuídas" />
      </div>
      <section>
        <h2 className="text-lg font-medium text-foreground mb-3">Atalhos rápidos</h2>
        <div className="space-y-3">
          <Button variant="outline" className="flex items-center justify-start gap-3 h-auto py-4 bg-card" onClick={() => navigate('/teacher/create')}>
            <PenTool size={20} className="text-primary" aria-hidden="true" /> Criar atividade
          </Button>
          <Button variant="outline" className="flex items-center justify-start gap-3 h-auto py-4 bg-card" onClick={() => navigate('/teacher/content/new')}>
            <BookOpen size={20} className="text-primary" aria-hidden="true" /> Publicar conteúdo
          </Button>
          <Button variant="outline" className="flex items-center justify-start gap-3 h-auto py-4 bg-card" onClick={() => navigate('/teacher/corrections')}>
            <CheckSquare size={20} className="text-primary" aria-hidden="true" /> Ver correções
          </Button>
        </div>
      </section>
    </div>
  );
};

export const TeacherActivities = () => {
  const navigate = useNavigate();
  const { data, isLoading, error, reload } = useAcademicData(() => listAtividades());
  return (
    <div className="space-y-6 pb-20">
      <SectionHeader title="Atividades" subtitle="Histórico de atividades criadas e enviadas." />
      <Button onClick={() => navigate('/teacher/create')}>Criar nova atividade</Button>
      <div className="space-y-4">
        {isLoading ? <LoadingState message="Carregando atividades..." /> : null}
        {error ? <ErrorState title="Não foi possível carregar as atividades" message={error} onRetry={reload} compact /> : null}
        {!isLoading && !error && !data?.dados.length ? <EmptyState title="Nenhuma atividade criada." /> : null}
        {data?.dados.map(activity => (
          <Card key={activity._id} tabIndex={0} className="focus:outline-none focus:ring-2 focus:ring-primary">
            <div className="flex justify-between gap-3 mb-3">
              <div>
                <Badge variant={activity.status === 'publicada' ? 'success' : 'warning'}>{activity.status}</Badge>
                <h3 className="font-medium text-foreground text-base mt-2">{activity.titulo}</h3>
                <p className="text-sm text-muted-foreground">{activity.turma} | {activity.disciplina}</p>
              </div>
              <span className="text-sm text-muted-foreground">{new Date(activity.prazo).toLocaleDateString('pt-BR')}</span>
            </div>
            <Button variant="outline" className="!py-2.5" onClick={() => navigate(`/teacher/activity/${activity._id}`)}>Ver detalhes</Button>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const TeacherActivityDetail = () => {
  const { id } = useParams();
  const { data, isLoading, error, reload } = useAcademicData(async () => ({ activity: await getAtividade(id!), deliveries: (await listEntregasAtividade(id!)).dados }), [id]);
  if (isLoading) return <LoadingState message="Carregando atividade..." />;
  if (error || !data) return <div className="space-y-4"><BackButton to="/teacher/activities" /><ErrorState title="Não foi possível abrir a atividade" message={error || 'Atividade não encontrada.'} onRetry={reload} compact /></div>;
  const { activity, deliveries } = data;
  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center gap-3">
        <BackButton to="/teacher/activities" />
        <div>
          <h1 className="text-xl font-medium text-foreground">{activity.titulo}</h1>
          <p className="text-base text-muted-foreground">{activity.turma} | {activity.disciplina}</p>
        </div>
      </header>
      <Card>
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 className="font-medium text-lg">Enunciado</h2>
          <ReadAloudButton label="Ouvir texto" />
        </div>
        <p className="text-base leading-relaxed text-foreground">{activity.enunciado}</p>
      </Card>
      <Card>
        <h2 className="font-medium text-lg mb-3">Resumo de envio</h2>
        <p className="text-muted-foreground">{deliveries.length} entrega(s): {deliveries.filter(item => item.status === 'corrigida').length} corrigida(s) e {deliveries.filter(item => item.status === 'entregue').length} pendente(s).</p>
      </Card>
    </div>
  );
};

export const TeacherCreateActivity = () => (
  <TeacherForm title="Nova Atividade" submitLabel="Publicar para alunos" secondaryLabel="Salvar atividade" />
);

const TeacherForm = ({ title, submitLabel, secondaryLabel }: { title: string; submitLabel: string; secondaryLabel?: string }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ titulo: '', turma: '', disciplina: '', prazo: '', enunciado: '' });
  const [status, setStatus] = useState<'rascunho' | 'publicada'>('publicada');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setIsSubmitting(true);
    try { await createAtividade({ ...form, prazo: new Date(form.prazo).toISOString(), status }); navigate('/teacher/activities'); }
    catch (submitError) { setError(getFriendlyErrorMessage(submitError)); }
    finally { setIsSubmitting(false); }
  };
  return (
    <form onSubmit={submit} className="space-y-6 pb-20">
      <header className="flex items-center gap-3">
        <BackButton to="/teacher" />
        <div>
          <h1 className="text-xl font-medium text-foreground">{title}</h1>
          <p className="text-base text-muted-foreground">Campos simples para o MVP.</p>
        </div>
      </header>
      {error ? <FeedbackMessage type="error" message={error} compact /> : null}
      <label className="block space-y-2"><span>Título</span><input required value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} className="w-full bg-card border border-border rounded-xl p-4" /></label>
      <label className="block space-y-2"><span>Turma</span><input required value={form.turma} onChange={e => setForm({ ...form, turma: e.target.value })} className="w-full bg-card border border-border rounded-xl p-4" /></label>
      <label className="block space-y-2"><span>Matéria</span><input required value={form.disciplina} onChange={e => setForm({ ...form, disciplina: e.target.value })} className="w-full bg-card border border-border rounded-xl p-4" /></label>
      <label className="block space-y-2"><span>Data de entrega</span><input required type="datetime-local" value={form.prazo} onChange={e => setForm({ ...form, prazo: e.target.value })} className="w-full bg-card border border-border rounded-xl p-4" /></label>
      <label className="block space-y-2">
        <span>Enunciado</span>
        <textarea required value={form.enunciado} onChange={e => setForm({ ...form, enunciado: e.target.value })} className="w-full bg-card border border-border rounded-xl p-4 min-h-[150px] focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Escreva as instruções para os alunos." />
      </label>
      {secondaryLabel ? <Button type="submit" variant="outline" onClick={() => setStatus('rascunho')} disabled={isSubmitting}>{secondaryLabel}</Button> : null}
      <Button type="submit" onClick={() => setStatus('publicada')} disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : submitLabel}</Button>
    </form>
  );
};

export const TeacherContents = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { contents, isLoading, error, setContents, setError, reload } = usePostContents();
  const [success, setSuccess] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Excluir este conteúdo? Esta ação também remove os comentários relacionados.');

    if (!confirmed) {
      return;
    }

    setDeletingId(id);
    setError('');
    setSuccess('');

    try {
      const response = await deletePost(id);
      setContents(items => items.filter(item => item.id !== id));
      setSuccess(response.mensagem);
    } catch (deleteError) {
      setError(getFriendlyErrorMessage(deleteError));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <SectionHeader title="Conteúdos" subtitle="Materiais publicados para os alunos." />
      <Button onClick={() => navigate('/teacher/content/new')}>Novo conteúdo</Button>
      {isLoading ? <LoadingState message="Carregando conteúdos..." /> : null}
      {error ? <ErrorState title="Não foi possível carregar os conteúdos" message={error} onRetry={reload} compact /> : null}
      {success ? <FeedbackMessage type="success" message={success} compact onClose={() => setSuccess('')} /> : null}
      {!isLoading && !error && contents.length === 0 ? (
        <EmptyState
          title="Nenhum conteúdo publicado ainda."
          message="Crie o primeiro post para que alunos possam visualizar."
        />
      ) : null}
      <div className="space-y-4">
        {contents.map(content => (
          <Card key={content.id}>
            <Badge variant="primary">{content.subject}</Badge>
            <h3 className="font-medium text-lg mt-3">{content.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{content.className} | Publicado em {content.publishedAt}</p>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" className="!w-auto !py-2 !px-3" onClick={() => navigate(`/teacher/content/${content.id}`)}>Ver conteúdo</Button>
              {content.authorId === user?.id ? (
                <>
                  <Button variant="outline" className="!w-auto !py-2 !px-3" onClick={() => navigate(`/teacher/content/${content.id}/edit`)}>Editar</Button>
                  <Button variant="ghost" disabled={deletingId === content.id} className="!w-auto !py-2 !px-3" onClick={() => handleDelete(content.id)}>
                    {deletingId === content.id ? 'Excluindo...' : 'Excluir'}
                  </Button>
                </>
              ) : null}
              <ReadAloudButton label="Ouvir texto" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const TeacherContentForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { content, isLoading, error: loadError, reload } = usePostContent(id);
  const [titulo, setTitulo] = useState('');
  const [disciplina, setDisciplina] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [tags, setTags] = useState('');
  const [visivelPara, setVisivelPara] = useState<'todos' | 'alunos' | 'professores'>('todos');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (content && isEditing) {
      setTitulo(content.title);
      setDisciplina(content.subject === 'Geral' ? '' : content.subject);
      setConteudo(content.text);
      setTags(content.tags.join(', '));
      setVisivelPara(content.visibility);
    }
  }, [content, isEditing]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!titulo.trim() || !conteudo.trim()) {
      setError('Título e texto do conteúdo são obrigatórios.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        titulo: titulo.trim(),
        conteudo: conteudo.trim(),
        disciplina: disciplina.trim() || undefined,
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
        visivelPara,
      };

      const response = isEditing && id
        ? await updatePost(id, payload)
        : await createPost(payload);

      setSuccess(response.mensagem);
      navigate('/teacher/contents');
    } catch (submitError) {
      setError(getFriendlyErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-20" noValidate>
      <header className="flex items-center gap-3">
        <BackButton to="/teacher/contents" />
        <div>
          <h1 className="text-xl font-medium text-foreground">{isEditing ? 'Editar conteúdo' : 'Novo conteúdo'}</h1>
          <p className="text-base text-muted-foreground">Publique um material de leitura para a turma.</p>
        </div>
      </header>
      {isLoading ? <LoadingState message="Carregando conteúdo..." /> : null}
      {loadError ? <ErrorState title="Não foi possível carregar o conteúdo" message={loadError} onRetry={reload} compact /> : null}
      {error ? <FeedbackMessage type="error" message={error} compact /> : null}
      {success ? <FeedbackMessage type="success" message={success} compact /> : null}
      <label className="block space-y-2">
        <span>Título</span>
        <input value={titulo} onChange={event => setTitulo(event.target.value)} className="w-full bg-card border border-border rounded-xl p-4 text-base focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Título" required />
      </label>
      <label className="block space-y-2">
        <span>Matéria</span>
        <input value={disciplina} onChange={event => setDisciplina(event.target.value)} className="w-full bg-card border border-border rounded-xl p-4 text-base focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Matéria" />
      </label>
      <label className="block space-y-2">
        <span>Visibilidade</span>
        <select value={visivelPara} onChange={event => setVisivelPara(event.target.value as 'todos' | 'alunos' | 'professores')} className="w-full bg-card border border-border rounded-xl p-4 text-base focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="todos">Todos</option>
          <option value="alunos">Alunos</option>
          <option value="professores">Professores</option>
        </select>
      </label>
      <label className="block space-y-2">
        <span>Tags</span>
        <input value={tags} onChange={event => setTags(event.target.value)} className="w-full bg-card border border-border rounded-xl p-4 text-base focus:outline-none focus:ring-2 focus:ring-primary" placeholder="matematica, atividade" />
      </label>
      <label className="block space-y-2">
        <span>Texto do conteúdo</span>
        <textarea value={conteudo} onChange={event => setConteudo(event.target.value)} className="w-full bg-card border border-border rounded-xl p-4 min-h-[220px] focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Escreva o conteúdo que será publicado para os alunos." required />
      </label>
      <Button type="submit" disabled={isSubmitting || Boolean(loadError)}>
        {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Publicar conteúdo'}
      </Button>
    </form>
  );
};

export const TeacherContentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { content, isLoading, error, reload } = usePostContent(id);

  if (isLoading) {
    return <LoadingState message="Carregando conteúdo..." />;
  }

  if (error || !content) {
    return (
      <div className="space-y-4">
        <BackButton to="/teacher/contents" />
        <ErrorState
          title="Não foi possível abrir o conteúdo"
          message={error || 'Conteúdo não encontrado.'}
          onRetry={error ? reload : undefined}
          compact
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center gap-3">
        <BackButton to="/teacher/contents" />
        <div>
          <h1 className="text-xl font-medium text-foreground">{content.title}</h1>
          <p className="text-base text-muted-foreground">{content.subject} | {content.className}</p>
        </div>
      </header>
      {content.authorId === user?.id ? (
        <Button variant="outline" onClick={() => navigate(`/teacher/content/${content.id}/edit`)}>Editar conteúdo</Button>
      ) : null}
      <Card>
        <div className="flex justify-between items-start gap-3 mb-4">
          <h2 className="font-medium text-lg">Texto do conteúdo</h2>
          <ReadAloudButton label="Ouvir texto" />
        </div>
        <p className="text-base leading-relaxed">{content.text}</p>
      </Card>
      <ComentariosSection postId={content.id} />
    </div>
  );
};

export const TeacherCorrectionsClasses = () => {
  const navigate = useNavigate();
  const { data, isLoading, error, reload } = useAcademicData(() => listTurmas());
  return (
    <div className="space-y-6 pb-20">
      <SectionHeader title="Correções" subtitle="Escolha uma turma para revisar entregas." />
      {isLoading ? <LoadingState message="Carregando turmas..." /> : null}
      {error ? <ErrorState title="Não foi possível carregar as turmas" message={error} onRetry={reload} compact /> : null}
      {!isLoading && !error && !data?.dados.length ? <EmptyState title="Nenhuma turma atribuída." /> : null}
      {data?.dados.map(item => (
        <Card key={item._id}>
          <h3 className="font-medium text-lg">{item.nome}</h3>
          <p className="text-sm text-muted-foreground mb-4">{item.codigo} | {item.anoLetivo} | {item.turno}</p>
          <Button onClick={() => navigate(`/teacher/corrections/${item._id}`)}>Ver correções</Button>
        </Card>
      ))}
    </div>
  );
};

export const TeacherCorrectionsList = () => {
  const { classId = '' } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error, reload } = useAcademicData(async () => {
    const turma = await getTurma(classId);
    const atividades = (await listAtividades({ turma: turma.codigo })).dados;
    const listas = await Promise.all(atividades.map(item => listEntregasAtividade(item._id)));
    return { turma, entregas: listas.flatMap(item => item.dados) };
  }, [classId]);
  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center gap-3">
        <BackButton to="/teacher/corrections" />
        <div>
          <h1 className="text-xl font-medium text-foreground">{data?.turma.nome || 'Correções'}</h1>
          <p className="text-base text-muted-foreground">Atividades da turma</p>
        </div>
      </header>
      {isLoading ? <LoadingState message="Carregando entregas..." /> : null}
      {error ? <ErrorState title="Não foi possível carregar as entregas" message={error} onRetry={reload} compact /> : null}
      {!isLoading && !error && !data?.entregas.length ? <EmptyState title="Nenhuma entrega nesta turma." /> : null}
      {data?.entregas.map(item => {
        const atividade = typeof item.atividadeId === 'string' ? null : item.atividadeId;
        const aluno = typeof item.alunoId === 'string' ? null : item.alunoId;
        return <Card key={item._id}>
          <div className="flex justify-between gap-3">
            <div>
              <Badge variant={item.status === 'corrigida' ? 'success' : 'warning'}>{item.status === 'corrigida' ? 'Corrigida' : 'Pendente'}</Badge>
              <h3 className="font-medium text-base mt-2">{atividade?.titulo || 'Atividade'}</h3>
              <p className="text-sm text-muted-foreground">{aluno?.nome || 'Aluno'}</p>
            </div>
          </div>
          <Button className="mt-4" variant={item.status === 'corrigida' ? 'outline' : 'primary'} onClick={() => navigate(`/teacher/correction/${item._id}`)}>
            {item.status === 'corrigida' ? 'Revisar correção' : 'Corrigir'}
          </Button>
        </Card>;
      })}
    </div>
  );
};

export const TeacherCorrection = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: item, isLoading, error, reload } = useAcademicData(async () => {
    const atividades = (await listAtividades()).dados;
    const entregas = (await Promise.all(atividades.map(item => listEntregasAtividade(item._id)))).flatMap(item => item.dados);
    const entrega = entregas.find(item => item._id === id);
    if (!entrega) throw new Error('Entrega não encontrada.');
    let correcao = null;
    if (entrega.status === 'corrigida') correcao = await getCorrecao(entrega._id);
    return { entrega, correcao };
  }, [id]);
  const [teacherScore, setTeacherScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => { if (item?.correcao) { setTeacherScore(String(item.correcao.nota)); setFeedback(item.correcao.feedback); } }, [item]);
  if (isLoading) return <LoadingState message="Carregando entrega..." />;
  if (error || !item) return <div className="space-y-4"><BackButton /><ErrorState title="Não foi possível abrir a entrega" message={error || 'Entrega não encontrada.'} onRetry={reload} compact /></div>;
  const atividade = typeof item.entrega.atividadeId === 'string' ? null : item.entrega.atividadeId;
  const aluno = typeof item.entrega.alunoId === 'string' ? null : item.entrega.alunoId;
  const submit = async () => {
    setSubmitError(''); setIsSubmitting(true);
    try { await saveCorrecao(item.entrega._id, Number(teacherScore), feedback.trim()); navigate('/teacher/corrections'); }
    catch (saveError) { setSubmitError(getFriendlyErrorMessage(saveError)); }
    finally { setIsSubmitting(false); }
  };
  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center gap-3">
        <BackButton />
        <div>
          <h1 className="text-xl font-medium text-foreground">Corrigir atividade</h1>
          <p className="text-base text-muted-foreground">{aluno?.nome || 'Aluno'} | {atividade?.titulo || 'Atividade'}</p>
        </div>
      </header>
      <Card>
        <div className="flex justify-between mb-3"><h2 className="font-medium text-lg">Resposta enviada</h2><ReadAloudButton label="Ouvir texto" /></div>
        <p className="leading-relaxed">{item.entrega.resposta}</p>
      </Card>
      {submitError ? <FeedbackMessage type="error" message={submitError} compact /> : null}
      <Card className="p-4 border-primary"><label htmlFor="score" className="text-sm text-primary">Nota do professor (0 a 10)</label><input id="score" type="number" min="0" max="10" step="0.1" value={teacherScore} onChange={e => setTeacherScore(e.target.value)} className="w-full text-3xl font-medium bg-transparent focus:outline-none" /></Card>
      <label className="block space-y-2"><span>Comentário do professor</span><textarea value={feedback} onChange={e => setFeedback(e.target.value)} className="w-full bg-card border border-border rounded-xl p-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary" /></label>
      <Button onClick={submit} disabled={isSubmitting || !feedback.trim() || teacherScore === ''}>{isSubmitting ? 'Salvando...' : 'Confirmar correção'}</Button>
    </div>
  );
};

export const TeacherProfile = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [profile, setProfile] = useState<Professor | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState('');
  const { data: turmas, isLoading: isLoadingTurmas, error: turmasError, reload: reloadTurmas } = useAcademicData(() => listTurmas());
  const name = profile?.nome || user?.nome || teacher.name;
  const initials = name
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  useEffect(() => {
    let isMounted = true;

    getMeuPerfilProfessor()
      .then(data => {
        if (isMounted) {
          setProfile(data);
        }
      })
      .catch(error => {
        if (isMounted) {
          setProfileError(getFriendlyErrorMessage(error));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingProfile(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6 pb-20">
      <ProfileHeader initials={initials || teacher.avatar} name={name} subtitle={user?.email || `Nascimento: ${teacher.birthDate}`} />
      <Button variant="outline" onClick={handleLogout}>Sair</Button>
      {isLoadingProfile ? <LoadingState message="Carregando perfil..." /> : null}
      {profileError ? <ErrorState title="Não foi possível carregar o perfil" message={profileError} compact /> : null}
      <Card>
        <h2 className="font-medium text-lg mb-2">Dados do professor</h2>
        <p className="text-muted-foreground">Nascimento: {profile?.dataNascimento ? new Date(profile.dataNascimento).toLocaleDateString('pt-BR') : 'Não informado'}</p>
        <p className="text-muted-foreground">Matérias: {profile?.materias?.length ? profile.materias.join(', ') : 'Não informadas'}</p>
        <p className="text-muted-foreground">Turmas: {profile?.turmas?.length ? profile.turmas.join(', ') : 'Não informadas'}</p>
      </Card>
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Turmas atribuídas</h2>
        {isLoadingTurmas ? <LoadingState message="Carregando turmas..." /> : null}
        {turmasError ? <ErrorState title="Não foi possível carregar as turmas" message={turmasError} onRetry={reloadTurmas} compact /> : null}
        {!isLoadingTurmas && !turmasError && !turmas?.dados.length ? <EmptyState title="Nenhuma turma atribuída." /> : null}
        {turmas?.dados.map(item => (
          <Card key={item._id}>
            <h3 className="font-medium">{item.nome}</h3>
            <p className="text-sm text-muted-foreground mb-4">{item.codigo} | {item.anoLetivo} | {item.turno}</p>
            <Button variant="outline" onClick={() => navigate(`/teacher/class/${item._id}`)}>Acessar turma</Button>
          </Card>
        ))}
      </section>
    </div>
  );
};

export const TeacherClassDetail = () => {
  const { classId = '' } = useParams();
  const { data, isLoading, error, reload } = useAcademicData(async () => {
    const turma = await getTurma(classId);
    const [disciplinas, atividades] = await Promise.all([listDisciplinas(classId), listAtividades({ turma: turma.codigo })]);
    return { turma, disciplinas: disciplinas.dados, atividades: atividades.dados };
  }, [classId]);
  if (isLoading) return <LoadingState message="Carregando turma..." />;
  if (error || !data) return <div className="space-y-4"><BackButton to="/teacher/profile" /><ErrorState title="Não foi possível abrir a turma" message={error || 'Turma não encontrada.'} onRetry={reload} compact /></div>;
  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center gap-3"><BackButton to="/teacher/profile" /><div><h1 className="text-xl font-medium">{data.turma.nome}</h1><p className="text-muted-foreground">{data.turma.codigo} | {data.turma.anoLetivo}</p></div></header>
      <Card>
        <div className="flex items-center gap-2 mb-4"><CalendarDays size={18} className="text-primary" /><h2 className="font-medium text-lg">Dados da turma</h2></div>
        <p className="text-sm text-muted-foreground">Turno: {data.turma.turno} | Situação: {data.turma.ativa ? 'Ativa' : 'Inativa'}</p>
        {data.turma.descricao ? <p className="text-sm text-muted-foreground mt-2">{data.turma.descricao}</p> : null}
      </Card>
      <Card>
        <h2 className="font-medium text-lg mb-3">Disciplinas</h2>
        <div className="space-y-3">{data.disciplinas.map(item => <div key={item._id} className="rounded-xl bg-input-background p-3"><strong>{item.nome}</strong><p className="text-sm text-muted-foreground">{item.codigo} | {item.cargaHoraria} horas</p></div>)}</div>
      </Card>
      <Card>
        <h2 className="font-medium text-lg mb-3">Histórico de atividades</h2>
        <div className="space-y-3">
          {data.atividades.map(activity => (
            <div key={activity._id} className="rounded-xl bg-input-background p-3">
              <div className="flex justify-between gap-3">
                <strong>{activity.titulo}</strong>
                <Badge variant={activity.status === 'publicada' ? 'success' : 'warning'}>{activity.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{activity.disciplina} | prazo {new Date(activity.prazo).toLocaleDateString('pt-BR')}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
