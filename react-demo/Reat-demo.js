const express = require('express');
const cors = require('cors');
const sql = require('mssql');
 
const app = express();
const port = 4200;

// SQL Server 配置
const config = {
    user: 'sa',
    password: 'Alan944926',
    server: '111.231.79.183',
    database: 'reactDemoApp', // 修改为你的数据库名
    options: {
        encrypt: false,
        trustServerCertificate: true,
        pool: {
            max: 100, // 连接池最大连接数
            min: 0,  // 最小连接数
            idleTimeoutMillis: 30000 // 空闲连接超时时间
        }
    }
};

// 使用全局连接池 这是最佳实践
const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect(); // 启动连接但不等待
// 确保应用启动时连接成功
poolConnect.then(() => {
    console.log('Connected to SQL Server');
}).catch(err => {
    console.error('Database connection failed:', err);
    process.exit(1);
});

// 实时接受消息 socket.io
const http = require('http').Server(app);
const io = require('socket.io')(http, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// 下载
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');

// 图片上传
const multer = require("multer");

app.use(cors());
app.use(express.json()); // 解析 JSON 请求体

// 根路径处理
app.get('/', (req, res) => {
    res.send('API is running...');
});

// 登录接口
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    console.log('登录请求:', { email, password });
    
    try {
        // 确保连接池已连接
        await poolConnect;
        
        // 查询用户
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM reactDemoApp.dbo.userAccounts WHERE email = @email');
        
        if (result.recordset.length === 0) {
            return res.status(401).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        const user = result.recordset[0];
        
        // 检查账户是否被锁定
        if (user.is_locked) {
            return res.status(401).json({
                success: false,
                message: '账户已被锁定，请联系管理员'
            });
        }
        
        // 直接比较密码（明文比较）
        if (password !== user.password) {
            return res.status(401).json({
                success: false,
                message: '密码错误'
            });
        }
        
        // 更新最后登录时间
        await pool.request()
            .input('id', sql.Int, user.id)
            .query('UPDATE reactDemoApp.dbo.userAccounts SET last_login_time = GETDATE() WHERE id = @id');
        
        // 返回用户信息（排除密码）
        const userResponse = {
            id: user.id,
            name: user.name,
            email: user.email,
            registration_date: user.registration_date,
            last_login_time: user.last_login_time,
            profile_picture: user.profile_picture,
            permission_level: user.permission_level,
            is_locked: user.is_locked,
            notes: user.notes
        };
        
        res.json({
            success: true,
            user: userResponse,
            token: `jwt-token-${user.id}-${Date.now()}` // 模拟 JWT token
        });
        
    } catch (err) {
        console.error('登录错误:', err);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 注册接口
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    
    console.log('注册请求:', { username, email, password });
    
    try {
        // 确保连接池已连接
        await poolConnect;
        
        // 检查邮箱是否已存在
        const existingUser = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT id FROM reactDemoApp.dbo.userAccounts WHERE email = @email');
        
        if (existingUser.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                message: '该邮箱已被注册'
            });
        }
        
        // 插入新用户
        const result = await pool.request()
            .input('name', sql.NVarChar, username)
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, password)
            .query(`
                INSERT INTO reactDemoApp.dbo.userAccounts 
                (name, email, password, permission_level) 
                OUTPUT INSERTED.* 
                VALUES (@name, @email, @password, 'user')
            `);
        
        const newUser = result.recordset[0];
        
        // 返回用户信息（排除密码）
        const userResponse = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            registration_date: newUser.registration_date,
            permission_level: newUser.permission_level
        };
        
        res.json({
            success: true,
            message: '注册成功',
            user: userResponse
        });
        
    } catch (err) {
        console.error('注册错误:', err);
        res.status(500).json({
            success: false,
            message: '注册失败，请稍后重试'
        });
    }
});

// 获取用户列表接口
app.get('/api/getUserAccounts', async (req, res) => {
    try {
        // 确保连接池已连接
        await poolConnect;
        
        let accountLoginResult = await pool.request().query('SELECT * FROM reactDemoApp.dbo.userAccounts');
        res.json({ AccountLogin: accountLoginResult.recordset });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// 获取用户信息接口（根据 token）
app.get('/api/auth/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: '未授权'
            });
        }
        
        // 简单的 token 解析（实际应该验证 JWT）
        const userId = token.split('-')[2]; // 从模拟 token 中提取用户ID
        
        // 确保连接池已连接
        await poolConnect;
        
        const result = await pool.request()
            .input('id', sql.Int, userId)
            .query('SELECT id, name, email, registration_date, last_login_time, profile_picture, permission_level, is_locked, notes FROM reactDemoApp.dbo.userAccounts WHERE id = @id');
        
        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        res.json({
            success: true,
            user: result.recordset[0]
        });
        
    } catch (err) {
        console.error('获取用户信息错误:', err);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// Socket.io 连接处理
io.on('connection', (socket) => {
    console.log('用户连接:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('用户断开连接:', socket.id);
    });
});

// 启动服务器
http.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
});

// 优雅关闭
process.on('SIGINT', async () => {
    console.log('正在关闭服务器...');
    await pool.close();
    process.exit(0);
});