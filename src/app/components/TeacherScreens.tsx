import React, { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, CalendarDays, CalendarPlus, CheckSquare, FileText, Pencil, PenTool, Plus, SlidersHorizontal, Trash2, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePostContent, usePostContents } from '../hooks/usePostContents';
import { getFriendlyErrorMessage } from '../services/api';
import { createPost, deletePost, listPosts, updatePost } from '../services/postService';
import { getMeuPerfilProfessor, updateMeuPerfilProfessor } from '../services/profileService';
import { createAtividade, createEventoCronograma, deleteEventoCronograma, getAtividade, getCorrecao, getTurma, listAtividades, listCronograma, listDisciplinas, listEntregasAtividade, listTurmas, saveCorrecao, updateEventoCronograma } from '../services/academicService';
import { useAcademicData } from '../hooks/useAcademicData';
import { EventoCronograma, Professor, Questao, TipoQuestao } from '../types/api';
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

const StatCard = ({ icon: Icon, value, label, tone = "primary", onClick }: any) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full rounded-2xl border border-border bg-card p-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 md:p-5"
    aria-label={`${label}: ${value}. Acessar área.`}
  >
    <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2 ${tone === "coral" ? "bg-[#FFE8E8] text-accent" : "bg-primary-light text-primary"}`}>
      <Icon size={20} aria-hidden="true" />
    </div>
    <span className="block text-2xl font-medium text-foreground">{value}</span>
    <span className="text-sm text-muted-foreground">{label}</span>
  </button>
);

export const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const firstName = user?.nome.split(' ')[0] || 'Professor';
  const { data: summary, isLoading: isLoadingSummary } = useAcademicData(async () => {
    const [atividadesResponse, turmasResponse, posts] = await Promise.all([
      listAtividades(),
      listTurmas(),
      listPosts(),
    ]);

    const entregasPorAtividade = await Promise.all(
      atividadesResponse.dados.map(atividade => listEntregasAtividade(atividade._id))
    );

    const pendingCorrections = entregasPorAtividade
      .flatMap(response => response.dados)
      .filter(entrega => entrega.status !== 'corrigida').length;

    const publishedContents = posts.filter(post => post.authorId === user?.id).length;

    return {
      activitiesCount: atividadesResponse.dados.length,
      pendingCorrections,
      publishedContents,
      classesCount: turmasResponse.dados.length,
    };
  }, [user?.id]);

  return (
    <div className="space-y-8">
      <SectionHeader title={`Olá, Prof. ${firstName}`} subtitle="Resumo das suas turmas hoje." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={FileText} value={isLoadingSummary ? '-' : String(summary?.activitiesCount ?? 0)} label="Atividades enviadas" onClick={() => navigate('/teacher/activities')} />
        <StatCard icon={CheckSquare} value={isLoadingSummary ? '-' : String(summary?.pendingCorrections ?? 0)} label="Correções pendentes" tone="coral" onClick={() => navigate('/teacher/corrections')} />
        <StatCard icon={BookOpen} value={isLoadingSummary ? '-' : String(summary?.publishedContents ?? 0)} label="Conteúdos publicados" onClick={() => navigate('/teacher/contents')} />
        <StatCard icon={Users} value={isLoadingSummary ? '-' : String(summary?.classesCount ?? 0)} label="Turmas atribuídas" onClick={() => navigate('/teacher/profile')} />
      </div>
      <section>
        <h2 className="text-lg font-medium text-foreground mb-4">Atalhos rápidos</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Button variant="outline" className="flex items-center justify-start gap-3 h-auto py-4 bg-card" onClick={() => navigate('/teacher/create')}>
            <PenTool size={20} className="text-primary" aria-hidden="true" /> Criar atividade
          </Button>
          <Button variant="outline" className="flex items-center justify-start gap-3 h-auto py-4 bg-card" onClick={() => navigate('/teacher/content/new')}>
            <BookOpen size={20} className="text-primary" aria-hidden="true" /> Publicar conteúdo
          </Button>
          <Button variant="outline" className="flex items-center justify-start gap-3 h-auto py-4 bg-card" onClick={() => navigate('/teacher/corrections')}>
            <CheckSquare size={20} className="text-primary" aria-hidden="true" /> Ver correções
          </Button>
          <Button variant="outline" className="flex items-center justify-start gap-3 h-auto py-4 bg-card" onClick={() => navigate('/teacher/schedule')}>
            <CalendarDays size={20} className="text-primary" aria-hidden="true" /> Abrir agenda
          </Button>
        </div>
      </section>
    </div>
  );
};

export const TeacherActivities = () => {
  const navigate = useNavigate();
  const { data, isLoading, error, reload } = useAcademicData(() => listAtividades());
  const [subject, setSubject] = useState('todas');
  const [className, setClassName] = useState('todas');
  const [status, setStatus] = useState('todos');
  const [order, setOrder] = useState<'proximo' | 'distante'>('proximo');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activities = data?.dados || [];
  const subjects = [...new Set(activities.map(item => item.disciplina))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const classes = [...new Set(activities.map(item => item.turma))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const filtered = activities
    .filter(item => subject === 'todas' || item.disciplina === subject)
    .filter(item => className === 'todas' || item.turma === className)
    .filter(item => status === 'todos' || item.status === status)
    .sort((a, b) => (order === 'proximo' ? 1 : -1) * (new Date(a.prazo).getTime() - new Date(b.prazo).getTime()));
  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <div className="flex items-start justify-between gap-3"><SectionHeader title="Atividades" subtitle="Histórico de atividades criadas e enviadas." /><button type="button" onClick={() => setFiltersOpen(open => !open)} aria-expanded={filtersOpen} aria-controls="teacher-activity-filters" className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${filtersOpen ? 'border-primary bg-primary-light text-primary' : 'border-border text-primary hover:bg-primary-light'}`} aria-label={`${filtersOpen ? 'Fechar' : 'Abrir'} filtros de atividades`} title="Filtros"><SlidersHorizontal size={20} aria-hidden="true" /></button></div>
      <div className="max-w-sm">
        <Button onClick={() => navigate('/teacher/create')}>Criar nova atividade</Button>
      </div>
      {filtersOpen ? <section id="teacher-activity-filters" aria-labelledby="teacher-activity-filters-title" className="rounded-2xl border border-border bg-card p-4">
        <h2 id="teacher-activity-filters-title" className="mb-4 font-medium">Filtrar e organizar</h2>
        {activities.length ? <><fieldset className="mb-4"><legend className="mb-2 text-sm">Matéria</legend><div className="flex flex-wrap gap-2">{['todas', ...subjects].map(item => { const count = item === 'todas' ? activities.length : activities.filter(activity => activity.disciplina === item).length; return <button key={item} type="button" aria-pressed={subject === item} onClick={() => setSubject(item)} className={`rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${subject === item ? 'border-primary bg-primary-light text-primary' : 'border-border bg-input-background'}`}><span className="block font-medium">{item === 'todas' ? 'Todas' : item}</span><span className="block text-xs opacity-80">{count} atividade(s)</span></button>; })}</div></fieldset><div className="grid gap-4 sm:grid-cols-3"><label className="space-y-2"><span className="block text-sm">Turma</span><select value={className} onChange={event => setClassName(event.target.value)} className="w-full rounded-xl border border-border bg-card p-3"><option value="todas">Todas</option>{classes.map(item => <option key={item}>{item}</option>)}</select></label><label className="space-y-2"><span className="block text-sm">Situação</span><select value={status} onChange={event => setStatus(event.target.value)} className="w-full rounded-xl border border-border bg-card p-3"><option value="todos">Todas</option><option value="rascunho">Rascunhos</option><option value="publicada">Publicadas</option><option value="encerrada">Encerradas</option></select></label><label className="space-y-2"><span className="block text-sm">Prazo</span><select value={order} onChange={event => setOrder(event.target.value as typeof order)} className="w-full rounded-xl border border-border bg-card p-3"><option value="proximo">Mais próximo</option><option value="distante">Mais distante</option></select></label></div><button type="button" onClick={() => { setSubject('todas'); setClassName('todas'); setStatus('todos'); setOrder('proximo'); }} className="mt-4 text-sm font-medium text-primary underline underline-offset-4">Limpar filtros</button></> : <p className="text-sm text-muted-foreground">Crie sua primeira atividade para começar a organizar esta área.</p>}
      </section> : null}
      <p role="status" aria-live="polite" className="text-sm text-muted-foreground">{filtered.length} atividade(s) encontrada(s).</p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? <LoadingState message="Carregando atividades..." /> : null}
        {error ? <ErrorState title="Não foi possível carregar as atividades" message={error} onRetry={reload} compact /> : null}
        {!isLoading && !error && !data?.dados.length ? <EmptyState title="Nenhuma atividade criada." /> : null}
        {filtered.map(activity => (
          <Card key={activity._id} tabIndex={0} className="focus:outline-none focus:ring-2 focus:ring-primary">
            <div className="flex justify-between gap-3 mb-3">
              <div>
                <Badge variant={activity.status === 'publicada' ? 'success' : 'warning'}>{activity.status}</Badge>
                <h3 className="font-medium text-foreground text-base mt-2">{activity.titulo}</h3>
                <p className="text-sm text-muted-foreground">{activity.turma} | {activity.disciplina}</p>
                <p className="text-sm text-muted-foreground mt-1">{activity.questoes?.length ? `${activity.questoes.length} questão(ões) em formatos variados` : 'Resposta aberta'}</p>
              </div>
              <span className="text-sm text-muted-foreground">{new Date(activity.prazo).toLocaleDateString('pt-BR')}</span>
            </div>
            <Button variant="outline" className="!py-2.5" onClick={() => navigate(`/teacher/activity/${activity._id}`)}>Ver detalhes</Button>
          </Card>
        ))}
      </div>
      {!isLoading && !error && activities.length > 0 && !filtered.length ? <EmptyState title="Nenhuma atividade corresponde aos filtros." /> : null}
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
          <ReadAloudButton text={activity.enunciado} label="Ouvir texto" />
        </div>
        <p className="text-base leading-relaxed text-foreground">{activity.enunciado}</p>
      </Card>
      {activity.questoes?.length ? (
        <Card>
          <h2 className="font-medium text-lg mb-4">Questões da atividade</h2>
          <div className="space-y-4">
            {activity.questoes.map((questao, index) => (
              <section key={questao._id || index} className="rounded-xl bg-input-background p-4">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge variant="primary">Questão {index + 1}</Badge>
                  <span className="text-sm text-muted-foreground">{questao.tipo === 'multipla_escolha' ? 'Múltipla escolha' : questao.tipo === 'resposta_curta' ? 'Resposta curta' : 'Redação'} · {questao.obrigatoria ? 'Obrigatória' : 'Opcional'}</span>
                </div>
                <p className="font-medium">{questao.enunciado}</p>
                {questao.orientacao ? <p className="text-sm text-muted-foreground mt-1">{questao.orientacao}</p> : null}
              </section>
            ))}
          </div>
        </Card>
      ) : null}
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
  const { data: catalogo, isLoading: isLoadingCatalogo, error: catalogoError, reload: reloadCatalogo } = useAcademicData(
    () => Promise.all([listDisciplinas(), listTurmas()])
  );
  const [questoes, setQuestoes] = useState<Questao[]>([
    { tipo: 'redacao', enunciado: '', orientacao: '', obrigatoria: true, alternativas: [], limiteCaracteres: 5000 },
  ]);
  const [status, setStatus] = useState<'rascunho' | 'publicada'>('publicada');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const disciplinas = catalogo?.[0].dados || [];
  const turmas = catalogo?.[1].dados || [];
  const disciplinaSelecionada = disciplinas.find(item => item.nome === form.disciplina);
  const turmaIdsDaDisciplina = new Set(
    disciplinaSelecionada?.turmaIds.map(turma => typeof turma === 'string' ? turma : turma._id) || []
  );
  const turmasDisponiveis = turmas.filter(turma => turmaIdsDaDisciplina.has(turma._id));
  const agora = new Date();
  agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset() + 1);
  const prazoMinimo = agora.toISOString().slice(0, 16);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setIsSubmitting(true);
    try { await createAtividade({ ...form, prazo: new Date(form.prazo).toISOString(), status, questoes }); navigate('/teacher/activities'); }
    catch (submitError) { setError(getFriendlyErrorMessage(submitError)); }
    finally { setIsSubmitting(false); }
  };
  return (
    <form onSubmit={submit} className="space-y-6 pb-20">
      <header className="flex items-center gap-3">
        <BackButton to="/teacher" />
        <div>
          <h1 className="text-xl font-medium text-foreground">{title}</h1>
          <p className="text-base text-muted-foreground">Combine questões objetivas, respostas curtas e redações.</p>
        </div>
      </header>
      {error ? <FeedbackMessage type="error" message={error} compact /> : null}
      {isLoadingCatalogo ? <LoadingState message="Carregando matérias e turmas..." /> : null}
      {catalogoError ? <ErrorState title="Não foi possível carregar matérias e turmas" message={catalogoError} onRetry={reloadCatalogo} compact /> : null}
      <label className="block space-y-2"><span>Título</span><input required value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} className="w-full bg-card border border-border rounded-xl p-4" /></label>
      <label className="block space-y-2">
        <span>Matéria</span>
        <span id="materia-help" className="block text-sm text-muted-foreground">Selecione uma matéria que você leciona.</span>
        <select
          required
          value={form.disciplina}
          aria-describedby="materia-help"
          disabled={isLoadingCatalogo || Boolean(catalogoError)}
          onChange={event => setForm({ ...form, disciplina: event.target.value, turma: '' })}
          className="w-full bg-card border border-border rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
        >
          <option value="">Selecione a matéria</option>
          {disciplinas.map(disciplina => <option key={disciplina._id} value={disciplina.nome}>{disciplina.nome}</option>)}
        </select>
      </label>
      <label className="block space-y-2">
        <span>Turma</span>
        <span id="turma-help" className="block text-sm text-muted-foreground">
          {form.disciplina ? 'Exibindo somente turmas vinculadas à matéria selecionada.' : 'Escolha primeiro uma matéria para liberar as turmas.'}
        </span>
        <select
          required
          value={form.turma}
          aria-describedby="turma-help"
          disabled={!form.disciplina || !turmasDisponiveis.length}
          onChange={event => setForm({ ...form, turma: event.target.value })}
          className="w-full bg-card border border-border rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
        >
          <option value="">{turmasDisponiveis.length ? 'Selecione a turma' : 'Nenhuma turma disponível'}</option>
          {turmasDisponiveis.map(turma => <option key={turma._id} value={turma.codigo}>{turma.nome} ({turma.codigo})</option>)}
        </select>
      </label>
      <label className="block space-y-2">
        <span>Data de entrega</span>
        <span id="prazo-help" className="block text-sm text-muted-foreground">Escolha uma data e horário futuros.</span>
        <input required type="datetime-local" min={prazoMinimo} value={form.prazo} aria-describedby="prazo-help" onChange={e => setForm({ ...form, prazo: e.target.value })} className="w-full bg-card border border-border rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary" />
      </label>
      <label className="block space-y-2">
        <span>Orientações gerais</span>
        <textarea required value={form.enunciado} onChange={e => setForm({ ...form, enunciado: e.target.value })} className="w-full bg-card border border-border rounded-xl p-4 min-h-[150px] focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Escreva as instruções para os alunos." />
      </label>
      <section className="space-y-4" aria-labelledby="questoes-title">
        <div>
          <h2 id="questoes-title" className="text-lg font-medium">Questões</h2>
          <p className="text-sm text-muted-foreground">Cada campo possui rótulo e instruções. Questões obrigatórias são identificadas em texto.</p>
        </div>
        {questoes.map((questao, index) => {
          const update = (dados: Partial<Questao>) => setQuestoes(items => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...dados } : item));
          return (
            <Card key={index} className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-medium">Questão {index + 1}</h3>
                {questoes.length > 1 ? <Button type="button" variant="ghost" className="!w-auto !py-2" onClick={() => setQuestoes(items => items.filter((_, itemIndex) => itemIndex !== index))}>Remover</Button> : null}
              </div>
              <label className="block space-y-2">
                <span>Tipo de resposta</span>
                <select value={questao.tipo} onChange={event => {
                  const tipo = event.target.value as TipoQuestao;
                  update({ tipo, alternativas: tipo === 'multipla_escolha' ? ['Alternativa 1', 'Alternativa 2'] : [] });
                }} className="w-full bg-card border border-border rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="multipla_escolha">Múltipla escolha</option>
                  <option value="resposta_curta">Resposta curta</option>
                  <option value="redacao">Redação</option>
                </select>
              </label>
              <label className="block space-y-2">
                <span>Enunciado da questão</span>
                <textarea required value={questao.enunciado} onChange={event => update({ enunciado: event.target.value })} className="w-full bg-card border border-border rounded-xl p-4 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary" />
              </label>
              <label className="block space-y-2">
                <span>Orientação adicional <span className="text-muted-foreground">(opcional)</span></span>
                <input value={questao.orientacao || ''} onChange={event => update({ orientacao: event.target.value })} className="w-full bg-card border border-border rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary" />
              </label>
              {questao.tipo === 'multipla_escolha' ? (
                <fieldset className="space-y-3">
                  <legend className="font-medium">Alternativas</legend>
                  {questao.alternativas.map((alternativa, alternativaIndex) => (
                    <label key={alternativaIndex} className="flex items-center gap-3">
                      <span className="w-6 text-sm text-muted-foreground">{String.fromCharCode(65 + alternativaIndex)}.</span>
                      <input required value={alternativa} aria-label={`Alternativa ${alternativaIndex + 1} da questão ${index + 1}`} onChange={event => update({ alternativas: questao.alternativas.map((item, itemIndex) => itemIndex === alternativaIndex ? event.target.value : item) })} className="flex-1 bg-card border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary" />
                    </label>
                  ))}
                  <Button type="button" variant="outline" className="!w-auto !py-2" disabled={questao.alternativas.length >= 8} onClick={() => update({ alternativas: [...questao.alternativas, `Alternativa ${questao.alternativas.length + 1}`] })}>Adicionar alternativa</Button>
                </fieldset>
              ) : (
                <label className="block space-y-2">
                  <span>Limite de caracteres</span>
                  <input type="number" min="50" max="20000" value={questao.limiteCaracteres || (questao.tipo === 'redacao' ? 5000 : 500)} onChange={event => update({ limiteCaracteres: Number(event.target.value) })} className="w-full bg-card border border-border rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary" />
                </label>
              )}
              <label className="flex items-center gap-3 min-h-11">
                <input type="checkbox" checked={questao.obrigatoria} onChange={event => update({ obrigatoria: event.target.checked })} className="h-5 w-5 accent-primary" />
                <span>Resposta obrigatória</span>
              </label>
            </Card>
          );
        })}
        <Button type="button" variant="outline" onClick={() => setQuestoes(items => [...items, { tipo: 'resposta_curta', enunciado: '', orientacao: '', obrigatoria: true, alternativas: [], limiteCaracteres: 500 }])}>Adicionar questão</Button>
      </section>
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
  const [subject, setSubject] = useState('todas');
  const [visibility, setVisibility] = useState('todas');
  const [authorship, setAuthorship] = useState('todos');
  const [order, setOrder] = useState<'recentes' | 'antigos'>('recentes');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const subjects = [...new Set(contents.map(item => item.subject))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const filteredContents = contents
    .filter(item => subject === 'todas' || item.subject === subject)
    .filter(item => visibility === 'todas' || item.visibility === visibility)
    .filter(item => authorship === 'todos' || (authorship === 'meus' ? item.authorId === user?.id : item.authorId !== user?.id))
    .sort((a, b) => (order === 'recentes' ? -1 : 1) * (new Date(a.publishedAtISO || 0).getTime() - new Date(b.publishedAtISO || 0).getTime()));

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
    <div className="space-y-6 pb-20 md:pb-8">
      <style>{filtersOpen ? '' : '[aria-labelledby="teacher-content-filters"]{display:none}'}</style>
      <div className="flex items-start justify-between gap-3"><SectionHeader title="Conteúdos" subtitle="Materiais publicados para os alunos." /><button type="button" onClick={() => setFiltersOpen(open => !open)} aria-expanded={filtersOpen} aria-controls="teacher-content-filters" className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${filtersOpen ? 'border-primary bg-primary-light text-primary' : 'border-border text-primary hover:bg-primary-light'}`} aria-label={`${filtersOpen ? 'Fechar' : 'Abrir'} filtros de conteúdos`} title="Filtros"><SlidersHorizontal size={20} aria-hidden="true" /></button></div>
      <div className="max-w-sm">
        <Button onClick={() => navigate('/teacher/content/new')}>Novo conteúdo</Button>
      </div>
      {isLoading ? <LoadingState message="Carregando conteúdos..." /> : null}
      {error ? <ErrorState title="Não foi possível carregar os conteúdos" message={error} onRetry={reload} compact /> : null}
      {success ? <FeedbackMessage type="success" message={success} compact onClose={() => setSuccess('')} /> : null}
      {!isLoading && !error && contents.length === 0 ? (
        <EmptyState
          title="Nenhum conteúdo publicado ainda."
          message="Crie o primeiro post para que alunos possam visualizar."
        />
      ) : null}
      {contents.length ? <section aria-labelledby="teacher-content-filters" className="rounded-2xl border border-border bg-card p-4"><h2 id="teacher-content-filters" className="mb-3 font-medium">Filtrar e organizar</h2><fieldset className="mb-4"><legend className="mb-2 text-sm">Matéria</legend><div className="flex flex-wrap gap-2">{['todas', ...subjects].map(item => { const count = item === 'todas' ? contents.length : contents.filter(content => content.subject === item).length; return <button key={item} type="button" aria-pressed={subject === item} onClick={() => setSubject(item)} className={`rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${subject === item ? 'border-primary bg-primary-light text-primary' : 'border-border bg-input-background'}`}><span className="block font-medium">{item === 'todas' ? 'Todas' : item}</span><span className="block text-xs opacity-80">{count} conteúdo(s)</span></button>; })}</div></fieldset><div className="grid gap-4 sm:grid-cols-3"><label className="space-y-2"><span className="block text-sm">Visibilidade</span><select value={visibility} onChange={event => setVisibility(event.target.value)} className="w-full rounded-xl border border-border bg-card p-3"><option value="todas">Todas</option><option value="alunos">Alunos</option><option value="professores">Professores</option><option value="todos">Toda a comunidade</option></select></label><label className="space-y-2"><span className="block text-sm">Autoria</span><select value={authorship} onChange={event => setAuthorship(event.target.value)} className="w-full rounded-xl border border-border bg-card p-3"><option value="todos">Todos os professores</option><option value="meus">Meus conteúdos</option><option value="colegas">Outros professores</option></select></label><label className="space-y-2"><span className="block text-sm">Data</span><select value={order} onChange={event => setOrder(event.target.value as typeof order)} className="w-full rounded-xl border border-border bg-card p-3"><option value="recentes">Mais recentes</option><option value="antigos">Mais antigos</option></select></label></div><button type="button" onClick={() => { setSubject('todas'); setVisibility('todas'); setAuthorship('todos'); setOrder('recentes'); }} className="mt-4 text-sm font-medium text-primary underline underline-offset-4">Limpar filtros</button></section> : null}
      <p role="status" aria-live="polite" className="text-sm text-muted-foreground">{filteredContents.length} conteúdo(s) encontrado(s).</p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredContents.map(content => (
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
              <ReadAloudButton text={`${content.title}. ${content.text}`} label="Ouvir texto" />
            </div>
          </Card>
        ))}
      </div>
      {!isLoading && !error && contents.length > 0 && !filteredContents.length ? <EmptyState title="Nenhum conteúdo corresponde aos filtros." /> : null}
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
  const [videoLinks, setVideoLinks] = useState('');
  const [visivelPara, setVisivelPara] = useState<'todos' | 'alunos' | 'professores'>('todos');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: disciplinasResponse, isLoading: isLoadingDisciplinas, error: disciplinasError, reload: reloadDisciplinas } = useAcademicData(() => listDisciplinas());

  useEffect(() => {
    if (content && isEditing) {
      setTitulo(content.title);
      setDisciplina(content.subject === 'Geral' ? '' : content.subject);
      setConteudo(content.text);
      setTags(content.tags.join(', '));
      setVideoLinks(content.videoLinks.join('\n'));
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
        videoLinks: videoLinks.split(/\r?\n|,/).map(link => link.trim()).filter(Boolean),
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
      {isLoadingDisciplinas ? <LoadingState message="Carregando matérias..." /> : null}
      {disciplinasError ? <ErrorState title="Não foi possível carregar as matérias" message={disciplinasError} onRetry={reloadDisciplinas} compact /> : null}
      <label className="block space-y-2">
        <span>Título</span>
        <input value={titulo} onChange={event => setTitulo(event.target.value)} className="w-full bg-card border border-border rounded-xl p-4 text-base focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Título" required />
      </label>
      <label className="block space-y-2">
        <span>Matéria</span>
        <span id="conteudo-materia-help" className="block text-sm text-muted-foreground">Selecione uma matéria que você leciona.</span>
        <select required value={disciplina} aria-describedby="conteudo-materia-help" disabled={isLoadingDisciplinas || Boolean(disciplinasError)} onChange={event => setDisciplina(event.target.value)} className="w-full bg-card border border-border rounded-xl p-4 text-base focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60">
          <option value="">Selecione a matéria</option>
          {disciplinasResponse?.dados.map(item => <option key={item._id} value={item.nome}>{item.nome}</option>)}
        </select>
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
      <label className="block space-y-2">
        <span>Links de vídeos <span className="text-muted-foreground">(opcional)</span></span>
        <span id="video-links-help" className="block text-sm text-muted-foreground">Informe até 10 links HTTP ou HTTPS, um por linha.</span>
        <textarea value={videoLinks} onChange={event => setVideoLinks(event.target.value)} aria-describedby="video-links-help" className="w-full bg-card border border-border rounded-xl p-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary" placeholder={'https://www.youtube.com/watch?v=...\nhttps://vimeo.com/...'} />
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
          <ReadAloudButton text={content.text} label="Ouvir texto" />
        </div>
        <p className="text-base leading-relaxed">{content.text}</p>
      </Card>
      {content.videoLinks.length ? (
        <Card>
          <h2 className="font-medium text-lg mb-3">Vídeos relacionados</h2>
          <ul className="space-y-2">
            {content.videoLinks.map((link, index) => <li key={link}><a href={link} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-primary rounded">Abrir vídeo {index + 1}<span className="sr-only"> em uma nova aba</span></a></li>)}
          </ul>
        </Card>
      ) : null}
      <ComentariosSection postId={content.id} />
    </div>
  );
};

export const TeacherCorrectionsClasses = () => {
  const navigate = useNavigate();
  const { data, isLoading, error, reload } = useAcademicData(async () => {
    const classes = (await listTurmas()).dados;
    const classesWithPending = await Promise.all(classes.map(async item => {
      const activities = (await listAtividades({ turma: item.codigo })).dados;
      const deliveries = (await Promise.all(activities.map(activity => listEntregasAtividade(activity._id)))).flatMap(response => response.dados);
      return { ...item, pendingCorrections: deliveries.filter(delivery => delivery.status === 'entregue').length };
    }));
    return classesWithPending;
  });
  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <SectionHeader title="Correções" subtitle="Escolha uma turma para revisar entregas." />
      {isLoading ? <LoadingState message="Carregando turmas..." /> : null}
      {error ? <ErrorState title="Não foi possível carregar as turmas" message={error} onRetry={reload} compact /> : null}
      {!isLoading && !error && !data?.length ? <EmptyState title="Nenhuma turma atribuída." /> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data?.map(item => (
          <Card key={item._id}>
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-medium text-lg">{item.nome}</h3>
              <Badge variant={item.pendingCorrections ? 'warning' : 'success'}>
                {item.pendingCorrections ? `${item.pendingCorrections} pendente${item.pendingCorrections === 1 ? '' : 's'}` : 'Em dia'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{item.codigo} | {item.anoLetivo} | {item.turno}</p>
            <Button onClick={() => navigate(`/teacher/corrections/${item._id}`)}>Ver correções</Button>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const TeacherCorrectionsList = () => {
  const { classId = '' } = useParams();
  const navigate = useNavigate();
  const [view, setView] = useState<'pendentes' | 'corrigidas' | 'todas'>('pendentes');
  const { data, isLoading, error, reload } = useAcademicData(async () => {
    const turma = await getTurma(classId);
    const atividades = (await listAtividades({ turma: turma.codigo })).dados;
    const listas = await Promise.all(atividades.map(item => listEntregasAtividade(item._id)));
    return { turma, entregas: listas.flatMap(item => item.dados) };
  }, [classId]);
  const pendingCount = data?.entregas.filter(item => item.status === 'entregue').length || 0;
  const correctedCount = data?.entregas.filter(item => item.status === 'corrigida').length || 0;
  const filteredDeliveries = (data?.entregas || []).filter(item => view === 'todas' || (view === 'pendentes' ? item.status === 'entregue' : item.status === 'corrigida'));
  return (
    <div className="space-y-6 pb-20 md:pb-8">
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
      {!isLoading && !error && data?.entregas.length ? (
        <section aria-labelledby="correction-view-title" className="rounded-2xl border border-border bg-card p-4">
          <h2 id="correction-view-title" className="mb-3 font-medium">Selecionar entregas</h2>
          <div className="flex flex-wrap gap-2">
            <button type="button" aria-pressed={view === 'pendentes'} onClick={() => setView('pendentes')} className={`rounded-xl border px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${view === 'pendentes' ? 'border-primary bg-primary-light text-primary' : 'border-border bg-input-background'}`}><span className="block font-medium">Pendentes</span><span className="block text-xs opacity-80">{pendingCount} para corrigir</span></button>
            <button type="button" aria-pressed={view === 'corrigidas'} onClick={() => setView('corrigidas')} className={`rounded-xl border px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${view === 'corrigidas' ? 'border-primary bg-primary-light text-primary' : 'border-border bg-input-background'}`}><span className="block font-medium">Já corrigidas</span><span className="block text-xs opacity-80">{correctedCount} no histórico</span></button>
            <button type="button" aria-pressed={view === 'todas'} onClick={() => setView('todas')} className={`rounded-xl border px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${view === 'todas' ? 'border-primary bg-primary-light text-primary' : 'border-border bg-input-background'}`}><span className="block font-medium">Todas</span><span className="block text-xs opacity-80">{data.entregas.length} entregas</span></button>
          </div>
        </section>
      ) : null}
      <p role="status" aria-live="polite" className="text-sm text-muted-foreground">{filteredDeliveries.length} entrega(s) exibida(s).</p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredDeliveries.map(item => {
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
      {!isLoading && !error && Boolean(data?.entregas.length) && !filteredDeliveries.length ? <EmptyState title={view === 'pendentes' ? 'Nenhuma correção pendente.' : 'Nenhuma atividade no histórico.'} message={view === 'pendentes' ? 'Todas as entregas desta turma já foram corrigidas.' : 'As atividades corrigidas aparecerão aqui.'} /> : null}
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
        <div className="flex justify-between mb-3"><h2 className="font-medium text-lg">Respostas enviadas</h2><ReadAloudButton text={item.entrega.resposta} label="Ouvir respostas" /></div>
        {item.entrega.respostas?.length && atividade?.questoes?.length ? (
          <div className="space-y-5">
            {item.entrega.respostas.map((resposta, index) => {
              const questao = atividade.questoes.find(item => item._id === resposta.questaoId);
              return <section key={resposta.questaoId} className="rounded-xl bg-input-background p-4">
                <h3 className="font-medium">Questão {index + 1}</h3>
                {questao ? <p className="text-sm text-muted-foreground mt-1">{questao.enunciado}</p> : null}
                <p className="leading-relaxed mt-3 whitespace-pre-wrap">{resposta.resposta}</p>
              </section>;
            })}
          </div>
        ) : <p className="leading-relaxed whitespace-pre-wrap">{item.entrega.resposta}</p>}
      </Card>
      {submitError ? <FeedbackMessage type="error" message={submitError} compact /> : null}
      <Card className="p-4 border-primary"><label htmlFor="score" className="text-sm text-primary">Nota do professor (0 a 10)</label><input id="score" type="number" min="0" max="10" step="0.1" value={teacherScore} onChange={e => setTeacherScore(e.target.value)} className="w-full text-3xl font-medium bg-transparent focus:outline-none" /></Card>
      <label className="block space-y-2"><span>Comentário do professor</span><textarea value={feedback} onChange={e => setFeedback(e.target.value)} className="w-full bg-card border border-border rounded-xl p-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary" /></label>
      <Button onClick={submit} disabled={isSubmitting || !feedback.trim() || teacherScore === ''}>{isSubmitting ? 'Salvando...' : 'Confirmar correção'}</Button>
    </div>
  );
};

const toLocalDateTime = (value: string) => {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

const exportTeacherSchedule = (events: EventoCronograma[]) => {
  const format = (value: string | Date) => new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const escape = (value: string) => value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const entries = events.map(item => {
    const end = item.fim ? new Date(item.fim) : new Date(new Date(item.inicio).getTime() + 3_600_000);
    return ['BEGIN:VEVENT', `UID:${item._id}@luminia`, `DTSTAMP:${format(new Date())}`, `DTSTART:${format(item.inicio)}`, `DTEND:${format(end)}`, `SUMMARY:${escape(item.titulo)}`, `DESCRIPTION:${escape([item.descricao, item.disciplina, `Turma ${item.turma}`].filter(Boolean).join(' — '))}`, 'END:VEVENT'].join('\r\n');
  });
  const blob = new Blob([['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Luminia//Agenda do professor//PT-BR', 'CALSCALE:GREGORIAN', ...entries, 'END:VCALENDAR', ''].join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'agenda-professor-luminia.ics';
  link.click();
  URL.revokeObjectURL(url);
};

const emptyScheduleForm = { titulo: '', descricao: '', disciplina: '', turma: '', tipo: 'aula' as EventoCronograma['tipo'], inicio: '', fim: '' };

export const TeacherSchedule = () => {
  const { data, isLoading, error, reload } = useAcademicData(() => Promise.all([listCronograma(), listDisciplinas(), listTurmas()]));
  const [form, setForm] = useState(emptyScheduleForm);
  const [editingId, setEditingId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState('todas');
  const [classFilter, setClassFilter] = useState('todas');
  const [submitError, setSubmitError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const events = data?.[0].dados || [];
  const subjects = data?.[1].dados || [];
  const classes = data?.[2].dados || [];
  const selectedSubject = subjects.find(item => item.nome === form.disciplina);
  const selectedClassIds = new Set(selectedSubject?.turmaIds.map(item => typeof item === 'string' ? item : item._id) || []);
  const availableClasses = classes.filter(item => selectedClassIds.has(item._id));
  const filteredEvents = events.filter(item => (subjectFilter === 'todas' || item.disciplina === subjectFilter) && (classFilter === 'todas' || item.turma === classFilter));

  const resetForm = () => {
    setForm(emptyScheduleForm);
    setEditingId('');
    setShowForm(false);
    setSubmitError('');
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setSubmitError('');
    setFeedback('');
    try {
      const payload = { ...form, inicio: new Date(form.inicio).toISOString(), fim: form.fim ? new Date(form.fim).toISOString() : undefined };
      if (form.fim && new Date(form.fim) <= new Date(form.inicio)) {
        setSubmitError('O término deve acontecer depois do início.');
        return;
      }
      if (editingId) await updateEventoCronograma(editingId, payload);
      else await createEventoCronograma(payload);
      setFeedback(editingId ? 'Evento atualizado com sucesso.' : 'Evento adicionado à agenda.');
      resetForm();
      await reload();
    } catch (submitFailure) {
      setSubmitError(getFriendlyErrorMessage(submitFailure));
    } finally {
      setIsSaving(false);
    }
  };
  const edit = (item: EventoCronograma) => {
    setForm({ titulo: item.titulo, descricao: item.descricao || '', disciplina: item.disciplina || '', turma: item.turma, tipo: item.tipo, inicio: toLocalDateTime(item.inicio), fim: item.fim ? toLocalDateTime(item.fim) : '' });
    setEditingId(item._id);
    setShowForm(true);
    setFeedback('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const remove = async (item: EventoCronograma) => {
    if (!window.confirm(`Excluir o evento “${item.titulo}”?`)) return;
    try {
      await deleteEventoCronograma(item._id);
      setFeedback('Evento excluído da agenda.');
      await reload();
    } catch (removeError) {
      setSubmitError(getFriendlyErrorMessage(removeError));
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <div className="flex items-start justify-between gap-3">
        <SectionHeader title="Minha agenda" subtitle="Organize aulas, atividades, provas e eventos das suas turmas." />
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => setFiltersOpen(open => !open)} aria-expanded={filtersOpen} aria-controls="teacher-schedule-filters" className={`inline-flex h-11 w-11 items-center justify-center rounded-full border focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${filtersOpen ? 'border-primary bg-primary-light text-primary' : 'border-border text-primary hover:bg-primary-light'}`} aria-label={`${filtersOpen ? 'Fechar' : 'Abrir'} filtros da agenda`} title="Filtros"><SlidersHorizontal size={20} aria-hidden="true" /></button>
          <button type="button" onClick={() => exportTeacherSchedule(filteredEvents)} disabled={!filteredEvents.length} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border text-primary hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-40" aria-label="Baixar agenda em formato de calendário" title="Exportar agenda"><CalendarPlus size={20} aria-hidden="true" /></button>
          <button type="button" onClick={() => { resetForm(); setShowForm(true); }} className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2" aria-label="Adicionar evento" title="Adicionar evento"><Plus size={20} aria-hidden="true" /></button>
        </div>
      </div>
      {feedback ? <FeedbackMessage type="success" message={feedback} compact /> : null}
      {submitError && !showForm ? <FeedbackMessage type="error" message={submitError} compact /> : null}
      {showForm ? (
        <Card>
          <form onSubmit={submit} className="space-y-4">
            <div><h2 className="text-lg font-medium">{editingId ? 'Editar evento' : 'Novo evento'}</h2><p className="text-sm text-muted-foreground">O evento ficará visível para os alunos da turma selecionada.</p></div>
            {submitError ? <FeedbackMessage type="error" message={submitError} compact /> : null}
            <label className="block space-y-2"><span>Título</span><input required minLength={3} maxLength={180} value={form.titulo} onChange={event => setForm({ ...form, titulo: event.target.value })} className="w-full rounded-xl border border-border bg-card p-3 focus:outline-none focus:ring-2 focus:ring-primary" /></label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2"><span>Matéria</span><select required value={form.disciplina} onChange={event => setForm({ ...form, disciplina: event.target.value, turma: '' })} className="w-full rounded-xl border border-border bg-card p-3 focus:outline-none focus:ring-2 focus:ring-primary"><option value="">Selecione a matéria</option>{subjects.map(item => <option key={item._id} value={item.nome}>{item.nome}</option>)}</select></label>
              <label className="block space-y-2"><span>Turma</span><select required disabled={!form.disciplina} value={form.turma} onChange={event => setForm({ ...form, turma: event.target.value })} className="w-full rounded-xl border border-border bg-card p-3 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"><option value="">Selecione a turma</option>{availableClasses.map(item => <option key={item._id} value={item.codigo}>{item.nome} ({item.codigo})</option>)}</select></label>
              <label className="block space-y-2"><span>Tipo</span><select required value={form.tipo} onChange={event => setForm({ ...form, tipo: event.target.value as EventoCronograma['tipo'] })} className="w-full rounded-xl border border-border bg-card p-3 focus:outline-none focus:ring-2 focus:ring-primary"><option value="aula">Aula</option><option value="atividade">Atividade</option><option value="prova">Prova</option><option value="evento">Evento</option></select></label>
              <label className="block space-y-2"><span>Início</span><input required type="datetime-local" value={form.inicio} onChange={event => setForm({ ...form, inicio: event.target.value })} className="w-full rounded-xl border border-border bg-card p-3 focus:outline-none focus:ring-2 focus:ring-primary" /></label>
              <label className="block space-y-2"><span>Término (opcional)</span><input type="datetime-local" min={form.inicio || undefined} value={form.fim} onChange={event => setForm({ ...form, fim: event.target.value })} className="w-full rounded-xl border border-border bg-card p-3 focus:outline-none focus:ring-2 focus:ring-primary" /></label>
            </div>
            <label className="block space-y-2"><span>Descrição (opcional)</span><textarea maxLength={2000} value={form.descricao} onChange={event => setForm({ ...form, descricao: event.target.value })} className="min-h-24 w-full rounded-xl border border-border bg-card p-3 focus:outline-none focus:ring-2 focus:ring-primary" /></label>
            <div className="flex flex-wrap gap-3"><Button type="submit" disabled={isSaving}>{isSaving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Adicionar à agenda'}</Button><Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button></div>
          </form>
        </Card>
      ) : null}
      {filtersOpen ? <section id="teacher-schedule-filters" aria-labelledby="agenda-filters" className="rounded-2xl border border-border bg-card p-4">
        <h2 id="agenda-filters" className="mb-3 font-medium">Filtrar agenda</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2"><span className="block text-sm">Matéria</span><select value={subjectFilter} onChange={event => setSubjectFilter(event.target.value)} className="w-full rounded-xl border border-border bg-card p-3 focus:outline-none focus:ring-2 focus:ring-primary"><option value="todas">Todas</option>{subjects.map(item => <option key={item._id} value={item.nome}>{item.nome}</option>)}</select></label>
          <label className="space-y-2"><span className="block text-sm">Turma</span><select value={classFilter} onChange={event => setClassFilter(event.target.value)} className="w-full rounded-xl border border-border bg-card p-3 focus:outline-none focus:ring-2 focus:ring-primary"><option value="todas">Todas</option>{classes.map(item => <option key={item._id} value={item.codigo}>{item.nome}</option>)}</select></label>
        </div>
      </section> : null}
      {isLoading ? <LoadingState message="Carregando agenda..." /> : null}
      {error ? <ErrorState title="Não foi possível carregar a agenda" message={error} onRetry={reload} compact /> : null}
      {!isLoading && !error && !filteredEvents.length ? <EmptyState title="Nenhum evento encontrado." message="Adicione um evento ou altere os filtros da agenda." /> : null}
      <p role="status" aria-live="polite" className="text-sm text-muted-foreground">{filteredEvents.length} evento(s) na agenda.</p>
      <div className="grid gap-4 lg:grid-cols-2">
        {filteredEvents.map(item => <Card key={item._id}><div className="flex items-start justify-between gap-3"><div><Badge variant="primary">{item.tipo}</Badge><h3 className="mt-2 text-lg font-medium">{item.titulo}</h3><p className="text-sm text-muted-foreground">{item.disciplina} · Turma {item.turma}</p><p className="mt-2 text-sm">{new Date(item.inicio).toLocaleString('pt-BR')}{item.fim ? ` até ${new Date(item.fim).toLocaleString('pt-BR')}` : ''}</p>{item.descricao ? <p className="mt-2 text-sm text-muted-foreground">{item.descricao}</p> : null}</div><div className="flex gap-1"><button type="button" onClick={() => edit(item)} className="rounded-full p-2 text-primary hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary" aria-label={`Editar ${item.titulo}`}><Pencil size={18} aria-hidden="true" /></button><button type="button" onClick={() => void remove(item)} className="rounded-full p-2 text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500" aria-label={`Excluir ${item.titulo}`}><Trash2 size={18} aria-hidden="true" /></button></div></div></Card>)}
      </div>
    </div>
  );
};

export const TeacherProfile = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [profile, setProfile] = useState<Professor | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const { data: turmas, isLoading: isLoadingTurmas, error: turmasError, reload: reloadTurmas } = useAcademicData(() => listTurmas());
  const name = profile?.nome || user?.nome || 'Professor';
  const initials = name
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const profileSubtitle = user?.email || (profile?.dataNascimento ? `Nascimento: ${new Date(profile.dataNascimento).toLocaleDateString('pt-BR')}` : 'Perfil do professor');

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const savePhoto = async (fotoPerfil: string) => {
    if (!profile) return;
    setIsSavingPhoto(true);
    setPhotoError('');
    try {
      const response = await updateMeuPerfilProfessor(profile._id, fotoPerfil);
      setProfile(current => current ? { ...current, fotoPerfil: response.professor.fotoPerfil || '' } : current);
    } catch (error) {
      setPhotoError(getFriendlyErrorMessage(error));
    } finally {
      setIsSavingPhoto(false);
    }
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setPhotoError('Escolha uma imagem PNG, JPEG ou WebP de até 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => void savePhoto(String(reader.result));
    reader.onerror = () => setPhotoError('Não foi possível ler a imagem selecionada.');
    reader.readAsDataURL(file);
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
    <div className="space-y-6 pb-20 md:pb-8">
      <div className="space-y-6">
          <input id="teacher-profile-photo" type="file" accept="image/png,image/jpeg,image/webp" onChange={handlePhotoChange} disabled={isSavingPhoto} className="sr-only" />
          <ProfileHeader initials={initials || 'PR'} name={name} subtitle={profileSubtitle} photo={profile?.fotoPerfil} photoInputId="teacher-profile-photo" isSavingPhoto={isSavingPhoto} />
          {photoError ? <FeedbackMessage type="error" message={photoError} compact /> : null}
          <Card>
            <h2 className="font-medium text-lg mb-2">Dados do professor</h2>
            <p className="text-muted-foreground">Nascimento: {profile?.dataNascimento ? new Date(profile.dataNascimento).toLocaleDateString('pt-BR') : 'Não informado'}</p>
            <p className="text-muted-foreground">Matérias: {profile?.materias?.length ? profile.materias.join(', ') : 'Não informadas'}</p>
            <p className="text-muted-foreground">Turmas: {profile?.turmas?.length ? profile.turmas.join(', ') : 'Não informadas'}</p>
          </Card>
      </div>
      {isLoadingProfile ? <LoadingState message="Carregando perfil..." /> : null}
      {profileError ? <ErrorState title="Não foi possível carregar o perfil" message={profileError} compact /> : null}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Turmas atribuídas</h2>
        {isLoadingTurmas ? <LoadingState message="Carregando turmas..." /> : null}
        {turmasError ? <ErrorState title="Não foi possível carregar as turmas" message={turmasError} onRetry={reloadTurmas} compact /> : null}
        {!isLoadingTurmas && !turmasError && !turmas?.dados.length ? <EmptyState title="Nenhuma turma atribuída." /> : null}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {turmas?.dados.map(item => (
            <Card key={item._id}>
              <h3 className="font-medium">{item.nome}</h3>
              <p className="text-sm text-muted-foreground mb-4">{item.codigo} | {item.anoLetivo} | {item.turno}</p>
              <Button variant="outline" onClick={() => navigate(`/teacher/class/${item._id}`)}>Acessar turma</Button>
            </Card>
          ))}
        </div>
      </section>
      <button type="button" onClick={handleLogout} className="w-full rounded-xl border-2 border-red-200 bg-card px-4 py-3 font-medium text-red-600 transition-colors hover:border-red-300 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
        Sair
      </button>
    </div>
  );
};

export const TeacherClassDetail = () => {
  const { classId = '' } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error, reload } = useAcademicData(async () => {
    const turma = await getTurma(classId);
    const [disciplinas, atividades] = await Promise.all([listDisciplinas(classId), listAtividades({ turma: turma.codigo })]);
    return { turma, disciplinas: disciplinas.dados, atividades: atividades.dados };
  }, [classId]);
  if (isLoading) return <LoadingState message="Carregando turma..." />;
  if (error || !data) return <div className="space-y-4"><BackButton to="/teacher/profile" /><ErrorState title="Não foi possível abrir a turma" message={error || 'Turma não encontrada.'} onRetry={reload} compact /></div>;
  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <header className="flex items-center gap-3"><BackButton to="/teacher/profile" /><div><h1 className="text-xl font-medium">{data.turma.nome}</h1><p className="text-muted-foreground">{data.turma.codigo} | {data.turma.anoLetivo}</p></div></header>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2 mb-4"><CalendarDays size={18} className="text-primary" /><h2 className="font-medium text-lg">Dados da turma</h2></div>
          <p className="text-sm text-muted-foreground">Turno: {data.turma.turno} | Situação: {data.turma.ativa ? 'Ativa' : 'Inativa'}</p>
          {data.turma.descricao ? <p className="text-sm text-muted-foreground mt-2">{data.turma.descricao}</p> : null}
          <p className="text-sm text-muted-foreground mt-2">
            Professores: {data.turma.professorIds
              .map(professor => typeof professor === 'string' ? professor : professor.nome)
              .join(', ')}
          </p>
        </Card>
        <Card>
          <h2 className="font-medium text-lg mb-3">Disciplinas</h2>
          <div className="space-y-3">{data.disciplinas.map(item => <div key={item._id} className="rounded-xl bg-input-background p-3"><strong>{item.nome}</strong><p className="text-sm text-muted-foreground">{item.codigo} | {item.cargaHoraria} horas</p></div>)}</div>
        </Card>
      </div>
      <Card>
        <h2 className="font-medium text-lg mb-3">Histórico de atividades</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.atividades.map(activity => (
            <div key={activity._id} className="rounded-xl bg-input-background p-3">
              <div className="flex justify-between gap-3">
                <button
                  type="button"
                  onClick={() => navigate(`/teacher/activity/${activity._id}`)}
                  className="text-left font-medium text-foreground underline-offset-4 hover:text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                  aria-label={`Acessar atividade: ${activity.titulo}`}
                >
                  {activity.titulo}
                </button>
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
