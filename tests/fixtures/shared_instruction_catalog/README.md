# Evidência do catálogo candidato

Esta fixture registra a etapa de conteúdo `simplify-shared-conventions`. Ela não publica a raiz nem representa uma versão pública.

| Arquivo | Evidência |
|---|---|
| `baseline.json` | HEAD anterior, fontes e hashes, destino de cada família e linha normativa, extração da base, cinco exclusões e estado protegido da sessão |
| `candidate.json` | Identidade SHA-256 das entradas normalizadas para LF e inventário/hash de todas as saídas esperadas dos dois perfis |
| `validation-results.json` | Resultados efetivamente executados, preservação da raiz e limitações do host |
| `neutral-AGENTS.md` | Instrução candidata para consumidor novo com contexto próprio e duas conventions compartilhadas |
| `local-AGENTS.md` | Instrução candidata com todas as políticas locais explicitamente selecionadas |
| `neutral-generated.diff`, `local-generated.diff` | Comparação revisável das saídas descartáveis com os documentos de desenvolvimento preservados |
| `validation-results.json` | Resultados dos gates, limitação inicial do sandbox e suíte geral com 61 testes aprovados fora dessa restrição |

Os diffs mostram ausências dos cinco arquivos obsoletos no perfil novo; não executam remoções na raiz. As exclusões são o pai `contratos-de-artefatos-para-repositorios-consumidores.md`, seus filhos `.agents-compose.md`, `.arquivos-fonte.md`, `.relacao-pai-filha.md` e `uuid-em-novas-implementacoes.md`, todos sob `docs/conventions/`.

As famílias especializadas e contexto/autoria mantêm o conteúdo original, validado por hash após normalizar CRLF para LF. `rule_mapping` conserva os bullets e linhas de tabela originais, vinculados ao destino da respectiva fonte; a extração operacional é verificada bullet a bullet. A redução das duas fontes compartilhadas e a transferência dos contratos também exigem revisão de conteúdo, além das verificações estruturais automatizadas.

Para reproduzir os testes, na raiz:

```sh
python -B -m unittest discover -s tests -p test_shared_instruction_catalog.py -v
python -B -m unittest discover -s tests -v
```

O harness reutiliza o motor Python existente, com diretórios Git e consumidores descartáveis, sem rede, tag pública, commit na raiz, cache real ou dependência nova. Ele valida UTF-8/LF, descoberta de todos os filhos, conteúdo local preservado, família própria local, base empresarial com mais de duas fontes, diagnóstico de fontes aposentadas, arquivo alheio preservado e segunda geração sem gravação. O estado protegido é comparado antes/depois de cada teste integrado; os hashes históricos não impedem futuras publicações autorizadas.

Após mudar as entradas candidatas, revise o conteúdo e atualize as expectativas explicitamente:

```sh
python -B tests/test_shared_instruction_catalog.py --record-candidate
```

Esse comando é auxiliar de teste; a execução normal da suíte nunca altera as expectativas. A identidade não inclui caminhos descartáveis nem refs de uma publicação simulada. O pin real permanece `v4.0.1` nesta sessão; `AGENTS.md` e as conventions publicadas da raiz continuam pendentes de materialização pelo fluxo público após aceitação. O inventário de exclusões é insumo para o futuro export autorizado, sem migração de consumidores ou histórico.
