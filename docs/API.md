# 🔌 Referência de API

> Documentação completa dos endpoints REST das três APIs do ProconChatBot: **Admin (`:3002`)**, **RAG (`:3000`)** e **Chatbot (`:3001`)**.

🏠 [Voltar ao README](../README.md)


<br>

---

<br>

## 📋 Índice

- [Convenções](#-convenções)
- [Autenticação](#-autenticação)
- [API Administrativa — `:3002`](#-api-administrativa--3002)
  - [Autenticação & Usuários](#-autenticação--usuários)
  - [Procon (Unidades)](#-procon-unidades)
  - [Feriados](#-feriados)
  - [Agendamentos](#-agendamentos)
  - [Perguntas (RAG)](#-perguntas-rag)
  - [Audit Log](#-audit-log)
- [API RAG — `:3000`](#-api-rag--3000)
- [API Chatbot — `:3001`](#-api-chatbot--3001)
- [Códigos de erro comuns](#-códigos-de-erro-comuns)


<br>

---

<br>

## 📐 Convenções

| Item | Valor padrão |
|---|---|
| **Base URL Admin** | `http://localhost:3002` |
| **Base URL RAG** | `http://localhost:3000/api` |
| **Base URL Chatbot** | `http://localhost:3001/api` |
| **Content-Type** | `application/json` |
| **Charset** | `UTF-8` |
| **Idioma das mensagens** | `pt-BR` |

### Envelope de resposta padrão *(Admin)*

```json
{
  "sucesso": true,
  "mensagem": "Operação realizada com sucesso",
  "dados": { ... }
}
```

Em caso de erro:

```json
{
  "sucesso": false,
  "mensagem": "Descrição amigável do erro",
  "erro": "Detalhe técnico (opcional)"
}
```

🔝 [Voltar ao topo](#-referência-de-api)



<br>

---

<br>

## 🔐 Autenticação

A **API Admin** usa **JWT**. Após o login, envie o token no header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> O middleware `AuthMiddleware.authenticateToken` rejeita requisições com `401` (sem token) ou `403` (token inválido).

A **API RAG** e a **API Chatbot** são **públicas** *(uso interno entre serviços)*.

🔝 [Voltar ao topo](#-referência-de-api)



<br>

---

<br>

## 🏢 API Administrativa — `:3002`

Endpoints expostos pelo `ServiceProcon/backend`. Maioria exige JWT, exceto rotas marcadas como 🟢 públicas.

### 🔑 Autenticação & Usuários

| Método | Rota | Auth | Descrição |
|:---:|---|:---:|---|
| `POST` | `/login` | 🟢 | Login com email + senha. Retorna JWT + dados do usuário. |
| `POST` | `/usuario` | 🔒 | Criar novo usuário *(coordenador+)*. |
| `PUT` | `/usuario/:usuarioId` | 🔒 | Atualizar dados de usuário. |
| `PUT` | `/first-access` | 🔒 | Trocar senha no primeiro acesso. |
| `PUT` | `/mudar-senha` | 🔒 | Trocar senha (precisa da atual). |
| `PUT` | `/resetar-senha/:usuarioId` | 🔒 | Coordenador reseta a senha de outro. |
| `PUT` | `/desativar/:usuarioId` | 🔒 | Desativar usuário. |
| `PUT` | `/ativar/:usuarioId` | 🔒 | Reativar usuário. |
| `GET` | `/usuarios` | 🔒 | Listar usuários *(escopo Procon)*. |
| `GET` | `/usuario/:usuarioId` | 🔒 | Buscar usuário por ID. |
| `GET` | `/me` | 🔒 | Dados do usuário autenticado. |

#### Exemplo — Login

> Os valores abaixo são apenas ilustrativos. Substitua pelos seus dados de teste.

```http
POST /login
Content-Type: application/json

{
  "email": "<seu_email>",
  "senha": "<sua_senha>"
}
```

**Resposta `200`:**

```json
{
  "sucesso": true,
  "mensagem": "Login realizado com sucesso",
  "token": "<jwt_token_aqui>",
  "usuario": {
    "id": 1,
    "nome": "<nome do usuário>",
    "email": "<email do usuário>",
    "role": "DEV",
    "procon_id": 1,
    "primeiro_acesso": true
  }
}
```

🔝 [Voltar ao topo](#-referência-de-api)


---

### 🏢 Procon (Unidades)

| Método | Rota | Auth | Descrição |
|:---:|---|:---:|---|
| `GET` | `/procons/whatsapp/:whatsapp_number` | 🟢 | Buscar unidade pelo nº do WhatsApp *(usado pelo bot)*. |
| `GET` | `/procons-ativos` | 🟢 | Lista todos os PROCONs ativos *(versão pública)*. |
| `POST` | `/procon` | 🔒 | Criar nova unidade *(DIRETOR+)*. |
| `GET` | `/procons` | 🔒 | Listar todas as unidades. |
| `GET` | `/procon/:id` | 🔒 | Buscar unidade por ID. |
| `PUT` | `/procon/:id` | 🔒 | Atualizar unidade. |
| `PUT` | `/procon/:id/desativar` | 🔒 | Desativar unidade. |
| `PUT` | `/procon/:id/ativar` | 🔒 | Reativar unidade. |
| `DELETE` | `/procon/:id` | 🔒 | Deletar unidade *(DIRETOR+)*. |

🔝 [Voltar ao topo](#-referência-de-api)


---

### 📅 Feriados

| Método | Rota | Auth | Descrição |
|:---:|---|:---:|---|
| `GET` | `/feriados` | 🟢 | Listar feriados *(filtros por Procon e ano)*. |
| `GET` | `/feriado/verificar` | 🟢 | Verifica se uma data é feriado. |
| `GET` | `/feriado/:id` | 🟢 | Buscar feriado por ID. |
| `POST` | `/feriado` | 🔒 | Criar feriado *(coordenador+)*. |
| `PUT` | `/feriado/:id` | 🔒 | Atualizar feriado. |
| `DELETE` | `/feriado/:id` | 🔒 | Excluir feriado. |

#### Exemplo — Verificar feriado

```http
GET /feriado/verificar?procon_id=1&data=2026-12-25
```

```json
{
  "sucesso": true,
  "feriado": true,
  "dados": {
    "FERIADO_ID": 3,
    "nome": "Natal",
    "recorrente": true
  }
}
```

🔝 [Voltar ao topo](#-referência-de-api)


---

### 📆 Agendamentos

Rotas dividas entre **públicas** *(usadas pelo bot WhatsApp)* e **administrativas** *(painel)*.

| Método | Rota | Auth | Descrição |
|:---:|---|:---:|---|
| `GET` | `/agendamento/dias-disponiveis` | 🟢 | Lista próximos N dias com vagas. |
| `GET` | `/agendamento/horarios-disponiveis` | 🟢 | Horários livres de um dia. |
| `POST` | `/agendamento` | 🟢 | Cria agendamento *(bot)*. |
| `GET` | `/agendamento/buscar-por-cpf` | 🟢 | Lista agendamentos de um CPF. |
| `DELETE` | `/agendamento/:id` | 🟢 | Cancelar agendamento. |
| `GET` | `/admin/agendamentos` | 🔒 | Listar todos *(escopo Procon do user)*. |
| `GET` | `/admin/agendamento/:id` | 🔒 | Detalhes do agendamento. |
| `PUT` | `/admin/agendamento/:id/status` | 🔒 | Atualiza status manualmente. |

#### Exemplo — Criar agendamento

> Use **dados fictícios** para testes. Não use CPFs/telefones reais em ambientes de desenvolvimento que possam ser commitados ou logados.

```http
POST /agendamento
Content-Type: application/json

{
  "procon_id": 1,
  "nome_usuario": "<nome do consumidor>",
  "cpf": "<cpf_apenas_digitos>",
  "telefone": "<telefone_com_ddd>",
  "data_agendamento": "2026-06-10",
  "horario_agendamento": "09:30",
  "observacao": "<motivo do agendamento>"
}
```

```json
{
  "sucesso": true,
  "mensagem": "Agendamento criado com sucesso",
  "dados": { "id": 42 }
}
```

#### Status possíveis

```text
PENDENTE → CONFIRMADO → COMPARECEU
                     ↘ FALTOU
                     ↘ CANCELADO
```

🔝 [Voltar ao topo](#-referência-de-api)


---

### ❓ Perguntas (RAG)

A tabela `pergunta` é a **base de conhecimento** do RAG, com suporte a moderação e auditoria.

| Método | Rota | Auth | Descrição |
|:---:|---|:---:|---|
| `POST` | `/perguntas/buscar` | 🟢 | Busca semântica *(usado pelo bot)*. |
| `GET` | `/perguntas` | 🟢 | Listar perguntas aprovadas e ativas. |
| `GET` | `/pergunta/:id` | 🟢 | Detalhes da pergunta. |
| `POST` | `/pergunta` | 🔒 | Criar nova pergunta *(passa por moderação)*. |
| `GET` | `/admin/perguntas` | 🔒 | Listar TODAS as perguntas. |
| `GET` | `/admin/perguntas/pendentes` | 🔒 | Listar pendentes de revisão. |
| `PUT` | `/pergunta/:id` | 🔒 | Atualizar pergunta *(gera audit_log)*. |
| `PUT` | `/admin/pergunta/:id/revisar` | 🔒 | Coordenador aprova/reprova. |
| `PUT` | `/pergunta/:id/ativar` | 🔒 | Ativar pergunta. |
| `PUT` | `/pergunta/:id/desativar` | 🔒 | Desativar pergunta. |
| `DELETE` | `/pergunta/:id` | 🔒 | Excluir pergunta. |

#### Exemplo — Busca RAG

```http
POST /perguntas/buscar
Content-Type: application/json

{
  "procon_id": 1,
  "pergunta": "Estão cobrando um seguro no meu cartão"
}
```

```json
{
  "sucesso": true,
  "resultados": [
    {
      "Pergunta_ID": 1,
      "tema": "cobranca_indevida",
      "pergunta": "Cobrança de seguro não contratado",
      "resposta": "Você tem direito à devolução em dobro do valor cobrado indevidamente...",
      "base_legal": ["Art. 42, CDC", "Art. 6º, III, CDC"],
      "documentos": ["RG", "CPF", "Faturas com a cobrança"],
      "observacao": "Solicite primeiro a devolução amigável ao banco."
    }
  ]
}
```

#### Status de moderação

| Status | Significado |
|---|---|
| `APROVADO` | Disponível para o bot consultar. |
| `PENDENTE_REVISAO` | Aguardando coordenador. |
| `REPROVADO` | Não entra na base, sem violação grave. |
| `BLOQUEADO` | Violação grave (palavras ofensivas detectadas). |

🔝 [Voltar ao topo](#-referência-de-api)


---

### 📝 Audit Log

| Método | Rota | Auth | Descrição |
|:---:|---|:---:|---|
| `GET` | `/meus-logs` | 🔒 | Logs do próprio usuário. |
| `GET` | `/admin/logs` | 🔒 | Todos os logs *(COORDENADOR+)*. |
| `GET` | `/admin/logs/acao/:acao` | 🔒 | Filtrar por tipo de ação. |

Estrutura de cada log:

```json
{
  "id": 1024,
  "usuario_id": 3,
  "pergunta_id": 17,
  "acao": "UPDATE_PERGUNTA",
  "dados_anteriores": { "resposta": "Texto antigo..." },
  "dados_novos": { "resposta": "Texto atualizado..." },
  "ip_address": "192.168.0.10",
  "user_agent": "Mozilla/5.0 ...",
  "created_at": "2026-05-14T10:30:00Z"
}
```

🔝 [Voltar ao topo](#-referência-de-api)



<br>

---

<br>

## 🧠 API RAG — `:3000`

Exposta pelo `ServiceChatbot/backend`. Endpoints técnicos da busca RAG *(usados pelo time durante desenvolvimento ou ferramentas externas)*.

| Método | Rota | Descrição |
|:---:|---|---|
| `POST` | `/api/perguntar` | Consultar o RAG diretamente. |
| `GET` | `/api/temas` | Listar todos os temas indexados. |
| `GET` | `/api/tema/:id` | Buscar tema por ID. |
| `GET` | `/api/stats` | Estatísticas de uso. |
| `GET` | `/api/health` | Healthcheck. |

#### Exemplo — `/api/perguntar`

```bash
curl -X POST http://localhost:3000/api/perguntar \
  -H "Content-Type: application/json" \
  -d '{
    "pergunta": "Cobraram seguro que eu não pedi",
    "usarLlama": true
  }'
```

```json
{
  "sucesso": true,
  "resposta": "Você tem direito à devolução em dobro...",
  "confianca": "Alta",
  "score": 0.85,
  "metodo": "banco_dados",
  "base_legal": ["Art. 42, CDC"],
  "documentos": ["RG", "CPF", "Faturas"],
  "geradoPorIA": false
}
```

🔝 [Voltar ao topo](#-referência-de-api)



<br>

---

<br>

## 💬 API Chatbot — `:3001`

Endpoints REST para integração externa com o chatbot *(útil para apps web ou outras interfaces que não WhatsApp)*.

| Método | Rota | Descrição |
|:---:|---|---|
| `POST` | `/api/chat` | Enviar mensagem ao chatbot e receber resposta. |
| `GET` | `/api/tema/:id` | Buscar tema por ID. |
| `GET` | `/api/stats` | Estatísticas. |

#### Exemplo — `/api/chat`

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "mensagem": "Como cancelar meu plano de telefone?",
    "historico": []
  }'
```

```json
{
  "sucesso": true,
  "resposta": "📌 *Cancelamento de planos de telefone*\n\nVocê pode cancelar...",
  "confianca": "Alta",
  "score": 0.78
}
```

🔝 [Voltar ao topo](#-referência-de-api)



<br>

---

<br>

## ⚠️ Códigos de erro comuns

| Código | Significado | Causa típica |
|:---:|---|---|
| `400` | Bad Request | Payload inválido, campos obrigatórios ausentes. |
| `401` | Unauthorized | Token JWT ausente. |
| `403` | Forbidden | Token inválido, expirado ou sem permissão. |
| `404` | Not Found | Recurso não existe no banco. |
| `409` | Conflict | Conflito *(ex.: agendamento duplicado, email já cadastrado)*. |
| `422` | Unprocessable Entity | Dados semanticamente inválidos *(ex.: CPF mal formado)*. |
| `500` | Internal Server Error | Erro inesperado no servidor *(verifique logs)*. |

🔝 [Voltar ao topo](#-referência-de-api)



<br>

---

<br>

## 🧪 Testando localmente

> ⚠️ Substitua `<seu_email>` e `<sua_senha>` pelas credenciais que você criou no passo 9 do [guia de instalação](./INSTALLATION.md#9-criar-primeiro-usuário-admin). Nunca embuta credenciais reais em scripts versionados.

```bash
# Healthcheck rápido
curl http://localhost:3000/api/health
curl http://localhost:3002/procons-ativos

# Login + obter token (lê senha sem expor no histórico do shell)
read -s -p "Senha: " SENHA && echo
TOKEN=$(curl -s -X POST http://localhost:3002/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"<seu_email>\",\"senha\":\"$SENHA\"}" \
  | jq -r .token)
unset SENHA

# Chamada autenticada
curl http://localhost:3002/me \
  -H "Authorization: Bearer $TOKEN"
```

🔝 [Voltar ao topo](#-referência-de-api)



<br>

---

<br>

## 🔗 Veja também

- [📘 README — Documento central](../README.md)
- [📐 Arquitetura detalhada](./ARCHITECTURE.md)
- [⚙️ Guia de instalação](./INSTALLATION.md)
- [⚛️ Documentação do frontend](./FRONTEND.md)
- [💬 Fluxo do chatbot](./WHATSAPP.md)
- [🧠 Sistema RAG](./RAG.md)
- [🗄️ Modelagem do banco](./schema.md)

---

<p align="center"><sub>Documento mantido pela equipe Azimuth do 6º DSM — Fatec / Jacareí 2026.</sub></p>
