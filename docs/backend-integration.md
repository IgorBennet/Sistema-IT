# Contrato de integração com o backend

O front-end usa a interface `ItemsService`, em `services/items-service.ts`. Para integrar a API real, implemente a mesma interface em `services/api-items-service.ts` e altere somente a exportação `itemsService`.

## Endpoints esperados

| Método | Endpoint | Uso |
|---|---|---|
| GET | `/items?search=&type=&sort=&page=&pageSize=` | Pesquisa, filtros, ordenação e paginação |
| GET | `/items/{id}` | Detalhes de um item |
| POST | `/items` | Criação do item |
| POST | `/items/{id}/attachment` | Upload `multipart/form-data` |
| GET | `/items/{id}/attachment` | Visualização segura |
| GET | `/items/{id}/attachment/download` | Download com `Content-Disposition` |

## Payload de criação

```json
{"type":"instruction | flow | method | meeting","title":"string obrigatória","description":"string obrigatória","important":false}
```

`id`, `author`, `createdAt` e `updatedAt` devem ser definidos pelo backend. O autor deve vir da identidade autenticada.

## Resposta paginada

```json
{"data":[],"page":1,"pageSize":5,"total":28,"totalPages":6}
```

Os objetos seguem `KnowledgeItem`, `Attachment` e `Author` em `types/item.ts`. Datas usam ISO 8601 em UTC.

## Erros

```json
{"code":"VALIDATION_ERROR","message":"Revise os campos informados.","fieldErrors":{"title":"Informe o título."}}
```

Trate `400`, `401`, `403`, `404`, `413`, `415`, `422`, `429` e `500`. Não exponha mensagens técnicas diretamente.

## Upload e download

- Aceitos: PDF, DOC, DOCX, XLS, XLSX, JPG e PNG; limite de 10 MB.
- O backend deve repetir validação de tamanho e verificar conteúdo real.
- Gere nome seguro e aplique controle de acesso.
- Para arquivos privados, use streaming autenticado ou URL assinada curta.

## Troca dos mocks pela API

1. Crie `apiItemsService` implementando `ItemsService`.
2. Use `NEXT_PUBLIC_API_BASE_URL` em um cliente HTTP centralizado.
3. Selecione o serviço por `NEXT_PUBLIC_DATA_SOURCE`.
4. Mantenha componentes e hooks inalterados.
5. Adicione autenticação corporativa no cliente, nunca nos componentes.
