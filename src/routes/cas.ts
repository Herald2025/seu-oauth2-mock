import express, { Router, Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { Request, Response, Token } from 'oauth2-server';
import { randomUUID } from 'crypto';
import oauth from '../oauth/oauth.js';
import { User, Token as AppToken } from '../types/index.js';
import { setCurrentRedirectUri } from '../oauth/model.js';
import localOAuth2 from '../data/localOAuth2.json' with { type: 'json' };

const casRouter = Router();
const localUsers: User[] = Array.isArray(localOAuth2?.users) ? localOAuth2.users as User[] : [];

const normalizePrefix = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '/') return '';
  const withLeading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeading.endsWith('/') ? withLeading.slice(0, -1) : withLeading;
};

const prefixFromPathEnding = (pathname: string, endpointPath: string): string => {
  if (!pathname.endsWith(endpointPath)) return '';
  return normalizePrefix(pathname.slice(0, pathname.length - endpointPath.length));
};

const prefixFromUrl = (urlValue: string, endpointPath: string): string => {
  try {
    const parsed = new URL(urlValue, 'http://localhost');
    return prefixFromPathEnding(parsed.pathname, endpointPath);
  } catch {
    return '';
  }
};

const getDeploymentPrefix = (req: ExpressRequest, endpointPath: string = req.path): string => {
  const forwardedPrefix = req.get('x-forwarded-prefix');
  if (forwardedPrefix) {
    const first = forwardedPrefix.split(',')[0] || '';
    return normalizePrefix(first);
  }

  const forwardedUri = req.get('x-forwarded-uri') || req.get('x-original-uri') || req.get('x-rewrite-url');
  if (forwardedUri) {
    const fromForwardedUri = prefixFromUrl(forwardedUri, endpointPath);
    if (fromForwardedUri) return fromForwardedUri;
  }

  const referer = req.get('referer');
  if (referer) {
    const fromReferer = prefixFromUrl(referer, endpointPath);
    if (fromReferer) return fromReferer;
  }

  const configuredBasePath = process.env.BASE_PATH || process.env.PUBLIC_BASE_PATH || '';
  if (configuredBasePath) {
    return normalizePrefix(configuredBasePath);
  }

  const originalPath = req.originalUrl.split('?')[0];
  if (originalPath.endsWith(req.path)) {
    return normalizePrefix(originalPath.slice(0, originalPath.length - req.path.length));
  }
  return normalizePrefix(req.baseUrl || '');
};

const withPrefix = (req: ExpressRequest, absolutePath: string): string => {
  const prefix = getDeploymentPrefix(req);
  return `${prefix}${absolutePath}`;
};

const getFormPrefix = (req: ExpressRequest, endpointPath: string = req.path): string => {
  const fromBody = typeof req.body?.form_prefix === 'string' ? req.body.form_prefix : '';
  return normalizePrefix(fromBody) || getDeploymentPrefix(req, endpointPath);
};

// Middleware to add SEU-style security headers
casRouter.use((req, res, next) => {
  // Add security headers matching SEU system
  res.set({
    'requestid': randomUUID(),
    'cache-control': 'no-cache, no-store, max-age=0, must-revalidate',
    'pragma': 'no-cache',
    'expires': '0',
    'strict-transport-security': 'max-age=15768000 ; includeSubDomains',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'x-xss-protection': '1; mode=block',
    'content-language': 'en'
  });
  next();
});

