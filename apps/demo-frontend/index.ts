import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

const app = express();
const PORT = 7008;

// 静态文件服务
app.use(express.static('public'));

// 主演示页面
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>东南大学OAuth2系统演示</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: Arial, sans-serif; 
                background: #f5f5f5;
                padding: 20px;
            }
            .container { 
                max-width: 1000px; 
                margin: 0 auto; 
                background: white; 
                border: 1px solid #ddd;
                padding: 20px;
            }
            .header { 
                text-align: center; 
                margin-bottom: 20px;
                padding-bottom: 10px;
                border-bottom: 1px solid #ddd;
            }
            .header h1 { font-size: 24px; margin-bottom: 5px; }
            .header p { color: #666; }
            .section { margin-bottom: 25px; }
            .section h2 { color: #333; margin-bottom: 10px; }
            .config-box { 
                background: #f9f9f9; 
                padding: 15px; 
                border: 1px solid #ddd;
                margin: 10px 0;
            }
            .config-item { margin-bottom: 8px; }
            .config-label { font-weight: bold; }
            .config-value { 
                font-family: monospace; 
                background: #eee; 
                padding: 2px 4px; 
                margin-left: 10px;
            }
            .btn { 
                display: inline-block; 
                padding: 10px 20px; 
                background: #007bff;
                color: white; 
                text-decoration: none; 
                border: none;
                cursor: pointer;
                margin: 5px 5px 5px 0;
            }
            .btn:hover { 
                background: #0056b3;
            }
            .test-form {
                background: #f9f9f9;
                padding: 15px;
                border: 1px solid #ddd;
                margin: 10px 0;
            }
            .form-group {
                margin-bottom: 10px;
            }
            .form-group label {
                display: block;
                margin-bottom: 3px;
                font-weight: bold;
            }
            .form-group input, .form-group textarea {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                font-family: monospace;
            }
            .form-group textarea {
                height: 80px;
                resize: vertical;
            }
            .result-box {
                background: #d4edda;
                border: 1px solid #c3e6cb;
                padding: 10px;
                margin: 10px 0;
                white-space: pre-wrap;
                font-family: monospace;
                display: none;
            }
            .error-box {
                background: #f8d7da;
                border: 1px solid #f5c6cb;
                padding: 10px;
                margin: 10px 0;
                white-space: pre-wrap;
                font-family: monospace;
                display: none;
            }
            .step {
                background: white;
                border: 1px solid #ddd;
                padding: 15px;
                margin: 10px 0;
            }
            .step-number {
                background: #007bff;
                color: white;
                width: 25px;
                height: 25px;
                border-radius: 50%;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                margin-right: 10px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>东南大学OAuth2系统演示</h1>
            </div>
            
            <!-- 系统配置信息 -->
                <div class="section">
                    <h2>系统配置</h2>
                    <div class="config-box">
                        <div class="config-item">
                            <span class="config-label">OAuth2 API服务:</span>
                            <span class="config-value">http://115.190.80.75:7009 (公网) / http://localhost:7009 (本地)</span>
                        </div>
                        <div class="config-item">
                            <span class="config-label">演示页面:</span>
                            <span class="config-value">http://115.190.80.75:7008 (公网) / http://localhost:7008 (本地)</span>
                        </div>
                        <div class="config-item">
                            <span class="config-label">Client ID:</span>
                            <span class="config-value">localOAuth2</span>
                        </div>
                        <div class="config-item">
                            <span class="config-label">Client Secret:</span>
                            <span class="config-value">localOAuth2ACB</span>
                        </div>
                        <div class="config-item">
                            <span class="config-label">支持的回调地址:</span>
                            <span class="config-value">localhost:* 和 115.190.80.75:*</span>
                        </div>
                    </div>
                </div>

                <!-- 快速测试 -->
                <div class="section">
                    <h2>快速测试</h2>
                    <div style="margin-bottom: 15px;">
                        <button class="btn" onclick="startOAuthFlow('local')" style="margin-right: 10px;">
                            本地开发测试 (localhost回调)
                        </button>
                        <button class="btn" onclick="startOAuthFlow('online')" style="background: #28a745;">
                            在线环境测试 (公网回调)
                        </button>
                    </div>
                    <div style="background: #f8f9fa; padding: 10px; font-size: 14px; color: #666; border-left: 4px solid #007bff;">
                        <strong>选择说明:</strong><br>
                        • <strong>本地开发测试:</strong> 回调到localhost:7008，适合本地调试<br>
                        • <strong>在线环境测试:</strong> 回调到115.190.80.75:7008，适合在线演示
                    </div>
                </div>

                <!-- 手动测试步骤 -->
                <div class="section">
                    <h2>手动测试步骤</h2>
                    
                    <div style="background: #f8f9fa; padding: 12px; margin-bottom: 15px; border-left: 4px solid #007bff;">
                        <strong>测试模式:</strong>
                        <label style="display: inline-block; margin-left: 20px; margin-right: 20px;">
                            <input type="radio" name="testMode" value="local" checked onclick="currentMode='local'"> 本地开发 (localhost)
                        </label>
                        <label style="display: inline-block;">
                            <input type="radio" name="testMode" value="online" onclick="currentMode='online'"> 在线环境 (115.190.80.75)
                        </label>
                    </div>
                    
                    <div class="step">
                        <span class="step-number">1</span>
                        <strong>获取授权码</strong>
                        <p>点击授权链接，使用测试账号登录：</p>
                        <ul style="margin: 10px 0 10px 30px;">
                            <li>账号1: <code>213001001</code> / <code>JYc1g3e5BccjxPr</code></li>
                            <li>账号2: <code>213001002</code> / <code>Icarus1432</code></li>
                        </ul>
                    </div>

                    <div class="step">
                        <span class="step-number">2</span>
                        <strong>交换访问令牌</strong>
                        <div class="test-form">
                            <div class="form-group">
                                <label>授权码 (从回调URL中获取):</label>
                                <input type="text" id="authCode" placeholder="OC-12-xxx...">
                            </div>
                            <button class="btn" onclick="exchangeToken()">交换访问令牌</button>
                            <div id="tokenResult" class="result-box"></div>
                            <div id="tokenError" class="error-box"></div>
                        </div>
                    </div>

                    <div class="step">
                        <span class="step-number">3</span>
                        <strong>获取用户信息</strong>
                        <div class="test-form">
                            <div class="form-group">
                                <label>访问令牌:</label>
                                <input type="text" id="accessToken" placeholder="AT-7-xxx...">
                            </div>
                            <button class="btn" onclick="getUserProfile()">获取用户信息</button>
                            <div id="profileResult" class="result-box"></div>
                            <div id="profileError" class="error-box"></div>
                        </div>
                    </div>
                </div>

                <!-- 在线体验与开发调试说明 -->
                <div class="section">
                    <h2>在线体验 & 开发调试指南</h2>
                    <div class="config-box">
                        <h3>两种使用模式</h3>
                        <p><strong>1. 在线体验模式</strong> - 直接访问公网地址进行OAuth2流程测试</p>
                        <p><strong>2. 开发调试模式</strong> - 本地开发时重定向到localhost进行调试</p>
                        
                        <h3>配置说明</h3>
                        <p>系统已配置支持<strong>双重回调地址</strong>，无需修改代码即可同时支持：</p>
                        <ul style="margin: 10px 0 10px 20px;">
                            <li><code>http://localhost:18099/login/oauth2/code/github</code> - 本地Spring Boot应用</li>
                            <li><code>http://localhost:7008/callback</code> - 本地演示页面</li>
                            <li><code>http://115.190.80.75:18099/login/oauth2/code/github</code> - 公网Spring Boot应用</li>
                            <li><code>http://115.190.80.75:7008/callback</code> - 公网演示页面</li>
                        </ul>

                        <h3>开发者接入步骤</h3>
                        <p><strong>Step 1:</strong> 将你的OAuth2端点替换为：</p>
                        <div style="background: #f4f4f4; padding: 10px; margin: 10px 0; font-family: monospace; font-size: 14px;">
                        认证端点: http://115.190.80.75:7009/cas/oauth2.0/authorize<br>
                        令牌端点: http://115.190.80.75:7009/cas/oauth2.0/accessToken<br>
                        用户信息: http://115.190.80.75:7009/cas/oauth2.0/profile
                        </div>

                        <p><strong>Step 2:</strong> 配置OAuth2客户端参数：</p>
                        <div style="background: #f4f4f4; padding: 10px; margin: 10px 0; font-family: monospace; font-size: 14px;">
                        client_id: localOAuth2<br>
                        client_secret: localOAuth2ACB<br>
                        redirect_uri: 你的应用回调地址 (支持localhost和115.190.80.75)
                        </div>

                        <p><strong>Step 3:</strong> 测试流程</p>
                        <ul style="margin: 10px 0 10px 20px;">
                            <li><strong>在线测试:</strong> 直接使用公网地址，适合演示和初步验证</li>
                            <li><strong>本地调试:</strong> 设置回调地址为localhost，便于断点调试</li>
                            <li><strong>移动端测试:</strong> 使用公网地址，手机可直接访问</li>
                        </ul>

                        <h3>快速体验</h3>
                        <p>点击上方"开始OAuth2授权流程"按钮，系统会：</p>
                        <ol style="margin: 10px 0 10px 20px;">
                            <li>跳转到统一身份认证页面</li>
                            <li>使用测试账号快速登录 (点击账号卡片自动填充)</li>
                            <li>获取授权码并展示完整的令牌交换过程</li>
                            <li>返回用户信息，验证集成效果</li>
                        </ol>

                        <div style="background: #e8f5e8; padding: 10px; margin: 10px 0; border-left: 4px solid #4caf50;">
                            <strong>提示:</strong> 按东南大学统一身份认证接口的apitest那个域名仿的
                        </div>
                    </div>
                </div>

                <!-- API文档 -->
                <div class="section">
                    <h2>API文档</h2>
                    <div class="config-box">
                        <h3>1. 授权端点 (Authorization Endpoint)</h3>
                        <p><strong>GET</strong> <code>http://115.190.80.75:7009/cas/oauth2.0/authorize</code></p>
                        <p><strong>参数:</strong> client_id, redirect_uri, response_type=code, scope, state</p>
                        <p><strong>示例:</strong></p>
                        <div style="background: #f4f4f4; padding: 10px; margin: 5px 0; font-family: monospace; font-size: 12px; word-break: break-all;">
                        http://115.190.80.75:7009/cas/oauth2.0/authorize?client_id=localOAuth2&redirect_uri=http://localhost:7008/callback&response_type=code&scope=read:user,user:email&state=demo123
                        </div>
                        
                        <h3>2. 令牌端点 (Token Endpoint)</h3>
                        <p><strong>POST</strong> <code>http://115.190.80.75:7009/cas/oauth2.0/accessToken</code></p>
                        <p><strong>Content-Type:</strong> application/x-www-form-urlencoded</p>
                        <p><strong>参数:</strong> grant_type=authorization_code, code, redirect_uri, client_id, client_secret</p>
                        <p><strong>响应示例:</strong></p>
                        <div style="background: #f4f4f4; padding: 10px; margin: 5px 0; font-family: monospace; font-size: 12px;">
{<br>
&nbsp;&nbsp;"access_token": "AT-7-xxx...",<br>
&nbsp;&nbsp;"token_type": "bearer",<br>
&nbsp;&nbsp;"expires_in": 28800,<br>
&nbsp;&nbsp;"scope": "read:user,user:email"<br>
}
                        </div>
                        
                        <h3>3. 用户信息端点 (Profile Endpoint)</h3>
                        <p><strong>GET</strong> <code>http://115.190.80.75:7009/cas/oauth2.0/profile</code></p>
                        <p><strong>Headers:</strong> Authorization: Bearer {access_token}</p>
                        <p><strong>响应示例:</strong></p>
                        <div style="background: #f4f4f4; padding: 10px; margin: 5px 0; font-family: monospace; font-size: 12px;">
{<br>
&nbsp;&nbsp;"oauthClientId": "localOAuth2",<br>
&nbsp;&nbsp;"service": "http://localhost:7008/callback",<br>
&nbsp;&nbsp;"id": "213001001",<br>
&nbsp;&nbsp;"client_id": "localOAuth2"<br>
}
                        </div>

                        <h3>4. 登出端点 (Logout Endpoint)</h3>
                        <p><strong>GET</strong> <code>http://115.190.80.75:7009/dist/logOut?redirectUrl=http://yourapp.com</code></p>
                        <p><strong>参数:</strong> redirectUrl (可选，登出后重定向地址)</p>

                        <div style="background: #fff3cd; padding: 10px; margin: 10px 0; border-left: 4px solid #ffc107;">
                            <strong>测试账号:</strong> 所有端点都可以用本页面提供的测试账号进行验证 (213001001, 213001002, 213001003, 800000001)
                        </div>
                    </div>
                </div>
        </div>

        <script>
            // 当前测试模式
            let currentMode = 'local';
            
            function startOAuthFlow(mode = 'local') {
                currentMode = mode;
                
                // 根据模式设置服务器地址和回调地址
                const serverUrl = mode === 'online' ? 'http://115.190.80.75:7009' : 'http://localhost:7009';
                const callbackUrl = mode === 'online' ? 'http://115.190.80.75:7008/callback' : 'http://localhost:7008/callback';
                
                const authUrl = serverUrl + '/cas/oauth2.0/authorize?' + new URLSearchParams({
                    client_id: 'localOAuth2',
                    redirect_uri: callbackUrl,
                    response_type: 'code',
                    scope: 'read:user,user:email',
                    state: 'demo_' + Date.now()
                });
                window.open(authUrl, '_blank');
            }

            async function exchangeToken() {
                const authCode = document.getElementById('authCode').value;
                const resultDiv = document.getElementById('tokenResult');
                const errorDiv = document.getElementById('tokenError');
                
                if (!authCode) {
                    alert('请输入授权码');
                    return;
                }

                // 根据当前模式选择服务器地址
                const serverUrl = currentMode === 'online' ? 'http://115.190.80.75:7009' : 'http://localhost:7009';
                const callbackUrl = currentMode === 'online' ? 'http://115.190.80.75:7008/callback' : 'http://localhost:7008/callback';

                try {
                    const response = await fetch(serverUrl + '/cas/oauth2.0/accessToken', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: new URLSearchParams({
                            grant_type: 'authorization_code',
                            code: authCode,
                            redirect_uri: callbackUrl,
                            client_id: 'localOAuth2',
                            client_secret: 'localOAuth2ACB'
                        })
                    });

                    const data = await response.json();
                    
                    if (response.ok) {
                        resultDiv.textContent = JSON.stringify(data, null, 2);
                        resultDiv.style.display = 'block';
                        errorDiv.style.display = 'none';
                        
                        // 自动填入访问令牌
                        if (data.access_token) {
                            document.getElementById('accessToken').value = data.access_token;
                        }
                    } else {
                        errorDiv.textContent = JSON.stringify(data, null, 2);
                        errorDiv.style.display = 'block';
                        resultDiv.style.display = 'none';
                    }
                } catch (error) {
                    errorDiv.textContent = '请求失败: ' + error.message;
                    errorDiv.style.display = 'block';
                    resultDiv.style.display = 'none';
                }
            }

            async function getUserProfile() {
                const accessToken = document.getElementById('accessToken').value;
                const resultDiv = document.getElementById('profileResult');
                const errorDiv = document.getElementById('profileError');
                
                if (!accessToken) {
                    alert('请输入访问令牌');
                    return;
                }

                // 根据当前模式选择服务器地址
                const serverUrl = currentMode === 'online' ? 'http://115.190.80.75:7009' : 'http://localhost:7009';

                try {
                    const response = await fetch(serverUrl + '/cas/oauth2.0/profile', {
                        headers: {
                            'Authorization': 'Bearer ' + accessToken
                        }
                    });

                    const data = await response.json();
                    
                    if (response.ok) {
                        resultDiv.textContent = JSON.stringify(data, null, 2);
                        resultDiv.style.display = 'block';
                        errorDiv.style.display = 'none';
                    } else {
                        errorDiv.textContent = JSON.stringify(data, null, 2);
                        errorDiv.style.display = 'block';
                        resultDiv.style.display = 'none';
                    }
                } catch (error) {
                    errorDiv.textContent = '请求失败: ' + error.message;
                    errorDiv.style.display = 'block';
                    resultDiv.style.display = 'none';
                }
            }

            // 处理回调页面的授权码
            if (window.location.search) {
                const urlParams = new URLSearchParams(window.location.search);
                const code = urlParams.get('code');
                if (code) {
                    document.getElementById('authCode').value = code;
                    // 根据当前域名判断模式
                    if (window.location.hostname === '115.190.80.75') {
                        currentMode = 'online';
                    }
                    alert('已自动填入授权码: ' + code);
                }
            }
        </script>
    </body>
    </html>
  `);
});

// 回调页面
app.get('/callback', (req, res) => {
  const { code, state, error } = req.query;
  
  if (error) {
    res.send(`
      <h1>授权失败</h1>
      <p>错误: ${error}</p>
      <a href="/">返回首页</a>
    `);
    return;
  }

  if (code) {
    res.send(`
      <h1>授权成功！</h1>
      <p>授权码: <code>${code}</code></p>
      <p>状态: <code>${state}</code></p>
      <a href="/?code=${code}">返回首页继续测试</a>
    `);
  } else {
    res.send(`
      <h1>回调页面</h1>
      <p>等待授权回调...</p>
    `);
  }
});

app.listen(PORT, () => {
  console.log(`🌐 演示页面服务器启动成功！`);
  console.log(`📍 访问地址: http://localhost:${PORT}`);
});