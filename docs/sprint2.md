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
| 6.1 | Configurar testes backend | ✅ | [#44](https://github.com/cGuilhermec/ProconChatBot/issues/44) |
| 6.2 | Configurar testes frontend | ✅ | [#45](https://github.com/cGuilhermec/ProconChatBot/issues/45) |

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

### 🧪 Suítes de Testes Implementadas
| Arquivo | Cobertura | Cenários Validados |
|:---|:---|:---|
| auth.test.ts | Autenticação | Login com sucesso, credenciais inválidas |
| crud.test.ts | CRUD Usuário | Criação, listagem, perfil próprio |
| senha.test.ts | Senha | Primeiro acesso, troca e reset |
| status.test.ts | Ativação | Ativar/desativar usuário |

### 🚀 Como Executar
```bash
# Executar todos os testes
npm run test:all

# Executar com watch mode
npm run test:watch