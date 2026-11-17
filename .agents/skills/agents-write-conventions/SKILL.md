---
name: agents-write-conventions
description: Cria, revisa e mantém o conteúdo das conventions e subconventions, com regras claras, exemplos e curadoria de escopo, coerência e organização, na base ou no projeto consumidor.
---

# Escrever e manter convenções

Use esta skill para autoria e curadoria das regras, não para gerar documentos pelo manifesto nem versionar uma base. O agente decide a qualidade e o significado do conteúdo; a CLI confere seu contrato estrutural. Uma validação bem-sucedida não comprova que a regra é útil ou correta.

## Localizar a fonte certa

- Trabalhe na raiz do repositório indicada por `[repo-root]`. Leia as instruções locais, o contexto do projeto e as convenções relacionadas antes de escrever. Identifique o pedido, quem deve seguir a regra e em que situações ela se aplica.
- No consumidor, leia `[repo-root]/agents-compose.yml`. Use `outputs.AGENTS.md.include.conventions.local.tpl_dir` para localizar fontes locais; `out_dir` identifica saídas geradas. Não fixe esses diretórios pelos exemplos desta skill.
- Base e consumidor são papéis exclusivos. A base tem identificação interna e um `[repo-root]/AGENTS.md` simples e editável; esse arquivo não é uma convention nem é gerado por sync. O catálogo da base é conteúdo destinado aos consumidores, não uma lista de instruções adicionais que esta skill deve aplicar à própria base.
- Na base criada por `agents init --base`, o catálogo autoral é `[repo-root]/templates/docs/conventions/`; não é necessário um manifesto consumidor. Confira a estrutura e as instruções da base antes de escolher o destino.
- Uma regra compartilhada pertence à base; uma política específica do projeto pertence ao consumidor. Não amplie uma preferência local para toda a equipe sem esse escopo no pedido. Não transforme uma base em consumidor nem crie um manifesto consumidor nela.
- `agents.repository/ref` e `remote.tpl_dir` identificam fontes remotas fixadas. Não edite o cache nem os documentos gerados do consumidor (`AGENTS.md` e convenções publicadas). Se a mudança solicitada pertencer à base remota e ela não estiver disponível para autoria, informe onde deve ser feita; não crie uma cópia local conflitante como atalho.

## Curadoria do conteúdo

Antes de criar outro arquivo, confira se o assunto já tem uma convenção que pode receber a mudança. Edite somente o tema solicitado e preserve decisões existentes fora desse escopo.

- **Propósito e acionamento:** diga qual decisão a regra resolve, a quem se aplica e quando deve ser consultada. Evite títulos genéricos que misturam assuntos independentes.
- **Regra executável:** descreva a ação esperada e sua condição. Troque “faça testes adequados” por algo verificável no contexto, como “ao alterar o cálculo de desconto, teste os limites de 0% e 100%”. Não invente comandos ou requisitos que o projeto não adota.
- **Obrigação e recomendação:** diferencie o que é obrigatório, preferencial ou ilustrativo. Dê um motivo curto quando ele ajudar a decidir. Registre exceções reais, com condição e alternativa, sem criar ressalvas hipotéticas para toda regra.
- **Exemplos:** apresente exemplos completos, válidos e pequenos. Identifique valores ilustrativos; um exemplo de mensagem de commit não exige repetir a mesma mensagem em todos os projetos. Explique só conceitos necessários à regra e compatíveis com o conhecimento esperado do leitor.
- **Coerência:** procure duplicações, contradições e termos ambíguos nas regras relacionadas. Prefira uma fonte normativa com referências acionáveis. Se houver decisões incompatíveis sem prioridade definida, exponha a escolha que falta em vez de inventar uma política.
- **Organização:** separe assuntos que são consultados em situações diferentes. Use uma subconvenção para aprofundamento do mesmo tema, sem esconder uma regra indispensável atrás de uma referência opcional. Não divida arquivos apenas por tamanho.
- **Manutenção:** diferencie valores fixos do contrato, campos configuráveis, exemplos e estado atual. Prefira citar o campo configurável a cristalizar caminhos, versões ou ferramentas incidentais. Remova redundância no trecho alterado sem transformar a tarefa em uma revisão geral não solicitada.

## Formato aceito pelo gerador

Cada convenção `.tpl.md` precisa de exatamente um H1 e de um bloco não vazio `AGENT-CARD`, fora de exemplos de código. O card explica quando ler e como usar; as regras ficam no corpo. Exemplo completo de uma convenção, com conteúdo ilustrativo:

```markdown
# Mensagens de commit

<!-- AGENT-CARD START -->
Leia ao criar ou revisar uma mensagem de commit.
Use esta convenção para escolher o tipo e descrever a mudança.
<!-- AGENT-CARD END -->

## Regra

Use Conventional Commits: `<tipo>: <descrição>`.
Escolha `fix` para correções e `feat` para funcionalidades novas.
A descrição deve resumir a mudança concreta do commit.

## Exemplos

- `fix: corrige o cálculo de desconto`
- `feat: adiciona filtro de pedidos`

As mensagens são exemplos; adapte a descrição à mudança realizada.
```

Uma família usa `<tema>.tpl.md` e `<tema>.<subtema>.tpl.md` no mesmo diretório, com um único nível de filho. O filho depende do pai. O gerador acrescenta ao documento pai a seção `Quando ler as subconventions`, com os caminhos e condições de leitura obtidos dos cards dos filhos. Escreva cards específicos em cada fonte e não duplique essa seção gerada no template pai. Preserve o caminho relativo sob `out_dir` e troque `.tpl.md` por `.md` ao referenciar o documento publicado.

Na versão 2 do manifesto, criar ou copiar uma família local válida em `local.tpl_dir` basta para sua descoberta. Na versão 1, respeite a seleção explícita; entradas remotas também são explícitas. Ajuste o manifesto apenas quando necessário à autoria pedida, sem converter contratos ou alterar pins implicitamente. Consulte a referência de composição do pacote instalado quando precisar confirmar formatos.

## Conferir e encerrar

1. Releia a mudança como alguém que conhece programação, mas ainda não conhece esta regra. Confira o acionamento, a ação esperada, exemplos e possíveis conflitos com as convenções relacionadas.
2. Quando disponível, use a CLI instalada na raiz correta: `agents validate --base` para o catálogo da base, ou `agents validate` para a composição do consumidor. Confirme suporte pelo help se desconhecido; não instale ou atualize a CLI como parte da autoria. A validação do consumidor com base Git pode preencher o cache.
3. Relate as fontes alteradas, a decisão expressa pela regra e as verificações reais. Se não foi possível validar, diga por quê. Não confunda revisão semântica com validação de formato.

Autoria por si só não executa `sync`, não cria commits ou tags e não publica alterações. Quando o pedido incluir geração num projeto consumidor separado, use `agents-update-docs` para atualizar pelo manifesto existente. Para versionamento autorizado da base, use `agents-update-version`. Um pedido somente de revisão termina com os achados, sem editar fontes.

## Instalação

Esta skill vem do pacote da CLI. Tanto `agents init` no consumidor quanto `agents init --base` na base a instalam em `[repo-root]/.agents/skills/agents-write-conventions/`. A prévia `--dry-run` não escreve arquivos. Cópias idênticas são preservadas; personalizações ou arquivos extras causam conflito antes de qualquer escrita de setup. `sync` não atualiza skills pelo pin de conteúdo.
