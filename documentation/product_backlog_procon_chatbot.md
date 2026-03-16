# Product Backlog – Chatbot PROCON via WhatsApp (com RAG)

Projeto: Chatbot para orientação ao consumidor do PROCON de Jacareí via WhatsApp.

Arquitetura: Utilização de **RAG (Retrieval-Augmented Generation)** para recuperar informações da base de decisões do PROCON e gerar respostas explicativas com **LLM**.

<br>

<p align="center">
<a href="#epico1">Épico 1</a> | <a href="#epico2">Épico 2</a> | <a href="#epico3">Épico 3</a> | <a href="#epico4">Épico 4</a> | <a href="#epico5">Épico 5</a> | <a href="#epico6">Épico 6</a> | <a href="#epico7">Épico 7</a>
</p>

<br>


<br>
<br>

# <a id="epico1"></a>Épico 1 – Integração com WhatsApp

| ID | User Story | Prioridade |
|----|------------|------------|
| PB01 | Como cidadão, quero enviar mensagens ao chatbot via WhatsApp para receber orientações sobre problemas de consumo. | Alta |
| PB02 | Como sistema, preciso receber mensagens da API do WhatsApp e iniciar uma sessão de conversa. | Alta |
| PB03 | Como sistema, preciso identificar o usuário e manter o contexto da conversa. | Alta |
| PB04 | Como sistema, devo enviar respostas automaticamente para o usuário no WhatsApp. | Alta |

---

<br>
<br>

# <a id="epico2"></a>Épico 2 – Fluxos de decisão do PROCON

| ID | User Story | Prioridade |
|----|------------|------------|
| PB05 | Como cidadão, quero responder perguntas guiadas para identificar meu problema de consumo. | Alta |
| PB06 | Como sistema, devo navegar pelos fluxos decisórios fornecidos pelo PROCON. | Alta |
| PB07 | Como sistema, devo apresentar opções claras e numeradas ao usuário. | Alta |
| PB08 | Como sistema, devo determinar o próximo passo com base na resposta do usuário. | Alta |

---

<br>
<br>

# <a id="epico3"></a>Épico 3 – Sistema RAG (Recuperação de Conhecimento)

| ID | User Story | Prioridade |
|----|------------|------------|
| PB09 | Como sistema, devo indexar documentos e fluxos decisórios do PROCON em uma base vetorial. | Alta |
| PB10 | Como sistema, devo recuperar informações relevantes da base para responder perguntas do usuário. | Alta |
| PB11 | Como sistema, devo enviar o contexto recuperado para o modelo de linguagem (LLM). | Alta |
| PB12 | Como sistema, devo garantir que a resposta esteja alinhada com as regras e diretrizes do PROCON. | Alta |

---

<br>
<br>

# <a id="epico4"></a>Épico 4 – Geração de respostas com LLM

| ID | User Story | Prioridade |
|----|------------|------------|
| PB13 | Como cidadão, quero receber explicações claras sobre meus direitos como consumidor. | Alta |
| PB14 | Como sistema, devo gerar respostas explicativas utilizando um modelo de linguagem. | Alta |
| PB15 | Como sistema, devo informar que a resposta possui caráter orientativo e não substitui atendimento oficial. | Alta |
| PB16 | Como sistema, devo indicar quando uma resposta foi gerada com auxílio de inteligência artificial. | Média |

---

<br>
<br>

# <a id="epico5"></a>Épico 5 – Registro e análise de interações

| ID | User Story | Prioridade |
|----|------------|------------|
| PB17 | Como administrador, quero registrar as conversas realizadas com o chatbot. | Média |
| PB18 | Como administrador, quero identificar quais fluxos de atendimento são mais utilizados. | Média |
| PB19 | Como administrador, quero exportar relatórios de uso do sistema. | Baixa |

---

<br>
<br>

# <a id="epico6"></a>Épico 6 – Segurança e LGPD

| ID | User Story | Prioridade |
|----|------------|------------|
| PB20 | Como sistema, devo proteger os dados pessoais dos usuários conforme a LGPD. | Alta |
| PB21 | Como sistema, devo anonimizar dados sensíveis utilizados em análises. | Média |
| PB22 | Como administrador, quero garantir acesso seguro ao painel administrativo. | Média |

---

<br>
<br>

# <a id="epico7"></a>Épico 7 – DevOps e Qualidade

| ID | User Story | Prioridade |
|----|------------|------------|
| PB23 | Como desenvolvedor, quero versionar o código em um repositório Git. | Alta |
| PB24 | Como equipe, queremos pipeline de CI/CD para automatizar builds e deploys. | Média |
| PB25 | Como equipe, queremos testes automatizados para garantir qualidade do sistema. | Média |
| PB26 | Como equipe, queremos documentação técnica mínima do sistema. | Média |