# Luminia

Plataforma educacional acessível para apoiar professores e alunos com organização de atividades, conteúdos, feedbacks e recursos preparados para IA.

## Sobre o projeto

O **Luminia** é um frontend de uma plataforma educacional com foco em ensino, aprendizagem, acessibilidade e inclusão. A interface foi criada com inspiração em um protótipo visual do Figma e organiza experiências separadas para professores e alunos.

A proposta é oferecer uma navegação clara para que professores acompanhem turmas, atividades, correções e presença, enquanto alunos acessam conteúdos, cronograma, boletim, atividades e feedbacks. O projeto também considera estudantes neurodivergentes ao priorizar textos objetivos, leitura simples, contraste visual e preparação para recursos de leitura em voz alta.

## Objetivo do MVP

Esta versão inicial entrega um MVP navegável do frontend da Luminia, com dados mockados e telas principais para demonstrar o fluxo do produto em um contexto de hackathon.

O projeto está em evolução e foi estruturado para receber futuras integrações com backend, autenticação real, persistência de dados e recursos de IA para apoio pedagógico.

## Funcionalidades

### Geral

- Tela inicial de apresentação da plataforma.
- Acesso separado para professor e aluno.
- Navegação inferior por abas, pensada para experiência mobile first.
- Interface com cards, botões grandes, textos claros e hierarquia visual simples.
- Dados mockados para simular professores, alunos, turmas, conteúdos, atividades, correções, notas e cronograma.

### Área do professor

- Dashboard com resumo de atividades, correções, conteúdos e turmas.
- Atalhos para criar atividade, publicar conteúdo e ver correções.
- Visualização de atividades antigas e atuais.
- Formulário para criar atividade.
- Lista e detalhe de conteúdos publicados.
- Formulário para publicar novo conteúdo.
- Área de correções organizada por turma.
- Tela de correção com resposta do aluno, nota sugerida pela IA, nota do professor, diferença entre notas, comentários e pontos de estudo.
- Perfil do professor com nome, data de nascimento, matérias e turmas atribuídas.
- Detalhe da turma com lista de presença, notas, comentários e histórico de atividades.

### Área do aluno

- Dashboard com próxima aula, atividades pendentes, última nota e novo feedback.
- Lista e detalhe de conteúdos publicados pelos professores.
- Lista de atividades com status e tela de envio de resposta.
- Feedback do aluno com comentário do professor, feedback da IA, pontos para estudar e conteúdos relacionados.
- Botões para adaptar feedback da IA em versões simples, resumida e detalhada.
- Perfil do aluno com dados pessoais, matérias em andamento, boletim, cronograma do dia e professores por matéria.

### Acessibilidade e leitura

- Botões visuais de **Ouvir texto** e **Ouvir feedback** em conteúdos, enunciados, feedbacks e pontos de estudo.
- Interface preparada para futura integração com Web Speech API, Expo Speech ou recursos nativos de acessibilidade.
- Ícones acompanhados de texto.
- Foco em textos legíveis, navegação simples e contraste adequado.

## Tecnologias utilizadas

As tecnologias abaixo foram identificadas nos arquivos reais do projeto:

| Tecnologia | Uso no projeto |
| --- | --- |
| React | Construção da interface em componentes. |
| TypeScript/TSX | Arquivos `.tsx` para componentes e telas. |
| Vite | Build tool e servidor de desenvolvimento. |
| Tailwind CSS | Utilitários de estilo e tema visual. |
| React Router | Rotas e navegação entre telas. |
| Lucide React | Ícones da interface. |
| Radix UI | Dependências de componentes acessíveis presentes no projeto. |
| Material UI | Dependências `@mui/*` presentes no projeto. |
| pnpm | Gerenciador de pacotes usado pelo lockfile e workspace. |

## Estrutura de pastas

Estrutura principal do repositório:

```text
.
├── guidelines/
│   └── Guidelines.md
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── components/
│   │   └── data/
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
└── ATTRIBUTIONS.md
```

