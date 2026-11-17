# Dependências do port Node

Seleção verificada em 2026-11-16. Esta é a introdução planejada da plataforma Node/TypeScript, não uma atualização automática. `package-lock.json` fixa também as dependências transitivas. Nenhuma destas escolhas é inserida como política nos consumidores.

| Componente | Versão | Release no npm | Motivo |
| --- | --- | --- | --- |
| `yaml` | 2.9.1 | 2026-09-11 | YAML 1.2 e posições de nós/comentários |
| `ajv` | 8.20.0 | 2026-04-24 | Validação local do JSON Schema |
| `remark-parse` | 11.0.0 | 2023-09-18 | Estrutura CommonMark sem reserializar fontes |
| `unified` | 11.0.5 | 2024-06-19 | Pipeline do parser Markdown |
| `typescript` | 7.0.2 | 2026-07-08 | Compilação ESM com checagem estrita, somente desenvolvimento |
| `@types/node` | 22.20.5 | 2026-10-01 | APIs compatíveis com a menor linha Node suportada |
| `prettier` | 3.9.10 | 2026-10-10 | Formatação, somente desenvolvimento; 3.10.1 ainda dentro da janela de maturidade |
| `lefthook` | 2.1.8 | preexistente | Gate local preservado, agora invocando os scripts npm |
| `actions/checkout` | 7.0.1 | 2026-07-20 | Action estável com runtime Node 24 |
| `actions/setup-node` | 7.1.0 | 2026-10-08 | Configuração das três linhas LTS; versão minor com mais de 30 dias |

As linhas Node 22, 24 e 26 constam como LTS suportadas na [lista oficial](https://nodejs.org/en/about/previous-releases). Os patches disponíveis podem ser consultados no [índice oficial](https://nodejs.org/dist/index.json); a CI seleciona o patch atual de cada linha. O host inicial executou Node 24.15.0 e Git 2.56.1.windows.1. Os executáveis oficiais 22.23.5, 24.22.3 e 26.13.1 foram obtidos somente no cache, com SHA-256 conferido contra `SHASUMS256.txt`, para a verificação das três linhas. Os testes e o relatório de validação distinguem execução local de matriz configurada.

Referências: [YAML document API](https://eemeli.org/yaml/), [Ajv JSON Schema](https://ajv.js.org/json-schema.html), [remark-parse](https://github.com/remarkjs/remark/tree/main/packages/remark-parse), [TypeScript 7.0.2](https://github.com/microsoft/TypeScript/releases/tag/v7.0.2), [releases Prettier](https://github.com/prettier/prettier/releases). Datas conferidas nos metadados públicos do registro npm com `npm view <pacote> time --json`.

`npm audit --json` retornou zero advisories em todas as severidades na instalação inicial. Isso registra o resultado observado, sem prometer ausência de vulnerabilidades futuras. Compilação, typecheck e testes do tarball verificam compatibilidade antes da aceitação.

Rollback interno: descarte a instalação/tarball de teste e restaure somente os arquivos deste port a partir do diff revisado. O snapshot dos inputs/outputs aceitos e os oráculos históricos ficam em `tests/fixtures/node-cli/`; preserve as alterações anteriores da etapa de conteúdo. Não altere pins, tags, remotos ou documentos gerados da raiz para desfazer um ensaio. Não houve publicação npm, migração ou versão Git nesta etapa; o valor de versão preexistente em `package.json` permanece metadado de desenvolvimento.
