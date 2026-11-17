# Oráculo histórico do port

Estas fontes preservam os três entrypoints e os cinco módulos de testes Python anteriores ao port, inclusive alterações preexistentes da etapa `simplify-shared-conventions`. Os arquivos foram movidos sem alterar bytes, após os cenários Node correspondentes passarem.

Este diretório é evidência histórica, não um entrypoint suportado ou parte da suíte normal. Os caminhos internos refletem o checkout anterior e não foram adaptados para execução daqui. Não instale Python para desenvolver ou usar a CLI. `scenario-map.json`, no diretório pai, mapeia os 61 cenários anteriores para a evidência Node; as fixtures `accepted-inputs/` e `accepted-outputs/` são a referência de comportamento aceita.

O pacote npm exclui todos os testes e oráculos. A cópia destas fontes não implica suporte a releases privadas, execução de motor obtido de conteúdo remoto ou migração de consumidores.
