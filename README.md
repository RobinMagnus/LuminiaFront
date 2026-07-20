# Luminia Frontend

Interface web do **Luminia**, plataforma educacional com experiências separadas para professores e alunos. A aplicação consome a API REST do Luminia Backend para autenticação, conteúdos, perfis e fluxos acadêmicos.

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
13. [Limitações conhecidas](#13-limitações-conhecidas)
14. [Planejamento](#14-planejamento)
15. [Referências normativas](#15-referências-normativas)

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

| Comando | Descrição |
| --- | --- |
| `pnpm dev` | Inicia o servidor de desenvolvimento Vite. |
| `pnpm build` | Gera o bundle de produção. |
| `pnpm test` | Executa os testes uma vez com Vitest. |
| `pnpm test:coverage` | Executa os testes e gera cobertura V8. |

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
cd ../LuminiaBack
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

| Perfil | Email | Senha |
| --- | --- | --- |
| Professor | `professor@luminia.com` | `123456` |
| Aluno | `aluno@luminia.com` | `123456` |

Essas credenciais são exclusivas para desenvolvimento.

## 7 AUTENTICAÇÃO E ROTAS

### 7.1 Sessão

O login usa `POST /auth/login` e a restauração de sessão usa `GET /auth/me`. O JWT é armazenado em `localStorage` sob a chave `luminia:authToken` e enviado automaticamente como Bearer Token.

Rotas protegidas verificam autenticação e role. Um `401` encerra a sessão; um `403` preserva a sessão e exibe acesso negado.

### 7.2 Área do professor

| Rota | Tela |
| --- | --- |
| `/teacher` | Dashboard. |
| `/teacher/activities` | Atividades reais do professor. |
| `/teacher/activity/:id` | Detalhe e resumo de entregas. |
| `/teacher/create` | Criação de atividade publicada ou rascunho. |
| `/teacher/contents` | Conteúdos publicados. |
| `/teacher/content/new` | Criação de conteúdo. |
| `/teacher/content/:id/edit` | Edição de conteúdo próprio. |
| `/teacher/content/:id` | Detalhe e comentários. |
| `/teacher/corrections` | Turmas disponíveis para correção. |
| `/teacher/corrections/:classId` | Entregas da turma. |
| `/teacher/correction/:id` | Correção ou revisão de entrega. |
| `/teacher/profile` | Perfil e turmas atribuídas. |
| `/teacher/class/:classId` | Turma, disciplinas e atividades. |

### 7.3 Área do aluno

| Rota | Tela |
| --- | --- |
| `/student` | Dashboard. |
| `/student/contents` | Conteúdos disponíveis. |
| `/student/content/:id` | Detalhe e comentários. |
| `/student/activities` | Atividades e situação da entrega. |
| `/student/activity/:id` | Resposta e envio de atividade. |
| `/student/feedback` | Correções e notas recebidas. |
| `/student/profile` | Perfil, disciplinas, boletim e cronograma. |

## 8 INTEGRAÇÃO COM A API

### 8.1 Endpoints consumidos

| Funcionalidade | Endpoints |
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
├── .github/workflows/
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

| Caminho | Responsabilidade |
| --- | --- |
| `src/app/App.tsx` | Rotas, layouts e autorização por role. |
| `src/app/components/TeacherScreens.tsx` | Fluxos do professor. |
| `src/app/components/StudentScreens.tsx` | Fluxos do aluno. |
| `src/app/services/api.ts` | Cliente HTTP, JWT e normalização de erros. |
| `src/app/services/academicService.ts` | Operações acadêmicas tipadas. |
| `src/app/hooks/useAcademicData.ts` | Estado reutilizável de carregamento, erro e recarga. |
| `src/app/types/api.ts` | Contratos da API. |
| `src/app/data/mockData.ts` | Dados residuais de demonstração visual. |

## 11 TRATAMENTO DE ERROS E ACESSIBILIDADE

`ApiError` e `normalizeApiError` convertem falhas HTTP, rede, timeout e respostas inválidas em mensagens seguras. As telas usam componentes reutilizáveis para carregamento, lista vazia, erro e sucesso.

A interface possui foco visível, regiões `aria-live`, rótulos em controles, navegação por teclado e botões com área adequada para toque. Os botões de leitura ainda representam apenas a interação visual.

## 12 MAPEAMENTO DA IMPLANTAÇÃO

| Área | Situação |
| --- | --- |
| Autenticação e autorização | Integrada. |
| Posts e comentários | Integrados. |
| Perfis | Integrados. |
| Atividades e entregas | Integradas. |
| Correções manuais e feedback | Integrados. |
| Boletim e cronograma do aluno | Integrados para consulta. |
| Turmas e disciplinas | Integradas para consulta. |
| Presença | Endpoint disponível; falta uma listagem de alunos adequada à chamada na tela. |
| IA e leitura em voz alta | Não integradas. |

## 13 LIMITAÇÕES CONHECIDAS

- O dashboard ainda exibe alguns números e destaques estáticos.
- A presença não é editada pela interface porque o fluxo exige identificar alunos da turma; essa composição ainda não possui um contrato dedicado no frontend.
- Não há edição ou exclusão de atividade na interface, embora os endpoints existam.
- Paginação usa limite de até 100 itens e ainda não possui controles visuais.
- Recursos atribuídos à IA não chamam um serviço real.
- A leitura em voz alta não executa síntese de voz.
- O projeto não possui lint configurado.

## 14 PLANEJAMENTO

Próximos incrementos sugeridos:

1. integrar indicadores do dashboard;
2. implementar chamada e registro de presença por turma;
3. adicionar edição e exclusão de atividades;
4. criar controles visuais de paginação e filtros;
5. ampliar testes dos serviços e telas acadêmicas;
6. integrar recursos de IA somente com contrato, consentimento e rastreabilidade definidos.

## 15 REFERÊNCIAS NORMATIVAS

- README do `LuminiaBack`, usado como padrão de organização documental;
- documentação do contrato implementado nas rotas do backend;
- WCAG 2.2 como referência para evolução de acessibilidade;
- boas práticas do React, TypeScript, Vite e Testing Library.
