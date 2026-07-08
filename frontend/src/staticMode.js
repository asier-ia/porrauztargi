const BASE = import.meta.env.BASE_URL || '/'

export const assetUrl = (path) => `${BASE}${path.replace(/^\//, '')}`

const isStatic = import.meta.env.VITE_STATIC_MODE === 'true'

if (isStatic) {
  const ORIGINAL_FETCH = window.fetch.bind(window)

  window.fetch = function (input, init) {
    const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : '')
    const method = init?.method?.toUpperCase() || (input instanceof Request ? input.method : 'GET')

    if (method === 'GET') {
      const path = url.replace(/^https?:\/\/[^/]+/, '').split('?')[0]

      const rewrite = (staticPath) => ORIGINAL_FETCH(`${BASE}${staticPath}`)

      if (path.endsWith('/api/ranking')) return rewrite('data/ranking.json')
      if (path.endsWith('/api/participants')) return rewrite('data/participants.json')
      if (path.endsWith('/api/scorers')) return rewrite('data/scorers.json')
      if (path.endsWith('/api/results')) return rewrite('data/results.json')
      if (path.endsWith('/api/next-update')) return rewrite('data/next-update.json')

      if (path.includes('/api/matches')) {
        const dateMatch = url.match(/date=(\d{4}-\d{2}-\d{2})/)
        return rewrite('data/matches.json').then(async (res) => {
          const all = await res.json()
          const filtered = dateMatch ? all.filter(m => m.utcDate.startsWith(dateMatch[1])) : all
          return new Response(JSON.stringify(filtered), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        })
      }

      if (path.includes('/api/participants/')) {
        const m = path.match(/\/api\/participants\/(\d+)(\/.+)?$/)
        if (m && !m[2]) return rewrite(`data/participants/${m[1]}.json`)
      }
    }

    if (method === 'POST') {
      if (url.includes('/api/create-payment-intent')) {
        return Promise.resolve(
          new Response(JSON.stringify({
            detail: 'Las donaciones están disponibles en la web real: porrauztargi.korpoweb.com'
          }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          })
        )
      }
      if (url.includes('/api/participants/') && url.includes('/jinx')) {
        return Promise.resolve(
          new Response(JSON.stringify({
            detail: 'El mal de ojo solo está disponible en la web real: porrauztargi.korpoweb.com'
          }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          })
        )
      }
    }

    return ORIGINAL_FETCH(input, init)
  }
}

export default isStatic
