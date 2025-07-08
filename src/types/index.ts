export interface User {
  id: string;
  username: string;
  password?: string;
  email?: string;
  cardId?: string;
  realName?: string;
  department?: string;
  userType?: string;
}

export interface Client {
  id: string;
  clientSecret: string;
  grants: string[];
  redirectUris: string[];
  users: User[];
}

export interface Token {
  accessToken: string;
  accessTokenExpiresAt?: Date;
  refreshToken?: string;
  refreshTokenExpiresAt?: Date;
  scope?: string | string[];
  client: Client;
  user: User;
}

export interface AuthorizationCode {
  authorizationCode: string;
  expiresAt: Date;
  redirectUri: string;
  scope?: string | string[];
  client: Client;
  user: User;
}
