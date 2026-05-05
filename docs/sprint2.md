# 📍 Sprint 02 - ProconChatBot 📍

**🗓️ 13/04/2026 à 29/04/2026 🗓️**

<p align="center">
<a href="#objetivo">Objetivo da Sprint</a> | 
<a href="#backlog">Backlog da Sprint</a> | 
<a href="#burndown">Burndown</a> | 
<a href="#arquitetura">Arquitetura de Sistemas</a> | 
<a href="#kanban">Kanban</a> | 
<a href="#review">Sprint Review</a> | 
<a href="#testes">Configuração e Estratégia de Testes</a>
</p>

<br>

🏠 [Voltar para home](../README.md)

---

## 🤝 <a id="objetivo"></a>Objetivo da Sprint

O foco principal desta sprint foi a **Estruturação e Padronização de Software**. Após validar o Core Engine na Sprint 1, nesta etapa estabelecemos as bases sólidas para o Full Stack: definindo arquiteturas robustas para Backend e Frontend, modelagem de dados definitiva, estratégias de segurança e a configuração dos ambientes de testes automatizados para garantir a estabilidade do ProconChatBot.

---

## 🚧 <a id="backlog"></a>Sprint Backlog

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
| 4.1 | Restruturar Projeto | ✅ | [#42](https://github.com/cGuilhermec/ProconChatBot/issues/42) |
| 5.1 | Configurar projeto frontend | ✅ | [#43](https://github.com/cGuilhermec/ProconChatBot/issues/43) |
| 6.1 | Configurar e criar o CRUD e testes backend - Usuario | ✅ | [#44](https://github.com/cGuilhermec/ProconChatBot/issues/44) |
| 6.2 | Configurar e criar o CRUD e testes backend - Procon( Perguntas ) | ✅ | [#45](https://github.com/cGuilhermec/ProconChatBot/issues/45) |
| 6.3 | Configurar e criar o CRUD e testes backend - Feriado | ✅ | [#48](https://github.com/cGuilhermec/ProconChatBot/issues/48) |
| 6.4 | Configurar e criar o CRUD e testes no backend - Agendamento | ✅ | [#50](https://github.com/cGuilhermec/ProconChatBot/issues/50) |
| 6.5 | Integrar Chat (WhatsApp) com o Crud Agendamento | ✅ | [#53](https://github.com/cGuilhermec/ProconChatBot/issues/53) |
| 6.6 | Configurar e criar o CRUD e testes no backend - Pergunta | ✅ | [#54](https://github.com/cGuilhermec/ProconChatBot/issues/54) |
| 6.7 | Configurar e criar o CRUD e testes backend - AUDIT_LOG | ✅ | [#55](https://github.com/cGuilhermec/ProconChatBot/issues/55) |

---

## 📇 <a id="burndown"></a>Burndown Sprint 02

Nesta sprint, o foco foi na fundação técnica, totalizando a queima de **52 Story Points**. O esforço inicial concentrou-se na modelagem e reestruturação para evitar débitos técnicos futuros.

![alt text](caminho_para_seu_grafico_burndown.png)

---

## 🏗️ <a id="arquitetura"></a>Arquitetura de Sistemas

Diferente da Sprint 1 (focada no motor RAG), a Sprint 2 consolidou a arquitetura global do sistema:
* **Backend:** Implementação de uma estrutura modular em Node.js com TypeScript.
* **Frontend:** Configuração do ambiente React para a interface do usuário.
* **Persistência:** Definição do banco de dados e modelagem das entidades (usuários, logs de triagem e histórico de conversas).

---

## 📝 Kanban
![alt text](caminho_para_seu_print_do_kanban.png)

---

## 🎬 <a id="review"></a>Sprint Review

#### O que funcionou bem?
* **Padronização Técnica:** A definição precoce de padrões reduziu a fricção entre front e back.
* **Ambiente de Testes:** A configuração inicial das suites já permite validar as novas rotas.

#### Pontos a melhorar!
* **Esforço de Reestruturação:** A migração de componentes da Sprint 1 levou mais tempo que o previsto.

---

## 🔬 <a id="testes"></a>Configuração e Estratégia de Testes

### 📌 Visão Geral
A estratégia de testes foi desenvolvida para garantir a confiabilidade do ProconChatBot, utilizando o **test runner nativo do Node.js** (`node:test`) e `supertest` para integração.

### 🛠️ Tecnologias Utilizadas
| Ferramenta | Finalidade |
|:---|:---|
| `node:test` | Test runner nativo do Node.js |
| `node:assert` | Asserções para validação |
| `supertest` | Simulação de requisições HTTP |
| `tsx` | Execução de TypeScript nos testes |

### 📁 Estrutura dos Testes
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
├── agendamento/
│   ├── public.test.ts         # Testes de rotas públicas (WhatsApp)
│   ├── validation.test.ts     # Testes de validação (CPF, data, horário)
│   └── admin.test.ts          # Testes de rotas administrativas
├── pergunta/
│   ├── public.test.ts         # Testes de rotas públicas (RAG)
│   ├── admin.test.ts          # Testes de rotas administrativas
│   └── moderation.test.ts     # Testes de moderação (palavras ofensivas)
├── auditLog/
│   └── auditLog.test.ts       # Testes do sistema de auditoria
└── setup.test.ts              # Configuração global
```

### 🚀 Como Executar
```bash
# Executar todos os testes
npm run test:all

# Executar com watch mode
npm run test:watch

# Executar testes do usuário
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