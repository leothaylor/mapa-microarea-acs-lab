# Mapa da Microárea — Rotina ACS LAB

**Protótipo exploratório — NÃO USAR COM DADOS DE PACIENTES.**

Esta aplicação utiliza ruas reais via OpenStreetMap, mas os **18 pontos, categorias e setores são totalmente fictícios**, localizados em uma área de demonstração diferente daquela dos prints do My Maps. Não foi importado qualquer dado real.

## Funcionalidades da primeira versão
- Mapa real com zoom, marcadores e três setores coloridos.
- Filtros por HAS, Diabetes, Gestante e Criança (apenas categorias simuladas).
- Modo de visitas de rotina ou ação específica.
- Contagens visuais e percentual de pontos demonstrativos concluídos por setor.
- Alteração do mês de referência e marcação/desmarcação de conclusão.
- Seleção de pontos para roteiro e enquadramento do mapa.
- Inserção de pontos exclusivamente nos polígonos fictícios.
- Persistência dos testes no localStorage do navegador.
- Layout para celular e manifesto PWA instalável.

## Segurança e limitações
- Repositório e demonstração públicos.
- Nenhum backend, autenticação, criptografia, backup ou integração com e-SUS.
- **Não inserir dados pessoais, endereços de pacientes ou localizações reais.**
- Os percentuais representam apenas pontos fictícios visitados; não representam a cobertura oficial nem a qualidade do cuidado.
- O botão "Ver no mapa" apenas enquadra a seleção, não calcula rota por ruas.
- O mapa e a biblioteca Leaflet precisam de internet. Somente o shell local do app pode ser armazenado em cache.
- Antes de qualquer utilização fora do laboratório serão necessários uma análise de privacidade, definição de finalidade e revisão funcional.

## Publicação
GitHub Pages > Settings > Pages > Build and deployment > Deploy from a branch > main / (root).

Arquivo principal: index.html; lógica: app.js; serviço de cache: sw.js.

## Próximos experimentos
- Seleção visual de múltiplos pontos, legibilidade e agrupamento de marcadores.
- Desenho de setor e relatórios agregados, sempre usando dados fictícios.
- Investigar separação entre visitas de rotina e ações dirigidas sem duplicação de registro.
- Validar interface em celular real.
