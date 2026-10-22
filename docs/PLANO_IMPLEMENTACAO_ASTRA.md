# Plano de implementação — Mapa da Microárea ACS LAB

Status: especificação de engenharia para protótipo, não autorização para uso de dados pessoais. Referência inicial: 2026-10-22. Projeto: https://github.com/leothaylor/mapa-microarea-acs-lab — deploy: https://leothaylor.github.io/mapa-microarea-acs-lab/

## Missão e contexto verificado

Produto experimental de utilidade gratuita da marca Rotina ACS. O proprietário já foi ACS e usava Google My Maps com camadas, pontos, ícones, polígonos e contagens para visualizar a microárea, perceber concentrações e organizar visitas. Para rotina, ele priorizava proximidade; para ações direcionadas (p. ex. diabetes), filtrava o grupo primeiro e só depois organizava por proximidade. O mapa é o centro da experiência. O SuperKit ACS é um produto pago de fichas, calendários, checklists e materiais operacionais; este app deve ser COMPLEMENTAR (visualização geográfica, seleção de pontos, execução e indicadores), não replicar as fichas/calendários e nem competir com e-SUS Território.

Experimento totalmente **fictício**, repositório e GitHub Pages públicos. Os prints do My Maps original foram referência de UX, **nenhuma informação real do My Maps deve ser copiada ou importada**. Sem nomes, diagnósticos vinculados a pessoas reais, identificadores clínicos, telefones, endereços residenciais ou cadastros de pacientes. Apenas pontos e grupos **sintéticos**. Manter aviso inequívoco na UI e documentação. Este LAB não deve ser publicizado como solução clínica pronta. Não incorporar analytics que capturem coordenadas ou estado dos registros.

## Estado atual no GitHub (ler o código antes de editar)