// CAS OAuth2.0 Authorization Endpoint
casRouter.get('/cas/oauth2.0/authorize', (req: ExpressRequest, res: ExpressResponse) => {
  // Show login page with CAS style
  const { client_id, redirect_uri, response_type } = req.query;
  
  // ===== 添加详细调试日志 =====
  console.log('=== CAS AUTHORIZE DEBUG ===');
  console.log('原始请求URL:', req.url);
  console.log('原始query对象:', req.query);
  console.log('client_id:', client_id);
  console.log('redirect_uri类型:', typeof redirect_uri);
  console.log('redirect_uri长度:', redirect_uri ? (redirect_uri as string).length : 'undefined');
  console.log('redirect_uri内容:', redirect_uri);
  console.log('response_type:', response_type);
  console.log('===========================');
  
  // 验证必要参数
  if (!client_id || !redirect_uri || !response_type) {
    res.status(400).json({
      error: 'invalid_request',
      error_description: 'Missing required parameters'
    });
    return;
  }

  // 规范化redirect_uri：若为相对路径或本地默认，改为当前请求域名
  const getProto = () => (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
  const getHost = () => (req.headers['x-forwarded-host'] as string) || req.get('host') || 'localhost';
  const normalizeRedirectUri = (uri: string | string[] | undefined) => {
    const raw = Array.isArray(uri) ? uri[0] : (uri || '');
    try {
      // 绝对URL直接使用
      if (/^https?:\/\//i.test(raw)) return raw;
      // 空或相对路径，使用当前域名拼接
      const base = `${getProto()}://${getHost()}`;
      if (!raw) return `${base}/callback`;
      return new URL(raw, base).toString();
    } catch {
      // 兜底为当前域名/callback
      return `${getProto()}://${getHost()}/callback`;
    }
  };

  const normalizedRedirectUri = normalizeRedirectUri(redirect_uri as unknown as string | string[] | undefined);
  const formPrefix = getDeploymentPrefix(req, '/cas/oauth2.0/authorize');
  // 设置当前的redirect_uri以便OAuth2验证时使用
  setCurrentRedirectUri(normalizedRedirectUri);
  
  // HTML转义函数
  const escapeHtml = (unsafe: string): string => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };
  
  // 从本地JSON加载账号列表并生成账号卡片（不区分老师学生）
  let accountCardsHtml = '';
  try {
    accountCardsHtml = localUsers
      .map((u) => `
        <div class="account-card" onclick="fillAccount('${(u.id)}', '${(u.password)}')">
          <div class="account-main">${escapeHtml(u.realName || u.id)} (${escapeHtml(u.id)})</div>
          <div class="account-detail">${escapeHtml(u.department || '')}</div>
        </div>
      `)
      .join('\n');
  } catch (e) {
    console.error('加载本地账号数据失败:', e);
    accountCardsHtml = '<div style="color:#d32f2f;">加载本地账号数据失败</div>';
  }

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>（仿）东南大学统一身份认证</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 50px; background-color: #f5f5f5; }
            .login-container { background: white; padding: 30px; border-radius: 8px; max-width: 400px; margin: 0 auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .logo { text-align: center; margin-bottom: 20px; color: #1976d2; }
            .form-group { margin-bottom: 15px; }
            label { display: block; margin-bottom: 5px; font-weight: bold; }
            input[type="text"], input[type="password"] { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
            button { width: 100%; padding: 12px; background-color: #1976d2; color: white; border: none; border-radius: 4px; font-size: 16px; cursor: pointer; }
            button:hover { background-color: #1565c0; }
            .test-info { background-color: #e3f2fd; padding: 15px; border-radius: 6px; margin-bottom: 20px; font-size: 14px; }
            .debug-info { background-color: #fff3cd; padding: 10px; border-radius: 4px; margin-bottom: 20px; font-size: 12px; word-break: break-all; }
            
            /* 账号卡片样式 */
            .account-card {
                background: white;
                border: 1px solid #e0e0e0;
                border-radius: 6px;
                padding: 10px;
                cursor: pointer;
                transition: all 0.2s ease;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .account-card:hover {
                background: #f8f9fa;
                border-color: #1976d2;
                box-shadow: 0 2px 8px rgba(25,118,210,0.15);
                transform: translateY(-1px);
            }
            .account-card:active {
                transform: translateY(0);
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .account-main {
                font-weight: bold;
                color: #333;
                font-size: 13px;
                margin-bottom: 4px;
            }
            .account-detail {
                color: #666;
                font-size: 11px;
                line-height: 1.3;
            }
        </style>
    </head>
    <body>
        <div class="login-container">
            <div class="logo">
                <h2>（仿）东南大学统一身份认证</h2>
            </div>
            
            <!-- 调试信息显示 -->
            <div class="debug-info">
                <strong>调试信息:</strong><br>
                redirect_uri: ${escapeHtml(redirect_uri as string)}<br>
                规范化: ${escapeHtml(normalizedRedirectUri)}
            </div>
            
            <div class="test-info">
                <strong>测试环境 - 一键登录</strong><br>
                <div style="margin-top: 15px; display: grid; grid-template-columns: 1fr; gap: 8px;">
                  ${accountCardsHtml}
                </div>
                <div style="margin-top: 12px; font-size: 11px; color: #666; text-align: center;">
                    💡 点击上方卡片快速填入测试账号密码（来自 localOAuth2.json）
                </div>
            </div>
            <form method="post" action="${escapeHtml(withPrefix(req, '/cas/oauth2.0/authorize'))}">
                <input type="hidden" name="form_prefix" value="${escapeHtml(formPrefix)}" />
                <input type="hidden" name="client_id" value="${escapeHtml(req.query.client_id as string)}" />
                <input type="hidden" name="redirect_uri" value="${escapeHtml(normalizedRedirectUri)}" />
                <input type="hidden" name="response_type" value="${escapeHtml(req.query.response_type as string)}" />
                <input type="hidden" name="scope" value="${escapeHtml((req.query.scope as string) || '')}" />
                <input type="hidden" name="state" value="${escapeHtml((req.query.state as string) || '')}" />
                
                <div class="form-group">
                    <label>用户名:</label>
                    <input type="text" name="username" required />
                </div>
                
                <div class="form-group">
                    <label>密码:</label>
                    <input type="password" name="password" required />
                </div>
                
                <button type="submit">登录</button>
            </form>
        </div>
        
        <script>
            function fillAccount(username, password) {
                document.querySelector('input[name="username"]').value = username;
                document.querySelector('input[name="password"]').value = password;
            }
        </script>
    </body>
    </html>
  `);
});

// CAS OAuth2.0 Authorization POST Handler
casRouter.post('/cas/oauth2.0/authorize', async (req: ExpressRequest, res: ExpressResponse) => {
  // ===== 添加详细调试日志 =====
  console.log('=== CAS AUTHORIZE POST DEBUG ===');
  console.log('POST body:', req.body);
  console.log('redirect_uri from body:', req.body.redirect_uri);
  console.log('redirect_uri类型:', typeof req.body.redirect_uri);
  console.log('redirect_uri长度:', req.body.redirect_uri ? req.body.redirect_uri.length : 'undefined');
  console.log('form_prefix:', req.body.form_prefix);
  console.log('================================');
  const formPrefix = getFormPrefix(req, '/cas/oauth2.0/authorize');
  
  // 设置当前的redirect_uri以便OAuth2验证时使用（按请求域名规范化）
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
  const host = (req.headers['x-forwarded-host'] as string) || req.get('host') || 'localhost';
  const normalize = (uri: string | undefined) => {
    const raw = uri || '';
    try {
      if (/^https?:\/\//i.test(raw)) return raw;
      const base = `${proto}://${host}`;
      if (!raw) return `${base}/callback`;
      return new URL(raw, base).toString();
    } catch {
      return `${proto}://${host}/callback`;
    }
  };
  setCurrentRedirectUri(normalize(req.body.redirect_uri));

  const request = new Request(req);
  const response = new Response(res);

  // Mock authentication function compatible with SEU system
  const authenticate = async () => {
    const { username, password } = req.body;
    return localUsers.find((u: User) => u.id === username && u.password === password) || null;
  };

  try {
    const user = await authenticate();
    if (!user) {
      // If authentication fails, redirect back with error
      // 修复：避免二次编码问题，直接构建URL
      const params = new URLSearchParams();
      params.set('client_id', req.body.client_id || '');
      params.set('redirect_uri', req.body.redirect_uri || '');
      params.set('response_type', req.body.response_type || '');
      params.set('scope', req.body.scope || '');
      params.set('state', req.body.state || '');
      params.set('error', 'invalid_credentials');
      
      const errorUrl = `${formPrefix}/cas/oauth2.0/authorize?${params.toString()}`;
      console.log('认证失败，重定向到:', errorUrl);
      res.redirect(errorUrl);
      return;
    }
    
    const options = {
        authenticateHandler: {
            handle: () => user
        }
    };

    console.log('开始OAuth2授权流程...');
    const code = await oauth.authorize(request, response, options);
    console.log('OAuth2授权成功，生成的code:', code);
    res.locals.oauth = { code: code };
    res.status(response.status || 302).set(response.headers).send();
  } catch (err: any) {
    console.error('OAuth2授权错误:', err);
    res.status(err.code || 500).json({
      error: err.name || 'server_error',
      error_description: err.message || 'Internal server error'
    });
  }
});

// CAS OAuth2.0 Access Token Endpoint
casRouter.post('/cas/oauth2.0/accessToken', (req: ExpressRequest, res: ExpressResponse) => {
  // 设置当前的redirect_uri以便OAuth2验证时使用
  if (req.body.redirect_uri) {
    setCurrentRedirectUri(req.body.redirect_uri);
  }

  const request = new Request(req);
  const response = new Response(res);
  
  // 调试日志
  console.log('[CAS] 令牌端点请求:', req.body);
  console.log('[CAS] 请求头:', req.headers);
  
  oauth.token(request, response)
    .then((token: Token) => {
      console.log('[CAS] 令牌生成成功:', token.accessToken);
      res.locals.oauth = { token: token };
      // Return in SEU compatible format (JSON for both success and error)
      res.setHeader('Content-Type', 'application/json;charset=UTF-8');
      res.json({
        access_token: token.accessToken,
        token_type: 'bearer',
        expires_in: 28800, // 8小时，匹配SEU系统
        scope: token.scope || 'read:user,user:email'
      });
    })
    .catch((err: any) => {
      console.log('[CAS] 令牌端点错误:', err);
      // Return JSON format for errors (matching SEU system behavior)
      res.status(err.code || 400)
         .setHeader('Content-Type', 'application/json;charset=UTF-8')
         .json({
           error: err.name === 'InvalidGrantError' ? 'invalid_grant' : 
                  err.name === 'InvalidClientError' ? 'invalid_client' :
                  err.name === 'UnsupportedGrantTypeError' ? 'unsupported_grant_type' :
                  'invalid_request',
           error_description: err.message
         });
    });
});

// CAS OAuth2.0 Profile Endpoint
casRouter.get('/cas/oauth2.0/profile', (req: ExpressRequest, res: ExpressResponse) => {
  const authHeader = req.get('Authorization');
  const accessToken = authHeader?.replace('Bearer ', '') || req.query.access_token as string;
  
  if (!accessToken) {
    res.status(401)
       .setHeader('Content-Type', 'application/json;charset=UTF-8')
       .json({
         error: 'expired_accessToken'
       });
    return;
  }

  const request = new Request(req);
  const response = new Response(res);
  
  oauth.authenticate(request, response)
    .then((token: Token) => {
      const user = token.user as User;
      const client = token.client;
      
      // 获取原始service参数（现在从令牌中动态获取）
      const tokenWithRedirect = token as AppToken;
      const originalService = tokenWithRedirect.redirectUri;
      
      // Return user info with complete user information
      res.setHeader('Content-Type', 'application/json;charset=UTF-8');
              res.json({
          oauthClientId: client?.id || 'localOAuth2',
          service: originalService || '', // 返回令牌中存储的service/redirectUri
          id: user.id,
          client_id: client?.id || 'localOAuth2',
          email: user.email,
          realName: user.realName,
          department: user.department,
          userType: user.userType,
          studentNumber: user.studentNumber,
          gender: user.gender
        });
    })
    .catch((_err: any) => {
      // Use SEU standard error format
      res.status(401)
         .setHeader('Content-Type', 'application/json;charset=UTF-8')
         .json({
           error: 'expired_accessToken'
         });
    });
});

// CAS OAuth2.0 Callback Authorize Endpoint (discovered from real system)
casRouter.get('/cas/oauth2.0/callbackAuthorize', async (req: ExpressRequest, res: ExpressResponse) => {
  // This endpoint handles the callback after user authentication
  // It should redirect to the original authorize endpoint for processing
  const { client_id, redirect_uri, response_type, state, _client_name } = req.query;
  
  // Redirect to our authorize endpoint for processing
  const authorizeUrl = `${withPrefix(req, '/cas/oauth2.0/authorize')}?${new URLSearchParams({
    client_id: client_id as string,
    redirect_uri: redirect_uri as string,
    response_type: response_type as string,
    state: state as string
  }).toString()}`;
  
  res.redirect(authorizeUrl);
});

// Update login page to match SEU's SPA structure
casRouter.get('/dist/main/login', (req: ExpressRequest, res: ExpressResponse) => {
  const serviceUrl = req.query.service as string;
  const formPrefix = getDeploymentPrefix(req, '/dist/main/login');
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>（仿）东南大学统一身份认证</title>
        <style>
            body { 
                font-family: 'Microsoft YaHei', Arial, sans-serif; 
                margin: 0; 
                padding: 0; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .login-container { 
                background: white; 
                padding: 40px; 
                border-radius: 12px; 
                max-width: 420px; 
                width: 90%;
                box-shadow: 0 15px 35px rgba(0,0,0,0.1), 0 5px 15px rgba(0,0,0,0.07);
                position: relative;
                overflow: hidden;
            }
            .login-container::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: linear-gradient(90deg, #667eea, #764ba2);
            }
            .logo { 
                text-align: center; 
                margin-bottom: 30px; 
                color: #333;
            }
            .logo h1 {
                margin: 0;
                font-size: 24px;
                font-weight: 300;
            }
            .logo .subtitle {
                color: #666;
                font-size: 14px;
                margin-top: 5px;
            }
            .form-group { 
                margin-bottom: 20px; 
                position: relative;
            }
            label { 
                display: block; 
                margin-bottom: 8px; 
                font-weight: 500;
                color: #555;
                font-size: 14px;
            }
            input[type="text"], input[type="password"] { 
                width: 100%; 
                padding: 12px 16px; 
                border: 2px solid #e1e5e9; 
                border-radius: 8px; 
                box-sizing: border-box;
                font-size: 16px;
                transition: border-color 0.3s ease;
            }
            input[type="text"]:focus, input[type="password"]:focus {
                outline: none;
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }
            button { 
                width: 100%; 
                padding: 14px; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white; 
                border: none; 
                border-radius: 8px; 
                font-size: 16px; 
                font-weight: 500;
                cursor: pointer;
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            }
            button:hover { 
                transform: translateY(-1px);
                box-shadow: 0 7px 14px rgba(102, 126, 234, 0.4);
            }
            button:active {
                transform: translateY(0);
            }
            .test-info { 
                background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
                padding: 16px; 
                border-radius: 8px; 
                margin-bottom: 25px; 
                font-size: 13px;
                border-left: 4px solid #667eea;
            }
            .test-info strong {
                color: #333;
            }
            .service-info {
                background: #f8f9fa;
                padding: 12px;
                border-radius: 6px;
                font-size: 12px;
                color: #666;
                margin-bottom: 20px;
                word-break: break-all;
            }
        </style>
    </head>
    <body>
        <div class="login-container">
            <div class="logo">
                <h1>东南大学</h1>
                <div class="subtitle">统一身份认证系统</div>
            </div>
            
            ${serviceUrl ? `<div class="service-info">
                <strong>回调服务:</strong><br>
                ${decodeURIComponent(serviceUrl)}
            </div>` : ''}
            
            <div class="test-info">
                <strong>测试环境</strong><br>
                <div style="margin-top: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <button type="button" onclick="fillAccount('213001001', 'JYc1g3e5BccjxPr')" style="background: #6c757d; color: white; border: none; padding: 8px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                        213001001
                    </button>
                    <button type="button" onclick="fillAccount('213001002', 'Icarus1432')" style="background: #6c757d; color: white; border: none; padding: 8px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                        213001002
                    </button>
                    <button type="button" onclick="fillAccount('213001003', 'DevTest2024')" style="background: #6c757d; color: white; border: none; padding: 8px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                        213001003
                    </button>
                    <button type="button" onclick="fillAccount('100000001', 'AdminPass123')" style="background: #6c757d; color: white; border: none; padding: 8px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                        100000001
                    </button>
                </div>
                <div style="margin-top: 10px; font-size: 11px; color: #666;">
                    点击上方按钮快速填入测试账号
                </div>
            </div>
            
            <form method="post" action="${withPrefix(req, '/cas/oauth2.0/login')}">
                <input type="hidden" name="form_prefix" value="${formPrefix}" />
                <input type="hidden" name="service" value="${serviceUrl || ''}" />
                
                <div class="form-group">
                    <label>用户名:</label>
                    <input type="text" name="username" required placeholder="请输入用户名" />
                </div>
                
                <div class="form-group">
                    <label>密码:</label>
                    <input type="password" name="password" required placeholder="请输入密码" />
                </div>
                
                <button type="submit">登录</button>
            </form>
        </div>
        
        <script>
            function fillAccount(username, password) {
                document.querySelector('input[name="username"]').value = username;
                document.querySelector('input[name="password"]').value = password;
            }
        </script>
    </body>
    </html>
  `);
});

// Handle login form submission
casRouter.post('/cas/oauth2.0/login', async (req: ExpressRequest, res: ExpressResponse) => {
  const { username, password, service } = req.body;
  const formPrefix = getFormPrefix(req, '/cas/oauth2.0/login');
  
  // Authenticate user
  const user = localUsers.find((u: User) => u.id === username && u.password === password) || null;
  
  if (!user) {
    // Redirect back to login with error
    res.redirect(`${formPrefix}/dist/main/login?service=${encodeURIComponent(service)}&error=invalid_credentials`);
    return;
  }
  
  // User authenticated, redirect to service
  if (service) {
    // Add a ticket parameter (simulate CAS ticket)
    const ticket = `ST-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const serviceUrl = new URL(service);
    serviceUrl.searchParams.set('ticket', ticket);
    
    res.redirect(serviceUrl.toString());
  } else {
    res.send(`
      <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
        <h1 style="color: #4caf50;">✅ 登录成功</h1>
        <p>用户: ${user.realName || user.id}</p>
        <p>邮箱: ${user.email}</p>
      </div>
    `);
  }
});

// CAS Logout Endpoint
casRouter.get('/dist/logOut', (req: ExpressRequest, res: ExpressResponse) => {
  const redirectUrl = req.query.redirectUrl as string;
  
  // Note: Session clearing would require session middleware setup
  // For now, we'll just handle the logout redirect
  
  // Redirect to the specified URL or show logout success page
  if (redirectUrl) {
    res.redirect(redirectUrl);
  } else {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>登出成功</title>
          <style>
              body { font-family: Arial, sans-serif; margin: 50px; background-color: #f5f5f5; }
              .logout-container { background: white; padding: 30px; border-radius: 8px; max-width: 400px; margin: 0 auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
              .success { color: #4caf50; }
          </style>
      </head>
      <body>
          <div class="logout-container">
              <h2 class="success">登出成功</h2>
              <p>您已成功登出东南大学统一身份认证系统</p>
              <p><a href="${withPrefix(req, '/cas/oauth2.0/authorize')}">重新登录</a></p>
          </div>
      </body>
      </html>
    `);
  }
});

export default casRouter; 
