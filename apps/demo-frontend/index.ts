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
                            <span class="config-value">http://localhost:7009</span>
                        </div>
                        <div class="config-item">
                            <span class="config-label">演示页面:</span>
                            <span class="config-value">http://localhost:7008</span>
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
                            <span class="config-label">回调地址:</span>
                            <span class="config-value">http://localhost:18099/login/oauth2/code/github</span>
                        </div>
                    </div>
                </div>
                <!-- 快速测试 -->
                <div class="section">
                    <h2>快速测试</h2>
                    <a href="#" class="btn" onclick="startOAuthFlow()">开始OAuth2授权流程</a>
                </div>

                <!-- 手动测试步骤 -->
                <div class="section">
                    <h2>手动测试步骤</h2>
                    
                    <div class="step">
                        <span class="step-number">1</span>
                        <strong>获取授权码</strong>
                        <p>点击授权链接，使用测试账号登录：</p>
                        <ul style="margin: 10px 0 10px 30px;">
                            <li>账号1: <code>TEST_USER</code> / <code>JYc1g3e5BccjxPr</code></li>
                            <li>账号2: <code>TESTUSER</code> / <code>Icarus1432</code></li>
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

                <!-- API文档 -->
                <div class="section">
                    <h2>API文档</h2>
                    <div class="config-box">
                        <h3>授权端点</h3>
                        <p><strong>GET</strong> <code>http://localhost:7009/cas/oauth2.0/authorize</code></p>
                        <p>参数: client_id, redirect_uri, response_type=code, scope, state</p>
                        
                        <h3 style="margin-top: 20px;">令牌端点</h3>
                        <p><strong>POST</strong> <code>http://localhost:7009/cas/oauth2.0/accessToken</code></p>
                        <p>参数: grant_type=authorization_code, code, redirect_uri, client_id, client_secret</p>
                        
                        <h3 style="margin-top: 20px;">用户信息端点</h3>
                        <p><strong>GET</strong> <code>http://localhost:7009/cas/oauth2.0/profile</code></p>
                        <p>Headers: Authorization: Bearer {access_token}</p>
                    </div>
                </div>
        </div>

        <script>
            function startOAuthFlow() {
                const authUrl = 'http://localhost:7009/cas/oauth2.0/authorize?' + new URLSearchParams({
                    client_id: 'localOAuth2',
                    redirect_uri: 'http://localhost:7008/callback',
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

                try {
                    const response = await fetch('http://localhost:7009/cas/oauth2.0/accessToken', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: new URLSearchParams({
                            grant_type: 'authorization_code',
                            code: authCode,
                            redirect_uri: 'http://localhost:7008/callback',
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

                try {
                    const response = await fetch('http://localhost:7009/cas/oauth2.0/profile', {
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