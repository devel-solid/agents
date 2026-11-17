# Autoria de conventions

O catálogo pode ficar vazio. Crie pais `nome.tpl.md` e filhos opcionais `nome.detalhes.tpl.md` no mesmo diretório; subdiretórios são permitidos. Cada fonte tem exatamente um H1 e um cartão não vazio fora de exemplos de código:

```md
# Qualidade

<!-- AGENT-CARD START -->
Leia este documento ao revisar mudanças.
Use este documento para orientar as verificações do projeto.
<!-- AGENT-CARD END -->

Descreva aqui as regras da empresa.
```

Declare somente o pai ao selecionar uma família no consumidor. Execute `agents validate --base` para conferir todo o catálogo, inclusive fontes que nenhum consumidor selecionou. O contrato completo acompanha o pacote instalado em `docs/guides/contratos-de-composicao.md`.

Para autoria assistida, use `agents-write-conventions`, instalada por `init --base` em `.agents/skills/agents-write-conventions/SKILL.md` na base. Ela orienta o conteúdo e a revisão das regras; a validação estrutural não substitui essa curadoria. Autoria não executa geração ou versionamento implicitamente.
