import { defineConfig, loadEnv, type ProxyOptions } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * O navegador fala só com o Vite (porta 5173). O Vite repassa:
 *   /api/bilheteria/*  ->  BILHETERIA_URL (padrão http://localhost:8080)
 *   /api/pagamentos/*  ->  PAGAMENTOS_URL (padrão http://localhost:8081)
 * Assim não é preciso configurar CORS nos backends.
 */
function proxyPara(alvo: string, prefixo: string, nome: string): ProxyOptions {
  return {
    target: alvo,
    changeOrigin: true,
    // Evita a página de aviso do ngrok gratuito quando o backend está atrás dele.
    headers: { 'ngrok-skip-browser-warning': 'true' },
    rewrite: (caminho) => caminho.replace(prefixo, ''),
    configure: (proxy) => {
      // Backend fora do ar: responde 502 em JSON, no mesmo formato do ErroResposta.
      proxy.on('error', (_erro, _req, res) => {
        if (res && 'writeHead' in res && !res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({
            codigo: 'servico_offline',
            mensagem: `${nome} não respondeu em ${alvo}`,
            detalhes: [],
          }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') }
  const bilheteria = env.BILHETERIA_URL || 'http://localhost:8080'
  const pagamentos = env.PAGAMENTOS_URL || 'http://localhost:8081'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api/bilheteria': proxyPara(bilheteria, '/api/bilheteria', 'Bilheteria'),
        '/api/pagamentos': proxyPara(pagamentos, '/api/pagamentos', 'Pagamentos'),
      },
    },
  }
})
