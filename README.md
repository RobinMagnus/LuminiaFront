# Luminia Frontend

Frontend do **Luminia**, plataforma educacional com experiências separadas para professores e alunos. O projeto foi criado como MVP acadêmico/hackathon, com interface mobile first, autenticação integrada ao backend e telas demonstrativas para fluxos educacionais.

O bundle visual inicial veio de um protótipo do Figma Community: `Luminiaprototicoapp (Community)`.

## Sobre o projeto

O frontend organiza a navegação de dois perfis:

- professor: dashboard, atividades, conteúdos, correções e perfil;
- aluno: dashboard, conteúdos, atividades, feedback e perfil.

Parte da aplicação já consome o backend real. Outras telas ainda usam dados mockados para demonstrar o produto sem depender de endpoints que ainda não existem.

## Tecnologias usadas

Tecnologias identificadas nos arquivos reais do projeto:

| Tecnologia | Uso |
| --- | --- |
| React | Construção da interface em componentes. |
| TSX/TypeScript | Componentes e serviços escritos em arquivos `.tsx` e `.ts`. |
| Vite | Servidor de desenvolvimento e build. |
| React Router | Rotas, navegação e proteção de áreas por perfil. |
| Tailwind CSS | Estilização por utilitários e tema visual. |
| Lucide React | Ícones da interface. |
| Radix UI | Dependências de componentes acessíveis presentes no projeto. |
| Material UI | Dependências `@mui/*` presentes no projeto. |
| pnpm | Gerenciador de pacotes usado pelo lockfile e workspace. |
| GitHub Actions | CI do frontend com instalação e build. |
| Vitest | Testes automatizados de comportamento. |
| Testing Library | Testes da interface de comentários. |

## Scripts disponíveis

Scripts reais definidos no `package.json`:

| Comando | Descrição |
| --- | --- |
| `pnpm dev` | Inicia o servidor de desenvolvimento Vite. |
| `pnpm build` | Gera a build de produção com Vite. |
| `pnpm test` | Executa testes com Vitest e Testing Library. |

Não há script de lint configurado atualmente.

## Instalação

Pré-requisitos:

- Node.js instalado;
- pnpm instalado.

Instale as dependências:

```bash
pnpm install
```

Inicie o servidor de desenvolvimento:

```bash
pnpm dev
```

Por padrão, o Vite disponibiliza a aplicação em:

```txt
http://localhost:5173/
```

Gere a build de produção:

```bash
pnpm build
```

Para executar o fluxo integrado, suba também o backend em outro terminal:

```bash
cd ../LuminiaBack
docker compose up -d
npm install
npm run seed
npm run dev
```

## Variáveis de ambiente

O frontend possui `.env.example` com:

```env
VITE_API_URL=http://localhost:3000
```

Crie o `.env` local:

```bash
cp .env.example .env
```

`VITE_API_URL` define a URL base da API usada pelos serviços em `src/app/services/`.

Problemas comuns:

- se o login falhar por rede, confirme se o backend está rodando em `http://localhost:3000`;
- se houver erro de CORS, confirme se `CORS_ORIGIN` no backend inclui `http://localhost:5173`;
- em dispositivo físico, `localhost` aponta para o próprio dispositivo. Use o IP local da máquina, por exemplo `VITE_API_URL=http://192.168.x.x:3000`, sem fixar esse IP no código.

## Telas e rotas disponíveis

### Login

| Rota | Descrição |
| --- | --- |
| `/` | Tela de login com email e senha. |

O login usa o backend real em `POST /auth/login`. Após autenticação:

- usuário com role `professor` é redirecionado para `/teacher`;
- usuário com role `aluno` é redirecionado para `/student`.

### Área do professor

Rotas protegidas para usuário com role `professor`:

