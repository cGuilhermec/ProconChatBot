# 🤖 ProconChatBot - Jacareí (RAG & LLM)

<p align="center">
  <img src="https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow?style=for-the-badge" alt="Status">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/RAG-AI-orange?style=for-the-badge" alt="RAG">
</p>

<br>

<p align="center">
<a href="#sobre">Sobre o Projeto</a> | 
<a href="#backlog">Product Backlog</a> | 
<a href="#sprints">Entregas de Sprints</a> | 
<a href="#tecnologias">Tecnologias</a> | 
<a href="#equipe">Nossa Equipe</a> | 
<a href="#uso">Como Usar</a> | 
<a href="./backend/README.md">📦 Backend</a> | 
<a href="#arquitetura">Arquitetura & DB</a> |
</p>

<br>

## 📖 <a id="sobre"></a>Sobre o Projeto

O **ProconChatBot** é um sistema de atendimento inteligente desenvolvido para o **PROCON de Jacareí**. O projeto visa automatizar a triagem inicial de reclamações de consumo utilizando a técnica de **RAG (Retrieval-Augmented Generation)**. 

Diferente de chatbots comuns, este sistema utiliza processamento de linguagem natural (NLP) para buscar fundamentos jurídicos reais em uma base de conhecimento estruturada e, em seguida, utiliza uma **LLM Open Source** para gerar uma resposta explicativa e humanizada via WhatsApp.

**Principais Funcionalidades:**
* Atendimento automatizado via WhatsApp.
* Busca semântica em base de dados de direitos do consumidor.
* Identificação de fluxos decisórios baseados na Lei Federal e normas do PROCON.
* Geração de respostas fundamentadas com auxílio de IA.

🔝 [Voltar ao topo](#top)

---

## 🎯 <a id="backlog"></a>Product Backlog

O desenvolvimento está estruturado em épicos focados na experiência do cidadão e na precisão jurídica das respostas.

### Épico 1 – Integração com WhatsApp
| ID | User Story | Prioridade |
|----|------------|------------|
| PB01 | Como cidadão, quero enviar mensagens ao chatbot via WhatsApp para receber orientações. | Alta |
| PB02 | Como sistema, preciso receber mensagens da API e iniciar uma sessão de conversa. | Alta |

### Épico 3 – Sistema RAG (Recuperação de Conhecimento)
| ID | User Story | Prioridade |
|----|------------|------------|
| PB09 | Como sistema, devo indexar documentos e fluxos decisórios do PROCON. | Alta |
| PB10 | Como sistema, devo recuperar informações relevantes da base para o usuário. | Alta |

### Épico 4 – Geração de respostas com LLM
| ID | User Story | Prioridade |
|----|------------|------------|
| PB13 | Como cidadão, quero receber explicações claras sobre meus direitos. | Alta |
| PB14 | Como sistema, devo gerar respostas explicativas utilizando um modelo de linguagem. | Alta |

> 📍 *O Backlog completo com os 7 Épicos pode ser acessado na pasta de documentação do projeto.*

🔝 [Voltar ao topo](#top)

---

## 📅 <a id="sprints"></a>Entregas de Sprints

Cada sprint foca em uma evolução do motor de busca e na integração da inteligência artificial.

| Sprint | Previsão de Entrega | Status | Histórico |
|:---:|:---:|:---:|:---:|
| 1 | 25/03/2026 | ✅ Finalizada | [Ver Relatório](./docs/sprint1.md) |
| 2 | 15/04/2026 | 🚧 Em Progresso | [Ver Relatório](./docs/sprint2.md) |
| 3 | 10/05/2026 | [-] Não Iniciado | - |

**Legenda:**
✅ Finalizada | 🚧 Em Progresso | [-] Não iniciado

🔝 [Voltar ao topo](#top)

---

## 🛠️ <a id="tecnologias"></a>Tecnologias

O projeto utiliza o ecossistema robusto de JavaScript para garantir performance e facilidade de manutenção:

| Categoria | Tecnologia |
|---|---|
| **Back-end** | Node.js, TypeScript, Express |
| **IA / RAG** | Fuse.js (Fuzzy Search), Natural (NLP/Stemming) |
| **Integração** | Axios (Consumo de API LLM), WhatsApp API |
| **Testes** | Node Test Runner, TSX, Vitest |
| **DevOps** | Git, GitHub, Nodemon |

🔝 [Voltar ao topo](#top)

---

## 📚 <a id="documentacao-rag"></a>Documentação do Sistema RAG

Para garantir que o Chatbot forneça informações jurídicas precisas e evite "alucinações", implementamos um motor de **RAG (Retrieval-Augmented Generation)** customizado para o Procon.

### Componentes Principais:
* **Indexação Semântica:** Mapeamento de termos-chave e raízes de palavras (Stemming).
* **Fuzzy Match:** Busca difusa com `Fuse.js` para tolerância a erros ortográficos dos usuários.
* **Score de Confiança:** Sistema de pontuação que classifica a precisão da resposta entre Baixa, Média e Alta.

> 📄 **Confira o guia técnico detalhado:** [Documentação de Implementação RAG](./docs/RAG.md)

🔝 [Voltar ao topo](#top)

---

## 👥 <a id="equipe"></a>Nossa Equipe

| Função | Nome |
|---|---|
| **Scrum Master / Dev** | Jackson Rodrigo Costa Machado |
| **Project Owner** | Ligia Ribeiro |
| **Dev Team** | Guilherme Carvalho |
| **Dev Team** | Gustavo Carvalho |


🔝 [Voltar ao topo](#top)

---

## 🚀 <a id="uso"></a>Como Executar o Projeto

```bash
# 1. Clone o repositório
git clone [https://github.com/cGuilhermec/ProconChatBot.git](https://github.com/cGuilhermec/ProconChatBot.git)

# 2. Acesse o diretório
cd ProconChatBot

# 3. Instale as dependências
npm install

# 4. Execute os testes automatizados (RAG & LLM)
npm run test:all

# 5. Inicie o servidor em modo desenvolvimento
npm run dev
...
```

> 📦 Para detalhes completos sobre a API, RAG, comandos e troubleshooting, consulte a
> [**Documentação do Backend**](./backend/README.md).

---

## 🏗️ <a id="arquitetura"></a>Arquitetura & Banco de Dados

O projeto segue o padrão **MVC com Camada de Model Ativa**, garantindo separação clara entre regras de negócio e infraestrutura.

### 🗄️ Estrutura de Dados (PostgreSQL 18)
Optamos pelo **PostgreSQL** com a extensão **pgvector** para suportar nativamente as operações de IA:
* **Busca Vetorial:** Armazenamento de *embeddings* diretamente no banco para o sistema RAG.
* **Alta Performance:** Otimizado para consultas complexas e grandes volumes de dados jurídicos.
* **Escalabilidade:** Pronto para crescimento horizontal sem custos de licenciamento.

### 🛠️ Backend & ORM
* **ORM Prisma:** Utilizamos o Prisma (v7) como fonte da verdade, garantindo *Type Safety* nativo e migrações automatizadas.
* **Camadas do Sistema:**
    * **Controllers:** Orquestração de entrada e saída (HTTP).
    * **Services:** Onde reside toda a lógica de negócio e integração com LLMs.
    * **Models:** Abstração de dados e consultas via Prisma.

> 📄 **Confira o detalhamento técnico:** [Documentação de Banco de Dados e Decisões Técnicas](./backend/DB.md)

> 🗄️ **Confira a Modelagem:** [Modelagem do Banco de Dados (Dicionário)](./docs/database/SCHEMA.md)

🔝 [Voltar ao topo](#top)