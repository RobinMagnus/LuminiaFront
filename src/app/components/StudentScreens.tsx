import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, CalendarDays, CheckCircle2, Clock, FileText, GraduationCap, UserRound } from 'lucide-react';
import { activities, feedbacks, grades, schedule, student, teachersBySubject } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';
import { usePostContent, usePostContents } from '../hooks/usePostContents';
import { getFriendlyErrorMessage } from '../services/api';
import { getMeuPerfilAluno } from '../services/profileService';
import { Aluno } from '../types/api';
import { AIFeedbackCard } from './AIFeedback';
import { ComentariosSection } from './ComentariosSection';
import { EmptyState, ErrorState, LoadingState } from './feedback';
import { Badge, Button, Card, ProfileHeader, ReadAloudButton, SectionHeader } from './ui';

const BackButton = ({ to }: { to?: string }) => {
  const navigate = useNavigate();
  return <button onClick={() => to ? navigate(to) : navigate(-1)} className="text-muted-foreground p-2 -ml-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary" aria-label="Voltar">←</button>;
};

const QuickCard = ({ icon: Icon, title, subtitle, onClick }: any) => (
  <Card
    className="p-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
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
  const firstName = user?.nome.split(' ')[0] || 'Maria';
  return (
    <div className="space-y-6">
      <SectionHeader title={`Olá, ${firstName}`} subtitle="Aqui está seu dia de estudos." />
      <div className="grid grid-cols-2 gap-4">
        <QuickCard icon={CalendarDays} title="Próxima aula" subtitle="Biologia, 11:10" onClick={() => navigate('/student/profile')} />
        <QuickCard icon={Clock} title="Pendentes" subtitle="1 atividade" onClick={() => navigate('/student/activities')} />
        <QuickCard icon={GraduationCap} title="Última nota" subtitle="7.5 em Física" onClick={() => navigate('/student/feedback')} />
        <QuickCard icon={BookOpen} title="Novo feedback" subtitle="IA explicou seus erros" onClick={() => navigate('/student/feedback')} />
      </div>
      <section>
        <h2 className="text-lg font-medium mb-3">Atalhos</h2>
        <div className="space-y-3">
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
  return (
    <div className="space-y-6 pb-20">
      <SectionHeader title="Conteúdos" subtitle="Materiais publicados pelos professores." />
      {isLoading ? <LoadingState message="Carregando conteúdos..." /> : null}
      {error ? <ErrorState title="Não foi possível carregar os conteúdos" message={error} onRetry={reload} compact /> : null}
      {!isLoading && !error && contents.length === 0 ? (
        <EmptyState
          title="Nenhum conteúdo disponível."
          message="Quando professores publicarem posts visíveis para alunos, eles aparecerão aqui."
        />
      ) : null}
      {contents.map(content => (
        <Card key={content.id}>
          <Badge variant="primary">{content.subject}</Badge>
          <h3 className="font-medium text-lg mt-3">{content.title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{content.teacher} | {content.publishedAt}</p>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" className="!w-auto !py-2 !px-3" onClick={() => navigate(`/student/content/${content.id}`)}>Ver conteúdo</Button>
            <ReadAloudButton label="Ouvir texto" />
          </div>
        </Card>
      ))}
    </div>
  );
};

export const StudentContentDetail = () => {
  const { id } = useParams();
  const { content, isLoading, error, reload } = usePostContent(id);

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
    <div className="space-y-6 pb-20">
      <header className="flex items-center gap-3"><BackButton to="/student/contents" /><div><h1 className="text-xl font-medium">{content.title}</h1><p className="text-muted-foreground">{content.subject} | {content.teacher}</p></div></header>
      <Card>
        <div className="flex justify-between items-start gap-3 mb-4"><h2 className="font-medium text-lg">Texto do conteúdo</h2><ReadAloudButton label="Ouvir texto" /></div>
        <p className="text-base leading-relaxed">{content.text}</p>
      </Card>
      <Card>
        <div className="flex justify-between items-start gap-3 mb-3"><h2 className="font-medium text-lg">Conteúdos relacionados</h2><ReadAloudButton label="Ouvir texto" /></div>
        <div className="space-y-2">{content.related.map(item => <p key={item} className="rounded-xl bg-input-background p-3">{item}</p>)}</div>
      </Card>
      <ComentariosSection postId={content.id} />
    </div>
  );
};

export const StudentActivities = () => {
  const navigate = useNavigate();
  return (
    <div className="space-y-6 pb-20">
      <SectionHeader title="Atividades" subtitle="Acompanhe pendências e resultados." />
      {activities.map(activity => (
        <Card key={activity.id}>
          <Badge variant={activity.status === "Corrigida" ? "success" : "warning"}>{activity.status}</Badge>
          <h3 className="font-medium text-lg mt-3">{activity.title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{activity.subject} | {activity.teacher} | Entrega: {activity.dueDate}</p>
          <Button onClick={() => navigate(activity.status === "Corrigida" ? '/student/feedback' : `/student/activity/${activity.id}`)}>
            {activity.status === "Corrigida" ? "Ver resultado" : "Responder"}
          </Button>
        </Card>
      ))}
    </div>
  );
};

export const StudentActivity = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const activity = activities.find(item => item.id === id) || activities[0];
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
  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center gap-3"><BackButton to="/student/activities" /><div><h1 className="text-xl font-medium">{activity.title}</h1><p className="text-muted-foreground">{activity.subject} | {activity.dueDate}</p></div></header>
      <Card>
        <div className="flex justify-between items-start gap-3 mb-4"><h2 className="font-medium text-lg">Enunciado</h2><ReadAloudButton label="Ouvir texto" /></div>
        <p className="leading-relaxed">{activity.statement}</p>
      </Card>
      <label className="block space-y-2"><span>Sua resposta</span><textarea className="w-full bg-card border border-border rounded-xl p-4 min-h-[200px] focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Digite sua resposta aqui." /></label>
      <Button onClick={() => setSubmitted(true)}>Enviar atividade</Button>
    </div>
  );
};

