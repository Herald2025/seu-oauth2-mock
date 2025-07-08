import { Router, Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express';
import { Request, Response, Token } from 'oauth2-server';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import oauth from '../oauth/oauth.js';
import { User } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = process.env.DATA_PATH || path.join(process.cwd(), 'data');

const router = Router();

// Middleware to handle OAuth2 authentication
const authenticateHandler = {
  handle: (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    const request = new Request(req);
    const response = new Response(res);
    return oauth.authenticate(request, response)
      .then((token: Token) => {
        res.locals.oauth = { token: token };
        next();
      })
      .catch((err: any) => {
        res.status(err.code || 500).json(err);
      });
  }
};

// 1. Login Page
router.get('/login', (req, res) => {
  res.send(`
    <h1>Login</h1>
    <form method="post" action="/authorize">
      <input type="hidden" name="client_id" value="${req.query.client_id}" />
      <input type="hidden" name="redirect_uri" value="${req.query.redirect_uri}" />
      <input type="hidden" name="response_type" value="${req.query.response_type}" />
      <input type="hidden" name="scope" value="${req.query.scope}" />
      <label>Username: <input type="text" name="username"></label><br/>
      <label>Password: <input type="password" name="password"></label><br/>
      <button type="submit">Login</button>
    </form>
  `);
});

// 2. Authorization Endpoint
router.post('/authorize', async (req: ExpressRequest, res: ExpressResponse) => {
  const request = new Request(req);
  const response = new Response(res);

  // A simple mock authentication function
  const authenticate = async () => {
    const { username, password } = req.body;
    // This is a mock user lookup. In a real app, you'd query a database.
    const files = fs.readdirSync(dataPath);
    for (const file of files) {
        const clientData = JSON.parse(fs.readFileSync(path.join(dataPath, file), 'utf-8'));
        const user = clientData.users.find((u: User) => u.username === username && u.password === password);
        if (user) {
            return user;
        }
    }
    return null;
  };

  try {
    const user = await authenticate();
    if (!user) {
      // If authentication fails, redirect back to the login page with an error
      const url = new URL(req.headers.referer as string);
      res.redirect(url.pathname + url.search);
      return;
    }
    
    // `authenticateHandler` is what will be deciding whether the user is authenticated or not
    const options = {
        authenticateHandler: {
            handle: () => {
                return user;
            }
        }
    };

    const code = await oauth.authorize(request, response, options);
    res.locals.oauth = { code: code };
    res.status(response.status || 302).set(response.headers).send();
  } catch (err: any) {
    res.status(err.code || 500).json(err);
  }
});


// 3. Token Endpoint
router.post('/token', (req: ExpressRequest, res: ExpressResponse) => {
  const request = new Request(req);
  const response = new Response(res);
  oauth.token(request, response)
    .then((token: Token) => {
      res.locals.oauth = { token: token };
      res.json(token);
    })
    .catch((err: any) => {
      res.status(err.code || 500).json(err);
    });
});

// 4. Protected Resource
router.get('/profile', authenticateHandler.handle, (req, res) => {
  res.json({
    profile: res.locals.oauth.token.user
  });
});

export default router;
