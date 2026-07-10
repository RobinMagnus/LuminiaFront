import React, { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, CalendarDays, CheckSquare, FileText, PenTool, Sparkles, Users } from 'lucide-react';
import { activities, attendance, classes, corrections, teacher } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';
import { usePostContent, usePostContents } from '../hooks/usePostContents';
import { getFriendlyErrorMessage } from '../services/api';
import { createPost, deletePost, updatePost } from '../services/postService';
import { getMeuPerfilProfessor } from '../services/profileService';
import { Professor } from '../types/api';
import { ComentariosSection } from './ComentariosSection';
import { EmptyState, ErrorState, FeedbackMessage, LoadingState } from './feedback';
import { AITag, Badge, Button, Card, ProfileHeader, ReadAloudButton, SectionHeader } from './ui';

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
  return (
    <div className="space-y-6 pb-20">
      <SectionHeader title="Atividades" subtitle="Histórico de atividades criadas e enviadas." />
      <Button onClick={() => navigate('/teacher/create')}>Criar nova atividade</Button>
      <div className="space-y-4">
        {activities.map(activity => (
          <Card key={activity.id} tabIndex={0} className="focus:outline-none focus:ring-2 focus:ring-primary">
            <div className="flex justify-between gap-3 mb-3">
              <div>
                <Badge variant={activity.status === "Corrigida" ? "success" : "warning"}>{activity.status}</Badge>
                <h3 className="font-medium text-foreground text-base mt-2">{activity.title}</h3>
                <p className="text-sm text-muted-foreground">{activity.className} | {activity.subject}</p>
              </div>
              <span className="text-sm text-muted-foreground">{activity.sentAt}</span>
            </div>
            <p className="text-sm text-foreground mb-4">{activity.submissions} de {activity.totalStudents} alunos enviaram</p>
            <Button variant="outline" className="!py-2.5" onClick={() => navigate(`/teacher/activity/${activity.id}`)}>Ver detalhes</Button>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const TeacherActivityDetail = () => {
  const { id } = useParams();
  const activity = activities.find(item => item.id === id) || activities[0];
  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center gap-3">
        <BackButton to="/teacher/activities" />
        <div>
          <h1 className="text-xl font-medium text-foreground">{activity.title}</h1>
          <p className="text-base text-muted-foreground">{activity.className} | {activity.subject}</p>
        </div>
      </header>
      <Card>
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 className="font-medium text-lg">Enunciado</h2>
          <ReadAloudButton label="Ouvir texto" />
        </div>
        <p className="text-base leading-relaxed text-foreground">{activity.statement}</p>
      </Card>
      <Card>
        <h2 className="font-medium text-lg mb-3">Resumo de envio</h2>
        <p className="text-muted-foreground">{activity.submissions} de {activity.totalStudents} alunos já enviaram. Correções podem ser feitas manualmente ou com apoio da IA.</p>
      </Card>
    </div>
  );
};

export const TeacherCreateActivity = () => (
  <TeacherForm title="Nova Atividade" submitLabel="Publicar para alunos" secondaryLabel="Salvar atividade" />
);

const TeacherForm = ({ title, submitLabel, secondaryLabel }: { title: string; submitLabel: string; secondaryLabel?: string }) => {
  const navigate = useNavigate();
  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center gap-3">
        <BackButton to="/teacher" />
        <div>
          <h1 className="text-xl font-medium text-foreground">{title}</h1>
          <p className="text-base text-muted-foreground">Campos simples para o MVP.</p>
        </div>
      </header>
      {["Título", "Turma", "Matéria", "Data de entrega"].map(label => (
        <label key={label} className="block space-y-2">
          <span>{label}</span>
          <input className="w-full bg-card border border-border rounded-xl p-4 text-base focus:outline-none focus:ring-2 focus:ring-primary" placeholder={label} />
        </label>
      ))}
      <label className="block space-y-2">
        <span>Enunciado</span>
        <textarea className="w-full bg-card border border-border rounded-xl p-4 min-h-[150px] focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Escreva as instruções para os alunos." />
      </label>
      {secondaryLabel ? <Button variant="outline">{secondaryLabel}</Button> : null}
      <Button onClick={() => navigate('/teacher/activities')}>{submitLabel}</Button>
    </div>
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
  return (
    <div className="space-y-6 pb-20">
      <SectionHeader title="Correções" subtitle="Escolha uma turma para revisar entregas." />
      {classes.map(item => (
        <Card key={item.id}>
          <h3 className="font-medium text-lg">{item.name}</h3>
          <p className="text-sm text-muted-foreground mb-4">{item.subject}</p>
          <div className="flex gap-6 mb-5">
            <div><span className="block text-2xl font-medium text-accent">{item.pending}</span><span className="text-sm text-muted-foreground">Pendentes</span></div>
            <div><span className="block text-2xl font-medium text-primary">{item.corrected}</span><span className="text-sm text-muted-foreground">Corrigidas</span></div>
          </div>
          <Button onClick={() => navigate(`/teacher/corrections/${item.id}`)}>Ver correções</Button>
        </Card>
      ))}
    </div>
  );
};

export const TeacherCorrectionsList = () => {
  const { classId = "3a" } = useParams();
  const navigate = useNavigate();
  const selected = classes.find(item => item.id === classId) || classes[0];
  const list = corrections.filter(item => item.classId === selected.id);
  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center gap-3">
        <BackButton to="/teacher/corrections" />
        <div>
          <h1 className="text-xl font-medium text-foreground">{selected.name}</h1>
          <p className="text-base text-muted-foreground">Atividades da turma</p>
        </div>
      </header>
      {list.map(item => (
        <Card key={item.id}>
          <div className="flex justify-between gap-3">
            <div>
              <Badge variant={item.status === "Corrigida" ? "success" : "warning"}>{item.status}</Badge>
              <h3 className="font-medium text-base mt-2">{item.activity}</h3>
              <p className="text-sm text-muted-foreground">{item.student}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground">IA</span>
              <p className="font-medium text-primary">{item.aiScore}</p>
              {item.teacherScore ? <p className="text-sm text-foreground">Prof. {item.teacherScore}</p> : null}
            </div>
          </div>
          <Button className="mt-4" variant={item.status === "Corrigida" ? "outline" : "primary"} onClick={() => navigate(`/teacher/correction/${item.id}`)}>
            {item.status === "Corrigida" ? "Revisar correção" : "Corrigir"}
          </Button>
        </Card>
      ))}
    </div>
  );
};

export const TeacherCorrection = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const item = corrections.find(correction => correction.id === id) || corrections[0];
  const [teacherScore, setTeacherScore] = useState(item.teacherScore || "8.0");
  const diff = Math.abs(Number(teacherScore || 0) - item.aiScore).toFixed(1);
  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center gap-3">
        <BackButton />
        <div>
          <h1 className="text-xl font-medium text-foreground">Corrigir atividade</h1>
          <p className="text-base text-muted-foreground">{item.student} | {item.activity}</p>
        </div>
      </header>
      <Card>
        <div className="flex justify-between mb-3"><h2 className="font-medium text-lg">Resposta enviada</h2><ReadAloudButton label="Ouvir texto" /></div>
        <p className="leading-relaxed">{item.answer}</p>
      </Card>
      <Button variant="secondary" className="flex items-center justify-center gap-2"><Sparkles size={18} aria-hidden="true" /> Solicitar correção pela IA</Button>
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4"><AITag /><p className="text-3xl font-medium text-primary mt-2">{item.aiScore}</p><p className="text-xs text-muted-foreground">Nota da IA</p></Card>
        <Card className="p-4 border-primary"><label htmlFor="score" className="text-xs text-primary">Nota professor</label><input id="score" value={teacherScore} onChange={e => setTeacherScore(e.target.value)} className="w-full text-3xl font-medium bg-transparent focus:outline-none" /></Card>
        <Card className="p-4"><p className="text-3xl font-medium text-accent">{diff}</p><p className="text-xs text-muted-foreground">Diferença</p></Card>
      </div>
      <Card>
        <div className="flex justify-between mb-3"><h2 className="font-medium text-lg">Comentários da IA</h2><ReadAloudButton label="Ouvir feedback" /></div>
        <p className="text-base leading-relaxed">A IA identificou confusão na fórmula F = m x a e sugere revisar isolamento de variáveis.</p>
      </Card>
      <Card>
        <div className="flex justify-between mb-3"><h2 className="font-medium text-lg">Explicação dos erros</h2><ReadAloudButton label="Ouvir texto" /></div>
        <p className="text-base leading-relaxed">O aluno dividiu massa por aceleração. O correto é dividir a força pela massa para encontrar a aceleração.</p>
      </Card>
      <Card>
        <div className="flex justify-between mb-3"><h2 className="font-medium text-lg">Pontos para estudar</h2><ReadAloudButton label="Ouvir texto" /></div>
        <ul className="space-y-2 text-base"><li>Segunda Lei de Newton</li><li>Isolamento de variáveis</li><li>Unidades de medida</li></ul>
      </Card>
      <label className="block space-y-2"><span>Comentário do professor</span><textarea className="w-full bg-card border border-border rounded-xl p-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary" defaultValue="A nota final é do professor. Revise a fórmula correta e tente refazer o cálculo." /></label>
      <Button onClick={() => navigate('/teacher/corrections')}>Confirmar correção</Button>
    </div>
  );
};

