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
                            <span class="config-label">认证中心 (线上服务):</span>
                            <span class="config-value">http://115.190.80.75:7009</span>
                        </div>
                        <div class="config-item">
                            <span class="config-label">第三方应用演示:</span>
                            <span class="config-value">http://localhost:7008 (本页面)</span>
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
                    <div style="background: #e7f3ff; padding: 12px; margin-top: 10px; border-left: 4px solid #007bff;">
                        <strong>使用说明:</strong><br>
                        • 本页面模拟第三方应用<br>
                        • 点击授权按钮将跳转到线上认证中心登录<br>
                        • 登录成功后回调到本页面完成OAuth2流程
                    </div>
                </div>

                <!-- 快速测试 -->
                <div class="section">
                    <h2>快速体验OAuth2流程</h2>
                    <div style="margin-bottom: 15px;">
                        <button class="btn" onclick="startOAuthFlow()" style="background: #28a745; font-size: 16px; padding: 15px 30px;">
                            开始OAuth2授权流程
                        </button>
                    </div>
                    <div style="background: #f8f9fa; padding: 12px; font-size: 14px; color: #666; border-left: 4px solid #28a745;">
                        <strong>流程说明:</strong><br>
                        1. 点击按钮跳转到线上认证中心 (115.190.80.75:7009)<br>
                        2. 使用测试账号登录 (如: 213001001 / JYc1g3e5BccjxPr)<br>
                        3. 授权成功后自动回调到本页面<br>
                        4. 查看完整的OAuth2授权码和令牌信息
                    </div>
                </div>

                <!-- 手动测试步骤 -->
                <div class="section">
                    <h2>手动测试步骤</h2>
                    
                    <div style="background: #f8f9fa; padding: 12px; margin-bottom: 15px; border-left: 4px solid #007bff;">
                        <strong>智能回调机制:</strong> 
                        <ul style="margin: 8px 0 0 20px; font-size: 14px;">
                            <li>认证中心: 线上服务 (115.190.80.75:7009)</li>
                            <li>回调地址: JavaScript自动检测当前访问地址并构建对应的回调URL</li>
                            <li>例如: 访问 localhost:7008 → 回调 localhost:7008/callback</li>
                            <li>例如: 访问 115.190.80.75:7008 → 回调 115.190.80.75:7008/callback</li>
                        </ul>
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
                        <p><strong>响应示例 (完整结构):</strong></p>
                        <div style="background: #f4f4f4; padding: 10px; margin: 5px 0; font-family: monospace; font-size: 12px;">
{<br>
&nbsp;&nbsp;"oauthClientId": "localOAuth2",<br>
&nbsp;&nbsp;"service": "http://localhost:18099/login/oauth2/code/github", <span style="color: #d9534f;">// 注意: 后端当前硬编码此值</span><br>
&nbsp;&nbsp;"id": "213001001",<br>
&nbsp;&nbsp;"client_id": "localOAuth2",<br>
&nbsp;&nbsp;"email": "user@example.com",<br>
&nbsp;&nbsp;"realName": "张三",<br>
&nbsp;&nbsp;"department": "计算机科学与工程学院",<br>
&nbsp;&nbsp;"userType": "本科生",<br>
&nbsp;&nbsp;"studentNumber": "213001001",<br>
&nbsp;&nbsp;"gender": "男"<br>
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
            // 当前测试模式和使用的回调地址
            let currentMode = 'local';
            let usedCallbackUrl = '';
            
            function startOAuthFlow() {
                // 始终使用线上认证中心
                const serverUrl = 'http://115.190.80.75:7009';  // 线上认证中心
                
                // 智能检测回调地址：根据当前访问地址自动构建回调URL
                const currentProtocol = window.location.protocol; // http: 或 https:
                const currentHostname = window.location.hostname; // 域名或IP
                const currentPort = window.location.port;         // 端口号
                
                // 构建回调地址，保持与当前访问地址一致
                let callbackUrl;
                if (currentPort && currentPort !== '80' && currentPort !== '443') {
                    callbackUrl = currentProtocol + '//' + currentHostname + ':' + currentPort + '/callback';
                } else {
                    callbackUrl = currentProtocol + '//' + currentHostname + '/callback';
                }
                
                // 设置模式和记录回调地址
                currentMode = currentHostname === '115.190.80.75' ? 'online' : 'local';
                usedCallbackUrl = callbackUrl;
                
                const authUrl = serverUrl + '/cas/oauth2.0/authorize?' + new URLSearchParams({
                    client_id: 'localOAuth2',
                    redirect_uri: callbackUrl,
                    response_type: 'code',
                    scope: 'read:user,user:email',
                    state: 'demo_' + Date.now()
                });
                
                console.log('OAuth2流程开始:');
                console.log('认证中心:', serverUrl);
                console.log('当前访问地址:', window.location.href);
                console.log('自动构建回调:', callbackUrl);
                
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

                // 始终使用线上认证中心，但回调地址必须与获取授权码时一致
                const serverUrl = 'http://115.190.80.75:7009';  // 线上认证中心
                
                // 如果没有记录的回调地址，则重新构建
                let callbackUrl = usedCallbackUrl;
                if (!callbackUrl) {
                    const currentProtocol = window.location.protocol;
                    const currentHostname = window.location.hostname;
                    const currentPort = window.location.port;
                    
                    if (currentPort && currentPort !== '80' && currentPort !== '443') {
                        callbackUrl = currentProtocol + '//' + currentHostname + ':' + currentPort + '/callback';
                    } else {
                        callbackUrl = currentProtocol + '//' + currentHostname + '/callback';
                    }
                }

                console.log('交换令牌 - 当前模式:', currentMode);
                console.log('服务器地址:', serverUrl);
                console.log('回调地址:', callbackUrl);

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
                    console.error('请求失败:', error);
                    errorDiv.textContent = '请求失败: ' + error.message + ' (模式: ' + currentMode + ', 服务器: ' + serverUrl + ')';
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

                // 始终使用线上认证中心
                const serverUrl = 'http://115.190.80.75:7009';  // 线上认证中心

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
                    // 根据当前域名设置模式和回调地址
                    if (window.location.hostname === '115.190.80.75') {
                        currentMode = 'online';
                        usedCallbackUrl = 'http://115.190.80.75:7008/callback';
                    } else {
                        currentMode = 'local';
                        usedCallbackUrl = 'http://localhost:7008/callback';
                    }
                    alert('已自动填入授权码: ' + code + ' (认证中心: 115.190.80.75:7009, 回调: ' + usedCallbackUrl + ')');
                }
            }
            
            // 页面加载时根据域名自动设置模式
            window.addEventListener('DOMContentLoaded', function() {
                if (window.location.hostname === '115.190.80.75') {
                    currentMode = 'online';
                } else {
                    currentMode = 'local';
                }
            });
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