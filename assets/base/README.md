# Base de instruções da empresa

Esta base publica instruções para projetos consumidores separados. Ela não é consumidora, não possui manifesto de composição e não executa sync.

Depois de agents init --base, os sete arquivos são:

```text
base-equipe/
├── .agents/
│   ├── skills/
│   │   ├── agents-update-version/
│   │   │   └── SKILL.md
│   │   └── agents-write-conventions/
│   │       └── SKILL.md
│   └── base.json
├── templates/
│   ├── docs/
│   │   └── conventions/
│   │       └── README.md
│   └── AGENTS.tpl.md
├── AGENTS.md
└── README.md
```

AGENTS.md contém as instruções para trabalhar na própria base. Ele é simples, editável e preservado ao repetir init. templates/AGENTS.tpl.md é outro arquivo: fornece as instruções que serão geradas nos consumidores. O catálogo também é conteúdo destinado aos consumidores. .agents/base.json é a identificação interna da base, criada pela CLI.

1. Use agents-write-conventions para escrever e revisar o catálogo, ou edite ou copie uma fonte válida diretamente em templates/docs/conventions/.
2. Confira com a CLI instalada:

```bash
agents validate --base
```

3. Mantenha os arquivos em Git e faça commit das mudanças. Depois, prepare a versão com agents-update-version ou use os comandos diretamente:

```bash
agents release --bump minor --dry-run
agents release --bump minor
```

minor é ilustrativo: escolha patch, minor ou major pelo impacto. A CLI calcula o número e cria somente a tag local. Com IA, a skill exige aprovação do plano antes da criação da tag. O envio ao remoto depende da autorização e do fluxo Git da equipe.

4. Cada consumidor roda agents init em seu próprio projeto, configura a base publicada no manifesto e usa validate e sync. A versão não é adotada automaticamente.

A prévia de init não grava arquivos. O catálogo padrão está vazio; --starter minimal acrescenta dois exemplos editáveis. Node.js nas linhas suportadas basta para criar e validar a base; Git é necessário para versionar. Esta base não precisa do motor nem de package.json. A referência de formato acompanha a CLI instalada em docs/guides/contratos-de-composicao.md.
