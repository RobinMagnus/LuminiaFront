export type Role = 'aluno' | 'professor';

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  role: Role;
  ativo: boolean;
};

export type UsuarioPopulado = {
  _id: string;
  nome: string;
  email: string;
  role: Role;
  ativo: boolean;
};

export type Aluno = {
  _id: string;
  userId: UsuarioPopulado;
  nome: string;
  dataNascimento?: string;
  turma?: string;
  matricula: string;
  boletim?: Array<{
    disciplina?: string;
    nota?: number;
    periodo?: string;
    observacao?: string;
  }>;
};

export type Professor = {
  _id: string;
  userId: UsuarioPopulado;
  nome: string;
  dataNascimento?: string;
  materias?: string[];
  turmas?: string[];
};

export type Post = {
  _id: string;
  titulo: string;
  conteudo: string;
  disciplina?: string;
  autor?: {
    _id: string;
    nome?: string;
    email?: string;
    role?: Role;
  };
  tags?: string[];
  visivelPara: 'todos' | 'alunos' | 'professores';
  createdAt?: string;
  updatedAt?: string;
};

export type LoginRequest = {
  email: string;
  senha: string;
};

export type LoginResponse = {
  token: string;
  user: Usuario;
};

export type AuthSession = {
  token: string;
  user: Usuario;
};

export type ApiErrorBody = {
  mensagem: string;
  erros?: string[];
};

export type Paginacao = {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
  itens: number;
};

export type ListaPaginada<T> = { dados: T[]; paginacao: Paginacao };

export type Atividade = {
  _id: string;
  titulo: string;
  enunciado: string;
  disciplina: string;
  turma: string;
  professorId: string | Pick<UsuarioPopulado, '_id' | 'nome' | 'email'>;
  prazo: string;
  status: 'rascunho' | 'publicada' | 'encerrada';
  createdAt?: string;
};

export type Entrega = {
  _id: string;
  atividadeId: string | Pick<Atividade, '_id' | 'titulo' | 'disciplina' | 'turma' | 'prazo'>;
  alunoId: string | Pick<UsuarioPopulado, '_id' | 'nome' | 'email'>;
  resposta: string;
  status: 'entregue' | 'corrigida';
  entregueEm: string;
};

export type Correcao = {
  _id: string;
  entregaId: string;
  professorId: string | Pick<UsuarioPopulado, '_id' | 'nome'>;
  nota: number;
  feedback: string;
  corrigidoEm: string;
};

export type NotaBoletim = { disciplina: string; nota: number; periodo: string; observacao?: string };
export type Boletim = { aluno: Pick<Aluno, '_id' | 'nome' | 'matricula' | 'turma'>; notas: NotaBoletim[] };

export type EventoCronograma = {
  _id: string;
  titulo: string;
  descricao?: string;
  turma: string;
  disciplina?: string;
  tipo: 'aula' | 'atividade' | 'prova' | 'evento';
  inicio: string;
  fim?: string;
  professorId: string | Pick<UsuarioPopulado, '_id' | 'nome'>;
};

export type Turma = {
  _id: string;
  codigo: string;
  nome: string;
  anoLetivo: number;
  turno: 'manha' | 'tarde' | 'noite' | 'integral';
  descricao?: string;
  ativa: boolean;
  professorId: string | Pick<UsuarioPopulado, '_id' | 'nome' | 'email'>;
};

export type Disciplina = {
  _id: string;
  codigo: string;
  nome: string;
  descricao?: string;
  cargaHoraria: number;
  turmaIds: Array<string | Pick<Turma, '_id' | 'codigo' | 'nome' | 'anoLetivo' | 'turno' | 'ativa'>>;
  ativa: boolean;
  professorId: string | Pick<UsuarioPopulado, '_id' | 'nome' | 'email'>;
};