### Principais diretórios e arquivos

| Caminho | Descrição |
| --- | --- |
| `src/main.tsx` | Ponto de entrada da aplicação React. |
| `src/app/App.tsx` | Configuração das rotas, layouts e navegação inferior. |
| `src/app/components/` | Componentes e telas principais do professor, aluno, login, feedback da IA e UI reutilizável. |
| `src/app/data/mockData.ts` | Dados mockados usados para simular o MVP. |
| `src/styles/` | Arquivos globais de estilo, tema, fontes e Tailwind CSS. |
| `src/imports/` | Imagens importadas para o projeto. |
| `guidelines/Guidelines.md` | Orientações auxiliares do projeto/design. |
| `vite.config.ts` | Configuração do Vite, plugins e alias. |
| `package.json` | Dependências e scripts disponíveis. |
| `pnpm-lock.yaml` | Lockfile do pnpm para instalação reproduzível. |

## Como executar localmente

Pré-requisitos:

- Node.js instalado.
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

```text
http://localhost:5173/
```

Gere a build de produção:

```bash
pnpm build
```

## Variáveis de ambiente

Nesta versão do projeto, não foram identificadas variáveis de ambiente obrigatórias, arquivos `.env.example` ou uso de variáveis como `VITE_` no código.

Caso integrações futuras sejam adicionadas, recomenda-se criar um arquivo `.env.example` documentando as chaves necessárias.

## Scripts disponíveis

Scripts reais definidos no `package.json`:

| Comando | Descrição |
| --- | --- |
| `pnpm dev` | Inicia o servidor de desenvolvimento com Vite. |
| `pnpm build` | Gera a build de produção usando Vite. |

## Boas práticas aplicadas

- Componentização de telas e elementos reutilizáveis.
- Separação entre rotas, componentes, dados mockados e estilos.
- Interface mobile first, adequada para demonstração rápida de MVP.
- Organização visual alinhada ao protótipo criado no Figma.
- Navegação simples para professor e aluno.
- Cards e botões com tamanhos confortáveis para toque.
- Textos em português do Brasil e com linguagem clara.
- Estrutura preparada para evolução com API, autenticação e dados reais.
- Uso de dados mockados centralizados para facilitar substituição por serviços reais.

## Acessibilidade

O Luminia foi pensado para ser simples, legível e acessível. Nesta versão, o frontend considera:

- Bom contraste entre fundo, texto e botões principais.
- Textos objetivos e fáceis de entender.
- Navegação por abas simples e previsível.
- Ícones acompanhados de rótulos textuais.
- Botões grandes e áreas de toque confortáveis.
- Estados de foco em elementos interativos.
- Recursos visuais de leitura, como **Ouvir texto** e **Ouvir feedback**.
- Estrutura preparada para melhorias futuras com leitores de tela e leitura em voz alta.

Melhorias futuras recomendadas:

- Auditoria com ferramentas como Lighthouse e axe.
- Testes com leitores de tela.
- Validação completa de navegação por teclado.
- Implementação real de síntese de voz.
- Preferências de tamanho de fonte e redução de movimento.

## Próximos passos

- Integrar com backend.
- Implementar autenticação real para professor e aluno.
- Persistir dados de usuários, turmas, atividades, notas e feedbacks.
- Conectar recursos de IA para correção assistida e adaptação de explicações.
- Adicionar testes automatizados.
- Criar fluxo real de publicação e envio de atividades.
- Melhorar validações de formulários.
- Expandir recursos de acessibilidade.
- Configurar deploy.
- Criar documentação de arquitetura conforme o MVP evoluir.

## Status do projeto

Projeto em desenvolvimento como **MVP para hackathon**.

## Créditos

Projeto desenvolvido para fins acadêmicos/hackathon.

Nome do projeto: **Luminia**.

O bundle inicial veio de um protótipo do Figma Community: `Luminiaprototicoapp (Community)`.

