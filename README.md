# Mapa da Microárea — Rotina ACS LAB

**Protótipo público: somente simulação com dados fictícios. Não inserir dados de pacientes.**

[Usar o laboratório](https://leothaylor.github.io/mapa-microarea-acs-lab/) · [Plano de implementação](docs/PLANO_IMPLEMENTACAO_ASTRA.md)

## Entregue: P0 + P1

- Mapa Leaflet/OSM como interface principal, identidade verde, painel recolhível e painel inferior no celular. Roteiro e inclusão sempre acessíveis.
- Marcadores distinguem grupo, seleção/ordem, conclusão e múltiplas categorias. Agrupamentos mostram quantidade; clique aproxima e separa pontos coincidentes.
- Roteiro ordenável, remoção individual, confirmação para limpar e enquadramento. **A linha é uma ligação visual e não segue vias públicas**; não calcula tempo, distância por ruas ou otimização.
- Conclusão/desfazer por competência, com indicadores e cores dos setores; novos registros guardam data local e modo operacional. As oito conclusões da demo em outubro/2026 são preservadas.
- Criar, editar, mover por escolha no mapa/coordenadas e excluir pontos fictícios, dentro ou fora da área inicial. Identificadores automáticos; exclusão limpa roteiro e conclusões. Coordenadas limitadas à projeção de ruas (latitude ±85°, longitude ±180°).
- Vários grupos por ponto; criar/renomear/excluir grupos simulados com cor/símbolo. Filtros usam **OU** e contam pontos distintos. Ação específica exige ao menos um grupo. Excluir um grupo preserva seus pontos.
- GPS somente no botão **Minha localização**, com permissão, precisão/erros, ajuste manual por arraste e opção de ocultar. Posição temporária não integra estado, registros nem armazenamento local.
- Persistência na mesma chave `rotina-acs-lab-map-v01`, com migração V0.1/P0 para versão 3, competência, modo e filtros. Dados ilegíveis não são sobrescritos automaticamente; indisponibilidade/quota gera aviso.
- Restaurar demo exige confirmação e substitui somente os dados de teste deste app neste navegador.

## Privacidade e limites

Sem backend, conta, login, prontuário, analytics, sincronização, PEC ou materiais do SuperKit ACS. Nenhum dado real foi importado. Os pontos e grupos são sintéticos; percentuais não são cobertura oficial nem qualidade do cuidado.

Setores A/B/C ainda são os polígonos demonstrativos. A associação original é preservada na migração; ao criar/mover/editar um ponto, o setor é derivado da posição. Fora dos polígonos = sem setor; setor sem pontos no filtro = sem dados.

OSM recebe apenas requisições normais dos tiles visíveis. A geolocalização não é armazenada pelo app, mas centralizar o mapa gera as requisições cartográficas normais da região. O service worker não intercepta tiles nem outros domínios. Não há download de mapa offline: ruas e Leaflet exigem internet. O manifesto PWA existe, mas instalação em aparelho físico não foi validada neste ciclo.

## Executar e verificar

Site estático, sem build ou instalação de pacotes. Servir a raiz por HTTP, por exemplo:

```sh
python -m http.server 8765 --bind 127.0.0.1
node --check app.js
node --check domain.js
node --check sw.js
node --check vendor/leaflet.markercluster.js
node --check tests/browser-smoke.js
node --test tests/domain.test.js
```

`tests/browser-smoke.js` é uma função Playwright `(page) => …`, executável pelo navegador de testes/MCP `browser_run_code_unsafe` usando o caminho absoluto em `filename`. Abra antes `http://127.0.0.1:8765`. **Usa uma sessão local de teste e substitui seus dados locais; recusa rodar em domínio publicado.** Confirmações e GPS são simulados; a confirmação nativa também foi exercitada separadamente. Não depende de um pacote Playwright instalado no projeto.

TESTADO em 22/10/2026:
- Node v22.19.0: todas as verificações sintáticas e 9/9 testes de domínio aprovados.
- Playwright: migração V0.1 com ponto local adicional, roteiro/reordenação, conclusão/desfazer, reload, competência, formulários CRUD, movimento, grupos CRUD, OR, GPS negado/concedido temporário e agrupamento. Sem erros JS.
- Viewports 360×800, 390×844, 430×932, 844×390 e 1366×900: sem overflow horizontal; atribuição OSM visível com painel aberto. Formulário mobile inspecionado visualmente; operação com movimento reduzido verificada.
- Casos adicionais: ação em ponto coincidente e fora do filtro, estado ilegível preservado e erro de quota informado. GPS real, teclado virtual e instalação Android/iOS dependem de aparelho físico.

Ferramentas: Git 2.54.0.windows.1 e GitHub CLI autenticado, TESTADOS; servidor Python e Playwright OPERACIONAIS nesta sessão. Nenhuma configuração global alterada; nenhuma reinstalação. Identidade Git usada por comando, conforme histórico do repositório.

## Arquitetura e dependências

`index.html`/`styles.css`: interface; `app.js`: Leaflet e eventos; `domain.js`: dados/migração/operações; `sw.js`: shell local, network-first. GitHub Pages: branch **main**, pasta **root**.

Leaflet 1.9.4 via unpkg, já utilizado na V0.1. [Leaflet.markercluster 1.5.3](https://github.com/Leaflet/Leaflet.markercluster) incluído em `vendor/` (34 KB JS) com licença MIT, versão fixa, fallback para marcadores simples. A inclusão foi precedida por consulta ao inventário `C:\Users\usuário\Documents\AI_AGENT_STACK`; não houve instalação de npm/Python ou alterações nos projetos LT/Remotion.

## Checkpoints e pendências

- P0: `37ce42e`, publicado após testes, preservado.
- P1: `330d603`, com estabilização dos popups em `5512d50`; publicada e validada.
- P2 entregue neste checkpoint: concentração separada da execução, resumo mensal por setor/grupo com total distinto, backup JSON local com validação estrita, prévia e confirmação.
- P2 pendente: edição de polígonos e aperfeiçoamento/validação de instalação PWA em aparelhos físicos. Nenhuma nova fase iniciada.
- P3 fora deste ciclo: rotas por ruas, importação My Maps/KML, calendário ampliado, qualquer uso de produção com dados pessoais.


## Validação final do checkpoint P2 — 23/10/2026

- `backup.js` valida formato/versão, referências, duplicações, coordenadas, registros, campos permitidos e tamanho máximo de 1 MB. Limites: 2.000 pontos e 32 grupos.
- Exportação usa download local; restauração requer prévia e declaração de dados fictícios. Grava antes de substituir o estado em memória: falhas de quota preservam os dados atuais.
- `node --check` em `app.js`, `domain.js`, `backup.js` e `sw.js`: aprovado. `node --test tests/domain.test.js tests/backup.test.js`: **14/14 aprovados**.
- `tests/backup-browser.js` executado via Playwright: **PASS**, sem erros JS. Validou download real e conteúdo, restauração com recarga, cancelamento, JSON inválido, arquivo >1 MB, erro de quota sem perda, prévia mobile, resumo e concentração independente da competência.
- A sessão local inicialmente reutilizou uma cópia HTTP antiga de `domain.js`; revalidação sem cache carregou a versão atual e todos os testes passaram. Não foi necessário reimplementar funcionalidades.
- Testes de navegador substituem apenas o estado da instância local de teste; não executá-los contra dados de trabalho. Arquivos não são enviados a servidor. GPS temporário não integra o backup.
