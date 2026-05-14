<div id="top"></div>

<h1 align="center">📍 Sprint 02 — ProconChatBot</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Sprint-02-blue?style=for-the-badge" alt="Sprint 02">
  <img src="https://img.shields.io/badge/Status-Finalizada-success?style=for-the-badge" alt="Status">
  <img src="https://img.shields.io/badge/Story%20Points-52-orange?style=for-the-badge" alt="Story Points">
</p>

<p align="center">
  <b>🗓️ 13/04/2026 — 29/04/2026</b>
</p>

<p align="center">
  <a href="#-objetivo">Objetivo</a> ·
  <a href="#-backlog">Backlog</a> ·
  <a href="#-burndown">Burndown</a> ·
  <a href="#-arquitetura">Arquitetura</a> ·
  <a href="#-kanban">Kanban</a> ·
  <a href="#-sprint-review">Review</a> ·
  <a href="#-estratégia-de-testes">Testes</a>
</p>

<p align="center">
  🏠 <a href="../README.md">Voltar ao README</a> ·
  📘 <a href="./ARCHITECTURE.md">Arquitetura</a> ·
  ⬅️ <a href="./sprint1.md">Sprint 01</a>
</p>

<br>

---

<br>

## 🎯 Objetivo

O foco principal desta sprint foi a **Estruturação e Padronização de Software**. Após validar o Core Engine na Sprint 1, nesta etapa estabelecemos as bases sólidas para o Full Stack:

- 🏗️ Definir arquiteturas robustas para **Backend** e **Frontend**.
- 🗄️ Modelagem definitiva de dados *(7 entidades principais)*.
- 🔐 Estratégias de **autenticação e segurança** *(JWT + bcrypt + RBAC)*.
- ✅ Configuração dos ambientes de **testes automatizados** para garantir a estabilidade do ProconChatBot.

