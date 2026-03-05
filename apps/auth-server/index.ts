import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import routes from '../../src/routes/index.js';
import casRoutes from '../../src/routes/cas.js';

const app = express();

// 配置CORS支持跨域请求 - 允许任何来源（测试环境）
app.use(cors({
  origin: true, // 允许任何来源
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Add CAS routes for SEU compatibility
app.use(casRoutes);

// Keep original routes for backward compatibility
app.use(routes);

const PORT = process.env.PORT || 7009; // OAuth2 API端口
const BASE_PATH = (process.env.BASE_PATH || process.env.PUBLIC_BASE_PATH || '').trim();
const normalizedBasePath = BASE_PATH
  ? `/${BASE_PATH.replace(/^\/+|\/+$/g, '')}`
  : '';
const withBasePath = (path: string) => `${normalizedBasePath}${path}`;

app.listen(PORT, () => {
  console.log(`🚀 东南大学OAuth2测试系统启动成功！`);
  console.log(`📍 OAuth2 API服务: http://localhost:${PORT}/`);
  if (normalizedBasePath) {
    console.log(`📁 BASE_PATH: ${normalizedBasePath}`);
  }
  console.log(`\n🔗 CAS OAuth2端点:`);
  console.log(`  认证: http://localhost:${PORT}${withBasePath('/cas/oauth2.0/authorize')}`);
  console.log(`  令牌: http://localhost:${PORT}${withBasePath('/cas/oauth2.0/accessToken')}`);
  console.log(`  用户信息: http://localhost:${PORT}${withBasePath('/cas/oauth2.0/profile')}`);
  console.log(`  登出: http://localhost:${PORT}${withBasePath('/dist/logOut')}`);
  console.log(`\n🌐 CORS已启用，支持跨域访问`);
});
