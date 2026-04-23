# Documentação de Decisão Tecnológica: PostgreSQL para ProconChatBot

Este documento detalha os fundamentos técnicos e financeiros para a escolha do PostgreSQL como o banco de dados central do sistema ProconChatBot, focado em tecnologias de IA e RAG (Retrieval-Augmented Generation).

## 📋 Status do Processo de Decisão
- [x] Analisar requisitos funcionais e não funcionais
- [x] Testar compatibilidade com bibliotecas de LLM
- [x] Verificar escalabilidade para grandes volumes de dados jurídicos
- [x] Documentar decisão técnica

---

## 1. Justificativa Técnica: O PostgreSQL como "AI-Ready"

Com base nas tendências de mercado de 2026, o PostgreSQL consolidou-se como o padrão de ouro para aplicações de Inteligência Artificial devido à sua flexibilidade.

### 1.1 Suporte Nativo a Busca Vetorial (RAG)
Diferente de soluções que exigem um banco de vetores separado (como Pinecone ou Milvus), a extensão **pgvector** permite:
- Armazenar *embeddings* (vetores) na mesma tabela dos dados relacionais.
- Realizar buscas por similaridade de cosseno ou distância euclidiana com alta performance.
- Manter a consistência ACID em operações que envolvem tanto metadados quanto vetores.

### 1.2 Maturidade em Consultas Complexas
Como o projeto utiliza IA para interpretar demandas de usuários, é comum a necessidade de consultas SQL dinâmicas e complexas. O PostgreSQL supera o MySQL em:
- **CTEs (Common Table Expressions) e Window Functions:** Essenciais para relatórios analíticos de atendimentos.
- **Otimizador de Consultas:** Melhor processamento de joins múltiplos, comum em bases de dados normalizadas de órgãos públicos.

### 1.3 Consolidação da Stack (Eficiência Operacional)
O PostgreSQL atua como um "canivete suíço", permitindo centralizar:
- **Dados Transacionais:** Histórico de chats e cadastros.
- **Documentos RAG:** Armazenamento de normas e leis do PROCON.
- **Busca Textual (Full-Text Search):** Busca por palavras-chave com suporte nativo a dicionários em português.

---

## 2. Análise de Custo e Performance

### 2.1 Eficiência de Recursos
O PostgreSQL 18 introduziu melhorias significativas em workloads de I/O, entregando até **3x mais performance em operações I/O-bound**. Para o ProconChatBot, isso significa:
- Menor latência na recuperação de documentos para o chatbot.
- Capacidade de rodar em instâncias com hardware mais modesto por mais tempo, adiando custos de *upsize*.

### 2.2 Estimativa de Custos de Hospedagem (Valores Mensais)

Considerando um ambiente de produção inicial, estas são as projeções baseadas no mercado atual:

| Provedor | Instância Sugerida (Managed) | Custo Estimado (USD) | Observações |
| :--- | :--- | :--- | :--- |
| **Digital Ocean** | Basic Node (1GB RAM / 1 vCPU) | ~$15.00 | Ideal para MVP e testes iniciais. |
| **AWS RDS / GCP** | db.t4g.small (2GB RAM) | ~$25.00 - $35.00 | Alta disponibilidade e backups automáticos. |
| **Hospedagem Própria** | VPS (2GB RAM) | ~$10.00 - $12.00 | Menor custo, porém exige gestão manual de DB. |

**Vantagem de Escala:** Como o PostgreSQL é Open Source, não há custos de licenciamento por core ou usuário, permitindo o crescimento horizontal (sharding) ou vertical sem taxas ocultas.

---

## 3. Conclusão

A escolha do PostgreSQL para o ProconChatBot minimiza o custo operacional ao reduzir a complexidade da infraestrutura (menos bancos para gerenciar) e garante que o sistema esteja preparado para as demandas de busca vetorial exigidas por modelos de linguagem modernos.

# Documentação de Arquitetura do Backend

## 1. Visão Geral da Arquitetura
**Padrão Escolhido:** MVC com Camada de Model Ativa (Active Record Pattern).

O sistema é estruturado em três camadas principais com responsabilidades bem definidas e isoladas, garantindo que o código seja testável e de fácil manutenção.

### Responsabilidades por Camada
| Camada | Responsabilidade | O que NÃO faz |
| :--- | :--- | :--- |
| **Controller** | Orquestração HTTP, recebe requisições e formata respostas. | Não contém regras de negócio. |
| **Service** | Regras de negócio, validações, cálculos e orquestração de Models. | Não acessa o banco de dados diretamente. |
| **Model** | Única camada que acessa o banco de dados (via Prisma). | Não contém regras de negócio. |

**Fluxo de Dependência:**
`Controller` → `Service` → `Model` → `Banco de Dados`

---

## 2. ORM: Prisma
**Status:** ✅ Selecionado (ADR-002)

O Prisma foi escolhido por oferecer a melhor combinação de **Type Safety**, produtividade e facilidade de uso em ecossistemas TypeScript.

### Por que Prisma (v7)?
* **Schema Declarativo:** Um único arquivo (`schema.prisma`) como fonte da verdade.
* **Type Safety Nativo:** Tipos TypeScript gerados automaticamente, eliminando erros em tempo de compilação.
* **Migrações Automatizadas:** Histórico versionado e rollbacks suportados.
* **Prisma Studio:** Interface gráfica integrada para visualização de dados em tempo de desenvolvimento.
* **Alta Performance:** Engine otimizada em WASM, reduzindo o bundle size em ~70% em relação a versões anteriores.

---

## 3. Estrutura de Pastas
A organização do diretório `src/` reflete a separação de conceitos:

```text
src/
├── controllers/    # Orquestração HTTP e formato de respostas
├── services/       # Regras de negócio e integração com IA/RAG
├── models/         # Camada de acesso a dados (Abstração Prisma)
├── routes/         # Definição de endpoints da API
├── middlewares/    # Interceptadores (Auth, Error Handling, Logger)
├── prisma/         # Schema e Migrations versionadas
├── config/         # Instâncias de DB e variáveis de ambiente
└── utils/          # Funções auxiliares, validadores e formatadores
```

## 4. Princípios de Desenvolvimento
Aplicamos os seguintes conceitos de **Clean Code** e **SOLID**:

* **Single Responsibility (SRP):** Cada camada possui uma única responsabilidade bem definida.
* **Separation of Concerns:** Regras de negócio nunca se misturam com lógica de transporte (HTTP) ou persistência de dados.
* **Meaningful Names:** Nomenclatura clara e semântica, como `UserService`, `ChatbotModel` e `AuthMiddleware`.
* **Fail Fast:** Validações de negócio são executadas logo no início dos *Services* para interromper o fluxo em caso de erro, evitando processamento desnecessário.

---

## 5. Decisões Técnicas Registradas (ADR)

* **ADR-001: Arquitetura do Backend**
    * **Decisão:** Adoção de MVC com Model Ativa para garantir organização e facilidade de testes.
* **ADR-002: ORM (Prisma)**
    * **Decisão:** Uso do Prisma pela segurança de tipos (Type Safety) e alta produtividade no desenvolvimento.
* **ADR-003: Banco de Dados (PostgreSQL)**
    * **Decisão:** Escolha do PostgreSQL pela maturidade e suporte nativo a dados vetoriais via `pgvector`, essencial para o motor de RAG.

---
