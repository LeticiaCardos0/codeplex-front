# codeplex-front

**Plateia**: loja de ingressos (React + Vite) ligada às APIs de **Bilheteria** e **Pagamentos**.

| Página | Rota | O que faz |
|---|---|---|
| Vitrine | `#/` | Evento em destaque, busca e cards dos próximos eventos |
| Evento | `#/evento/{id}` | Detalhes e checkout (quantidade, CPF, final do cartão) |
| Pedido | `#/pedido/{id}` | Acompanha o pagamento ao vivo e mostra o ingresso quando `PAGO` |
| Meus ingressos | `#/meus-ingressos` | Ingressos do CPF usado na compra |
| Área do produtor | `#/produtor/eventos` e `#/produtor/pagamentos` | Publica eventos, vendas e receita, cobranças de Pagamentos |

Ambiente de demonstração: cartão final `4242` aprova e `0000` recusa. As imagens dos eventos são
ilustrativas (picsum.photos), porque a API não tem foto.

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
