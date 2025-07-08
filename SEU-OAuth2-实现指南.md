# 东南大学OAuth2兼容系统实现指南

## 🎯 概述

基于对东南大学OAuth2系统的完整测试，本文档提供详细的实现指南，确保我们的系统与真实系统完全兼容。

## 📋 核心发现总结

### ✅ 验证成功的关键点
- **Client配置**: `localOAuth2` / `localOAuth2ACB` 完全有效
- **授权流程**: 标准OAuth2授权码模式工作正常
- **响应格式**: 统一使用JSON格式（非YAML）
- **令牌系统**: 特定格式的授权码和访问令牌
- **用户信息**: 简化的用户信息结构

## 🔧 实现要求

### 1. 令牌生成系统

#### 授权码格式 (Authorization Code)
```
格式: OC-{version}-{random_string}
示例: OC-12-tGA5LIBAhhKK4yiaDGBvWHmvMB7QaHi5
```

**实现建议**:
```javascript
function generateAuthorizationCode() {
    const version = '12'; // 固定版本号
    const randomString = generateRandomString(32); // 32字符随机串
    return `OC-${version}-${randomString}`;
}

function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
```

#### 访问令牌格式 (Access Token)
```
格式: AT-{version}-{random_string}
示例: AT-7-suiM0djDVVzhAK9XyudmQNngM3WleWY9
```

**实现建议**:
```javascript
function generateAccessToken() {
    const version = '7'; // 固定版本号
    const randomString = generateRandomString(32); // 32字符随机串
    return `AT-${version}-${randomString}`;
}
```

### 2. 端点响应格式

#### `/cas/oauth2.0/accessToken` 成功响应
```json
{
  "access_token": "AT-7-suiM0djDVVzhAK9XyudmQNngM3WleWY9",
  "token_type": "bearer",
  "expires_in": 28800,
  "scope": "read:user,user:email"
}
```

**实现代码**:
```javascript
// 令牌端点处理
app.post('/cas/oauth2.0/accessToken', (req, res) => {
    // 验证授权码...
    
    const accessToken = generateAccessToken();
    
    res.setHeader('Content-Type', 'application/json;charset=UTF-8');
    res.json({
        access_token: accessToken,
        token_type: 'bearer',
        expires_in: 28800, // 8小时
        scope: req.body.scope || 'read:user,user:email'
    });
});
```

#### `/cas/oauth2.0/profile` 成功响应
```json
{
  "oauthClientId": "localOAuth2",
  "service": "http://localhost:18099/login/oauth2/code/github",
  "id": "TESTUSER",
  "client_id": "localOAuth2"
}
```

**实现代码**:
```javascript
// 用户信息端点处理
app.get('/cas/oauth2.0/profile', (req, res) => {
    // 验证访问令牌...
    
    const user = getCurrentUser(accessToken);
    const originalService = getOriginalService(accessToken); // 从令牌上下文获取
    
    res.setHeader('Content-Type', 'application/json;charset=UTF-8');
    res.json({
        oauthClientId: clientId,
        service: originalService,
        id: user.username,
        client_id: clientId
    });
});
```

### 3. 错误响应格式

#### 统一错误格式
```json
{
  "error": "error_description"
}
```

**常见错误示例**:
- 无效令牌: `{"error": "expired_accessToken"}`
- 无效授权码: `{"error": "invalid_code"}`
- 无效客户端: `{"error": "invalid_client"}`

**实现代码**:
```javascript
function sendError(res, statusCode, errorMessage) {
    res.status(statusCode);
    res.setHeader('Content-Type', 'application/json;charset=UTF-8');
    res.json({
        error: errorMessage
    });
}

// 使用示例
sendError(res, 401, 'expired_accessToken');
```

### 4. 用户数据结构更新

#### 现有User接口需要的字段
```typescript
interface User {
    // 现有字段
    id: string;
    username: string;
    email: string;
    // ... 其他字段
    
    // SEU系统需要的字段（映射关系）
    // id -> username (用户唯一标识)
    // 其他字段根据需要映射
}
```

#### 映射逻辑
```javascript
function mapUserToSEUFormat(user, clientId, originalService) {
    return {
        oauthClientId: clientId,
        service: originalService,
        id: user.username, // 使用username作为用户ID
        client_id: clientId // 重复字段，与oauthClientId相同
    };
}
```

### 5. 会话和上下文管理