| Rota | Tela |
| --- | --- |
| `/teacher` | Dashboard do professor. |
| `/teacher/activities` | Lista de atividades. |
| `/teacher/activity/:id` | Detalhe de atividade. |
| `/teacher/create` | Formulário visual de criação de atividade. |
| `/teacher/contents` | Lista de conteúdos. |
| `/teacher/content/new` | Formulário visual de novo conteúdo. |
| `/teacher/content/:id` | Detalhe de conteúdo. |
| `/teacher/corrections` | Lista de turmas para correção. |
| `/teacher/corrections/:classId` | Lista de correções por turma. |
| `/teacher/correction/:id` | Tela visual de correção. |
| `/teacher/profile` | Perfil do professor e logout. |
| `/teacher/class/:classId` | Detalhe visual da turma. |

### Área do aluno

Rotas protegidas para usuário com role `aluno`:

| Rota | Tela |
| --- | --- |
| `/student` | Dashboard do aluno. |
| `/student/contents` | Lista de conteúdos. |
| `/student/content/:id` | Detalhe de conteúdo. |
| `/student/activities` | Lista de atividades. |
| `/student/activity/:id` | Tela visual de resposta de atividade. |
| `/student/feedback` | Feedback do aluno com simulação de adaptação por nível. |
| `/student/profile` | Perfil do aluno e logout. |

## Fluxos disponíveis

### Fluxo de professor

Disponível hoje:

- login real com email e senha;
- restauração de sessão com `GET /auth/me`;
- proteção da área `/teacher`;
- bloqueio de acesso de aluno às telas do professor;
- visualização de dashboard;
- navegação por atividades, conteúdos, correções e perfil;
- logout removendo o token do `localStorage`;
- listagem e detalhe de conteúdos tentando consumir `GET /posts`.
- comentários reais em posts/conteúdos: listar, criar, editar o próprio comentário e excluir conforme permissão retornada pela API.

Ainda simulado:

- criação real de atividades;
- publicação real de conteúdo pelo formulário;
- correção de atividades;
- nota sugerida por IA;
- presença;
- dados detalhados de turma.

### Fluxo de aluno

Disponível hoje:

- login real com email e senha;
- restauração de sessão com `GET /auth/me`;
- proteção da área `/student`;
- bloqueio de acesso de professor às telas do aluno;
- visualização de dashboard;
- navegação por conteúdos, atividades, feedback e perfil;
- logout removendo o token do `localStorage`;
- listagem e detalhe de conteúdos tentando consumir `GET /posts`.
- comentários reais em posts/conteúdos: listar, criar, editar o próprio comentário e excluir conforme permissão retornada pela API.

Ainda simulado:

- atividades pendentes;
- envio real de resposta;
- boletim;
- cronograma;
- feedback pedagógico;
- adaptação de feedback por IA.

## O que está integrado com backend

- `POST /auth/login`: autenticação real.
- `GET /auth/me`: recuperação do usuário autenticado.
- Envio automático de `Authorization: Bearer TOKEN` pela camada `apiFetch`.
- Token JWT salvo em `localStorage` com a chave `luminia:authToken`.
- Logout com remoção do token.
- Proteção de rotas por role (`professor` e `aluno`).
- `GET /posts` e `GET /posts/:id` nas telas de conteúdos, com fallback para mocks caso a API não responda ou não haja dados.
- `GET /posts/:postId/comentarios`: listagem real de comentários.
- `POST /posts/:postId/comentarios`: criação real de comentário.
- `PUT /comentarios/:id`: edição real de comentário próprio.
- `DELETE /comentarios/:id`: exclusão real quando `podeExcluir` vem como `true`.

Contrato TypeScript de comentários:

```ts
type AutorComentario = {
  _id: string;
  nome: string;
  role: 'aluno' | 'professor';
};

type Comentario = {
  _id: string;
  postId: string;
  conteudo: string;
  autor: AutorComentario;
  criadoEm: string;
  atualizadoEm: string;
  podeEditar: boolean;
  podeExcluir: boolean;
};
```

