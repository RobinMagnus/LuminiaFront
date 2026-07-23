# Luminia Frontend

Frontend do **Luminia**, plataforma educacional com experiências separadas para professores e alunos. O projeto foi criado como MVP acadêmico/hackathon, com interface mobile first, autenticação por JWT e integração progressiva com a API.

> Observação: a pasta local deste repositório está nomeada como `LuminiaFront`.

## SUMÁRIO

1. [Apresentação](#1-apresentação)
2. [Tecnologias utilizadas](#2-tecnologias-utilizadas)
3. [Scripts disponíveis](#3-scripts-disponíveis)
4. [Fluxo de desenvolvimento](#4-fluxo-de-desenvolvimento)
5. [Instalação e configuração](#5-instalação-e-configuração)
6. [Execução da aplicação](#6-execução-da-aplicação)
7. [Autenticação e rotas](#7-autenticação-e-rotas)
8. [Integração com a API](#8-integração-com-a-api)
9. [Testes e qualidade](#9-testes-e-qualidade)
10. [Estrutura do projeto](#10-estrutura-do-projeto)
11. [Tratamento de erros e acessibilidade](#11-tratamento-de-erros-e-acessibilidade)
12. [Mapeamento da implantação](#12-mapeamento-da-implantação)
13. [Limitações conhecidas](#limitações-conhecidas)
14. [Próximos passos](#próximos-passos)
15. [Créditos](#créditos)

## 1 APRESENTAÇÃO

Este documento registra os requisitos de execução, a organização técnica, as rotas da interface e o estado de integração do frontend. A estrutura segue o padrão documental do repositório de backend, com numeração progressiva e seções equivalentes.

O projeto é um MVP mobile first desenvolvido a partir do protótipo `Luminiaprototicoapp (Community)`. Os dados operacionais vêm do backend; os recursos de IA permanecem apenas como direcionamento de produto.

## 2 TECNOLOGIAS UTILIZADAS

- React 18 e TypeScript;
- Vite 6;
- React Router;
- Tailwind CSS;
- Lucide React;
- componentes Radix UI e Material UI;
- Fetch API com cliente HTTP centralizado;
- Vitest, Testing Library e cobertura V8;
- pnpm;
- GitHub Actions para integração contínua.

## 3 SCRIPTS DISPONÍVEIS

| Comando              | Descrição                                  |
| -------------------- | ------------------------------------------ |
| `pnpm dev`           | Inicia o servidor de desenvolvimento Vite. |
| `pnpm build`         | Gera o bundle de produção.                 |
| `pnpm test`          | Executa os testes uma vez com Vitest.      |
| `pnpm test:coverage` | Executa os testes e gera cobertura V8.     |

Não há script de lint configurado atualmente.

## 4 FLUXO DE DESENVOLVIMENTO

Atualize `develop` e crie uma branch de funcionalidade:

```bash
git switch develop
git pull origin develop
git switch -c feature/nome-da-feature
```

Após concluir e validar a alteração:

```bash
git push -u origin feature/nome-da-feature
```

O workflow em `.github/workflows/frontend-ci.yml` instala as dependências com lockfile congelado e valida a build. As regras de Pull Request e proteção de branches devem ser mantidas alinhadas às descritas no backend.

## 5 INSTALAÇÃO E CONFIGURAÇÃO

### 5.1 Pré-requisitos

- Node.js 20 ou versão compatível;
- pnpm;
- Luminia Backend e MongoDB para os fluxos integrados.

### 5.2 Instalação das dependências

```bash
pnpm install
```

Em CI, use instalação reproduzível:

```bash
pnpm install --frozen-lockfile
```

### 5.3 Variável de ambiente

Crie o arquivo local a partir do exemplo:

```bash
cp .env.example .env
```

Configuração padrão:

```env
VITE_API_URL=http://localhost:3000
```

`VITE_API_URL` define a URL base usada pelos serviços. Em dispositivo físico, use o IP local da máquina no lugar de `localhost`. No backend, inclua a origem do Vite em `CORS_ORIGIN`.

## 6 EXECUÇÃO DA APLICAÇÃO

Prepare primeiro o backend:

```bash
cd ../LuminiaBackend
docker compose up -d
npm install
npm run seed
npm run dev
```

Em outro terminal, inicie o frontend:

```bash
cd ../LuminiaFront
pnpm dev
```

A interface fica disponível, por padrão, em `http://localhost:5173`.

Credenciais criadas pelo seed local:

| Perfil    | Email                   | Senha    |
| --------- | ----------------------- | -------- |
| Professor | `professor@luminia.com` | `123456` |
| Aluno     | `aluno@luminia.com`     | `123456` |

Essas credenciais são exclusivas para desenvolvimento.

## 7 AUTENTICAÇÃO E ROTAS

### 7.1 Sessão

O login usa `POST /auth/login` e a restauração de sessão usa `GET /auth/me`. O JWT é armazenado em `localStorage` sob a chave `luminia:authToken` e enviado automaticamente como Bearer Token.

Rotas protegidas verificam autenticação e role. Um `401` encerra a sessão; um `403` preserva a sessão e exibe acesso negado.

### 7.2 Área do professor

| Rota                            | Tela                                        |
| ------------------------------- | ------------------------------------------- |
| `/teacher`                      | Dashboard.                                  |
| `/teacher/activities`           | Atividades reais do professor.              |
| `/teacher/activity/:id`         | Detalhe e resumo de entregas.               |
| `/teacher/create`               | Criação de atividade publicada ou rascunho. |
| `/teacher/contents`             | Conteúdos publicados.                       |
| `/teacher/content/new`          | Criação de conteúdo.                        |
| `/teacher/content/:id/edit`     | Edição de conteúdo próprio.                 |
| `/teacher/content/:id`          | Detalhe e comentários.                      |
| `/teacher/corrections`          | Turmas disponíveis para correção.           |
| `/teacher/corrections/:classId` | Entregas da turma.                          |
| `/teacher/correction/:id`       | Correção ou revisão de entrega.             |
| `/teacher/profile`              | Perfil e turmas atribuídas.                 |
| `/teacher/class/:classId`       | Turma, disciplinas e atividades.            |

### 7.3 Área do aluno

| Rota                    | Tela                                                    |
| ----------------------- | ------------------------------------------------------- |
| `/student`              | Dashboard do aluno.                                     |
| `/student/contents`     | Lista de conteúdos.                                     |
| `/student/content/:id`  | Detalhe de conteúdo.                                    |
| `/student/activities`   | Lista de atividades.                                    |
| `/student/activity/:id` | Tela visual de resposta de atividade.                   |
| `/student/feedback`     | Feedback do aluno com simulação de adaptação por nível. |
| `/student/profile`      | Perfil do aluno e logout.                               |

## Fluxo de branching

Este projeto segue um fluxo de desenvolvimento estruturado com `develop` como branch de integração e `main` para produção.

### Como contribuir

1. **Crie uma branch feature a partir de `develop`:**

   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/sua-feature
   ```

2. **Faça commits e push para a branch feature:**

   ```bash
   git push origin feature/sua-feature
   ```

3. **Abra um Pull Request (PR) para `develop`:**
   - Vá para o repositório no GitHub
   - Clique em "New Pull Request"
   - Defina `base: develop` e `compare: feature/sua-feature`
   - Adicione descrição clara das mudanças
   - Solicite revisão

4. **Depois de revisado e testado em `develop`, abra um PR para `main`:**
   - Quando a feature estiver pronta para produção
   - Crie um PR de `develop` → `main`
   - Garanta que todos os testes passam

### Proteções de branch

A branch `main` possui proteções obrigatórias:

- ✅ Checks de CI devem passar (build e testes)
- ✅ Requer aprovação de @RobinMagnus
- ✅ Admins também devem respeitar as proteções

Para aplicar manualmente, use:

```bash
curl -X PUT \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.github.com/repos/RobinMagnus/LuminiaFront/branches/main/protection \
  -d '{
    "required_status_checks": {
      "strict": true,
      "contexts": []
    },
    "enforce_admins": true,
    "required_pull_request_reviews": {
      "dismiss_stale_reviews": false,
      "require_code_owner_reviews": false,
      "required_approving_review_count": 1
    },
    "restrictions": null
  }'
```

**Token necessário:** PAT com scope `repo` e permissão de admin no repositório.

### Automação: Auto-merge develop → main

Um workflow automático tenta fazer merge de `develop` em `main` sempre que há commits à frente:

- Gatilho: push em `develop`
- Cria ou reutiliza PR de `develop` → `main` com título: `Automated: merge develop into main`
- Tenta ativar auto-merge (merge method: `merge`)

**Nota sobre auto-merge:** Se o auto-merge falhar (permissões insuficientes), o workflow documenta a necessidade de um PAT com escopo `repo` armazenado em `Secrets` como `AUTO_MERGE_TOKEN`.

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
- listagem e detalhe de conteúdos com `GET /posts` e `GET /posts/:id`;
- criação, edição e exclusão de posts próprios com `POST /posts`, `PUT /posts/:id` e `DELETE /posts/:id`;
- perfil básico real com `GET /professores/me`.
- comentários reais em posts/conteúdos: listar, criar, editar o próprio comentário e excluir conforme permissão retornada pela API.

Ainda simulado:

- feedback pedagógico por IA;
- leitura em voz alta com síntese real;
- endpoint agregado de resumo para dashboard.

### Fluxo de aluno

Disponível hoje:

- login real com email e senha;
- restauração de sessão com `GET /auth/me`;
- proteção da área `/student`;
- bloqueio de acesso de professor às telas do aluno;
- visualização de dashboard;
- navegação por conteúdos, atividades, feedback e perfil;
- logout removendo o token do `localStorage`;
- listagem e detalhe de conteúdos com `GET /posts` e `GET /posts/:id`;
- perfil básico real com `GET /alunos/me`.
- comentários reais em posts/conteúdos: listar, criar, editar o próprio comentário e excluir conforme permissão retornada pela API.

Ainda simulado:

- feedback pedagógico;
- adaptação de feedback por IA.

## O que está integrado com backend

- `POST /auth/login`: autenticação real.
- `GET /auth/me`: recuperação do usuário autenticado.
- Envio automático de `Authorization: Bearer TOKEN` pela camada `apiFetch`.
- Token JWT salvo em `localStorage` com a chave `luminia:authToken`.
- Logout com remoção do token.
- Proteção de rotas por role (`professor` e `aluno`).
- `GET /posts` e `GET /posts/:id` nas telas de conteúdos.
- `POST /posts`, `PUT /posts/:id` e `DELETE /posts/:id` na área do professor.
- `GET /alunos/me` e `GET /professores/me` nas telas de perfil.
- `GET /posts/:postId/comentarios`: listagem real de comentários.
- `POST /posts/:postId/comentarios`: criação real de comentário.
- `PUT /comentarios/:id`: edição real de comentário próprio.
- `DELETE /comentarios/:id`: exclusão real quando `podeExcluir` vem como `true`.

Contrato TypeScript de comentários:

```ts
type AutorComentario = {
  _id: string;
  nome: string;
  role: "aluno" | "professor";
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

## 8 INTEGRAÇÃO COM A API

### 8.1 Endpoints consumidos

| Funcionalidade     | Endpoints                                                                            |
| ------------------ | ------------------------------------------------------------------------------------ |
| Autenticação       | `POST /auth/login`, `GET /auth/me`                                                   |
| Perfis             | `GET /alunos/me`, `GET /professores/me`                                              |
| Conteúdos          | `GET /posts`, `GET /posts/:id`, `POST /posts`, `PUT /posts/:id`, `DELETE /posts/:id` |
| Comentários        | `GET/POST /posts/:postId/comentarios`, `PUT/DELETE /comentarios/:id`                 |
| Atividades         | `GET /atividades`, `GET /atividades/:id`, `POST /atividades`                         |
| Entregas           | `POST /atividades/:id/entregas`, `GET /atividades/:id/entregas`, `GET /entregas/me`  |
| Correções          | `GET/PUT /entregas/:id/correcao`                                                     |
| Boletim            | `GET /boletins/me`                                                                   |
| Cronograma         | `GET /cronograma`                                                                    |
| Catálogo acadêmico | `GET /turmas`, `GET /turmas/:id`, `GET /disciplinas`                                 |

Listagens acadêmicas e de conteúdo respeitam o envelope `{ dados, paginacao }`. Os contratos TypeScript ficam em `src/app/types/api.ts`; as chamadas acadêmicas ficam em `src/app/services/academicService.ts`.

### 8.2 Fluxos acadêmicos implementados

- Professor lista, consulta e cria atividades, inclusive como rascunho.
- Professor acompanha entregas por atividade e por turma.
- Professor registra e revisa nota e feedback de uma entrega.
- Professor consulta suas turmas, disciplinas e atividades vinculadas.
- Aluno lista somente atividades publicadas para sua turma.
- Aluno acompanha se uma atividade está pendente, entregue ou corrigida.
- Aluno envia uma resposta, com proteção contra reenvio duplicado.
- Aluno consulta correções, boletim, cronograma e disciplinas reais.

## 9 TESTES E QUALIDADE

Execute:

```bash
pnpm test
pnpm test:coverage
pnpm build
```

A suíte cobre autenticação, contexto de sessão, rotas protegidas, posts, perfis, comentários e tratamento de erros. Novos fluxos acadêmicos devem receber testes de serviço e comportamento nas próximas alterações.

## 10 ESTRUTURA DO PROJETO

```txt
.
├── .github/
│   └── workflows/
│       ├── frontend-ci.yml
│       └── auto-merge-develop-to-main.yml
├── guidelines/
├── src/
│   ├── app/
│   │   ├── components/
│   │   ├── config/
│   │   ├── contexts/
│   │   ├── data/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── test/
│   │   ├── types/
│   │   └── App.tsx
│   ├── imports/
│   ├── styles/
│   └── main.tsx
├── .env.example
├── package.json
├── pnpm-lock.yaml
├── vite.config.ts
└── README.md
```

Arquivos centrais:

| Caminho                                          | Responsabilidade                                                             |
| ------------------------------------------------ | ---------------------------------------------------------------------------- |
| `src/main.tsx`                                   | Ponto de entrada da aplicação React.                                         |
| `src/app/App.tsx`                                | Rotas, layouts, navegação inferior e proteção por role.                      |
| `src/app/components/LoginScreen.tsx`             | Tela de login integrada ao backend.                                          |
| `src/app/components/TeacherScreens.tsx`          | Telas da área do professor.                                                  |
| `src/app/components/StudentScreens.tsx`          | Telas da área do aluno.                                                      |
| `src/app/components/AIFeedback.tsx`              | Card visual de feedback simulado com níveis de detalhe.                      |
| `src/app/components/ComentariosSection.tsx`      | Formulário e lista de comentários integrados ao backend.                     |
| `src/app/components/ComentariosSection.test.tsx` | Testes de comportamento da seção de comentários.                             |
| `src/app/components/feedback.tsx`                | Estados reutilizáveis de erro, carregamento, vazio e feedback acessível.     |
| `src/app/components/ui.tsx`                      | Componentes básicos reutilizados pela interface.                             |
| `src/app/config/api.ts`                          | Configuração da URL da API.                                                  |
| `src/app/contexts/AuthContext.tsx`               | Estado de sessão, login, logout e restauração de usuário.                    |
| `src/app/hooks/usePostContents.ts`               | Hook para buscar posts/conteúdos reais e tratar carregamento/erro/vazio.     |
| `src/app/services/api.ts`                        | Cliente HTTP com token JWT automático e normalização central de erros.       |
| `src/app/services/authService.ts`                | Serviços de login e usuário autenticado.                                     |
| `src/app/services/comentarioService.ts`          | Serviços e tipos do contrato de comentários.                                 |
| `src/app/services/postService.ts`                | Serviços de posts e mapeamento para conteúdos da UI.                         |
| `src/app/services/profileService.ts`             | Serviços de perfil autenticado de aluno e professor.                         |
| `src/app/types/api.ts`                           | Tipos TypeScript do contrato principal da API.                               |
| `src/app/data/mockData.ts`                       | Dados simulados usados nas telas ainda não integradas.                       |
| `src/app/test/setup.ts`                          | Setup dos testes com matchers do Testing Library e limpeza de storage/mocks. |
| `src/app/test/fixtures.ts`                       | Fixtures reutilizáveis de usuário, sessão, posts, perfis e comentários.      |
| `src/app/test/renderWithProviders.tsx`           | Helper de renderização com router e providers.                               |
| `src/styles/`                                    | Estilos globais, tema, fontes e Tailwind CSS.                                |
| `src/imports/`                                   | Imagens importadas para o projeto.                                           |

## Status da integração

- Autenticação real com o backend está implementada.
- Sessão é restaurada com `GET /auth/me` quando existe token no `localStorage`.
- Rotas principais são protegidas conforme o perfil retornado pelo backend.
- Aluno não acessa rotas de professor, e professor não acessa rotas de aluno.
- Conteúdos/posts usam dados reais do backend.
- Professor cria, edita e exclui posts próprios.
- Aluno visualiza posts reais sem ações de criação/edição/exclusão.
- Perfis básicos usam dados reais do backend.
- Comentários são carregados a partir do backend nas telas de detalhe de conteúdo.
- A API retorna `podeEditar` e `podeExcluir`; a interface usa esses campos para mostrar ações sem recalcular regras complexas.
- Erros HTTP são normalizados em `apiFetch` e exibidos por componentes visuais reutilizáveis.
- `401` fora do login dispara encerramento de sessão, remove o token e orienta novo login.
- `403` mantém a sessão ativa e exibe acesso negado.
- O CI do frontend executa `pnpm install --frozen-lockfile` e `pnpm build`.

## Status atual

Implementado:

- Interface mobile first para professor e aluno.
- Login real com JWT.
- Controle de sessão e logout.
- Proteção de rotas por perfil.
- Camada de serviços HTTP organizada.
- Integração real com posts/conteúdos do backend.
- Criação, edição e exclusão real de posts próprios para professor.
- Perfis básicos reais de aluno e professor.
- Integração real de comentários em posts/conteúdos.
- Workflow de CI para build do frontend.
- Testes automatizados de autenticação, AuthContext, rotas protegidas, posts, perfis, comentários e feedback de erros.
- Padronização global de erros e estados assíncronos.
- Fluxo de branching automatizado (develop → main).

Ainda não implementado:

- Integração real de IA.
- Síntese de voz real para os botões de leitura.
- Endpoint agregado de resumo (dashboard) para reduzir múltiplas chamadas por tela.

Status da etapa:

- Finalização dos testes do frontend: concluída.
- Padronização global de erros: concluída.
- Validação de build e testes: concluída.
- Fluxo de branching e auto-merge: configurado.

## Limitações conhecidas

- Recursos de IA ainda não possuem integração real no backend.
- Botões de leitura ainda não estão conectados à Web Speech API ou serviço equivalente.
- O dashboard ainda agrega dados com múltiplas requisições no cliente.
- O projeto não possui script de lint configurado.
- Comentários dependem de posts reais do backend; ao abrir conteúdo mockado, a seção mostra erro de recurso inexistente.

## Tratamento de erros

O modelo central de erro fica em `src/app/services/api.ts` como `AppError`, `ApiError`, `normalizeApiError` e `getFriendlyErrorMessage`. A normalização trata `400`, `401`, `403`, `404`, `409`, `422` e erros inesperados com fallback seguro.

Os estados visuais reutilizáveis ficam em `src/app/components/feedback.tsx`:

- `ErrorState`: erro com título, mensagem, status, retry, voltar, variante compacta/página, `role="alert"` e foco opcional.
- `FeedbackMessage`: sucesso, erro, aviso e informação com anúncio acessível e fechamento.
- `LoadingState`: carregamento anunciado com `role="status"`.
- `EmptyState`: estado vazio separado de erro.

Comportamento global:

- `401` em rota protegida ou `/auth/me`: limpa sessão, remove `luminia:authToken`, evita manter usuário inválido e mostra mensagem de sessão expirada.
- `401` no login: é tratado como credenciais inválidas, sem encerrar uma sessão inexistente.
- `403`: mantém sessão ativa, mostra acesso negado e não redireciona automaticamente para login.
- Erro de rede ao restaurar sessão: a política atual encerra a sessão por segurança do MVP; essa decisão evita exibir conteúdo protegido quando não foi possível confirmar o usuário.

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

## Como testar posts e perfis

1. Faça login como professor.
2. Acesse `Conteúdos`.
3. Crie um post com título e texto.
4. Edite o post criado.
5. Exclua o post criado.
6. Acesse `Perfil` e confirme dados reais de professor.
7. Faça logout.
8. Faça login como aluno.
9. Acesse `Conteúdos` e abra um post real.
10. Confirme que não há botões de criar, editar ou excluir post.
11. Acesse `Perfil` e confirme matrícula/turma vindas da API.

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

## Integrações concluídas

| Funcionalidade   | Situação  | Endpoint                                                                             |
| ---------------- | --------- | ------------------------------------------------------------------------------------ |
| Login            | Integrado | `POST /auth/login`                                                                   |
| Sessão           | Integrado | `GET /auth/me`                                                                       |
| Posts            | Integrado | `GET /posts`, `GET /posts/:id`, `POST /posts`, `PUT /posts/:id`, `DELETE /posts/:id` |
| Perfil aluno     | Integrado | `GET /alunos/me`                                                                     |
| Perfil professor | Integrado | `GET /professores/me`                                                                |
| Comentários      | Integrado | `GET/POST /posts/:postId/comentarios`, `PUT/DELETE /comentarios/:id`                 |
| Atividades       | Integrado | `GET /atividades`, `GET /atividades/:id`, `POST /atividades`                         |
| Entregas         | Integrado | `POST /atividades/:id/entregas`, `GET /atividades/:id/entregas`, `GET /entregas/me`  |
| Correções        | Integrado | `GET/PUT /entregas/:id/correcao`                                                     |
| Boletim          | Integrado | `GET /boletins/me`                                                                   |
| Cronograma       | Integrado | `GET /cronograma`                                                                    |
| Catálogo         | Integrado | `GET /turmas`, `GET /turmas/:id`, `GET /disciplinas`                                 |

## Recursos ainda simulados

- Feedback de IA adaptativo.
- Leitura em voz alta com síntese real de áudio.

## 11 TRATAMENTO DE ERROS E ACESSIBILIDADE

`ApiError` e `normalizeApiError` convertem falhas HTTP, rede, timeout e respostas inválidas em mensagens seguras. As telas usam componentes reutilizáveis para carregamento, lista vazia, erro e sucesso.

A interface possui foco visível, regiões `aria-live`, rótulos em controles, navegação por teclado e botões com área adequada para toque. Os botões de leitura ainda representam apenas a interação visual.

## 12 MAPEAMENTO DA IMPLANTAÇÃO

```bash
pnpm test:coverage
```

Execute também a build de produção:

```bash
pnpm build
```

A suíte validada nesta etapa possui 8 arquivos e 65 testes. Fluxos cobertos:

- login de professor e aluno;
- credenciais inválidas, falha de rede, campos obrigatórios e envio duplicado;
- restauração de sessão, token ausente, token expirado, erro de rede e logout no `AuthContext`;
- rotas protegidas, loading de sessão e proteção por role;
- listagem de posts com loading, vazio, erro e retry;
- permissões de aluno/professor em posts;
- criação, edição, exclusão, cancelamento e erros de posts;
- perfis de aluno e professor, estados vazios, erro e endpoint correto por role;
- comentários com listar, criar, editar, excluir, cancelar exclusão, permissões, aluno/professor, loading, vazio, rede, `401` e `403`;
- normalização central de erros e feedback visual acessível.

Cobertura real em 2026-07-09:

| Métrica    | Cobertura |
| ---------- | --------: |
| Statements |    70.95% |
| Branches   |    64.12% |
| Functions  |    51.59% |
| Lines      |    71.36% |

Limitação atual: não há script de lint dedicado no `package.json`; por isso a validação final executa `pnpm test`, `pnpm test:coverage`, `pnpm exec tsc --noEmit` e `pnpm build`.

## Próximos passos

1. Criar turmas e disciplinas.
2. Integrar turmas e disciplinas ao frontend.
3. Criar atividades e entregas.
4. Criar correções, presença e boletim.
5. Integrar IA por último.

## Histórico de evolução

- Base inicial do frontend: concluída.
- Base inicial do backend: concluída.
- MongoDB e seed: concluídos.
- Autenticação JWT: concluída.
- Autorização por role: concluída.
- Integração real frontend-backend: concluída nesta etapa.
- Comentários: implementados.
- Testes automatizados do frontend: concluídos.
- Padronização global de erros: concluída.
- Validação de build e testes: concluída.
- Fluxo de branching automatizado: configurado.
- Funcionalidades acadêmicas: pendentes.
- Integração com IA: pendente e planejada para o final.

## Créditos

Projeto desenvolvido para fins acadêmicos/hackathon.

Nome do projeto: **Luminia**.

O bundle visual inicial veio de um protótipo do Figma Community: `Luminiaprototicoapp (Community)`.
