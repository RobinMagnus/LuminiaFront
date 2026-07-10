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
