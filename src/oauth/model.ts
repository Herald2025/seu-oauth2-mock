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
    if (client && client.clientSecret === clientSecret) {
      return {
        id: client.id,
        grants: client.grants,
        redirectUris: client.redirectUris,
      };
    }
    return undefined;
  },

  saveAuthorizationCode: async (code: AuthorizationCode, client: Client, user: User): Promise<AuthorizationCode> => {
    const authCode: AppAuthorizationCode = {
      authorizationCode: code.authorizationCode,
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
    const newToken: AppToken = {
      ...token,
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
