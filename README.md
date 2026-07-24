# Luminia Frontend

Interface web do **Luminia**, uma plataforma educacional com experiências separadas para professores e alunos. O frontend é mobile first, usa autenticação JWT e consome a API do Luminia para conteúdos, comentários e fluxos acadêmicos.

## Estado atual

Já estão implementados:

- login, restauração de sessão, logout e proteção de rotas por perfil;
- áreas responsivas de professor e aluno;
- conteúdos e comentários com regras de autoria e permissão;
- atividades, entregas e correções;
- turmas, disciplinas, boletim e cronograma;
- perfis de aluno e professor;
- estados de carregamento, vazio, erro e sucesso;
- testes automatizados e build de produção.

Ainda são simulados ou planejados:

- feedback pedagógico gerado por IA;
- adaptação automática do feedback por nível;
- síntese de voz para os controles de leitura;
- endpoint agregado para reduzir as requisições dos dashboards.

## Tecnologias

- React 18 e TypeScript;
- Vite 6;
- React Router 7;
- Tailwind CSS 4;
- Material UI, Radix UI e Lucide React;
- Fetch API com cliente HTTP centralizado;
- Vitest, Testing Library e cobertura V8;
- pnpm;
- GitHub Actions.

## Pré-requisitos

- Node.js 20 ou superior;
- pnpm 9;
- backend e MongoDB em execução para usar os fluxos integrados.

## Instalação

```bash
pnpm install
cp .env.example .env
```

Variável disponível:

```env
VITE_API_URL=http://localhost:3000
```

Em um dispositivo físico, substitua `localhost` pelo IP da máquina que executa o backend e autorize a origem do frontend em `CORS_ORIGIN` no backend.

## Execução local

Primeiro, prepare a API:

```bash
cd ../LuminiaBack
docker compose up -d
npm install
npm run seed
npm run dev
```

Em outro terminal:

```bash
cd ../LuminiaFront
pnpm dev
```

A interface fica disponível em `http://localhost:5173` e a API, em `http://localhost:3000`.

Usuários criados pelo seed:

| Perfil | Email | Senha |
| --- | --- | --- |
| Professor | `professor@luminia.com` | `123456` |
| Aluno | `aluno@luminia.com` | `123456` |

Essas credenciais são destinadas somente ao desenvolvimento local.

## Scripts

| Comando | Descrição |
| --- | --- |
| `pnpm dev` | Inicia o servidor de desenvolvimento. |
| `pnpm build` | Gera o bundle de produção em `dist/`. |
| `pnpm test` | Executa os testes uma vez. |
| `pnpm test:coverage` | Executa os testes com cobertura V8. |

Não há script de lint configurado atualmente.

## Rotas da interface

### Professor

| Rota | Tela |
| --- | --- |
| `/teacher` | Dashboard |
| `/teacher/activities` | Lista de atividades |
| `/teacher/activity/:id` | Detalhe da atividade e entregas |
| `/teacher/create` | Criação de atividade |
| `/teacher/contents` | Conteúdos publicados |
| `/teacher/content/new` | Criação de conteúdo |
| `/teacher/content/:id` | Detalhe e comentários |
| `/teacher/content/:id/edit` | Edição de conteúdo |
| `/teacher/corrections` | Turmas disponíveis para correção |
| `/teacher/corrections/:classId` | Entregas da turma |
| `/teacher/correction/:id` | Correção ou revisão de entrega |
| `/teacher/class/:classId` | Detalhes da turma |
| `/teacher/profile` | Perfil |

### Aluno

| Rota | Tela |
| --- | --- |
| `/student` | Dashboard |
| `/student/contents` | Lista de conteúdos |
| `/student/content/:id` | Detalhe e comentários |
| `/student/activities` | Lista de atividades |
| `/student/activity/:id` | Resposta e situação da atividade |
| `/student/feedback` | Feedback e boletim |
| `/student/profile` | Perfil |

As áreas protegidas verificam autenticação e perfil. Alunos não acessam rotas de professor, e professores não acessam rotas de aluno.

## Integração com a API

O token JWT é salvo em `localStorage` com a chave `luminia:authToken` e enviado no header `Authorization: Bearer TOKEN`.

| Funcionalidade | Endpoints consumidos |
| --- | --- |
| Autenticação | `POST /auth/login`, `GET /auth/me` |
| Perfis | `GET /alunos/me`, `GET /professores/me` |
| Conteúdos | `GET /posts`, `GET /posts/:id`, `POST /posts`, `PUT /posts/:id`, `DELETE /posts/:id` |
| Comentários | `GET/POST /posts/:postId/comentarios`, `PUT/DELETE /comentarios/:id` |
| Atividades | `GET /atividades`, `GET /atividades/:id`, `POST /atividades` |
| Entregas | `POST /atividades/:id/entregas`, `GET /atividades/:id/entregas`, `GET /entregas/me` |
| Correções | `GET/PUT /entregas/:id/correcao` |
| Boletim | `GET /boletins/me` |
| Cronograma | `GET /cronograma` |
| Catálogo acadêmico | `GET /turmas`, `GET /turmas/:id`, `GET /disciplinas` |

As listagens usam o envelope `{ dados, paginacao }`. Os tipos compartilhados ficam em `src/app/types/api.ts`.

### Tratamento de erros

O cliente em `src/app/services/api.ts` centraliza token, timeout, parsing e normalização das falhas:

- `401` em uma rota protegida encerra a sessão e remove o token;
- `401` no login é apresentado como credenciais inválidas;
- `403` mantém a sessão e informa falta de permissão;
- erros de rede, validação e recursos inexistentes recebem mensagens apropriadas.

Os componentes reutilizáveis de feedback ficam em `src/app/components/feedback.tsx`.

## Estrutura

```text
.
├── .github/workflows/frontend-ci.yml
├── guidelines/
├── src/
│   ├── app/
│   │   ├── components/       # telas e componentes
│   │   ├── config/           # URL da API
│   │   ├── contexts/         # sessão e autenticação
│   │   ├── data/             # dados simulados remanescentes
│   │   ├── hooks/            # carregamento de dados
│   │   ├── services/         # cliente HTTP e serviços
│   │   ├── test/             # setup, fixtures e helpers
│   │   ├── types/            # contratos TypeScript
│   │   └── App.tsx           # rotas e layouts
│   ├── imports/              # imagens
│   ├── styles/               # tema, fontes e Tailwind
│   └── main.tsx
├── .env.example
├── package.json
├── pnpm-lock.yaml
├── vite.config.ts
└── vitest.config.ts
```

## Validação

Antes de enviar uma alteração, execute:

```bash
pnpm test
pnpm test:coverage
pnpm build
```

O workflow `frontend-ci.yml` roda em pushes e pull requests para `develop` e `main`, instala as dependências com lockfile congelado e valida a build.

## Limitações conhecidas

- os recursos de IA ainda não possuem integração com um provedor;
- os botões de leitura não executam síntese de voz;
- os dashboards agregam dados por meio de múltiplas requisições;
- o projeto ainda não possui lint dedicado;
- o erro de rede durante a restauração da sessão encerra a sessão por segurança.

## Créditos

Projeto acadêmico/hackathon. A base visual foi derivada do protótipo Figma Community `Luminiaprototicoapp (Community)`; consulte também `ATTRIBUTIONS.md`.
