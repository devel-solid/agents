---
name: update-docs
description: Sincroniza `AGENTS.md` e as `conventions` publicadas a partir de `agents-compose.yml` e do checkout fixado do repositório `agents`.
---

# Sincronização da documentação

Use a habilidade `update-docs` quando a documentação normativa do repositório precisar ser sincronizada.
Trate a própria habilidade como a interface pública deste fluxo.

## Fluxo

- Use a habilidade `update-docs` para sincronizar a documentação normativa do repositório.
- Separe autoria e geração conforme o pedido e a política local; uma mudança limitada às fontes não autoriza sincronização implícita.
- Peça confirmação antes de criar uma `convention` que o agente propôs por conta própria e que esteja fora do pedido.
- Quando a pessoa pedir para sincronizar a documentação, execute a geração diretamente. Para gerar os arquivos locais, execute `python3 -B .agents/skills/update-docs/scripts/update_docs.py` na raiz do repositório.
- O script lê `agents-compose.yml`, calcula `.cache/agents/<fingerprint>` e garante o checkout fixado antes de tocar em qualquer documento publicado.
- Se o checkout estiver ausente, desatualizado, inválido ou sujo, o script atualiza ou recria essa entrada de cache por conta própria.
- O script sincroniza `.agents/skills/update-docs/` a partir do checkout fixado, se executa de novo com a cópia local atualizada e só então materializa as `conventions` no diretório configurado em `conventions.out_dir` e regenera `AGENTS.md`.
- `conventions.out_dir` define o diretório publicado.
- `local.tpl_dir` e `remote.tpl_dir` definem as raízes de resolução de cada origem.
- `entries[].from` é relativo ao `tpl_dir` da origem e pode conter subdiretórios.
- A publicação preserva o caminho relativo e troca apenas `.tpl.md` por `.md` no destino final.
- Colisão é verificada pelo path final publicado, não por basename.
- O lançador em `bin/agents-bootstrap.py` é suporte manual opcional; a execução normal não deve depender de executá-lo antes.
- Não edite arquivos gerados manualmente, a menos que esteja alterando esta própria habilidade.