- Site estático: index.html (CSS/UI), app.js (estado e Leaflet), sw.js, manifest.webmanifest, icon.svg e README.md.
- Leaflet 1.9.4, base de ruas OpenStreetMap; 18 pontos artificiais em 3 polígonos A/B/C, categorias HAS/Diabetes/Gestante/Criança; filtros, modos Rotina/Ação, conclusão por mês, contagens, adição de ponto fictício dentro do setor e seleção do roteiro.
- Persistência localStorage em chave \`rotina-acs-lab-map-v01\`; \`state.points\`, \`state.visits\` por AAAA-MM e \`state.route\`.
- **Bugs/limites**: sidebar longa oculta roteiro/inclusão; seleção do roteiro não desenha linhas; não há reordenação nem trajetos por vias; ponto não tem CRUD real; adicionar exige setor rígido e se usa categoria ativa/default; hardcodes de coordenadas e grupos; grupos simples, um por ponto; setores não editáveis; sem GPS; não há agrupamento de marcadores, backup ou testes. \`month\` não é salvo; \`reset\` deve permanecer seguro.
- Página hospedada em GitHub Pages a partir da branch main/root. Preservar funcionamento com caminhos relativos e deploy estático, sem exigir serviço pago.

## Estratégia de engenharia: custo e qualidade

Créditos de Codex/Astra restritos (~40% no início). Trabalhar concentrado. Não reescrever tudo em React/Next/Vite nem adicionar backend, conta, login, Firebase/Supabase, serviço de rotas ou dependências grandes. Pode modularizar JS/CSS quando isso **simplificar de fato**. Preferir solução estática com Leaflet e componentes leves, sem novas APIs pagas, preservando dados de teste pré-existentes no navegador. Entregar commits pequenos ou pelo menos um checkpoint funcional antes de qualquer refatoração arriscada. Não quebrar funcionamento da V0.1.

### Dados e conceitos invariantes

1. \`Ponto operacional fictício\` com ID local estável, coordenadas, setor derivado espacialmente (quando possível) e **múltiplas categorias opcionais** (ex.: HAS + Diabetes, evitando dupla contagem de ponto); identificador genérico gerado automaticamente. Não exigir CPF, nome, telefone, endereço ou campos livres identificáveis.
2. \`Registro de execução\` com ID de ponto, competência AAAA-MM, data local da conclusão e tipo operacional (rotina/ação, quando escolhido); permitir desfazer. Não confundir visita planejada com concluída.
3. \`Roteiro\` é uma lista **ordenada** de IDs de pontos, removível/reordenável; visualização de sequência por segmentos retos; **não rotular como rota por ruas, tempo de deslocamento ou otimização automática real**.
4. \`Setor\` é polígono geográfico editável + rótulo genérico. Indicador setor = pontos distintos concluídos na competência / total de pontos distintos elegíveis ao filtro no setor. Não extrapolar para cobertura oficial, qualidade do cuidado ou avaliação clínica. Setor vazio = SEM DADOS (não 0% vermelho).
5. \`Concentração\` e \`execução\` são camadas distintas: distribuição de pontos não equivale a cobertura de atividades. Para concentração, começar com número de pontos por setor, sem inferência epidemiológica. Qualquer heatmap posterior deve ser rotulado como densidade dos pontos sintéticos, não incidência clínica.
6. Dados sintéticos da V0.1 devem continuar disponíveis, sem perder alterações de teste locais. Validar inputs e importar backup de modo seguro. Se mudar schema, incluir migração de v01 ou fallback conservador.
7. Sem compartilhamento, sincronização remota ou upload dos dados. Geolocalização exige clique e consentimento, deve exibir precisão/erro, permitir ajuste manual e não salvar coordenadas reais automaticamente no demo; nunca coletar em background.

## Roadmap priorizado

### P0 — UX e núcleo operacional (EXECUTAR PRIMEIRO; entrega obrigatória)

**Mapa / navegação**
- Corrigir layout: desktop com painel colapsável; mobile com mapa como protagonista e painel em drawer/bottom-sheet, sem obstrução de zoom, atribuição ou popups.
- Barra ou FAB persistente de **Roteiro (N)** e de **Adicionar ponto**; acessibilidade por teclado, labels claros e botões utilizáveis no touch.
- Estado de marcador visivelmente distinto: neutro, selecionado, concluído, selecionado+concluído; legenda inequívoca. Corrigir popup e atualização sem piscadas desnecessárias.
- Ao selecionar ponto → incluir/remover do roteiro; ao concluir/desfazer → recalcular contadores e cor do setor; conservar filtro/mês e viewport em todas as ações.
- Mostrar **roteiro ordenado** na interface com número dos pontos, reordenação simples (botões mover acima/abaixo; drag-and-drop é opcional), exclusão individual e limpar com confirmação adequada. Desenhar polilinha reta e números no mapa para visualizar sequência, com aviso "ligação visual — não segue vias públicas". Enquadrar roteiro.
- Diferenciar visualmente "Rotina" (todos os pontos conforme filtros opcionais) e "Ação específica" (grupo selecionado obrigatório), sem mudar sem querer o acompanhamento mensal.
- Dar feedback útil de estado vazio/erro, sem alert() para fluxo comum.

**Persistência e estabilidade**
- Proteger estado, usar IDs estáveis, manter compatibilidade com \`rotina-acs-lab-map-v01\`, validar estado importado; não perder dados ao atualizar. Salvar/restaurar competência e modo se vantajoso.
- Revisar assinaturas/eventos para evitar double click, duplicação de rota, erros com estado de visitas e reset; confirmação só para exclusões destrutivas.

### P1 — Edição real do laboratório (EXECUTAR APÓS P0, SE O ORÇAMENTO PERMITIR)

- Formulário compacto de ponto: criar, editar categoria(s) (até múltiplas), mover no mapa por seleção/drag, excluir com confirmação e limpeza das referências (visitas, roteiro). Identificadores automáticos genéricos, nunca dados pessoais.
- Remover dependência de coordenadas rígidas de Madureira para inclusão de pontos; permitir área demonstrativa em qualquer lugar. Manter dataset sintético inicial disponível num botão "Restaurar demo".
- Criar/renomear/excluir grupos **simulados** com cores/ícones distinguíveis; filtro múltiplo com lógica OR e contagem distinta dos pontos (não somar categorias sobrepostas).
- Capturar posição GPS **somente sob ação explícita** (botão "Minha localização"), visualização temporária da precisão e centralização; mensagens para permissão negada/indisponibilidade; **sem persistir por padrão** a posição do usuário.
- Agrupar marcadores próximos quando zoom afastado, exibir quantidade e expandir ao aproximar. Preferir plugin Leaflet pequeno mantido/compatível; tratar múltiplos pontos no mesmo local.

### P2 — Setores / relatórios / manutenção (PLANEJAR E EXECUTAR SÓ SE HOUVER MARGEM; NÃO COMPROMETER P0/P1)

- Desenho/edição/exclusão de polígonos de setores pelo usuário; cores recalculadas conforme competência e filtros, sem confundir volume com cobertura. Preferir Leaflet.Draw se compatível e permitido; validar geometria minimamente, e tratar pontos fora de qualquer setor como "sem setor". Recalcular associação setor pelo ponto.
- Visão de concentração (quantidade por setor) separada de execução (percentual por setor); alternância clara na legenda.
- Resumo mensal: pontos distintos, planejados, concluídos, pendentes e resultados por setor/grupo sem dupla contagem, com estados vazios; opcional CSV **agregado** sem coordenadas.
- Backup e restauração **local** (JSON de versão e dados fictícios) com validação de schema/tamanho/valores, preview e confirmação antes de sobrescrever; export de arquivo e import pelo usuário, sem upload. Não exportar dados livremente se futuramente houver dados sensíveis; LAB fictício apenas.
- Revisar PWA: manifesto, iconografia real PNG 192/512 se necessário, estratégia de SW que publique updates sem versão velha presa, instalação testada Android/desktop; shell offline onde possível, **não prometer mapa offline**.
- Documentar limitações e testes manuais no README, inclusive migração e reset.

### P3 — IDEIAS PARA OUTRO CICLO (NÃO IMPLEMENTAR AGORA)

- Roteamento pelas ruas com motor próprio/serviço permissivo e custo explícito; caminhos em becos exigem dados OSM adequados. Sem rotas "otimizadas" inventadas.
- Importação My Maps/KML/GeoJSON apenas de dados sintéticos e consentidos, com validação; nunca importar o My Maps real do proprietário.
- Múltiplos meses com calendário detalhado/indicadores evolutivos, alertas e metas configuráveis.
- Modo produção com avaliação LGPD específica (finalidade, base legal, segurança, riscos de reidentificação e governança), se algum dia houver autorização separada.

## Requisitos de interface e produto

- Visual profissional e sóbrio, em português BR; preserve a identidade verde atual como ponto de partida. O mapa é o produto, não um dashboard com mapa decorativo.
- Sempre deixar mapas e legendas legíveis em 360–430px e desktop 1366px. Testar clique/touch, botão fechar drawer, popups próximos das bordas, scrolling e responsividade.
- Evitar excesso de formulários. Fazer a tarefa frequente (abrir mapa, filtrar, selecionar, concluir) em poucos toques.
- Sem telas incompletas, botões inertes, campos não conectados ou dados fictícios confundíveis com cadastro real.
- Manter informação explícita: "LAB — somente simulação com dados fictícios; não inserir dados reais".
- Não substituir ou vincular funcionalidades comerciais do SuperKit por material grátis. Este app é camada geográfica e operacional; não reproduzir fichas ou checklists do SuperKit.
- Sem analytics coletando dados geográficos; não inserir tokens/secrets no frontend nem no repositório.
- OSM: https://operations.osmfoundation.org/policies/tiles/ — atribuição sempre visível, somente requisições de tiles para viewport de uso normal, nada de prefetch/download/offline de mosaicos; usar URL correta \`https://tile.openstreetmap.org/{z}/{x}/{y}.png\` e não forçar bypass de cache. Service worker não deve interceptar ou baixar tiles de outro domínio.

## Critérios de aceite verificáveis

1. Site atual continua carregando mapa no GitHub Pages, sem erro JS e sem tela branca.
2. Oito conclusões da demo em outubro/2026 permanecem; novas conclusões/desfazer persistem após recarregar.
3. Adicionar 3 pontos ao roteiro e removê-los altera lista, contadores do roteiro e destaque/numeração no mapa, sem alterar contadores de visita.
4. Reordenar 3 pontos muda a polilinha na sequência correta; texto deixa claro que não é rota de ruas.
5. Concluir ponto recalcula mês e setor; ao mudar competência, estados não são herdados indevidamente.
6. Grupo HAS+Diabetes em um mesmo ponto (se P1 concluída) é contado uma vez em total de pontos, duas referências de categoria, mas não duplicado em taxa de conclusão.
7. Clicar em GPS pede permissão somente após interação; recusa não quebra app.
8. Setor sem pontos aparece como "sem dados"/neutro; não como 0% ou baixa cobertura.
9. Dados V0.1 continuam acessíveis após migração; reset voluntário restaura demo; se backup incluído, roundtrip export/import testado.
10. Testes em viewport mobile e desktop; controles não escondem atribuição nem botões essenciais.
11. Verificar \`node --check\` em cada JS, adicionar testes leves do domínio quando viável, executar smoke test browser se disponível; relatar quais foram executados e o que depende de teste manual.
12. Nenhum arquivo/commit nos outros repositórios do proprietário.

## Fluxo recomendado ao Codex/Astra

1. Leia \`AGENTS.md\`, este arquivo, \`index.html\`, \`app.js\`, \`sw.js\`, \`README.md\`. Faça inventário **curto**.
2. Implemente P0 de ponta a ponta, teste, faça commit. Se houver orçamento disponível, P1; P2 apenas se não comprometer acabamento de P0/P1. Não execute P3.
3. Prefira código verificável e decisões conservadoras a promessas de funcionalidade. Se um item não couber, marque no README como pendente em vez de exibir controle quebrado.
4. Faça commit(s) no repositório designado e push para \`main\` **quando autorizado/disponível**, para permitir teste imediato no Pages. Não reescreva histórico nem use \`--force\`. Se push não estiver disponível, deixe a branch/PR e instruções precisas.
5. Entregue resposta final curta: URL da prévia, commits, P0/P1/P2 concluídos e pendentes, comandos de teste + limitações reais. Não gastar tokens com relatórios longos nem perguntas de confirmação para detalhes já definidos.