## O que ainda está mockado

Os dados abaixo vêm de `src/app/data/mockData.ts` ou de textos fixos nas telas:

- atividades;
- respostas de atividades;
- correções;
- notas;
- boletim;
- cronograma;
- presença;
- turmas;
- matérias;
- professores por matéria;
- feedbacks atribuídos à IA;
- conteúdos relacionados quando não vêm de tags dos posts.

Os botões de criação/publicação em telas de formulário ainda não persistem dados no backend.

Comentários não usam mocks quando a API responde; a tela exibe estado de erro quando a API não está disponível ou quando o post não existe.

## Acessibilidade

Recursos e cuidados presentes na interface atual:

- navegação inferior simples e previsível;
- textos curtos e linguagem clara;
- ícones acompanhados de rótulos textuais;
- botões grandes e áreas confortáveis para toque;
- estados de foco em elementos interativos;
- uso de `aria-label`, `aria-current`, `aria-selected`, `role="tab"` e `aria-live` em pontos da interface;
- botões visuais de **Ouvir texto** e **Ouvir feedback**.

Limite importante: os botões de leitura alternam estado visual, mas ainda não executam síntese de voz real.

## Estrutura de pastas

```txt
.
├── .github/
│   └── workflows/
│       └── frontend-ci.yml
├── guidelines/
│   └── Guidelines.md
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── components/
│   │   ├── config/
│   │   ├── contexts/
│   │   ├── data/
│   │   ├── hooks/
│   │   └── services/
│   ├── imports/
│   ├── styles/
│   └── main.tsx
├── index.html
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── postcss.config.mjs
├── vite.config.ts
├── default_shadcn_theme.css
├── ATTRIBUTIONS.md
└── README.md
```

### Principais arquivos

| Caminho | Descrição |
| --- | --- |
| `src/main.tsx` | Ponto de entrada da aplicação React. |
| `src/app/App.tsx` | Rotas, layouts, navegação inferior e proteção por role. |
| `src/app/components/LoginScreen.tsx` | Tela de login integrada ao backend. |
| `src/app/components/TeacherScreens.tsx` | Telas da área do professor. |
| `src/app/components/StudentScreens.tsx` | Telas da área do aluno. |
| `src/app/components/AIFeedback.tsx` | Card visual de feedback simulado com níveis de detalhe. |
| `src/app/components/ComentariosSection.tsx` | Formulário e lista de comentários integrados ao backend. |
| `src/app/components/ComentariosSection.test.tsx` | Testes de comportamento da seção de comentários. |
| `src/app/components/ui.tsx` | Componentes básicos reutilizados pela interface. |
| `src/app/config/api.ts` | Configuração da URL da API. |
| `src/app/contexts/AuthContext.tsx` | Estado de sessão, login, logout e restauração de usuário. |
| `src/app/hooks/usePostContents.ts` | Hook para buscar posts/conteúdos e aplicar fallback mockado. |
| `src/app/services/api.ts` | Cliente HTTP com token JWT automático. |
| `src/app/services/authService.ts` | Serviços de login e usuário autenticado. |
| `src/app/services/comentarioService.ts` | Serviços e tipos do contrato de comentários. |
| `src/app/services/postService.ts` | Serviços de posts e mapeamento para conteúdos da UI. |
| `src/app/data/mockData.ts` | Dados simulados usados nas telas ainda não integradas. |
| `src/app/test/setup.ts` | Setup dos testes com matchers do Testing Library. |
| `src/styles/` | Estilos globais, tema, fontes e Tailwind CSS. |
| `src/imports/` | Imagens importadas para o projeto. |

## Status da integração

