# Sistema IT — guia do código

O projeto foi desenvolvido em HTML, CSS e JavaScript puros. Para executar, abra `index.html` com a extensão Live Server do VS Code. Não é necessário instalar Node.js, pacotes ou dependências.

## Arquivos principais

- `index.html`: estrutura semântica, controles de acessibilidade, formulários e modais.
- `styles.css`: aparência, responsividade, alto contraste e temas claro/escuro.
- `app.js`: dados mockados, pesquisa, filtros, criação, edição, exclusão, temas e visualização de anexos.

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

Arquivos antigos `.doc`, `.xls` e `.ppt` não possuem renderização nativa confiável no navegador. Nesses casos, o sistema oferece abertura e download. Quando o backend disponibilizar uma URL HTTPS para arquivos do Office, o visualizador também poderá utilizar o Microsoft Office Online.

Os anexos dos cinco registros iniciais são mocks e contêm apenas metadados. Arquivos reais escolhidos pelo botão **Novo item** são guardados no IndexedDB e continuam disponíveis para visualização depois que a página é atualizada ou reaberta no mesmo navegador.

O limite do front-end é de **100 MB por anexo**. Na integração definitiva, o backend e o servidor também deverão aceitar esse mesmo tamanho.

O espaço disponível no IndexedDB depende da política e da capacidade do navegador. Se o navegador corporativo bloquear esse armazenamento ou estiver sem espaço, o sistema informa que o item ficará disponível apenas durante a sessão atual.

## Armazenamento local

Enquanto o backend não estiver disponível, o sistema utiliza o **IndexedDB**, banco interno do navegador, para manter os itens criados, editados ou excluídos e seus anexos reais. Esse armazenamento não exige instalação adicional.

Os dados ficam restritos ao navegador e ao computador em que foram cadastrados. Outros colaboradores não enxergarão essas informações até a integração com a API corporativa.

## Temas

O seletor no cabeçalho oferece:

- **Sistema**: acompanha o tema configurado no Windows ou navegador.
- **Claro**: mantém a interface clara.
- **Escuro**: aplica a interface escura.

A preferência fica salva no navegador com `localStorage`.

## Integração futura com backend

Atualmente, criação, edição, exclusão e anexos são mantidos no IndexedDB do navegador. Na integração real:

- Substitua a leitura do array por `GET /items`.
- Substitua a criação local por `POST /items` com upload do anexo.
- Substitua `saveItem()` por `PUT /items/:id` ou `PATCH /items/:id` durante a edição.
- Substitua `deleteItem()` por `DELETE /items/:id` após a confirmação.
- Remova as funções `openLocalDatabase()`, `persistItems()` e `loadStoredItems()` quando a API assumir a persistência.
- Faça o backend devolver uma URL ou stream seguro para visualização e download do anexo.

Não coloque URLs corporativas, tokens ou credenciais diretamente no front-end.
