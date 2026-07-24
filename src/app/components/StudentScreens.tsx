import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, CalendarDays, CalendarPlus, CheckCircle2, Clock, FileText, GraduationCap, SlidersHorizontal, UserRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePostContent, usePostContents } from '../hooks/usePostContents';
import { listMinhasLeituras, marcarPostComoLido, marcarPostComoNaoLido } from '../services/postService';
import { getFriendlyErrorMessage } from '../services/api';
import { getMeuPerfilAluno, updateMeuPerfilAluno } from '../services/profileService';
import { createEntrega, getAtividade, getCorrecao, getMeuBoletim, listAtividades, listCronograma, listDisciplinas, listMinhasEntregas } from '../services/academicService';
import { useAcademicData } from '../hooks/useAcademicData';
import { Aluno } from '../types/api';
import { ComentariosSection } from './ComentariosSection';
import { EmptyState, ErrorState, FeedbackMessage, LoadingState } from './feedback';
import { Badge, Button, Card, ProfileHeader, ReadAloudButton, SectionHeader } from './ui';

const BackButton = ({ to }: { to?: string }) => {
  const navigate = useNavigate();
  return <button onClick={() => to ? navigate(to) : navigate(-1)} className="text-muted-foreground p-2 -ml-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary" aria-label="Voltar">←</button>;
};

const escapeCalendarText = (value: string) => value
  .replace(/\\/g, '\\\\')
  .replace(/\r?\n/g, '\\n')
  .replace(/,/g, '\\,')
  .replace(/;/g, '\\;');

const toCalendarDate = (value: string | Date) => new Date(value)
  .toISOString()
  .replace(/[-:]/g, '')
  .replace(/\.\d{3}Z$/, 'Z');

const downloadSchedule = (events: NonNullable<Awaited<ReturnType<typeof listCronograma>>['dados']>) => {
  const generatedAt = toCalendarDate(new Date());
  const calendarEvents = events.map(event => {
    const end = event.fim ? new Date(event.fim) : new Date(new Date(event.inicio).getTime() + 60 * 60 * 1000);
    const details = [event.descricao, event.disciplina || event.tipo, `Turma ${event.turma}`].filter(Boolean).join(' — ');
    return [
      'BEGIN:VEVENT',
      `UID:${event._id}@luminia`,
      `DTSTAMP:${generatedAt}`,
      `DTSTART:${toCalendarDate(event.inicio)}`,
      `DTEND:${toCalendarDate(end)}`,
      `SUMMARY:${escapeCalendarText(event.titulo)}`,
      `DESCRIPTION:${escapeCalendarText(details)}`,
      'END:VEVENT',
    ].join('\r\n');
  });
  const calendar = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Luminia//Cronograma escolar//PT-BR', 'CALSCALE:GREGORIAN', ...calendarEvents, 'END:VCALENDAR', ''].join('\r\n');
  const url = URL.createObjectURL(new Blob([calendar], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'cronograma-luminia.ics';
  link.click();
  URL.revokeObjectURL(url);
};

const QuickCard = ({ icon: Icon, title, subtitle, onClick }: any) => (
  <Card
    className="p-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary md:p-5"
    role="button"
    tabIndex={0}
    onClick={onClick}
    onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onClick();
      }
    }}
  >
    <Icon className="text-primary mb-3" size={22} aria-hidden="true" />
    <h3 className="font-medium">{title}</h3>
    <p className="text-sm text-muted-foreground">{subtitle}</p>
  </Card>
);

