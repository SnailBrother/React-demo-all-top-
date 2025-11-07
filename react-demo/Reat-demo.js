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
            username: user.username,
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
app.post('/api/auth/register-old', async (req, res) => {
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
            .input('username', sql.NVarChar, username)
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, password)
            .query(`
                INSERT INTO reactDemoApp.dbo.userAccounts 
                (username, email, password, permission_level) 
                OUTPUT INSERTED.* 
                VALUES (@username, @email, @password, 'user')
            `);
        
        const newUser = result.recordset[0];
        
        // 返回用户信息（排除密码）
        const userResponse = {
            id: newUser.id,
            username: newUser.username,
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
// 注册接口 - 修改后的版本
// 修改后的注册接口
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;  
    
    console.log('注册请求:', { username, email, password });
    
    try {
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
        
        // 开始事务处理
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        
        try {
            // 插入新用户
            const userResult = await transaction.request()
                .input('username', sql.NVarChar, username)  
                .input('email', sql.NVarChar, email)
                .input('password', sql.NVarChar, password)
                .query(`
                    INSERT INTO reactDemoApp.dbo.userAccounts 
                    (username, email, password, permission_level) 
                    OUTPUT INSERTED.* 
                    VALUES (@username, @email, @password, 'user')
                `);
            
            const newUser = userResult.recordset[0];
            
            // 为用户创建默认主题设置 - 使用 username 作为 username
            await transaction.request()
                .input('username', sql.NVarChar, username) // 使用 username 作为 username
                .input('email', sql.NVarChar, email)
                .input('theme_name', sql.NVarChar, '默认主题')
                .input('background_color', sql.NVarChar, '#FFFFFFFF')
                .input('secondary_background_color', sql.NVarChar, '#F8F9FAFF')
                .input('hover_background_color', sql.NVarChar, '#E9ECEEFF')
                .input('focus_background_color', sql.NVarChar, '#DEE2E6FF')
                .input('font_color', sql.NVarChar, '#000000FF')
                .input('secondary_font_color', sql.NVarChar, '#6C757DFF')
                .input('hover_font_color', sql.NVarChar, '#0078D4FF')
                .input('focus_font_color', sql.NVarChar, '#0056B3FF')
                .input('watermark_font_color', sql.NVarChar, '#B3B5B6FF')
                .input('font_family', sql.NVarChar, 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif')
                .input('border_color', sql.NVarChar, '#DEE2E6FF')
                .input('secondary_border_color', sql.NVarChar, '#E9ECEEFF')
                .input('hover_border_color', sql.NVarChar, '#0078D4FF')
                .input('focus_border_color', sql.NVarChar, '#0056B3FF')
                .input('shadow_color', sql.NVarChar, '#00000019')
                .input('hover_shadow_color', sql.NVarChar, '#00000026')
                .input('focus_shadow_color', sql.NVarChar, '#0078D440')
                .query(`
                    INSERT INTO reactDemoApp.dbo.UserThemeSettings 
                    (
                        username, email, theme_name,
                        background_color, secondary_background_color, hover_background_color, focus_background_color,
                        font_color, secondary_font_color, hover_font_color, focus_font_color, watermark_font_color, font_family,
                        border_color, secondary_border_color, hover_border_color, focus_border_color,
                        shadow_color, hover_shadow_color, focus_shadow_color, is_active
                    ) 
                    VALUES (
                        @username, @email, @theme_name,
                        @background_color, @secondary_background_color, @hover_background_color, @focus_background_color,
                        @font_color, @secondary_font_color, @hover_font_color, @focus_font_color, @watermark_font_color, @font_family,
                        @border_color, @secondary_border_color, @hover_border_color, @focus_border_color,
                        @shadow_color, @hover_shadow_color, @focus_shadow_color, 1
                    )
                `);
            
            // 提交事务
            await transaction.commit();
            
            console.log(`用户 ${username} 注册成功，并创建了默认主题`);
            
            // 返回用户信息（排除密码）
            const userResponse = {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                registration_date: newUser.registration_date,
                permission_level: newUser.permission_level
            };
            
            res.json({
                success: true,
                message: '注册成功',
                user: userResponse
            });
            
        } catch (error) {
            // 回滚事务
            await transaction.rollback();
            console.error('注册事务错误:', error);
            throw error;
        }
        
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
            .query('SELECT id, username, email, registration_date, last_login_time, profile_picture, permission_level, is_locked, notes FROM reactDemoApp.dbo.userAccounts WHERE id = @id');
        
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

// 主题设置相关API

// 获取用户主题设置
app.get('/api/UserThemeSettings', async (req, res) => {
    const { email, username, theme_name = '默认主题' } = req.query;
    
    console.log('获取主题设置请求:', { email, username, theme_name });
    
    try {
        await poolConnect;
        
        let query = `
            SELECT * FROM reactDemoApp.dbo.UserThemeSettings 
            WHERE is_active = 1
        `;
        const request = pool.request();
        
        // 根据提供的参数构建查询条件
        if (email) {
            query += ' AND email = @email';
            request.input('email', sql.NVarChar, email);
        }
        if (username) {
            query += ' AND username = @username';
            request.input('username', sql.NVarChar, username);
        }
        if (theme_name) {
            query += ' AND theme_name = @theme_name';
            request.input('theme_name', sql.NVarChar, theme_name);
        }
        
        const result = await request.query(query);
        
        if (result.recordset.length === 0) {
            return res.json({
                success: true,
                theme: null,
                message: '未找到主题设置'
            });
        }
        
        res.json({
            success: true,
            theme: result.recordset[0]
        });
        
    } catch (err) {
        console.error('获取主题设置错误:', err);
        res.status(500).json({
            success: false,
            message: '获取主题设置失败'
        });
    }
});

// 创建或更新用户主题设置
app.post('/api/UserThemeSettings', async (req, res) => {
    const {
        username,
        email,
        theme_name = '默认主题',
        background_color = '#FFFFFFFF',
        secondary_background_color = '#F8F9FAFF',
        hover_background_color = '#E9ECEEFF',
        focus_background_color = '#DEE2E6FF',
        font_color = '#000000FF',
        secondary_font_color = '#6C757DFF',
        hover_font_color = '#0078D4FF',
        focus_font_color = '#0056B3FF',
        watermark_font_color = '#B3B5B6FF',
        font_family = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        border_color = '#DEE2E6FF',
        secondary_border_color = '#E9ECEEFF',
        hover_border_color = '#0078D4FF',
        focus_border_color = '#0056B3FF',
        shadow_color = '#00000019',
        hover_shadow_color = '#00000026',
        focus_shadow_color = '#0078D440'
    } = req.body;
    
    console.log('保存主题设置请求:', { username, email, theme_name });
    
    try {
        await poolConnect;
        
        // 首先检查是否已存在相同用户名和主题名的记录
        const existingTheme = await pool.request()
            .input('username', sql.NVarChar, username)
            .input('theme_name', sql.NVarChar, theme_name)
            .query(`
                SELECT id FROM reactDemoApp.dbo.UserThemeSettings 
                WHERE username = @username AND theme_name = @theme_name
            `);
        
        if (existingTheme.recordset.length > 0) {
            // 更新现有记录
            const result = await pool.request()
                .input('username', sql.NVarChar, username)
                .input('theme_name', sql.NVarChar, theme_name)
                .input('background_color', sql.NVarChar, background_color)
                .input('secondary_background_color', sql.NVarChar, secondary_background_color)
                .input('hover_background_color', sql.NVarChar, hover_background_color)
                .input('focus_background_color', sql.NVarChar, focus_background_color)
                .input('font_color', sql.NVarChar, font_color)
                .input('secondary_font_color', sql.NVarChar, secondary_font_color)
                .input('hover_font_color', sql.NVarChar, hover_font_color)
                .input('focus_font_color', sql.NVarChar, focus_font_color)
                .input('watermark_font_color', sql.NVarChar, watermark_font_color)
                .input('font_family', sql.NVarChar, font_family)
                .input('border_color', sql.NVarChar, border_color)
                .input('secondary_border_color', sql.NVarChar, secondary_border_color)
                .input('hover_border_color', sql.NVarChar, hover_border_color)
                .input('focus_border_color', sql.NVarChar, focus_border_color)
                .input('shadow_color', sql.NVarChar, shadow_color)
                .input('hover_shadow_color', sql.NVarChar, hover_shadow_color)
                .input('focus_shadow_color', sql.NVarChar, focus_shadow_color)
                .query(`
                    UPDATE reactDemoApp.dbo.UserThemeSettings 
                    SET 
                        background_color = @background_color,
                        secondary_background_color = @secondary_background_color,
                        hover_background_color = @hover_background_color,
                        focus_background_color = @focus_background_color,
                        font_color = @font_color,
                        secondary_font_color = @secondary_font_color,
                        hover_font_color = @hover_font_color,
                        focus_font_color = @focus_font_color,
                        watermark_font_color = @watermark_font_color,
                        font_family = @font_family,
                        border_color = @border_color,
                        secondary_border_color = @secondary_border_color,
                        hover_border_color = @hover_border_color,
                        focus_border_color = @focus_border_color,
                        shadow_color = @shadow_color,
                        hover_shadow_color = @hover_shadow_color,
                        focus_shadow_color = @focus_shadow_color,
                        is_active = 1
                    WHERE username = @username AND theme_name = @theme_name
                    
                    SELECT * FROM reactDemoApp.dbo.UserThemeSettings 
                    WHERE username = @username AND theme_name = @theme_name
                `);
            
            res.json({
                success: true,
                theme: result.recordset[0],
                message: '主题设置更新成功',
                action: 'updated'
            });
        } else {
            // 插入新记录
            const result = await pool.request()
                .input('username', sql.NVarChar, username)
                .input('email', sql.NVarChar, email)
                .input('theme_name', sql.NVarChar, theme_name)
                .input('background_color', sql.NVarChar, background_color)
                .input('secondary_background_color', sql.NVarChar, secondary_background_color)
                .input('hover_background_color', sql.NVarChar, hover_background_color)
                .input('focus_background_color', sql.NVarChar, focus_background_color)
                .input('font_color', sql.NVarChar, font_color)
                .input('secondary_font_color', sql.NVarChar, secondary_font_color)
                .input('hover_font_color', sql.NVarChar, hover_font_color)
                .input('focus_font_color', sql.NVarChar, focus_font_color)
                .input('watermark_font_color', sql.NVarChar, watermark_font_color)
                .input('font_family', sql.NVarChar, font_family)
                .input('border_color', sql.NVarChar, border_color)
                .input('secondary_border_color', sql.NVarChar, secondary_border_color)
                .input('hover_border_color', sql.NVarChar, hover_border_color)
                .input('focus_border_color', sql.NVarChar, focus_border_color)
                .input('shadow_color', sql.NVarChar, shadow_color)
                .input('hover_shadow_color', sql.NVarChar, hover_shadow_color)
                .input('focus_shadow_color', sql.NVarChar, focus_shadow_color)
                .query(`
                    INSERT INTO reactDemoApp.dbo.UserThemeSettings 
                    (
                        username, email, theme_name,
                        background_color, secondary_background_color, hover_background_color, focus_background_color,
                        font_color, secondary_font_color, hover_font_color, focus_font_color, watermark_font_color, font_family,
                        border_color, secondary_border_color, hover_border_color, focus_border_color,
                        shadow_color, hover_shadow_color, focus_shadow_color, is_active
                    ) 
                    OUTPUT INSERTED.* 
                    VALUES (
                        @username, @email, @theme_name,
                        @background_color, @secondary_background_color, @hover_background_color, @focus_background_color,
                        @font_color, @secondary_font_color, @hover_font_color, @focus_font_color, @watermark_font_color, @font_family,
                        @border_color, @secondary_border_color, @hover_border_color, @focus_border_color,
                        @shadow_color, @hover_shadow_color, @focus_shadow_color, 1
                    )
                `);
            
            res.json({
                success: true,
                theme: result.recordset[0],
                message: '主题设置创建成功',
                action: 'created'
            });
        }
        
    } catch (err) {
        console.error('保存主题设置错误:', err);
        res.status(500).json({
            success: false,
            message: '保存主题设置失败'
        });
    }
});

// 更新用户主题设置
app.put('/api/UserThemeSettings/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    
    console.log('更新主题设置请求:', { id, updates });
    
    try {
        await poolConnect;
        
        // 构建动态更新语句
        let setClause = [];
        const request = pool.request();
        request.input('id', sql.Int, id);
        
        // 遍历更新字段
        Object.keys(updates).forEach(key => {
            if (key !== 'id' && key !== 'username' && key !== 'email' && key !== 'theme_name') {
                setClause.push(`${key} = @${key}`);
                request.input(key, sql.NVarChar, updates[key]);
            }
        });
        
        if (setClause.length === 0) {
            return res.status(400).json({
                success: false,
                message: '没有提供有效的更新字段'
            });
        }
        
        setClause.push('is_active = 1');
        
        const query = `
            UPDATE reactDemoApp.dbo.UserThemeSettings 
            SET ${setClause.join(', ')}
            WHERE id = @id
            
            SELECT * FROM reactDemoApp.dbo.UserThemeSettings 
            WHERE id = @id
        `;
        
        const result = await request.query(query);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: '主题设置不存在'
            });
        }
        
        res.json({
            success: true,
            theme: result.recordset[0],
            message: '主题设置更新成功'
        });
        
    } catch (err) {
        console.error('更新主题设置错误:', err);
        res.status(500).json({
            success: false,
            message: '更新主题设置失败'
        });
    }
});

