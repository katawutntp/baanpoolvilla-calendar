import { getTokenData } from './firebaseApi';

export async function authRequired(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const token = authHeader.substring(7);
  
  try {
    const tokenData = await getTokenData(token);
    if (!tokenData) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    req.user = tokenData;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'unauthorized' });
  }
}

export async function adminRequired(req, res, next) {
  await authRequired(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'forbidden' });
    }
    next();
  });
}

export function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}