export const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const firstName = user?.nome.split(' ')[0] || 'Aluno';
  const { data: summary, isLoading: isLoadingSummary } = useAcademicData(async () => {
    const [cronogramaResponse, atividadesResponse, entregasResponse, boletimResponse] = await Promise.all([
      listCronograma(),
      listAtividades(),
      listMinhasEntregas(),
      getMeuBoletim(),
    ]);

    const entregasIds = new Set(
      entregasResponse.dados.map(item => (typeof item.atividadeId === 'string' ? item.atividadeId : item.atividadeId._id))
    );

    const pendingActivities = atividadesResponse.dados.filter(item => !entregasIds.has(item._id)).length;
    const correctedDeliveries = entregasResponse.dados.filter(item => item.status === 'corrigida').length;
    const latestGrade = boletimResponse.notas.length ? boletimResponse.notas[boletimResponse.notas.length - 1].nota : null;

    const now = Date.now();
    const sortedSchedule = [...cronogramaResponse.dados].sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime());
    const nextClass = sortedSchedule.find(item => new Date(item.inicio).getTime() >= now) || sortedSchedule[0] || null;

    return {
      pendingActivities,
      correctedDeliveries,
      latestGrade,
      nextClass,
    };
  });

  const nextClassSubtitle = (() => {
    if (isLoadingSummary) {
      return 'Carregando...';
    }

    if (!summary?.nextClass) {
      return 'Sem aula no cronograma';
    }

    return `${summary.nextClass.disciplina || summary.nextClass.tipo}, ${new Date(summary.nextClass.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  })();

  return (
    <div className="space-y-8">
      <SectionHeader title={`Olá, ${firstName}`} subtitle="Aqui está seu dia de estudos." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <QuickCard icon={CalendarDays} title="Próxima aula" subtitle={nextClassSubtitle} onClick={() => navigate('/student/profile')} />
        <QuickCard
          icon={Clock}
          title="Pendentes"
          subtitle={isLoadingSummary ? 'Carregando...' : `${summary?.pendingActivities ?? 0} atividade${(summary?.pendingActivities ?? 0) === 1 ? '' : 's'}`}
          onClick={() => navigate('/student/activities')}
        />
        <QuickCard
          icon={GraduationCap}
          title="Última nota"
          subtitle={isLoadingSummary ? 'Carregando...' : summary?.latestGrade !== null && summary?.latestGrade !== undefined ? `${summary.latestGrade.toLocaleString('pt-BR')} no boletim` : 'Sem notas lançadas'}
          onClick={() => navigate('/student/feedback')}
        />
        <QuickCard
          icon={BookOpen}
          title="Feedbacks"
          subtitle={isLoadingSummary ? 'Carregando...' : `${summary?.correctedDeliveries ?? 0} correção(ões) publicada(s)`}
          onClick={() => navigate('/student/feedback')}
        />
      </div>
      <section>
        <h2 className="text-lg font-medium mb-4">Atalhos</h2>
        <div className="grid gap-3 lg:grid-cols-3">
          <Button variant="outline" onClick={() => navigate('/student/contents')}>Ver conteúdos</Button>
          <Button variant="outline" onClick={() => navigate('/student/activities')}>Enviar atividade</Button>
          <Button variant="outline" onClick={() => navigate('/student/profile')}>Ver boletim e cronograma</Button>
        </div>
      </section>
    </div>
  );
};

export const StudentContents = () => {
  const navigate = useNavigate();
  const { contents, isLoading, error, reload } = usePostContents();
  const { data: leituras, isLoading: isLoadingLeituras, error: leiturasError, reload: reloadLeituras } = useAcademicData(() => listMinhasLeituras());
  const [materia, setMateria] = useState('todas');
  const [situacao, setSituacao] = useState<'todos' | 'nao_lidos' | 'lidos'>('todos');
  const [ordem, setOrdem] = useState<'recentes' | 'antigos'>('recentes');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const idsLidos = new Set(leituras?.map(item => item.postId) || []);
  const materias = [...new Set(contents.map(content => content.subject))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const conteudosFiltrados = contents
    .filter(content => materia === 'todas' || content.subject === materia)
    .filter(content => situacao === 'todos' || (situacao === 'lidos' ? idsLidos.has(content.id) : !idsLidos.has(content.id)))
    .sort((a, b) => {
      const diferenca = new Date(a.publishedAtISO || 0).getTime() - new Date(b.publishedAtISO || 0).getTime();
      return ordem === 'recentes' ? -diferenca : diferenca;
    });
  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <div className="flex items-start justify-between gap-3"><SectionHeader title="Conteúdos" subtitle="Escolha uma matéria ou use os filtros para encontrar seus materiais." /><button type="button" onClick={() => setFiltersOpen(open => !open)} aria-expanded={filtersOpen} aria-controls="student-content-filters" className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${filtersOpen ? 'border-primary bg-primary-light text-primary' : 'border-border text-primary hover:bg-primary-light'}`} aria-label={`${filtersOpen ? 'Fechar' : 'Abrir'} filtros de conteúdos`} title="Filtros"><SlidersHorizontal size={20} aria-hidden="true" /></button></div>
      {isLoading ? <LoadingState message="Carregando conteúdos..." /> : null}
      {error ? <ErrorState title="Não foi possível carregar os conteúdos" message={error} onRetry={reload} compact /> : null}
      {isLoadingLeituras ? <LoadingState message="Carregando seu progresso de leitura..." /> : null}
      {leiturasError ? <ErrorState title="Não foi possível carregar seu progresso" message={leiturasError} onRetry={reloadLeituras} compact /> : null}
      {!isLoading && !error && contents.length === 0 ? (
        <EmptyState
          title="Nenhum conteúdo disponível."
          message="Quando professores publicarem posts visíveis para alunos, eles aparecerão aqui."
        />
      ) : null}
      {!isLoading && !error && contents.length ? (
        <>
          {filtersOpen ? <section id="student-content-filters" aria-labelledby="filtros-title" className="rounded-2xl border border-border bg-card p-4">
            <h2 id="filtros-title" className="font-medium mb-3">Filtrar e organizar</h2>
            <fieldset className="mb-4">
              <legend className="mb-2 text-sm">Matéria</legend>
              <div className="flex flex-wrap gap-2">
                <button type="button" aria-pressed={materia === 'todas'} onClick={() => setMateria('todas')} className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${materia === 'todas' ? 'border-primary bg-primary-light text-primary' : 'border-border bg-input-background hover:border-primary/40'}`}>
                  <span className="block font-medium">Todas</span>
                  <span className="block text-xs opacity-80">{contents.length} conteúdos</span>
                </button>
                {materias.map(item => {
                  const itens = contents.filter(content => content.subject === item);
                  const lidos = itens.filter(content => idsLidos.has(content.id)).length;
                  return <button key={item} type="button" aria-pressed={materia === item} aria-label={`${item}, ${lidos} de ${itens.length} conteúdos lidos`} onClick={() => setMateria(item)} className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${materia === item ? 'border-primary bg-primary-light text-primary' : 'border-border bg-input-background hover:border-primary/40'}`}>
                    <span className="block font-medium">{item}</span>
                    <span className="block text-xs opacity-80">{lidos}/{itens.length} lidos</span>
                  </button>;
                })}
              </div>
            </fieldset>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2"><span className="block text-sm">Situação de leitura</span><select value={situacao} onChange={event => setSituacao(event.target.value as typeof situacao)} className="w-full rounded-xl border border-border bg-card p-3 focus:outline-none focus:ring-2 focus:ring-primary"><option value="todos">Todos</option><option value="nao_lidos">Ainda não lidos</option><option value="lidos">Já lidos</option></select></label>
              <label className="space-y-2"><span className="block text-sm">Organizar por data</span><select value={ordem} onChange={event => setOrdem(event.target.value as typeof ordem)} className="w-full rounded-xl border border-border bg-card p-3 focus:outline-none focus:ring-2 focus:ring-primary"><option value="recentes">Mais recentes primeiro</option><option value="antigos">Mais antigos primeiro</option></select></label>
            </div>
            <button type="button" onClick={() => { setMateria('todas'); setSituacao('todos'); setOrdem('recentes'); }} className="mt-4 text-sm font-medium text-primary underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-primary rounded">Limpar filtros</button>
          </section> : null}
          <p role="status" aria-live="polite" className="text-sm text-muted-foreground">{conteudosFiltrados.length} conteúdo(s) encontrado(s){materia !== 'todas' ? ` em ${materia}` : ''}.</p>
        </>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {conteudosFiltrados.map(content => (
          <Card key={content.id}>
            <div className="flex items-center justify-between gap-3"><Badge variant="primary">{content.subject}</Badge><Badge variant={idsLidos.has(content.id) ? 'success' : 'warning'}>{idsLidos.has(content.id) ? 'Lido' : 'Não lido'}</Badge></div>
            <h3 className="font-medium text-lg mt-3">{content.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{content.teacher} | {content.publishedAt}</p>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" className="!w-auto !py-2 !px-3" onClick={() => navigate(`/student/content/${content.id}`)}>Ver conteúdo</Button>
              <ReadAloudButton text={`${content.title}. ${content.text}`} label="Ouvir texto" />
            </div>
          </Card>
        ))}
      </div>
      {!isLoading && !error && contents.length > 0 && conteudosFiltrados.length === 0 ? <EmptyState title="Nenhum conteúdo corresponde aos filtros." message="Altere a matéria ou a situação de leitura." /> : null}
    </div>
  );
};

