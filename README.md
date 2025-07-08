# 东南大学OAuth2兼容系统 - 项目架构说明

## 📁 项目结构（重构后）

```
oauth2-server/
├── apps/                          # 应用程序目录
│   ├── auth-server/              # OAuth2认证服务器
│   │   └── index.ts              # 认证服务器入口（端口7009）
│   └── demo-frontend/            # 演示前端页面
│       └── index.ts              # 前端服务器入口（端口7008）
├── src/                          # 核心业务逻辑
│   ├── oauth/                    # OAuth2核心实现
│   │   ├── oauth.ts              # OAuth2服务器配置
│   │   └── model.ts              # 数据模型（SEU兼容）
│   ├── routes/                   # 路由定义
│   │   ├── cas.ts                # CAS风格端点（主要）
│   │   ├── demo.ts               # 演示路由
│   │   └── index.ts              # 原始OAuth2路由
│   └── types/                    # TypeScript类型定义
│       └── index.ts              # 接口定义
├── data/                         # 数据存储
│   ├── localOAuth2.json          # SEU兼容客户端配置
│   └── my-app.json               # 演示客户端配置
├── package.json                  # 项目配置（已更新脚本）
└── README.md                     # 本文档
```

## 🚀 启动方式

### 完整系统启动（推荐）
```bash
npm run dev
```
- 🔵 认证服务器：http://localhost:7009
- 🟢 演示前端：http://localhost:7008

### 单独启动
```bash
# 只启动认证服务器
npm run auth-server

# 只启动演示前端
npm run demo-frontend
```

## 🔗 核心端点

### CAS OAuth2.0端点（完全兼容SEU系统）
- **授权端点**: `GET /cas/oauth2.0/authorize`
- **令牌端点**: `POST /cas/oauth2.0/accessToken`
- **用户信息**: `GET /cas/oauth2.0/profile`
- **登出端点**: `GET /dist/logOut`

### 测试配置
- **Client ID**: `localOAuth2`
- **Client Secret**: `localOAuth2ACB`
- **测试账号**: `TEST_USER` / `JYc1g3e5BccjxPr`

## ✅ 已修复的问题

1. **OAuth令牌时效性**: 从1小时修改为8小时（28800秒）匹配SEU系统
2. **令牌格式兼容**: 授权码`OC-12-xxx`，访问令牌`AT-7-xxx`
3. **响应格式统一**: 全部使用JSON格式，包括错误响应
4. **项目架构优化**: 
   - 认证服务器独立为`apps/auth-server`
   - 演示前端独立为`apps/demo-frontend`
   - 保持`src/`作为共享业务逻辑
5. **Concurrency配置**: 更新npm scripts支持同时运行

## 🧪 测试流程

1. 启动系统：`npm run dev`
2. 访问演示页面：http://localhost:7008
3. 点击"开始OAuth2授权流程"
4. 使用测试账号登录
5. 观察完整的OAuth2流程

## 📋 兼容性特征

- ✅ **端点路径**: 完全匹配CAS风格路径
- ✅ **令牌格式**: 与SEU系统格式完全一致
- ✅ **响应格式**: JSON格式，包含所需字段
- ✅ **用户信息**: 返回`oauthClientId`, `service`, `id`, `client_id`
- ✅ **错误处理**: 统一错误格式`{"error": "error_description"}`
- ✅ **安全头部**: 匹配SEU系统的安全配置