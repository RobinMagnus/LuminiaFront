export const teacher = {
  name: "Carlos Almeida",
  birthDate: "14/03/1982",
  avatar: "CA",
  subjects: ["Física", "Matemática"],
  classes: ["3A", "3B"],
};

export const student = {
  name: "Maria Souza",
  birthDate: "22/08/2009",
  avatar: "MS",
  className: "3A",
  subjects: ["Física", "Matemática", "Redação", "Biologia"],
};

export const classes = [
  { id: "3a", name: "Turma 3A", subject: "Física", students: 35, pending: 12, corrected: 23 },
  { id: "3b", name: "Turma 3B", subject: "Matemática", students: 34, pending: 5, corrected: 30 },
];

export const activities = [
  {
    id: "1",
    title: "Lista de Exercícios 02",
    subject: "Física",
    className: "3A",
    teacher: "Carlos Almeida",
    sentAt: "12/05",
    dueDate: "Amanhã",
    status: "Pendente",
    submissions: 28,
    totalStudents: 35,
    statement: "Calcule a aceleração de um objeto de 5kg que sofre uma força de 20N. Mostre o passo a passo da fórmula utilizada.",
  },
  {
    id: "2",
    title: "Redação: Meio Ambiente",
    subject: "Redação",
    className: "3A e 3B",
    teacher: "Ana Ribeiro",
    sentAt: "05/05",
    dueDate: "Entregue",
    status: "Corrigida",
    submissions: 68,
    totalStudents: 70,
    statement: "Escreva uma redação argumentativa sobre a preservação ambiental no cotidiano escolar.",
  },
];

export const contents = [
  {
    id: "1",
    title: "Leis de Newton em exemplos simples",
    subject: "Física",
    className: "3A",
    teacher: "Carlos Almeida",
    publishedAt: "10/05",
    text: "As Leis de Newton explicam como forças alteram o movimento dos corpos. Quando uma força resultante age sobre um objeto, sua velocidade pode mudar. A segunda lei relaciona força, massa e aceleração pela fórmula F = m x a.",
    related: ["Exercícios práticos de dinâmica", "Vídeo: força e aceleração"],
  },
  {
    id: "2",
    title: "Progressão geométrica",
    subject: "Matemática",
    className: "3A",
    teacher: "Carlos Almeida",
    publishedAt: "09/05",
    text: "Uma progressão geométrica é uma sequência em que cada termo, a partir do segundo, é obtido multiplicando o termo anterior por uma razão constante.",
    related: ["Resumo de sequências", "Lista de PG comentada"],
  },
];

export const corrections = [
  {
    id: "1",
    classId: "3a",
    activity: "Lista de Exercícios 02",
    student: "Maria Souza",
    status: "Aguardando correção",
    aiScore: 7.5,
    teacherScore: "",
    answer: "Usei a fórmula F = m / a. Então 20 = 5 / a, logo a = 100 m/s2.",
  },
  {
    id: "2",
    classId: "3a",
    activity: "Lista de Exercícios 02",
    student: "João Silva",
    status: "Corrigida",
    aiScore: 7.0,
    teacherScore: "8.0",
    answer: "A aceleração é calculada por F = m x a. Como 20 = 5 x a, a = 4 m/s2.",
  },
];

export const feedbacks = [
  {
    id: "1",
    subject: "Física",
    activity: "Lista de Exercícios 02",
    grade: 7.5,
    teacherComment: "Você compreendeu o problema, mas precisa revisar o isolamento de variáveis.",
    aiFeedback: "A resposta mostra boa tentativa de aplicar a fórmula, mas houve confusão entre multiplicação e divisão. A fórmula correta é F = m x a.",
    pointsToStudy: ["Isolamento de variáveis", "Unidades de medida", "Segunda Lei de Newton"],
    relatedContent: ["Leis de Newton em exemplos simples", "Exercícios práticos de dinâmica"],
  },
];

export const grades = [
  { subject: "Física", teacher: "Carlos Almeida", current: 7.5, average: 7.0, status: "Em andamento", comment: "Boa participação nas aulas." },
  { subject: "Matemática", teacher: "Carlos Almeida", current: 8.2, average: 7.0, status: "Aprovado", comment: "Mantém bom ritmo de estudo." },
  { subject: "Redação", teacher: "Ana Ribeiro", current: 6.4, average: 7.0, status: "Atenção", comment: "Precisa desenvolver melhor os argumentos." },
];

export const schedule = [
  { time: "07:30", subject: "Física", teacher: "Carlos Almeida", room: "Sala 12", status: "Finalizada" },
  { time: "09:20", subject: "Matemática", teacher: "Carlos Almeida", room: "Sala 12", status: "Em andamento" },
  { time: "11:10", subject: "Biologia", teacher: "Renata Lima", room: "Laboratório", status: "Próxima aula" },
];

export const attendance = [
  { name: "Maria Souza", present: true },
  { name: "João Silva", present: true },
  { name: "Lia Martins", present: false },
  { name: "Pedro Rocha", present: true },
];

export const teachersBySubject = [
  { subject: "Física", teacher: "Carlos Almeida", avatar: "CA" },
  { subject: "Matemática", teacher: "Carlos Almeida", avatar: "CA" },
  { subject: "Redação", teacher: "Ana Ribeiro", avatar: "AR" },
  { subject: "Biologia", teacher: "Renata Lima", avatar: "RL" },
];
