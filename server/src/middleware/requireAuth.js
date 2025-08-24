import jwt from 'jsonwebtoken'
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

export function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || ''
    const [scheme, token] = auth.split(' ')
    if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'Missing token' })
    req.jwt = jwt.verify(token, JWT_SECRET) // { sub, role, iat, exp }
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}
