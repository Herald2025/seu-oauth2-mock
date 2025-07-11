export interface User {
  id: string;
  password?: string;
  email?: string;
  cardId?: string;
  realName?: string;
  department?: string;
  userType?: string;
  studentNumber?: string;
  gender?: string;
}

export interface Client {
  id: string;
  clientSecret: string;
  grants: string[];
  redirectUris?: string[]; // 改为可选，因为会在代码中动态生成
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
  redirectUri?: string;
}

export interface AuthorizationCode {
  authorizationCode: string;
  expiresAt: Date;
  redirectUri: string;
  scope?: string | string[];
  client: Client;
  user: User;
}
