# Sistema IT — guia do código

O projeto foi desenvolvido em HTML, CSS e JavaScript puros. Para executar, abra `index.html` com a extensão Live Server do VS Code. Não é necessário instalar Node.js, pacotes ou dependências.

## Arquivos principais

- `index.html`: estrutura semântica, controles de acessibilidade, formulários e modais.
- `styles.css`: aparência, responsividade, alto contraste e temas claro/escuro.
- `app.js`: dados mockados, pesquisa, filtros, criação, exclusão, temas e visualização de anexos.

## Organização do JavaScript

O `app.js` está dividido em seis blocos comentados:

1. Configurações, tipos e dados mockados.
2. Estado da interface e funções utilitárias.
3. Pesquisa, filtros, ordenação e renderização.
4. Leitor de anexos.
5. Formulário de criação e exclusão.
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

Os anexos dos registros iniciais são mocks e contêm apenas metadados. Arquivos escolhidos pelo botão **Novo item** podem ser visualizados durante a sessão atual.

## Temas

O seletor no cabeçalho oferece:

- **Sistema**: acompanha o tema configurado no Windows ou navegador.
- **Claro**: mantém a interface clara.
- **Escuro**: aplica a interface escura.

A preferência fica salva no navegador com `localStorage`.

## Integração futura com backend

Atualmente, criação e exclusão alteram apenas o array `items` em memória. Ao atualizar a página, os mocks retornam. Na integração real:

- Substitua a leitura do array por `GET /items`.
- Substitua a criação local por `POST /items` com upload do anexo.
- Substitua `deleteItem()` por `DELETE /items/:id` após a confirmação.
- Faça o backend devolver uma URL ou stream seguro para visualização e download do anexo.

Não coloque URLs corporativas, tokens ou credenciais diretamente no front-end.
