import { 
  AuthorizationCodeModel, 
  Client, 
  User, 
  Token, 
  AuthorizationCode,
  RefreshTokenModel,
  RefreshToken
} from 'oauth2-server';
import { fileURLToPath } from 'url';
import * as fs from 'fs';
import * as path from 'path';
import { Client as AppClient, User as AppUser, AuthorizationCode as AppAuthorizationCode, Token as AppToken } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = process.env.DATA_PATH || path.join(process.cwd(), 'data');

// SEU兼容的令牌生成工具
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateSEUAuthorizationCode(): string {
  const version = '12'; // 固定版本号，匹配SEU系统
  const randomString = generateRandomString(32); // 32字符随机串
  return `OC-${version}-${randomString}`;
}

function generateSEUAccessToken(): string {
  const version = '7'; // 固定版本号，匹配SEU系统
  const randomString = generateRandomString(32); // 32字符随机串
  return `AT-${version}-${randomString}`;
}

// In-memory storage for codes and tokens
const authorizationCodes: AppAuthorizationCode[] = [];
const tokens: AppToken[] = [];

const getClient = async (clientId: string): Promise<AppClient | undefined> => {
  const filePath = path.join(dataPath, `${clientId}.json`);
  if (fs.existsSync(filePath)) {
    const clientData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return clientData as AppClient;
  }
  return undefined;
};

const model: AuthorizationCodeModel & RefreshTokenModel = {
  getClient: async (clientId: string, clientSecret: string | null): Promise<Client | undefined> => {
    const client = await getClient(clientId);
    
    // 调试日志
    console.log(`[OAuth] 客户端验证: ID=${clientId}, Secret=${clientSecret ? '***' : 'null'}`);
    console.log(`[OAuth] 找到客户端:`, client ? `ID=${client.id}, Secret=${client.clientSecret ? '***' : 'null'}` : 'null');
    
    if (client) {
      // 对于授权端点，clientSecret可能为null
      if (clientSecret === null || client.clientSecret === clientSecret) {
        // 生成非常宽泛的redirectUris列表，覆盖常见的开发场景
        const universalRedirectUris = [];
        
        // 添加原有的配置（如果存在的话）
        if (client.redirectUris && client.redirectUris.length > 0) {
          universalRedirectUris.push(...client.redirectUris);
        }
        
        // 添加常见端口的各种路径组合
        const ports = [3000, 3001, 3002, 3003, 3004, 3005, 4000, 5000, 5173, 5174, 5175, 7008, 8000, 8080, 8081, 9000, 9090];
        const paths = ['/callback', '/auth/callback', '/oauth/callback', '/login', '/auth/login', '/oauth/login'];
        const hosts = ['localhost', '127.0.0.1'];
        
        // 生成所有可能的组合
        for (const host of hosts) {
          for (const port of ports) {
            for (const path of paths) {
              universalRedirectUris.push(`http://${host}:${port}${path}`);
              universalRedirectUris.push(`https://${host}:${port}${path}`);
            }
          }
        }
        
        return {
          id: client.id,
          grants: client.grants,
          redirectUris: [...new Set(universalRedirectUris)] // 去重
        };
      }
    }
    return undefined;
  },

  saveAuthorizationCode: async (code: AuthorizationCode, client: Client, user: User): Promise<AuthorizationCode> => {
    // 使用SEU格式的授权码
    const seuAuthCode = generateSEUAuthorizationCode();
    const authCode: AppAuthorizationCode = {
      authorizationCode: seuAuthCode,
      expiresAt: code.expiresAt,
      redirectUri: code.redirectUri as string,
      scope: code.scope || [],
      client: client as AppClient,
      user: user as AppUser,
    };
    authorizationCodes.push(authCode);
    return authCode;
  },

  getAuthorizationCode: async (authorizationCode: string): Promise<AuthorizationCode | undefined> => {
    const code = authorizationCodes.find(c => c.authorizationCode === authorizationCode);
    if (code) {
      return code;
    }
    return undefined;
  },

  revokeAuthorizationCode: async (code: AuthorizationCode): Promise<boolean> => {
    const index = authorizationCodes.findIndex(c => c.authorizationCode === code.authorizationCode);
    if (index !== -1) {
      authorizationCodes.splice(index, 1);
      return true;
    }
    return false;
  },

  saveToken: async (token: Token, client: Client, user: User): Promise<Token> => {
    // 使用SEU格式的访问令牌
    const seuAccessToken = generateSEUAccessToken();
    const newToken: AppToken = {
      ...token,
      accessToken: seuAccessToken,
      accessTokenExpiresAt: new Date(Date.now() + 28800000), // 8小时有效期
      client: client as AppClient,
      user: user as AppUser,
    };
    tokens.push(newToken);
    return newToken;
  },

  getAccessToken: async (accessToken: string): Promise<Token | undefined> => {
    const token = tokens.find(t => t.accessToken === accessToken);
    if (token) {
      return token;
    }
    return undefined;
  },

  getRefreshToken: async (refreshToken: string): Promise<RefreshToken | undefined> => {
    const token = tokens.find(t => t.refreshToken === refreshToken);
    if (token && token.refreshToken) {
      return {
        refreshToken: token.refreshToken,
        refreshTokenExpiresAt: token.refreshTokenExpiresAt,
        scope: token.scope,
        client: token.client,
        user: token.user,
      };
    }
    return undefined;
  },

  revokeToken: async (token: Token): Promise<boolean> => {
    const index = tokens.findIndex(t => t.refreshToken === token.refreshToken);
    if (index !== -1) {
      tokens.splice(index, 1);
      return true;
    }
    return false;
  },

  verifyScope: async (token: Token, scope: string | string[]): Promise<boolean> => {
    if (!token.scope) {
      return false;
    }
    const requestedScopes = Array.isArray(scope) ? scope : [scope];
    const authorizedScopes = Array.isArray(token.scope) ? token.scope : [token.scope];
    return requestedScopes.every(s => authorizedScopes.includes(s));
  },
};

export default model;