export const TeacherProfile = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [profile, setProfile] = useState<Professor | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState('');
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
        <Badge variant="warning">Demonstração visual — integração pendente</Badge>
        {classes.map(item => (
          <Card key={item.id}>
            <h3 className="font-medium">{item.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">{item.subject} | {item.students} alunos</p>
            <Button variant="outline" onClick={() => navigate(`/teacher/class/${item.id}`)}>Acessar turma</Button>
          </Card>
        ))}
      </section>
    </div>
  );
};

export const TeacherClassDetail = () => {
  const { classId = "3a" } = useParams();
  const selected = classes.find(item => item.id === classId) || classes[0];
  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center gap-3"><BackButton to="/teacher/profile" /><div><h1 className="text-xl font-medium">{selected.name}</h1><p className="text-muted-foreground">{selected.subject}</p></div></header>
      <Card>
        <div className="flex items-center gap-2 mb-4"><CalendarDays size={18} className="text-primary" /><h2 className="font-medium text-lg">Lista de presença</h2></div>
        <p className="text-sm text-muted-foreground mb-3">Chamada de hoje</p>
        <div className="space-y-3">
          {attendance.map(item => (
            <div key={item.name} className="flex items-center justify-between rounded-xl bg-input-background p-3">
              <span>{item.name}</span>
              <div className="flex gap-2" role="group" aria-label={`Presença de ${item.name}`}>
                <button className={`px-3 py-1 rounded-lg text-sm ${item.present ? "bg-primary text-white" : "bg-card text-muted-foreground"}`}>Presença</button>
                <button className={`px-3 py-1 rounded-lg text-sm ${!item.present ? "bg-accent text-white" : "bg-card text-muted-foreground"}`}>Falta</button>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h2 className="font-medium text-lg mb-3">Notas e comentários</h2>
        <div className="space-y-3">
          {["Maria Souza", "João Silva", "Lia Martins"].map((name, index) => (
            <div key={name} className="border-b border-border last:border-0 pb-3 last:pb-0">
              <p className="font-medium">{name}</p>
              <p className="text-sm text-muted-foreground">Última nota: {index === 0 ? "7.5" : "8.0"} | Média: 7.{index + 1}</p>
              <p className="text-sm text-muted-foreground">Feedback da IA disponível para revisão.</p>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h2 className="font-medium text-lg mb-3">Histórico de atividades</h2>
        <div className="space-y-3">
          {activities.filter(activity => activity.className.includes(selected.name.replace("Turma ", ""))).map(activity => (
            <div key={activity.id} className="rounded-xl bg-input-background p-3">
              <div className="flex justify-between gap-3">
                <strong>{activity.title}</strong>
                <Badge variant={activity.status === "Corrigida" ? "success" : "warning"}>{activity.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{activity.subject} | {activity.submissions} de {activity.totalStudents} entregas</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