🔝 [Voltar ao topo](#top)

<br>

---

<br>

## 🚧 Backlog

| ID | Tarefa | Status | Issue |
|:---:|:---|:---:|:---:|
| 1.1 | Definir arquitetura do backend | ✅ | [#24](https://github.com/cGuilhermec/ProconChatBot/issues/24) |
| 1.2 | Definir estrutura de módulos | ✅ | [#25](https://github.com/cGuilhermec/ProconChatBot/issues/25) |
| 1.3 | Escolher tecnologias e versões | ✅ | [#26](https://github.com/cGuilhermec/ProconChatBot/issues/26) |
| 1.4 | Definir padrões de código | ✅ | [#27](https://github.com/cGuilhermec/ProconChatBot/issues/27) |
| 1.5 | Definir estratégia de autenticação | ✅ | [#29](https://github.com/cGuilhermec/ProconChatBot/issues/29) |
| 2.1 | Definir arquitetura do frontend | ✅ | [#30](https://github.com/cGuilhermec/ProconChatBot/issues/30) |
| 2.2 | Escolher biblioteca de UI | ✅ | [#31](https://github.com/cGuilhermec/ProconChatBot/issues/31) |
| 2.3 | Definir padrões de componentes | ✅ | [#34](https://github.com/cGuilhermec/ProconChatBot/issues/34) |
| 2.4 | Planejar integração com backend | ✅ | [#35](https://github.com/cGuilhermec/ProconChatBot/issues/35) |
| 3.1 | Escolher banco de dados | ✅ | [#39](https://github.com/cGuilhermec/ProconChatBot/issues/39) |
| 3.2 | Modelagem de dados | ✅ | [#36](https://github.com/cGuilhermec/ProconChatBot/issues/36) |
| 4.1 | Reestruturar projeto | ✅ | [#42](https://github.com/cGuilhermec/ProconChatBot/issues/42) |
| 5.1 | Configurar projeto frontend | ✅ | [#43](https://github.com/cGuilhermec/ProconChatBot/issues/43) |
| 6.1 | CRUD e testes — **Usuario** | ✅ | [#44](https://github.com/cGuilhermec/ProconChatBot/issues/44) |
| 6.2 | CRUD e testes — **Procon (Perguntas)** | ✅ | [#45](https://github.com/cGuilhermec/ProconChatBot/issues/45) |
| 6.3 | CRUD e testes — **Feriado** | ✅ | [#48](https://github.com/cGuilhermec/ProconChatBot/issues/48) |
| 6.4 | CRUD e testes — **Agendamento** | ✅ | [#50](https://github.com/cGuilhermec/ProconChatBot/issues/50) |
| 6.5 | Integrar Chat (WhatsApp) com o CRUD de Agendamento | ✅ | [#53](https://github.com/cGuilhermec/ProconChatBot/issues/53) |
| 6.6 | CRUD e testes — **Pergunta** | ✅ | [#54](https://github.com/cGuilhermec/ProconChatBot/issues/54) |
| 6.7 | CRUD e testes — **AuditLog** | ✅ | [#55](https://github.com/cGuilhermec/ProconChatBot/issues/55) |

🔝 [Voltar ao topo](#top)

<br>

---

<br>

## 📇 Burndown

O foco foi a **fundação técnica**, totalizando a queima de **52 Story Points**. O esforço inicial concentrou-se na modelagem e reestruturação para evitar débitos técnicos futuros.

![Burndown Sprint 02](caminho_para_seu_grafico_burndown.png)

🔝 [Voltar ao topo](#top)

<br>

---

<br>

## 🏗️ Arquitetura

Diferente da Sprint 1 *(focada no motor RAG)*, a Sprint 2 consolidou a arquitetura global do sistema:

| Camada | Stack | Entregue |
|---|---|---|
| **Backend Admin** | Node.js + TypeScript + Express + Prisma | ✅ |
| **Backend Chatbot** | Node.js + whatsapp-web.js + Ollama | ✅ |
| **Frontend** | React 19 + Vite 8 + React Router 7 | ✅ |
| **Persistência** | PostgreSQL 18 + pgvector | ✅ |
| **Autenticação** | JWT + bcrypt + RBAC (4 papéis) | ✅ |

> 📘 Para o detalhamento técnico completo, veja [docs/ARCHITECTURE.md](./ARCHITECTURE.md).

🔝 [Voltar ao topo](#top)

<br>

---

<br>

## 📝 Kanban

![Kanban Sprint 02](caminho_para_seu_print_do_kanban.png)

🔝 [Voltar ao topo](#top)

<br>

---

<br>

## 🎬 Sprint Review

### ✅ O que funcionou bem

| Ponto | Detalhe |
|---|---|
| 🧱 **Padronização técnica** | A definição precoce de padrões reduziu a fricção entre front e back. |
| 🧪 **Ambiente de testes** | A configuração inicial das suites já permite validar as novas rotas. |

### ⚠️ Pontos a melhorar

| Ponto | Ação |
|---|---|
| 🔄 **Esforço de reestruturação** | A migração de componentes da Sprint 1 levou mais tempo que o previsto. |

🔝 [Voltar ao topo](#top)

<br>

---

<br>

## 🔬 Estratégia de Testes

### 📌 Visão geral

A estratégia de testes foi desenvolvida para garantir a confiabilidade do ProconChatBot, utilizando o **test runner nativo do Node.js** (`node:test`) e `supertest` para integração.

### 🛠️ Tecnologias

| Ferramenta | Finalidade |
|:---|:---|
| `node:test` | Test runner nativo do Node.js |
| `node:assert` | Asserções para validação |
| `supertest` | Simulação de requisições HTTP |
| `tsx` | Execução de TypeScript nos testes |

### 📁 Estrutura dos testes

```text
src/__tests__/
├── helpers/
│   ├── db.helper.ts           # Helpers para banco de dados
│   └── http.helper.ts         # Helpers para requisições HTTP
├── usuario/
│   ├── auth.test.ts           # Testes de autenticação
│   ├── crud.test.ts           # Testes CRUD do usuário
│   ├── senha.test.ts          # Testes de gerenciamento de senha
│   └── status.test.ts         # Testes de ativação/desativação
├── procon/
│   ├── crud.test.ts           # Testes CRUD do Procon
│   └── status.test.ts         # Testes de ativação/desativação
├── feriado/
│   ├── crud.test.ts           # Testes CRUD do Feriado
│   └── isFeriado.test.ts      # Testes de verificação de feriado
└── setup.test.ts              # Configuração global
```

### 🚀 Como executar

```bash
# Executar todos os testes
npm run test:all

# Executar com watch mode
npm run test:watch

# Executar testes do Usuário
npm run test:usuario

# Executar testes do Procon
npm run test:procon

# Executar testes do Feriado
npm run test:feriado

# Executar testes do Agendamento
npm run test:agendamento

# Executar testes da Pergunta
npm run test:pergunta

# Executar testes do AuditLog
npm run test:auditlog
```

> 💡 Para mais detalhes sobre endpoints e payloads de teste, veja [docs/API.md](./API.md).

🔝 [Voltar ao topo](#top)

<br>

---

<br>

<p align="center">
  ⬅️ <a href="./sprint1.md">Sprint 01</a> · 
  <a href="../README.md">Voltar ao README</a>
</p>

<p align="center"><sub>Documento mantido pela equipe Azimuth do 6º DSM — Fatec / Jacareí 2026.</sub></p>
