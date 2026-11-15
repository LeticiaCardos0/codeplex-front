# codeplex-front

Front (React + Vite) da **Bilheteria** e de **Pagamentos**.

- **Bilheteria**: cria eventos, compra ingressos e acompanha o status ao vivo
  (`PENDENTE` → `PAGO`/`CANCELADO` quando o webhook chega).
- **Pagamentos**: lista as cobranças com status, `tentativas_webhook` e `webhook_entregue`, e consulta
  por id.

## Rodar

Pré-requisito: Node 20+.

```bash
npm install
npm run dev
```

Abra http://localhost:5173.

O navegador só fala com o Vite. O Vite repassa as chamadas aos backends, então não é preciso CORS:

| Prefixo no front | Vai para | Variável |
|---|---|---|
| `/api/bilheteria/*` | `http://localhost:8080` | `BILHETERIA_URL` |
| `/api/pagamentos/*` | `http://localhost:8081` | `PAGAMENTOS_URL` |

Exemplo apontando para as máquinas dos times:

```bash
BILHETERIA_URL=http://192.168.0.10:8080 PAGAMENTOS_URL=http://192.168.0.20:8081 npm run dev
```

## Endpoints usados

| Serviço | Endpoint |
|---|---|
| Bilheteria | `GET/POST /eventos`, `POST /eventos/{id}/comprar`, `GET /ingressos`, `GET /ingressos/{id}` |
| Pagamentos | `GET /cobrancas/{id}` (contrato). Se o time expuser `GET /cobrancas`, a lista usa ele; senão, monta a lista a partir das `cobranca_id` dos ingressos |