#### 保存原始service参数
```javascript
// 在授权端点保存service信息
app.get('/cas/oauth2.0/authorize', (req, res) => {
    const { client_id, redirect_uri, state, scope } = req.query;
    
    // 生成授权码
    const authCode = generateAuthorizationCode();
    
    // 保存上下文信息（可以用Redis或内存存储）
    saveAuthCodeContext(authCode, {
        clientId: client_id,
        redirectUri: redirect_uri,
        state: state,
        scope: scope,
        originalService: redirect_uri // 保存原始service地址
    });
    
    // 重定向到登录页面...
});
```

#### 在令牌交换时传递上下文
```javascript
app.post('/cas/oauth2.0/accessToken', (req, res) => {
    const { code, client_id } = req.body;
    
    // 获取授权码上下文
    const context = getAuthCodeContext(code);
    
    if (!context || context.clientId !== client_id) {
        return sendError(res, 400, 'invalid_code');
    }
    
    const accessToken = generateAccessToken();
    
    // 保存访问令牌上下文
    saveAccessTokenContext(accessToken, {
        userId: getCurrentUserId(), // 从会话中获取
        clientId: client_id,
        originalService: context.originalService,
        scope: context.scope,
        expiresAt: Date.now() + 28800000 // 8小时后过期
    });
    
    res.json({
        access_token: accessToken,
        token_type: 'bearer',
        expires_in: 28800,
        scope: context.scope
    });
});
```

## 🔄 现有代码需要的修改

### 1. OAuth模型更新 (`src/oauth/model.ts`)

```typescript
// 更新generateAccessToken方法
generateAccessToken: async (client, user, scope) => {
    const token = `AT-7-${generateRandomString(32)}`;
    
    // 保存到数据库/内存
    const accessToken = {
        accessToken: token,
        accessTokenExpiresAt: new Date(Date.now() + 28800000), // 8小时
        client,
        user,
        scope
    };
    
    await saveAccessToken(accessToken);
    return accessToken;
},

// 更新generateAuthorizationCode方法  
generateAuthorizationCode: async (client, user, scope) => {
    const code = `OC-12-${generateRandomString(32)}`;
    
    const authCode = {
        authorizationCode: code,
        expiresAt: new Date(Date.now() + 600000), // 10分钟
        client,
        user,
        scope
    };
    
    await saveAuthCode(authCode);
    return authCode;
}
```

### 2. 路由更新 (`src/routes/index.ts`)

```typescript
// 更新用户信息端点
app.get('/cas/oauth2.0/profile', oauth.authenticate(), (req, res) => {
    const user = res.locals.oauth.token.user;
    const client = res.locals.oauth.token.client;
    
    // 获取原始service（需要从令牌上下文获取）
    const originalService = getOriginalServiceFromToken(res.locals.oauth.token);
    
    res.setHeader('Content-Type', 'application/json;charset=UTF-8');
    res.json({
        oauthClientId: client.id,
        service: originalService || client.redirectUris[0],
        id: user.username,
        client_id: client.id
    });
});
```

### 3. 错误处理中间件

```typescript
// 统一错误处理
app.use((err, req, res, next) => {
    if (err.name === 'OAuthError') {
        res.status(err.code || 400);
        res.setHeader('Content-Type', 'application/json;charset=UTF-8');
        res.json({
            error: err.message
        });
    } else {
        next(err);
    }
});
```

## 📝 测试验证

### 完整测试流程
1. 启动服务器
2. 使用测试脚本生成授权URL
3. 浏览器登录获取授权码
4. 使用授权码测试令牌交换
5. 使用访问令牌测试用户信息获取

### 验证要点
- ✅ 授权码格式: `OC-12-xxxxx`
- ✅ 访问令牌格式: `AT-7-xxxxx`
- ✅ 令牌有效期: 28800秒
- ✅ 用户信息结构: 包含 `oauthClientId`, `service`, `id`, `client_id`
- ✅ 错误格式: `{"error": "error_message"}`

## 🎯 实现优先级

### 高优先级 (P0)
1. ✅ 令牌格式生成算法
2. ✅ JSON响应格式统一
3. ✅ 用户信息结构匹配

### 中优先级 (P1)
1. 会话上下文管理
2. 原始service参数传递
3. 完整的错误处理

### 低优先级 (P2)
1. 前端登录页面美化
2. 多用户测试支持
3. 令牌刷新机制（如需要）

## 🚀 部署建议

1. **配置验证**: 确保 `localOAuth2` 客户端配置正确
2. **测试环境**: 先在测试环境验证完整流程
3. **生产部署**: 确认所有端点响应格式正确
4. **监控日志**: 添加详细的OAuth流程日志

**🎊 实现完成后，我们的系统将与东南大学OAuth2系统完全兼容！** 