- Autenticação real com o backend está implementada.
- Sessão é restaurada com `GET /auth/me` quando existe token no `localStorage`.
- Rotas principais são protegidas conforme o perfil retornado pelo backend.
- Aluno não acessa rotas de professor, e professor não acessa rotas de aluno.
- Conteúdos tentam usar posts reais do backend.
- Quando o backend está indisponível, as telas de conteúdo usam dados mockados para manter o MVP navegável.
- Comentários são carregados a partir do backend nas telas de detalhe de conteúdo.
- A API retorna `podeEditar` e `podeExcluir`; a interface usa esses campos para mostrar ações sem recalcular regras complexas.
- O CI do frontend executa `pnpm install --frozen-lockfile` e `pnpm build`.

## Status atual

Implementado:

- Interface mobile first para professor e aluno.
- Login real com JWT.
- Controle de sessão e logout.
- Proteção de rotas por perfil.
- Camada de serviços HTTP organizada.
- Integração inicial com posts/conteúdos do backend.
- Integração real de comentários em posts/conteúdos.
- Fallback de conteúdos para mocks.
- Workflow de CI para build do frontend.
- Testes automatizados da seção de comentários.

Ainda não implementado:

- Persistência real para atividades, respostas, correções, presença, boletim e cronograma.
- Criação real de posts pelo formulário do professor.
- Integração real de IA.
- Síntese de voz real para os botões de leitura.
- Validações completas de formulários e tratamento avançado de estados de erro.

## Limitações conhecidas

- Grande parte do MVP ainda depende de `mockData.ts`.
- As telas de correção e feedback exibem dados simulados; não há correção automática real.
- Boletim, presença e cronograma são apenas representações visuais.
- A tela de envio de atividade altera estado local, mas não envia dados para a API.
- Os formulários de atividade e conteúdo ainda não chamam endpoints de criação.
- O projeto não possui script de lint configurado.
- A leitura em voz alta ainda não está conectada a Web Speech API ou serviço equivalente.
- Comentários dependem de posts reais do backend; ao abrir conteúdo mockado, a seção mostra erro de recurso inexistente.

## Como testar comentários

1. No backend, rode `docker compose up -d`, `npm run seed` e `npm run dev`.
2. No frontend, confirme `.env` com `VITE_API_URL=http://localhost:3000`.
3. Rode `pnpm dev`.
4. Faça login como aluno: `aluno@luminia.com` / `123456`.
5. Abra `Conteúdos`, entre em um conteúdo real e crie um comentário.
6. Edite o próprio comentário.
7. Exclua o próprio comentário.
8. Faça login como professor: `professor@luminia.com` / `123456`.
9. Abra o mesmo conteúdo e valide listagem, criação e exclusão permitida de comentários no próprio post.

Estados tratados na interface:

- carregando;
- sucesso;
- lista vazia;
- erro de rede;
- sessão expirada (`401`, com logout e redirecionamento para login);
- sem permissão (`403`);
- recurso não encontrado (`404`);
- erro de validação;
- confirmação antes de excluir.

## Testes

Execute os testes automatizados:

```bash
pnpm test
```

Execute também a build de produção:

```bash
pnpm build
```

A suíte atual cobre a seção de comentários: renderização, estado vazio, envio, validação de campo vazio, contador, edição, exclusão, ações escondidas sem permissão e erros `401`/`403`.

## Próximos passos

- Integrar criação, edição e remoção de posts no frontend.
- Criar endpoints e telas integradas para atividades e entregas.
- Implementar persistência real de correções, notas, presença e cronograma.
- Expandir testes automatizados para autenticação, rotas protegidas e demais serviços.
- Implementar feedbacks de erro e carregamento mais completos.
- Realizar auditoria de acessibilidade com Lighthouse, axe e testes por teclado.
- Implementar síntese de voz real.
- Planejar integração com IA pedagógica somente após consolidar dados e fluxos principais.

## Créditos

Projeto desenvolvido para fins acadêmicos/hackathon.

Nome do projeto: **Luminia**.

O bundle visual inicial veio de um protótipo do Figma Community: `Luminiaprototicoapp (Community)`.