export const StudentFeedbackView = () => {
  const feedback = feedbacks[0];
  return (
    <div className="space-y-6 pb-20">
      <SectionHeader title="Feedback" subtitle="Notas, comentários e apoio da IA." />
      <Card>
        <Badge variant="primary">{feedback.subject}</Badge>
        <h2 className="font-medium text-lg mt-3">{feedback.activity}</h2>
        <div className="flex items-end justify-between my-4">
          <div><p className="text-sm text-muted-foreground">Nota recebida</p><p className="text-4xl font-medium text-primary">{feedback.grade}</p></div>
          <ReadAloudButton label="Ouvir feedback" />
        </div>
        <p className="text-base"><strong>Professor:</strong> {feedback.teacherComment}</p>
      </Card>
      <AIFeedbackCard feedback={feedback.aiFeedback} pointsToStudy={feedback.pointsToStudy} relatedContent={feedback.relatedContent} />
    </div>
  );
};

export const StudentProfile = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [profile, setProfile] = useState<Aluno | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState('');
  const name = profile?.nome || user?.nome || student.name;
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
  <div className="space-y-6 pb-20">
    <ProfileHeader initials={initials || student.avatar} name={name} subtitle={user?.email || `Turma ${student.className} | Nascimento: ${student.birthDate}`} />
    <Button variant="outline" onClick={handleLogout}>Sair</Button>
    {isLoadingProfile ? <LoadingState message="Carregando perfil..." /> : null}
    {profileError ? <ErrorState title="Não foi possível carregar o perfil" message={profileError} compact /> : null}
    <Card>
      <h2 className="font-medium text-lg mb-2">Dados do aluno</h2>
      <p className="text-muted-foreground">Matrícula: {profile?.matricula || 'Não informada'}</p>
      <p className="text-muted-foreground">Turma: {profile?.turma || 'Não informada'}</p>
      <p className="text-muted-foreground">Nascimento: {profile?.dataNascimento ? new Date(profile.dataNascimento).toLocaleDateString('pt-BR') : 'Não informado'}</p>
    </Card>
    <Card><h2 className="font-medium text-lg mb-2">Matérias em andamento</h2><Badge variant="warning">Demonstração visual — integração pendente</Badge><p className="text-muted-foreground mt-3">{student.subjects.join(", ")}</p></Card>
    <Card>
      <div className="flex items-center gap-2 mb-4"><FileText size={18} className="text-primary" /><h2 className="font-medium text-lg">Boletim</h2></div>
      <Badge variant="warning">Demonstração visual — integração pendente</Badge>
      <div className="space-y-3">
        {grades.map(item => (
          <div key={item.subject} className="rounded-xl bg-input-background p-3">
            <div className="flex justify-between gap-3"><strong>{item.subject}</strong><Badge variant={item.status === "Aprovado" ? "success" : item.status === "Atenção" ? "warning" : "primary"}>{item.status}</Badge></div>
            <p className="text-sm text-muted-foreground">{item.teacher} | Nota {item.current} | Média {item.average}</p>
            <p className="text-sm text-muted-foreground">{item.comment} Feedback da IA disponível quando houver.</p>
          </div>
        ))}
      </div>
    </Card>
    <Card>
      <div className="flex items-center gap-2 mb-4"><CalendarDays size={18} className="text-primary" /><h2 className="font-medium text-lg">Cronograma do dia</h2></div>
      <Badge variant="warning">Demonstração visual — integração pendente</Badge>
      <div className="space-y-3">{schedule.map(item => <div key={item.time} className="rounded-xl bg-input-background p-3"><strong>{item.time} | {item.subject}</strong><p className="text-sm text-muted-foreground">{item.teacher} | {item.room} | {item.status}</p></div>)}</div>
    </Card>
    <Card>
      <div className="flex items-center gap-2 mb-4"><UserRound size={18} className="text-primary" /><h2 className="font-medium text-lg">Professores por matéria</h2></div>
      <div className="space-y-3">
        {teachersBySubject.map(item => (
          <div key={item.subject} className="flex items-center justify-between rounded-xl bg-input-background p-3 gap-3">
            <div className="flex items-center gap-3"><span className="w-10 h-10 rounded-full bg-primary-light text-primary flex items-center justify-center text-sm">{item.avatar}</span><div><strong>{item.subject}</strong><p className="text-sm text-muted-foreground">{item.teacher}</p></div></div>
            <Button variant="outline" className="!w-auto !py-2 !px-3 !text-sm">Ver detalhes</Button>
          </div>
        ))}
      </div>
    </Card>
  </div>
  );
};
