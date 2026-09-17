# Sistema IT — guia do código

O projeto foi desenvolvido em HTML, CSS e JavaScript puros. Para executar, abra `index.html` com a extensão Live Server do VS Code. Não é necessário instalar Node.js, pacotes ou dependências.

## Arquivos principais

- `index.html`: estrutura semântica, controles de acessibilidade, formulários e modais.
- `styles.css`: aparência, responsividade, alto contraste e temas claro/escuro.
- `app.js`: dados mockados, pesquisa, filtros, criação, edição, exclusão, temas e visualização de anexos.

A exclusão utiliza um modal interno não bloqueante. Isso evita o congelamento aparente causado pela caixa nativa `window.confirm()`.

## Organização do JavaScript

O `app.js` está dividido em seis blocos comentados:

1. Configurações, tipos e dados mockados.
2. Estado da interface e funções utilitárias.
3. Pesquisa, filtros, ordenação e renderização.
4. Leitor de anexos.
5. Formulário de criação, edição e exclusão.
6. Eventos, acessibilidade e inicialização.

O valor interno `instruction` foi mantido para evitar quebra em integrações futuras, mas é apresentado ao usuário como **Procedimento**.

## Visualização de anexos

O visualizador funciona inteiramente no navegador:

- Imagens: JPG, JPEG, PNG, GIF e WEBP.
- Documentos: PDF e TXT.
- Tabelas: CSV e prévia textual da primeira aba de XLSX.
- Word: prévia textual de DOCX.
- PowerPoint: prévia textual dos slides de PPTX.

A biblioteca JSZip está incluída localmente em `vendor/jszip.min.js` para tornar a leitura de DOCX, XLSX e PPTX compatível com navegadores que não oferecem descompactação ZIP nativa. Ela é carregada pelo próprio Live Server e não requer instalação ou internet.

Arquivos antigos `.doc`, `.xls` e `.ppt` não possuem renderização nativa confiável no navegador. Nesses casos, o sistema oferece abertura e download. Quando o backend disponibilizar uma URL HTTPS para arquivos do Office, o visualizador também poderá utilizar o Microsoft Office Online.

A prévia local dos formatos modernos apresenta o conteúdo principal: texto do Word, células da primeira aba do Excel e textos dos slides do PowerPoint. Ela não reproduz integralmente fontes, animações, macros, gráficos ou a diagramação original do Microsoft Office.

Os anexos dos cinco registros iniciais são mocks e contêm apenas metadados. Arquivos reais escolhidos pelo botão **Novo item** podem ser visualizados e baixados durante a sessão atual.

O limite do front-end é de **100 MB por anexo**. Na integração definitiva, o backend e o servidor também deverão aceitar esse mesmo tamanho.

Para evitar travamentos, a extração local de DOCX, XLSX e PPTX é limitada a arquivos de até **25 MB**. Arquivos Office maiores continuam aceitos e podem ser baixados, mas não são descompactados para prévia no navegador.

## Funcionamento sem banco de dados

O sistema não utiliza IndexedDB nem outro banco de dados local. Criações, edições, exclusões e arquivos selecionados ficam apenas na memória da página e são perdidos quando ela é atualizada ou fechada. Essa decisão mantém a demonstração leve e evita o processamento local de grandes anexos durante a persistência.

## Temas

O seletor no cabeçalho oferece:

- **Sistema**: acompanha o tema configurado no Windows ou navegador.
- **Claro**: mantém a interface clara.
- **Escuro**: aplica a interface escura.

A preferência fica salva no navegador com `localStorage`.

## Integração futura com backend

Atualmente, criação, edição, exclusão e anexos funcionam somente durante a sessão atual. Na integração real:

- Substitua a leitura do array por `GET /items`.
- Substitua a criação local por `POST /items` com upload do anexo.
- Substitua `saveItem()` por `PUT /items/:id` ou `PATCH /items/:id` durante a edição.
- Substitua `deleteItem()` por `DELETE /items/:id` após a confirmação.
- Faça o backend devolver uma URL ou stream seguro para visualização e download do anexo.

Não coloque URLs corporativas, tokens ou credenciais diretamente no front-end.