// 获取用户的所有主题
app.get('/api/UserThemeSettings/all', async (req, res) => {
    const { email, username } = req.query;
    
    console.log('获取用户所有主题请求:', { email, username });
    
    try {
        await poolConnect;
        
        let query = `
            SELECT * FROM reactDemoApp.dbo.UserThemeSettings 
            WHERE is_active = 1
        `;
        const request = pool.request();
        
        if (email) {
            query += ' AND email = @email';
            request.input('email', sql.NVarChar, email);
        }
        if (username) {
            query += ' AND username = @username';
            request.input('username', sql.NVarChar, username);
        }
        
        query += ' ORDER BY theme_name';
        
        const result = await request.query(query);
        
        res.json({
            success: true,
            themes: result.recordset,
            count: result.recordset.length
        });
        
    } catch (err) {
        console.error('获取用户所有主题错误:', err);
        res.status(500).json({
            success: false,
            message: '获取主题列表失败'
        });
    }
});

// 删除用户主题设置
app.delete('/api/UserThemeSettings/:id', async (req, res) => {
    const { id } = req.params;
    
    console.log('删除主题设置请求:', { id });
    
    try {
        await poolConnect;
        
        // 软删除：设置 is_active = 0
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                UPDATE reactDemoApp.dbo.UserThemeSettings 
                SET is_active = 0 
                WHERE id = @id
            `);
        
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: '主题设置不存在'
            });
        }
        
        res.json({
            success: true,
            message: '主题设置删除成功'
        });
        
    } catch (err) {
        console.error('删除主题设置错误:', err);
        res.status(500).json({
            success: false,
            message: '删除主题设置失败'
        });
    }
});

// 在后端 app.js 中添加以下接口：

// 停用用户的所有主题
app.post('/api/UserThemeSettings/deactivate-all', async (req, res) => {
    const { username, email } = req.body;
    
    try {
      await poolConnect;
      
      const result = await pool.request()
        .input('username', sql.NVarChar, username)
        .input('email', sql.NVarChar, email)
        .query(`
          UPDATE reactDemoApp.dbo.UserThemeSettings 
          SET is_active = 0 
          WHERE username = @username AND email = @email
        `);
      
      res.json({
        success: true,
        message: '所有主题已停用',
        affected: result.rowsAffected[0]
      });
      
    } catch (err) {
      console.error('停用主题错误:', err);
      res.status(500).json({
        success: false,
        message: '停用主题失败'
      });
    }
  });
  
  // 激活指定主题
  app.put('/api/UserThemeSettings/:id/activate', async (req, res) => {
    const { id } = req.params;
    
    try {
      await poolConnect;
      
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`
          UPDATE reactDemoApp.dbo.UserThemeSettings 
          SET is_active = 1 
          WHERE id = @id
        `);
      
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({
          success: false,
          message: '主题不存在'
        });
      }
      
      res.json({
        success: true,
        message: '主题激活成功'
      });
      
    } catch (err) {
      console.error('激活主题错误:', err);
      res.status(500).json({
        success: false,
        message: '激活主题失败'
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