export const StudentContentDetail = () => {
  const { id } = useParams();
  const { content, isLoading, error, reload } = usePostContent(id);
  const { data: leituras, setData: setLeituras, error: leiturasError } = useAcademicData(() => listMinhasLeituras());
  const [readingActionError, setReadingActionError] = useState('');
  const [isUpdatingReading, setIsUpdatingReading] = useState(false);
  const isRead = Boolean(id && leituras?.some(item => item.postId === id));

  const toggleReading = async () => {
    if (!id) return;
    setIsUpdatingReading(true);
    setReadingActionError('');
    try {
      if (isRead) {
        await marcarPostComoNaoLido(id);
        setLeituras(items => items?.filter(item => item.postId !== id) || []);
      } else {
        const response = await marcarPostComoLido(id);
        setLeituras(items => [...(items || []), response.leitura]);
      }
    } catch (actionError) {
      setReadingActionError(getFriendlyErrorMessage(actionError));
    } finally {
      setIsUpdatingReading(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Carregando conteúdo..." />;
  }

  if (error || !content) {
    return (
      <div className="space-y-4">
        <BackButton to="/student/contents" />
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
    <div className="space-y-6 pb-20 md:pb-8">
      <header className="flex items-center gap-3"><BackButton to="/student/contents" /><div><h1 className="text-xl font-medium">{content.title}</h1><p className="text-muted-foreground">{content.subject} | {content.teacher}</p></div></header>
      {leiturasError || readingActionError ? <ErrorState message={readingActionError || leiturasError} compact /> : null}
      <Button variant={isRead ? 'outline' : 'primary'} onClick={() => void toggleReading()} disabled={isUpdatingReading}>
        {isUpdatingReading ? 'Atualizando...' : isRead ? 'Marcar como não lido' : 'Marcar como lido'}
      </Button>
      <Card>
        <div className="flex justify-between items-start gap-3 mb-4"><h2 className="font-medium text-lg">Texto do conteúdo</h2><ReadAloudButton text={content.text} label="Ouvir texto" /></div>
        <p className="text-base leading-relaxed">{content.text}</p>
      </Card>
      {content.videoLinks.length ? (
        <Card>
          <h2 className="font-medium text-lg mb-3">Vídeos relacionados</h2>
          <ul className="space-y-2">
            {content.videoLinks.map((link, index) => <li key={link}><a href={link} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-primary rounded">Assistir ao vídeo {index + 1}<span className="sr-only"> em uma nova aba</span></a></li>)}
          </ul>
        </Card>
      ) : null}
      <Card>
        <div className="flex justify-between items-start gap-3 mb-3"><h2 className="font-medium text-lg">Conteúdos relacionados</h2><ReadAloudButton text={content.related.join('. ')} label="Ouvir texto" /></div>
        <div className="space-y-2">{content.related.map(item => <p key={item} className="rounded-xl bg-input-background p-3">{item}</p>)}</div>
      </Card>
      <ComentariosSection postId={content.id} />
    </div>
  );
};

export const StudentActivities = () => {
  const navigate = useNavigate();
  const { data, isLoading, error, reload } = useAcademicData(() => Promise.all([listAtividades(), listMinhasEntregas()]));
  const [materia, setMateria] = useState('todas');
  const [situacao, setSituacao] = useState<'todas' | 'pendentes' | 'entregues' | 'corrigidas'>('todas');
  const [ordem, setOrdem] = useState<'proximo' | 'distante'>('proximo');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const atividades = data?.[0].dados || [];
  const entregas = data?.[1].dados || [];
  const entregaDaAtividade = (atividadeId: string) => entregas.find(
    item => (typeof item.atividadeId === 'string' ? item.atividadeId : item.atividadeId._id) === atividadeId
  );
  const materias = [...new Set(atividades.map(atividade => atividade.disciplina))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const atividadesFiltradas = atividades
    .filter(atividade => materia === 'todas' || atividade.disciplina === materia)
    .filter(atividade => {
      if (situacao === 'todas') return true;
      const entrega = entregaDaAtividade(atividade._id);
      if (situacao === 'pendentes') return !entrega;
      if (situacao === 'corrigidas') return entrega?.status === 'corrigida';
      return entrega?.status === 'entregue';
    })
    .sort((a, b) => {
      const diferenca = new Date(a.prazo).getTime() - new Date(b.prazo).getTime();
      return ordem === 'proximo' ? diferenca : -diferenca;
    });

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-start justify-between gap-3"><SectionHeader title="Atividades" subtitle="Escolha uma matéria ou use os filtros para acompanhar seus prazos." /><button type="button" onClick={() => setFiltersOpen(open => !open)} aria-expanded={filtersOpen} aria-controls="student-activity-filters" className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${filtersOpen ? 'border-primary bg-primary-light text-primary' : 'border-border text-primary hover:bg-primary-light'}`} aria-label={`${filtersOpen ? 'Fechar' : 'Abrir'} filtros de atividades`} title="Filtros"><SlidersHorizontal size={20} aria-hidden="true" /></button></div>
      {isLoading ? <LoadingState message="Carregando atividades..." /> : null}
      {error ? <ErrorState title="Não foi possível carregar as atividades" message={error} onRetry={reload} compact /> : null}
      {!isLoading && !error && !atividades.length ? <EmptyState title="Nenhuma atividade disponível." message="As atividades publicadas para sua turma aparecerão aqui." /> : null}
      {!isLoading && !error && atividades.length ? (
        <>
          {filtersOpen ? <section id="student-activity-filters" aria-labelledby="filtros-atividades-title" className="rounded-2xl border border-border bg-card p-4">
            <h2 id="filtros-atividades-title" className="font-medium mb-3">Filtrar e organizar</h2>
            <fieldset className="mb-4">
              <legend className="mb-2 text-sm">Matéria</legend>
              <div className="flex flex-wrap gap-2">
                <button type="button" aria-pressed={materia === 'todas'} onClick={() => setMateria('todas')} className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${materia === 'todas' ? 'border-primary bg-primary-light text-primary' : 'border-border bg-input-background hover:border-primary/40'}`}>
                  <span className="block font-medium">Todas</span>
                  <span className="block text-xs opacity-80">{atividades.length} atividades</span>
                </button>
                {materias.map(item => {
                  const itens = atividades.filter(atividade => atividade.disciplina === item);
                  const pendentes = itens.filter(atividade => !entregaDaAtividade(atividade._id)).length;
                  return (
                    <button key={item} type="button" aria-pressed={materia === item} aria-label={`${item}, ${pendentes} de ${itens.length} atividades pendentes`} onClick={() => setMateria(item)} className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${materia === item ? 'border-primary bg-primary-light text-primary' : 'border-border bg-input-background hover:border-primary/40'}`}>
                      <span className="block font-medium">{item}</span>
                      <span className="block text-xs opacity-80">{pendentes}/{itens.length} pendentes</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2"><span className="block text-sm">Situação da atividade</span><select value={situacao} onChange={event => setSituacao(event.target.value as typeof situacao)} className="w-full rounded-xl border border-border bg-card p-3 focus:outline-none focus:ring-2 focus:ring-primary"><option value="todas">Todas</option><option value="pendentes">Pendentes</option><option value="entregues">Entregues</option><option value="corrigidas">Corrigidas</option></select></label>
              <label className="space-y-2"><span className="block text-sm">Organizar por prazo</span><select value={ordem} onChange={event => setOrdem(event.target.value as typeof ordem)} className="w-full rounded-xl border border-border bg-card p-3 focus:outline-none focus:ring-2 focus:ring-primary"><option value="proximo">Prazo mais próximo</option><option value="distante">Prazo mais distante</option></select></label>
            </div>
            <button type="button" onClick={() => { setMateria('todas'); setSituacao('todas'); setOrdem('proximo'); }} className="mt-4 text-sm font-medium text-primary underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-primary rounded">Limpar filtros</button>
          </section> : null}
          <p role="status" aria-live="polite" className="text-sm text-muted-foreground">{atividadesFiltradas.length} atividade(s) encontrada(s){materia !== 'todas' ? ` em ${materia}` : ''}.</p>
        </>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {atividadesFiltradas.map(activity => {
          const entrega = entregaDaAtividade(activity._id);
          return <Card key={activity._id}>
            <Badge variant={entrega?.status === 'corrigida' ? 'success' : entrega ? 'primary' : 'warning'}>{entrega?.status === 'corrigida' ? 'Corrigida' : entrega ? 'Entregue' : 'Pendente'}</Badge>
            <h3 className="font-medium text-lg mt-3">{activity.titulo}</h3>
            <p className="text-sm text-muted-foreground mb-4">{activity.disciplina} | Entrega: {new Date(activity.prazo).toLocaleDateString('pt-BR')}</p>
            <p className="text-sm text-muted-foreground mb-4">{activity.questoes?.length ? `${activity.questoes.length} questão(ões): múltipla escolha e/ou produção de texto` : 'Resposta aberta'}</p>
            <Button onClick={() => navigate(entrega?.status === 'corrigida' ? '/student/feedback' : `/student/activity/${activity._id}`)} disabled={Boolean(entrega && entrega.status !== 'corrigida')}>
              {entrega?.status === 'corrigida' ? 'Ver resultado' : entrega ? 'Atividade enviada' : 'Responder'}
            </Button>
          </Card>;
        })}
      </div>
      {!isLoading && !error && atividades.length > 0 && atividadesFiltradas.length === 0 ? <EmptyState title="Nenhuma atividade corresponde aos filtros." message="Altere a matéria ou a situação da atividade." /> : null}
    </div>
  );
};

export const StudentActivity = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [resposta, setResposta] = useState('');
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: activity, isLoading, error, reload } = useAcademicData(() => getAtividade(id!), [id]);
  const handleSubmit = async () => {
    if (!id || !activity) return;
    const questoes = activity.questoes || [];
    const obrigatoriaPendente = questoes.find(questao => questao.obrigatoria && !respostas[questao._id!]?.trim());
    if (obrigatoriaPendente || (!questoes.length && !resposta.trim())) {
      setSubmitError('Responda todos os campos obrigatórios antes de enviar.');
      return;
    }
    setIsSubmitting(true); setSubmitError('');
    try {
      await createEntrega(id, questoes.length
        ? { respostas: questoes.filter(questao => respostas[questao._id!]?.trim()).map(questao => ({ questaoId: questao._id!, resposta: respostas[questao._id!].trim() })) }
        : { resposta: resposta.trim() });
      setSubmitted(true);
    }
    catch (submitError) { setSubmitError(getFriendlyErrorMessage(submitError)); }
    finally { setIsSubmitting(false); }
  };
  if (submitted) {
    return (
      <div className="space-y-6 pt-8 text-center flex flex-col items-center h-full">
        <div className="w-20 h-20 bg-[#E6F8F0] text-[#008A56] rounded-full flex items-center justify-center"><CheckCircle2 size={40} aria-hidden="true" /></div>
        <h2 className="text-xl font-medium">Atividade enviada!</h2>
        <p className="text-base text-muted-foreground">O professor fará a decisão final. A IA pode apoiar com feedback educativo.</p>
        <Button onClick={() => navigate('/student/activities')}>Voltar para atividades</Button>
      </div>
    );
  }
  if (isLoading) return <LoadingState message="Carregando atividade..." />;
  if (error || !activity) return <div className="space-y-4"><BackButton to="/student/activities" /><ErrorState title="Não foi possível abrir a atividade" message={error || 'Atividade não encontrada.'} onRetry={reload} compact /></div>;
  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center gap-3"><BackButton to="/student/activities" /><div><h1 className="text-xl font-medium">{activity.titulo}</h1><p className="text-muted-foreground">{activity.disciplina} | {new Date(activity.prazo).toLocaleDateString('pt-BR')}</p></div></header>
      <Card>
        <div className="flex justify-between items-start gap-3 mb-4"><h2 className="font-medium text-lg">Enunciado</h2><ReadAloudButton text={activity.enunciado} label="Ouvir texto" /></div>
        <p className="leading-relaxed">{activity.enunciado}</p>
      </Card>
      {submitError ? <ErrorState message={submitError} compact /> : null}
      {(activity.questoes || []).length ? (
        <form className="space-y-5" onSubmit={event => { event.preventDefault(); void handleSubmit(); }}>
          {activity.questoes.map((questao, index) => {
            const questionId = questao._id!;
            const describedBy = questao.orientacao ? `questao-${questionId}-orientacao` : undefined;
            return (
              <Card key={questionId} className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 id={`questao-${questionId}`} className="font-medium">Questão {index + 1}{questao.obrigatoria ? ' — obrigatória' : ' — opcional'}</h2>
                  <ReadAloudButton text={`${questao.enunciado}. ${questao.alternativas.join('. ')}`} label={`Ouvir questão ${index + 1}`} />
                </div>
                <p className="leading-relaxed">{questao.enunciado}</p>
                {questao.orientacao ? <p id={describedBy} className="text-sm text-muted-foreground">{questao.orientacao}</p> : null}
                {questao.tipo === 'multipla_escolha' ? (
                  <fieldset aria-describedby={describedBy} className="space-y-3">
                    <legend className="sr-only">{questao.enunciado}</legend>
                    {questao.alternativas.map((alternativa, alternativaIndex) => (
                      <label key={alternativa} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border bg-card p-3 hover:border-primary focus-within:ring-2 focus-within:ring-primary">
                        <input type="radio" name={`questao-${questionId}`} value={alternativa} checked={respostas[questionId] === alternativa} onChange={event => setRespostas(values => ({ ...values, [questionId]: event.target.value }))} className="h-5 w-5 accent-primary" />
                        <span><span className="font-medium">{String.fromCharCode(65 + alternativaIndex)}.</span> {alternativa}</span>
                      </label>
                    ))}
                  </fieldset>
                ) : questao.tipo === 'resposta_curta' ? (
                  <label className="block space-y-2">
                    <span className="sr-only">Resposta da questão {index + 1}</span>
                    <input value={respostas[questionId] || ''} maxLength={questao.limiteCaracteres || 500} aria-describedby={describedBy} onChange={event => setRespostas(values => ({ ...values, [questionId]: event.target.value }))} className="w-full rounded-xl border border-border bg-card p-4 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Digite uma resposta objetiva." />
                    <span className="block text-right text-sm text-muted-foreground">{(respostas[questionId] || '').length}/{questao.limiteCaracteres || 500}</span>
                  </label>
                ) : (
                  <label className="block space-y-2">
                    <span className="sr-only">Redação da questão {index + 1}</span>
                    <textarea value={respostas[questionId] || ''} maxLength={questao.limiteCaracteres || 5000} aria-describedby={describedBy} onChange={event => setRespostas(values => ({ ...values, [questionId]: event.target.value }))} className="min-h-[240px] w-full rounded-xl border border-border bg-card p-4 leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Organize suas ideias e escreva sua resposta." />
                    <span className="block text-right text-sm text-muted-foreground">{(respostas[questionId] || '').length}/{questao.limiteCaracteres || 5000}</span>
                  </label>
                )}
              </Card>
            );
          })}
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Enviando...' : 'Revisar e enviar atividade'}</Button>
        </form>
      ) : (
        <>
          <label className="block space-y-2"><span>Sua resposta</span><textarea value={resposta} onChange={event => setResposta(event.target.value)} className="w-full bg-card border border-border rounded-xl p-4 min-h-[200px] focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Digite sua resposta aqui." /></label>
          <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? 'Enviando...' : 'Enviar atividade'}</Button>
        </>
      )}
    </div>
  );
};

export const StudentFeedbackView = () => {
  const { data, isLoading, error, reload } = useAcademicData(async () => {
    const entregas = (await listMinhasEntregas()).dados.filter(item => item.status === 'corrigida');
    return Promise.all(entregas.map(async entrega => ({ entrega, correcao: await getCorrecao(entrega._id) })));
  });
  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <SectionHeader title="Feedback" subtitle="Notas, comentários e apoio da IA." />
      {isLoading ? <LoadingState message="Carregando correções..." /> : null}
      {error ? <ErrorState title="Não foi possível carregar os feedbacks" message={error} onRetry={reload} compact /> : null}
      {!isLoading && !error && !data?.length ? <EmptyState title="Nenhum feedback disponível." message="As correções publicadas pelos professores aparecerão aqui." /> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data?.map(({ entrega, correcao }) => {
          const atividade = typeof entrega.atividadeId === 'string' ? null : entrega.atividadeId; return <Card key={entrega._id}>
            <Badge variant="primary">{atividade?.disciplina || 'Atividade'}</Badge>
            <h2 className="font-medium text-lg mt-3">{atividade?.titulo || 'Atividade corrigida'}</h2>
            <div className="flex items-end justify-between my-4"><div><p className="text-sm text-muted-foreground">Nota recebida</p><p className="text-4xl font-medium text-primary">{correcao.nota.toLocaleString('pt-BR')}</p></div><ReadAloudButton text={`Nota ${correcao.nota.toLocaleString('pt-BR')}. Comentário do professor: ${correcao.feedback}`} label="Ouvir feedback" /></div>
            <p className="text-base"><strong>Comentário do professor:</strong> {correcao.feedback}</p>
          </Card>;
        })}
      </div>
    </div>
  );
};

export const StudentProfile = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [profile, setProfile] = useState<Aluno | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const { data: academic, isLoading: isLoadingAcademic, error: academicError, reload: reloadAcademic } = useAcademicData(() => Promise.all([getMeuBoletim(), listCronograma(), listDisciplinas()]));
  const name = profile?.nome || user?.nome || 'Aluno';
  const initials = name
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const profileSubtitle = user?.email || (profile?.turma ? `Turma ${profile.turma}` : 'Perfil do aluno');

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const savePhoto = async (fotoPerfil: string) => {
    if (!profile) return;
    setIsSavingPhoto(true);
    setPhotoError('');
    try {
      const response = await updateMeuPerfilAluno(profile._id, fotoPerfil);
      setProfile(current => current ? { ...current, fotoPerfil: response.aluno.fotoPerfil || '' } : current);
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

    getMeuPerfilAluno()
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
          <input id="student-profile-photo" type="file" accept="image/png,image/jpeg,image/webp" onChange={handlePhotoChange} disabled={isSavingPhoto} className="sr-only" />
          <ProfileHeader initials={initials || 'AL'} name={name} subtitle={profileSubtitle} photo={profile?.fotoPerfil} photoInputId="student-profile-photo" isSavingPhoto={isSavingPhoto} />
          {photoError ? <FeedbackMessage type="error" message={photoError} compact /> : null}
          <Card>
            <h2 className="font-medium text-lg mb-2">Dados do aluno</h2>
            <p className="text-muted-foreground">Matrícula: {profile?.matricula || 'Não informada'}</p>
            <p className="text-muted-foreground">Turma: {profile?.turma || 'Não informada'}</p>
            <p className="text-muted-foreground">Nascimento: {profile?.dataNascimento ? new Date(profile.dataNascimento).toLocaleDateString('pt-BR') : 'Não informado'}</p>
          </Card>
      </div>
      {isLoadingProfile ? <LoadingState message="Carregando perfil..." /> : null}
      {profileError ? <ErrorState title="Não foi possível carregar o perfil" message={profileError} compact /> : null}
      {!isLoadingProfile && isLoadingAcademic ? <LoadingState message="Carregando dados acadêmicos..." /> : null}
      {!profileError && academicError ? <ErrorState title="Não foi possível carregar os dados acadêmicos" message={academicError} onRetry={reloadAcademic} compact /> : null}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card><h2 className="font-medium text-lg mb-2">Matérias em andamento</h2><p className="text-muted-foreground">{academic?.[2].dados.map(item => item.nome).join(', ') || 'Nenhuma matéria vinculada.'}</p></Card>
        <Card>
          <div className="flex items-center gap-2 mb-4"><FileText size={18} className="text-primary" /><h2 className="font-medium text-lg">Boletim</h2></div>
          <div className="space-y-3">
            {academic?.[0].notas.map((item, index) => (
              <div key={`${item.disciplina}-${item.periodo}-${index}`} className="rounded-xl bg-input-background p-3">
                <div className="flex justify-between gap-3"><strong>{item.disciplina}</strong><Badge variant={item.nota >= 7 ? 'success' : item.nota >= 5 ? 'warning' : 'primary'}>{item.periodo}</Badge></div>
                <p className="text-sm text-muted-foreground">Nota {item.nota.toLocaleString('pt-BR')}</p>
                {item.observacao ? <p className="text-sm text-muted-foreground">{item.observacao}</p> : null}
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2"><CalendarDays size={18} className="text-primary" aria-hidden="true" /><h2 className="font-medium text-lg">Cronograma do dia</h2></div>
          <button
            type="button"
            onClick={() => downloadSchedule(academic?.[1].dados || [])}
            disabled={!academic?.[1].dados.length}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-primary transition-colors hover:border-primary hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Baixar cronograma para adicionar ao calendário"
            title="Adicionar ao calendário"
          >
            <CalendarPlus size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{academic?.[1].dados.map(item => <div key={item._id} className="rounded-xl bg-input-background p-3"><strong>{new Date(item.inicio).toLocaleString('pt-BR')} | {item.titulo}</strong><p className="text-sm text-muted-foreground">{item.disciplina || item.tipo} | Turma {item.turma}</p></div>)}</div>
      </Card>
      <Card>
        <div className="flex items-center gap-2 mb-4"><UserRound size={18} className="text-primary" /><h2 className="font-medium text-lg">Professores por matéria</h2></div>
        {!academic?.[2].dados.length ? <p className="text-sm text-muted-foreground mb-3">Nenhuma disciplina vinculada no momento.</p> : null}
        <div className="grid gap-3 md:grid-cols-2">
          {academic?.[2].dados.map(item => {
            const professor = typeof item.professorId === 'string' ? null : item.professorId;
            return <div key={item._id} className="flex items-center justify-between rounded-xl bg-input-background p-3 gap-3">
              <div className="flex items-center gap-3"><span className="w-10 h-10 rounded-full bg-primary-light text-primary flex items-center justify-center text-sm">{professor?.nome?.slice(0, 2).toUpperCase() || 'PR'}</span><div><strong>{item.nome}</strong><p className="text-sm text-muted-foreground">{professor?.nome || 'Professor não informado'}</p></div></div>
            </div>
          })}
        </div>
      </Card>
      <button type="button" onClick={handleLogout} className="w-full rounded-xl border-2 border-red-200 bg-card px-4 py-3 font-medium text-red-600 transition-colors hover:border-red-300 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
        Sair
      </button>
    </div>
  );
};
