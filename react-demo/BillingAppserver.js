const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const xlsx = require('xlsx');
const app = express();
const port = 5201;


// SQL Server 配置
const config = {
    user: 'sa',
    password: 'Alan944926',
    server: '121.4.22.55',
    database: 'BillingApp',
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

//使用全局连接池 这是最佳实践 搜索哪些使用了这个，直接关键字搜索：使用全局连接池 这是最佳实践 👇 2.1
//不需要手动关闭连接，连接池会自动管理
const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect(); // 启动连接但不等待
// 确保应用启动时连接成功
poolConnect.then(() => {
    console.log('Connected to SQL Server');
}).catch(err => {
    console.error('Database connection failed:', err);
    process.exit(1);
});
//使用全局连接池 这是最佳实践 搜索哪些使用了这个，直接关键字搜索：使用全局连接池 这是最佳实践 👆 2.1


//实时接受消息 socket.io

const http = require('http').Server(app);
const io = require('socket.io')(http, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});


//下载
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');

//图片上传
//const express = require("express");
const multer = require("multer");
//const fs = require("fs");
//const path = require("path");

const JSZip = require('jszip');  // 添加这行 JSZip 但没有正确导

app.use(cors());
app.use(express.json()); // 解析 JSON 请求体



// 根路径处理
app.get('/', (req, res) => {
    res.send('API is running...');
});






// 获取 Records 表数据
app.get('/api/getRecords', async (req, res) => {
    try {
        let firstpool = await sql.connect(config);
        let RecordsResult = await firstpool.request().query('SELECT * FROM Records');
        res.json(RecordsResult.recordset);
        firstpool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// 获取 Music 表数据
app.get('/api/getMusicData', async (req, res) => {
    try {
        let firstpool = await sql.connect(config);
        let musicResult = await firstpool.request().query('SELECT * FROM Music');
        res.json({ music: musicResult.recordset });
        firstpool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// 获取 RealEstate 表数据
app.get('/api/getRealEstateData', async (req, res) => {
    try {
        let firstpool = await sql.connect(config);
        let realEstateResult = await firstpool.request().query('SELECT * FROM RealEstate');
        res.json({ RealEstate: realEstateResult.recordset });
        firstpool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// 获取 AccountLogin 表数据
app.get('/api/getAccountLoginData', async (req, res) => {
    try {
        let firstpool = await sql.connect(config);
        let accountLoginResult = await firstpool.request().query('SELECT * FROM AccountLogin');
        res.json({ AccountLogin: accountLoginResult.recordset });
        firstpool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});
//增加检查账号是否存在的 API
app.post('/api/checkUsernameExists', async (req, res) => {
    const { username } = req.body;
    try {
        let firstpool = await sql.connect(config);
        const result = await firstpool.request()
            .input('username', sql.NVarChar(50), username)
            .query('SELECT COUNT(*) as count FROM AccountLogin WHERE username = @username');
        const exists = result.recordset[0].count > 0;
        res.json({ exists });
        firstpool.close();
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '检查账号是否存在时发生错误' });
    }
});
//在后端添加注册用户的 API 接口。
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        let firstpool = await sql.connect(config);
        // 再次在后端检查账号是否已存在
        const checkResult = await firstpool.request()
            .input('username', sql.NVarChar(50), username)
            .query('SELECT COUNT(*) as count FROM AccountLogin WHERE username = @username');
        if (checkResult.recordset[0].count > 0) {
            res.status(400).json({ message: '该账号已存在，请选择其他用户名' });
            firstpool.close();
            return;
        }

        const result = await firstpool.request()
            .input('username', sql.NVarChar(50), username)
            .input('password', sql.NVarChar(255), password)
            .query('INSERT INTO AccountLogin (username, password) VALUES (@username, @password)');
        res.status(201).json({ message: '注册成功' });
        firstpool.close();
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '注册失败' });
    }
});
//在后端添加注销用户账号的 API 接口。
app.delete('/api/deleteAccount', async (req, res) => {
    const { username, password } = req.body;
    try {
        let firstpool = await sql.connect(config);
        const result = await firstpool.request()
            .input('username', sql.NVarChar(50), username)
            .input('password', sql.NVarChar(255), password)
            .query('DELETE FROM AccountLogin WHERE username = @username AND password = @password');
        if (result.rowsAffected[0] > 0) {
            res.status(200).json({ message: '账号已注销' });
        } else {
            res.status(400).json({ message: '密码错误，注销失败' });
        }
        firstpool.close();
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '注销账号失败' });
    }
});
//在后端添加修改用户密码的 API 接口
app.put('/api/changePassword', async (req, res) => {
    const { username, oldPassword, newPassword } = req.body;
    try {
        let firstpool = await sql.connect(config);
        const checkResult = await firstpool.request()
            .input('username', sql.NVarChar(50), username)
            .input('oldPassword', sql.NVarChar(255), oldPassword)
            .query('SELECT * FROM AccountLogin WHERE username = @username AND password = @oldPassword');
        if (checkResult.recordset.length > 0) {
            const updateResult = await firstpool.request()
                .input('username', sql.NVarChar(50), username)
                .input('newPassword', sql.NVarChar(255), newPassword)
                .query('UPDATE AccountLogin SET password = @newPassword WHERE username = @username');
            res.status(200).json({ message: '密码修改成功' });
        } else {
            res.status(400).json({ message: '原密码错误，修改失败' });
        }
        firstpool.close();
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '密码修改失败' });
    }
});

// 获取 TravelExpenseReimbursement 报销表数据
app.get('/api/getTravelExpenseReimbursementData', async (req, res) => {
    try {
        let firstpool = await sql.connect(config);
        let travelExpenseReimbursementResult = await firstpool.request().query('SELECT * FROM TravelExpenseReimbursement');
        res.json({ TravelExpenseReimbursement: travelExpenseReimbursementResult.recordset });
        firstpool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});
// 添加差旅报销记录
// 添加差旅报销记录
app.post('/api/addTravelExpense', async (req, res) => {
    const { ProjectCode, ProjectName, Location, Amount, BusinessTripDate, ReimbursementDate, Remarks, ReimbursedBy, Whetherover } = req.body;
    try {
        let pool = await sql.connect(config);
        const result = await pool.request()
            .input('ProjectCode', sql.NVarChar, ProjectCode)
            .input('ProjectName', sql.NVarChar, ProjectName)
            .input('Location', sql.NVarChar, Location)
            .input('Amount', sql.Decimal(18, 2), Amount)
            .input('BusinessTripDate', sql.Date, BusinessTripDate)
            .input('ReimbursementDate', sql.Date, ReimbursementDate)
            .input('Remarks', sql.NVarChar, Remarks)
            .input('ReimbursedBy', sql.NVarChar, ReimbursedBy)
            .input('Whetherover', sql.Bit, Whetherover) // 新增
            .query('INSERT INTO TravelExpenseReimbursement (ProjectCode, ProjectName, Location, Amount, BusinessTripDate, ReimbursementDate, Remarks, ReimbursedBy, Whetherover) OUTPUT INSERTED.ID VALUES (@ProjectCode, @ProjectName, @Location, @Amount, @BusinessTripDate, @ReimbursementDate, @Remarks, @ReimbursedBy, @Whetherover)');

        res.json({ ID: result.recordset[0].ID });
        pool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// 更新差旅报销记录
app.put('/api/updateTravelExpense/:id', async (req, res) => {
    const { id } = req.params;
    const { ProjectCode, ProjectName, Location, Amount, BusinessTripDate, ReimbursementDate, Remarks, ReimbursedBy, Whetherover } = req.body;
    try {
        let pool = await sql.connect(config);
        await pool.request()
            .input('ID', sql.Int, id)
            .input('ProjectCode', sql.NVarChar, ProjectCode)
            .input('ProjectName', sql.NVarChar, ProjectName)
            .input('Location', sql.NVarChar, Location)
            .input('Amount', sql.Decimal(18, 2), Amount)
            .input('BusinessTripDate', sql.Date, BusinessTripDate)
            .input('ReimbursementDate', sql.Date, ReimbursementDate)
            .input('Remarks', sql.NVarChar, Remarks)
            .input('ReimbursedBy', sql.NVarChar, ReimbursedBy)
            .input('Whetherover', sql.Bit, Whetherover) // 新增
            .query('UPDATE TravelExpenseReimbursement SET ProjectCode = @ProjectCode, ProjectName = @ProjectName, Location = @Location, Amount = @Amount, BusinessTripDate = @BusinessTripDate, ReimbursementDate = @ReimbursementDate, Remarks = @Remarks, ReimbursedBy = @ReimbursedBy, Whetherover = @Whetherover WHERE ID = @ID');

        res.sendStatus(204); // No content
        pool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});


// 更新差旅报销记录
app.put('/api/updateTravelExpense/:id', async (req, res) => {
    const { id } = req.params;
    const { ProjectCode, ProjectName, Location, Amount, BusinessTripDate, ReimbursementDate, Remarks, ReimbursedBy, Whetherover } = req.body;
    try {
        let pool = await sql.connect(config);
        await pool.request()
            .input('ID', sql.Int, id)
            .input('ProjectCode', sql.NVarChar, ProjectCode)
            .input('ProjectName', sql.NVarChar, ProjectName)
            .input('Location', sql.NVarChar, Location)
            .input('Amount', sql.Decimal(18, 2), Amount)
            .input('BusinessTripDate', sql.Date, BusinessTripDate)
            .input('ReimbursementDate', sql.Date, ReimbursementDate)
            .input('Remarks', sql.NVarChar, Remarks)
            .input('ReimbursedBy', sql.NVarChar, ReimbursedBy)
            .input('Whetherover', sql.Bit, Whetherover) // 新增
            .query('UPDATE TravelExpenseReimbursement SET ProjectCode = @ProjectCode, ProjectName = @ProjectName, Location = @Location, Amount = @Amount, BusinessTripDate = @BusinessTripDate, ReimbursementDate = @ReimbursementDate, Remarks = @Remarks, ReimbursedBy = @ReimbursedBy, Whetherover = @Whetherover WHERE ID = @ID');

        res.sendStatus(204); // No content
        pool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// 删除差旅报销记录
app.delete('/api/deleteTravelExpense/:id', async (req, res) => {
    const { id } = req.params;
    try {
        let pool = await sql.connect(config);
        await pool.request()
            .input('ID', sql.Int, id)
            .query('DELETE FROM TravelExpenseReimbursement WHERE ID = @ID');

        res.sendStatus(204); // No content
        pool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});







// 获取  绩效表表数据
app.get('/api/getAchievementsData', async (req, res) => {
    try {
        let firstpool = await sql.connect(config);
        let achievementsResult = await firstpool.request().query('SELECT * FROM Achievements');
        res.json({ Achievements: achievementsResult.recordset });
        firstpool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// 添加绩效记录
app.post('/api/addAchievement', async (req, res) => {
    const { ProjectCode, ReportNumber, ProjectName, ChargeAmount, ChargeDate, AchievementAmount, SignedAmount, CommissionDate, Notes, PerformancePerson, Whetherticheng } = req.body;
    try {
        let pool = await sql.connect(config);
        const result = await pool.request()
            .input('ProjectCode', sql.VarChar, ProjectCode)
            .input('ReportNumber', sql.VarChar, ReportNumber)
            .input('ProjectName', sql.VarChar, ProjectName)
            .input('ChargeAmount', sql.Decimal(18, 2), ChargeAmount)
            .input('ChargeDate', sql.Date, ChargeDate)
            .input('AchievementAmount', sql.Decimal(18, 2), AchievementAmount)
            .input('SignedAmount', sql.Decimal(18, 2), SignedAmount)
            .input('CommissionDate', sql.Date, CommissionDate)
            .input('Notes', sql.Text, Notes)
            .input('PerformancePerson', sql.VarChar, PerformancePerson) // 添加 PerformancePerson
            .input('Whetherticheng', sql.Bit, Whetherticheng) // 新增
            .query('INSERT INTO Achievements (ProjectCode, ReportNumber, ProjectName, ChargeAmount, ChargeDate, AchievementAmount, SignedAmount, CommissionDate, Notes, PerformancePerson, Whetherticheng) OUTPUT INSERTED.ID VALUES (@ProjectCode, @ReportNumber, @ProjectName, @ChargeAmount, @ChargeDate, @AchievementAmount, @SignedAmount, @CommissionDate, @Notes, @PerformancePerson, @Whetherticheng)');

        res.json({ ID: result.recordset[0].ID });
        pool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// 更新绩效记录
app.put('/api/updateAchievement/:id', async (req, res) => {
    const { id } = req.params;
    const { ProjectCode, ReportNumber, ProjectName, ChargeAmount, ChargeDate, AchievementAmount, SignedAmount, CommissionDate, Notes, PerformancePerson, Whetherticheng } = req.body;
    try {
        let pool = await sql.connect(config);
        await pool.request()
            .input('ID', sql.Int, id)
            .input('ProjectCode', sql.VarChar, ProjectCode)
            .input('ReportNumber', sql.VarChar, ReportNumber)
            .input('ProjectName', sql.VarChar, ProjectName)
            .input('ChargeAmount', sql.Decimal(18, 2), ChargeAmount)
            .input('ChargeDate', sql.Date, ChargeDate)
            .input('AchievementAmount', sql.Decimal(18, 2), AchievementAmount)
            .input('SignedAmount', sql.Decimal(18, 2), SignedAmount)
            .input('CommissionDate', sql.Date, CommissionDate)
            .input('Notes', sql.Text, Notes)
            .input('PerformancePerson', sql.VarChar, PerformancePerson) // 添加 PerformancePerson
            .input('Whetherticheng', sql.Bit, Whetherticheng) // 新增
            .query('UPDATE Achievements SET ProjectCode = @ProjectCode, ReportNumber = @ReportNumber, ProjectName = @ProjectName, ChargeAmount = @ChargeAmount, ChargeDate = @ChargeDate, AchievementAmount = @AchievementAmount, SignedAmount = @SignedAmount, CommissionDate = @CommissionDate, Notes = @Notes, PerformancePerson = @PerformancePerson, Whetherticheng = @Whetherticheng WHERE ID = @ID');

        res.sendStatus(204); // No content
        pool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// 删除绩效记录
app.delete('/api/deleteAchievement/:id', async (req, res) => {
    const { id } = req.params;
    try {
        let pool = await sql.connect(config);
        await pool.request()
            .input('ID', sql.Int, id)
            .query('DELETE FROM Achievements WHERE ID = @ID');

        res.sendStatus(204); // No content
        pool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});


// 获取 Special_Tips 特别事项提醒表数据
app.get('/api/getSpecial_TipsData', async (req, res) => {
    let pool;
    try {
        // 1. 首先获取数据库数据
        pool = await sql.connect(config);
        const result = await pool.request().query('SELECT * FROM Special_Tips');

        // 2. 立即向所有客户端广播更新
        io.emit('tips-update', result.recordset);

        // 3. 同时响应 HTTP 请求
        res.json({ Special_Tips: result.recordset });
    } catch (err) {
        console.error('数据库查询错误:', err);
        res.status(500).send('Server Error');
    } finally {
        if (pool) {
            pool.close();
        }
    }
});
// 添加新的特殊提示
app.post('/api/addSpecialTip', async (req, res) => {
    const { asset_type, tip_content, remark } = req.body;

    // 验证输入
    if (!asset_type || !tip_content) {
        return res.status(400).json({ error: '缺少必要参数: asset_type, tip_content' });
    }

    let pool;
    try {
        pool = await sql.connect(config);

        // 插入新记录
        const insertResult = await pool.request()
            .input('asset_type', sql.NVarChar(100), asset_type)
            .input('tip_content', sql.NVarChar(1000), tip_content)
            .input('remark', sql.NVarChar(500), remark || null)
            .query(`
                INSERT INTO BillingApp.dbo.Special_Tips 
                (asset_type, tip_content, remark) 
                VALUES (@asset_type, @tip_content, @remark)
            `);

        // 获取更新后的完整列表
        const result = await pool.request().query('SELECT * FROM Special_Tips');

        // 广播给所有客户端
        io.emit('tips-update', result.recordset);

        res.status(200).json({ success: true });
    } catch (err) {
        console.error('添加特殊提示失败:', err);
        res.status(500).json({ error: '添加特殊提示失败' });
    } finally {
        if (pool) {
            pool.close();
        }
    }
});




// 获取 MessageDetail 表数据
// 获取消息数据并支持实时更新
app.get('/api/getMessageDetailData', async (req, res) => {
    let pool;
    try {
        // 1. 首先获取数据库数据
        pool = await sql.connect(config);
        const result = await pool.request().query('SELECT * FROM MessageDetail ORDER BY time DESC'); // 添加ORDER BY time DESC

        // 2. 立即向所有客户端广播更新
        io.emit('message-update', result.recordset);

        // 3. 同时响应HTTP请求
        res.json({ MessageDetail: result.recordset });
    } catch (err) {
        console.error('数据库查询错误:', err);
        res.status(500).send('Server Error');
    } finally {
        if (pool) {
            pool.close();
        }
    }
});
// 添加新公告 并支持实时更新
app.post('/api/addMessage', async (req, res) => {
    const { title, content } = req.body;

    // 验证输入
    if (!title || !content) {
        return res.status(400).json({ error: '缺少必要参数: title, content' });
    }

    let pool;
    try {
        pool = await sql.connect(config);

        // 插入新记录
        const insertResult = await pool.request()
            .input('title', sql.NVarChar(255), title)
            .input('content', sql.NVarChar(sql.MAX), content)
            .query(`
                INSERT INTO MessageDetail 
                (title, content, time) 
                VALUES (@title, @content, GETDATE())
            `);

        // 获取更新后的完整列表
        const result = await pool.request().query('SELECT * FROM MessageDetail');

        // 广播给所有客户端
        io.emit('message-update', result.recordset);

        res.status(200).json({ success: true, newMessage: result.recordset[result.recordset.length - 1] });
    } catch (err) {
        console.error('添加公告失败:', err);
        res.status(500).json({ error: '添加公告失败' });
    } finally {
        if (pool) {
            pool.close();
        }
    }
});


//构筑物价格查询 👇

// 新增构筑物
app.post('/api/addStructure', async (req, res) => {
    const { name, structure, area, unit, price, notes } = req.body;
    let pool;

    try {
        pool = await sql.connect(config);
        const query = `
            INSERT INTO Structures (name, structure, area, unit, price, notes) 
            OUTPUT INSERTED.*
            VALUES (@name, @structure, @area, @unit, @price, @notes)
        `;

        const result = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('structure', sql.NVarChar, structure)
            .input('area', sql.NVarChar, area)
            .input('unit', sql.NVarChar, unit)
            .input('price', sql.NVarChar, price)
            .input('notes', sql.NVarChar, notes || '')
            .query(query);

        const newBuilding = result.recordset[0];

        // 发送Socket通知
        io.emit('buildingUpdate', { action: 'add', building: newBuilding });

        res.status(201).json(newBuilding);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    } finally {
        if (pool) pool.close();
    }
});

// 更新构筑物
app.put('/api/updateStructure/:id', async (req, res) => {
    const { id } = req.params;
    const { name, structure, area, unit, price, notes } = req.body;
    let pool;

    try {
        pool = await sql.connect(config);
        const query = `
            UPDATE Structures 
            SET name = @name, structure = @structure, area = @area, 
                unit = @unit, price = @price, notes = @notes
            OUTPUT INSERTED.*
            WHERE id = @id
        `;

        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('name', sql.NVarChar, name)
            .input('structure', sql.NVarChar, structure)
            .input('area', sql.NVarChar, area)
            .input('unit', sql.NVarChar, unit)
            .input('price', sql.NVarChar, price)
            .input('notes', sql.NVarChar, notes || '')
            .query(query);

        if (result.rowsAffected[0] > 0) {
            const updatedBuilding = result.recordset[0];

            // 发送Socket通知
            io.emit('buildingUpdate', { action: 'update', building: updatedBuilding });

            res.status(200).json(updatedBuilding);
        } else {
            res.status(404).json({ message: '构筑物未找到' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    } finally {
        if (pool) pool.close();
    }
});

// 删除构筑物
app.delete('/api/deleteStructure/:id', async (req, res) => {
    const { id } = req.params;
    let pool;

    try {
        pool = await sql.connect(config);
        const query = 'DELETE FROM Structures WHERE id = @id';

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(query);

        if (result.rowsAffected[0] > 0) {
            // 发送Socket通知
            io.emit('buildingUpdate', { action: 'delete', id: parseInt(id) });

            res.status(200).json({ message: '构筑物删除成功' });
        } else {
            res.status(404).json({ message: '构筑物未找到' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    } finally {
        if (pool) pool.close();
    }
});

// 获取随机4条构筑物数据
app.get('/api/getRandomStructures', async (req, res) => {
    let pool;

    try {
        pool = await sql.connect(config);
        let structuresResult = await pool.request().query('SELECT TOP 4 * FROM Structures ORDER BY NEWID()');
        res.json({ Structures: structuresResult.recordset });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    } finally {
        if (pool) pool.close();
    }
});

// 获取分页数据
app.get('/api/getStructures', async (req, res) => {
    const { page = 1, pageSize = 10 } = req.query;
    const pageNum = parseInt(page);
    const size = parseInt(pageSize);
    let pool;

    // 验证参数有效性
    if (isNaN(pageNum)) {
        return res.status(400).json({ error: '页码必须是数字' });
    }
    if (isNaN(size)) {
        return res.status(400).json({ error: '每页条数必须是数字' });
    }
    if (pageNum < 1) {
        return res.status(400).json({ error: '页码必须大于0' });
    }
    if (size < 1 || size > 100) {
        return res.status(400).json({ error: '每页条数必须在1-100之间' });
    }

    try {
        pool = await sql.connect(config);

        // 获取总数
        const countResult = await pool.request()
            .query('SELECT COUNT(*) as totalCount FROM Structures');
        const totalCount = countResult.recordset[0].totalCount;

        // 获取分页数据
        const offset = (pageNum - 1) * size;
        const dataResult = await pool.request()
            .query(`
                SELECT * FROM Structures
                ORDER BY id
                OFFSET ${offset} ROWS
                FETCH NEXT ${size} ROWS ONLY
            `);

        res.json({
            results: dataResult.recordset,
            totalCount: totalCount
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    } finally {
        if (pool) pool.close();
    }
});

// 搜索构筑物数据（带分页）
app.get('/api/searchStructures', async (req, res) => {
    const { term, page = 1, pageSize = 10 } = req.query;
    const pageNum = parseInt(page);
    const size = parseInt(pageSize);
    let pool;

    // 验证参数有效性
    if (isNaN(pageNum)) {
        return res.status(400).json({ error: '页码必须是数字' });
    }
    if (isNaN(size)) {
        return res.status(400).json({ error: '每页条数必须是数字' });
    }
    if (pageNum < 1) {
        return res.status(400).json({ error: '页码必须大于0' });
    }
    if (size < 1 || size > 100) {
        return res.status(400).json({ error: '每页条数必须在1-100之间' });
    }

    try {
        pool = await sql.connect(config);

        // 获取总数
        const countQuery = `
            SELECT COUNT(*) as totalCount 
            FROM Structures
            WHERE name LIKE @term OR 
                  structure LIKE @term OR 
                  area LIKE @term OR 
                  unit LIKE @term OR 
                  price LIKE @term
        `;

        const countResult = await pool.request()
            .input('term', sql.NVarChar, `%${term}%`)
            .query(countQuery);

        const totalCount = countResult.recordset[0].totalCount;

        // 获取分页数据
        const offset = (pageNum - 1) * size;
        const dataQuery = `
            SELECT * FROM Structures
            WHERE name LIKE @term OR 
                  structure LIKE @term OR 
                  area LIKE @term OR 
                  unit LIKE @term OR 
                  price LIKE @term
            ORDER BY id
            OFFSET ${offset} ROWS
            FETCH NEXT ${size} ROWS ONLY
        `;

        const dataResult = await pool.request()
            .input('term', sql.NVarChar, `%${term}%`)
            .query(dataQuery);

        res.json({
            results: dataResult.recordset,
            totalCount: totalCount
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    } finally {
        if (pool) pool.close();
    }
});



//构筑物价格查询 👆



//苗木价格查询 👇

// 新增苗木
app.post('/api/addTree', async (req, res) => {
    const { name, diameter, height, crown_width, ground_diameter, price, region, species, notes } = req.body;
    let pool;

    try {
        pool = await sql.connect(config);
        const query = `
            INSERT INTO ChatApp.dbo.TreeDB (name, diameter, height, crown_width, ground_diameter, price, region, species, notes) 
            OUTPUT INSERTED.*
            VALUES (@name, @diameter, @height, @crown_width, @ground_diameter, @price, @region, @species, @notes)
        `;

        const result = await pool.request()
            .input('name', sql.VarChar, name)
            .input('diameter', sql.Decimal(5, 2), diameter)
            .input('height', sql.Decimal(5, 2), height)
            .input('crown_width', sql.Decimal(5, 2), crown_width)
            .input('ground_diameter', sql.Decimal(5, 2), ground_diameter)
            .input('price', sql.Decimal(10, 2), price)
            .input('region', sql.VarChar, region)
            .input('species', sql.VarChar, species)
            .input('notes', sql.Text, notes)
            .query(query);

        const newTree = result.recordset[0];

        // 发送Socket通知
        io.emit('treeUpdate', { action: 'add', tree: newTree });

        res.status(201).json(newTree);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    } finally {
        if (pool) pool.close();
    }
});

// 更新苗木
app.put('/api/updateTree/:id', async (req, res) => {
    const { id } = req.params;
    const { name, diameter, height, crown_width, ground_diameter, price, region, species, notes } = req.body;
    let pool;

    try {
        pool = await sql.connect(config);
        const query = `
            UPDATE ChatApp.dbo.TreeDB 
            SET name = @name, diameter = @diameter, height = @height, 
                crown_width = @crown_width, ground_diameter = @ground_diameter, 
                price = @price, region = @region, species = @species, notes = @notes
            OUTPUT INSERTED.*
            WHERE id = @id
        `;

        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('name', sql.VarChar, name)
            .input('diameter', sql.Decimal(5, 2), diameter)
            .input('height', sql.Decimal(5, 2), height)
            .input('crown_width', sql.Decimal(5, 2), crown_width)
            .input('ground_diameter', sql.Decimal(5, 2), ground_diameter)
            .input('price', sql.Decimal(10, 2), price)
            .input('region', sql.VarChar, region)
            .input('species', sql.VarChar, species)
            .input('notes', sql.Text, notes)
            .query(query);

        if (result.rowsAffected[0] > 0) {
            const updatedTree = result.recordset[0];

            // 发送Socket通知
            io.emit('treeUpdate', { action: 'update', tree: updatedTree });

            res.status(200).json({ message: '苗木更新成功', tree: updatedTree });
        } else {
            res.status(404).json({ message: '苗木未找到' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    } finally {
        if (pool) pool.close();
    }
});

// 删除苗木
app.delete('/api/deleteTree/:id', async (req, res) => {
    const { id } = req.params;
    let pool;

    try {
        pool = await sql.connect(config);
        const query = 'DELETE FROM ChatApp.dbo.TreeDB WHERE id = @id';

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(query);

        if (result.rowsAffected[0] > 0) {
            // 发送Socket通知
            io.emit('treeUpdate', { action: 'delete', id: parseInt(id) });

            res.status(200).json({ message: '苗木删除成功' });
        } else {
            res.status(404).json({ message: '苗木未找到' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    } finally {
        if (pool) pool.close();
    }
});

// 获取随机4条苗木数据
app.get('/api/getRandomTrees', async (req, res) => {
    let pool;

    try {
        pool = await sql.connect(config);
        let treesResult = await pool.request().query('SELECT TOP 4 * FROM ChatApp.dbo.TreeDB ORDER BY NEWID()');
        res.json({ Trees: treesResult.recordset });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    } finally {
        if (pool) pool.close();
    }
});

// 获取分页数据


// 搜索苗木数据（带分页）
app.get('/api/searchTrees', async (req, res) => {
    const { term, page = 1, pageSize = 10 } = req.query;
    const pageNum = parseInt(page);
    const size = parseInt(pageSize);
    let pool;

    // 验证参数有效性
    if (isNaN(pageNum)) {
        return res.status(400).json({ error: '页码必须是数字' });
    }
    if (isNaN(size)) {
        return res.status(400).json({ error: '每页条数必须是数字' });
    }
    if (pageNum < 1) {
        return res.status(400).json({ error: '页码必须大于0' });
    }
    if (size < 1 || size > 100) {
        return res.status(400).json({ error: '每页条数必须在1-100之间' });
    }

    try {
        pool = await sql.connect(config);

        // 获取总数
        const countQuery = `
            SELECT COUNT(*) as totalCount 
            FROM ChatApp.dbo.TreeDB
            WHERE name LIKE @term OR 
                  region LIKE @term OR 
                  species LIKE @term OR 
                  notes LIKE @term
        `;

        const countResult = await pool.request()
            .input('term', sql.VarChar, `%${term}%`)
            .query(countQuery);

        const totalCount = countResult.recordset[0].totalCount;

        // 获取分页数据
        const offset = (pageNum - 1) * size;
        const dataQuery = `
            SELECT * FROM ChatApp.dbo.TreeDB
            WHERE name LIKE @term OR 
                  region LIKE @term OR 
                  species LIKE @term OR 
                  notes LIKE @term
            ORDER BY id
            OFFSET ${offset} ROWS
            FETCH NEXT ${size} ROWS ONLY
        `;

        const dataResult = await pool.request()
            .input('term', sql.VarChar, `%${term}%`)
            .query(dataQuery);

        res.json({
            results: dataResult.recordset,
            totalCount: totalCount
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    } finally {
        if (pool) pool.close();
    }
});

// 批量上传
app.post('/api/uploadTreesExcel', async (req, res) => {
    const { data } = req.body;
    let pool;

    if (!data || !Array.isArray(data) || data.length === 0) {
        return res.status(400).json({ success: false, message: '没有可导入的数据' });
    }

    try {
        pool = await sql.connect(config);
        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        // 开始事务
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            for (const row of data) {
                try {
                    const request = new sql.Request(transaction);
                    await request
                        .input('name', sql.VarChar, row.name || '')
                        .input('diameter', sql.Decimal(5, 2), row.diameter || null)
                        .input('height', sql.Decimal(5, 2), row.height || null)
                        .input('crown_width', sql.Decimal(5, 2), row.crown_width || null)
                        .input('ground_diameter', sql.Decimal(5, 2), row.ground_diameter || null)
                        .input('price', sql.Decimal(10, 2), row.price || 0)
                        .input('region', sql.VarChar, row.region || '')
                        .input('species', sql.VarChar, row.species || '')
                        .input('notes', sql.Text, row.notes || '')
                        .query(`
                            INSERT INTO ChatApp.dbo.TreeDB 
                            (name, diameter, height, crown_width, ground_diameter, price, region, species, notes)
                            VALUES 
                            (@name, @diameter, @height, @crown_width, @ground_diameter, @price, @region, @species, @notes)
                        `);
                    successCount++;
                } catch (err) {
                    errorCount++;
                    errors.push(`行 ${successCount + errorCount}: ${err.message}`);
                    console.error(`导入失败:`, err);
                }
            }

            // 提交事务
            await transaction.commit();

            // 发送Socket通知
            io.emit('treeUpdate', { action: 'batchAdd' });

            if (errorCount > 0) {
                return res.json({
                    success: true,
                    message: `导入完成，成功 ${successCount} 条，失败 ${errorCount} 条`,
                    details: errors
                });
            }

            res.json({
                success: true,
                message: `成功导入 ${successCount} 条数据`
            });
        } catch (err) {
            // 回滚事务
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        console.error('导入失败:', err);
        res.status(500).json({
            success: false,
            message: '服务器处理数据时出错'
        });
    } finally {
        if (pool) pool.close();
    }
});


//苗木价格查询 👆

// 添加新记录
app.post('/api/addRecord', async (req, res) => {
    const { category, subcategory, amount, date, person } = req.body;
    try {
        let firstpool = await sql.connect(config);
        await firstpool.request()
            .input('category', sql.NVarChar, category)
            .input('subcategory', sql.NVarChar, subcategory)
            .input('amount', sql.Float, amount)
            .input('date', sql.Date, date)
            .input('person', sql.NVarChar, person)
            .query('INSERT INTO Records (Category, Subcategory, Amount, Date, Person) VALUES (@category, @subcategory, @amount, @date, @person)');
        res.status(201).send('Record added successfully');
        firstpool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// 更新记录
app.put('/api/updateRecord/:id', async (req, res) => {
    const { id } = req.params;
    const { category, subcategory, amount, date, person } = req.body;
    try {
        let firstpool = await sql.connect(config);
        await firstpool.request()
            .input('id', sql.Int, id)
            .input('category', sql.NVarChar, category)
            .input('subcategory', sql.NVarChar, subcategory)
            .input('amount', sql.Float, amount)
            .input('date', sql.Date, date)
            .input('person', sql.NVarChar, person)
            .query('UPDATE Records SET Category = @category, Subcategory = @subcategory, Amount = @amount, Date = @date, Person = @person WHERE Id = @id');
        res.send('Record updated successfully');
        firstpool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// 删除记录
app.delete('/api/deleteRecord/:id', async (req, res) => {
    const { id } = req.params;
    try {
        let firstpool = await sql.connect(config);
        await firstpool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Records WHERE Id = @id');
        res.send('Record deleted successfully');
        firstpool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// 添加新房产
app.post('/api/addRealEstateData', async (req, res) => {
    const { location, area, building_area, interior_area, community_name, property_usage, house_structure, market_price, market_rent, base_date, remarks, house_type, construction_year, floor } = req.body;
    try {
        let firstpool = await sql.connect(config);
        let result = await firstpool.request()
            .input('location', sql.NVarChar, location)
            .input('area', sql.NVarChar, area)
            .input('building_area', sql.Decimal(10, 2), building_area)
            .input('interior_area', sql.Decimal(10, 2), interior_area)
            .input('community_name', sql.NVarChar, community_name)
            .input('property_usage', sql.NVarChar, property_usage)
            .input('house_structure', sql.NVarChar, house_structure)
            .input('market_price', sql.Decimal(10, 2), market_price)
            .input('market_rent', sql.Decimal(10, 2), market_rent)
            .input('base_date', sql.Date, base_date) // 新增
            .input('remarks', sql.NVarChar, remarks) // 新增
            .input('house_type', sql.NVarChar, house_type)
            .input('construction_year', sql.Int, construction_year)
            .input('floor', sql.NVarChar, floor)
            .query('INSERT INTO RealEstate (location, area, building_area, interior_area, community_name, property_usage, house_structure, market_price, market_rent, base_date, remarks, house_type, construction_year, floor) OUTPUT INSERTED.* VALUES (@location, @area, @building_area, @interior_area, @community_name, @property_usage, @house_structure, @market_price, @market_rent, @base_date, @remarks, @house_type, @construction_year, @floor)');

        res.json(result.recordset[0]);
        firstpool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});


// 更新房产
app.put('/api/updateRealEstateData/:id', async (req, res) => {
    const { id } = req.params;
    const { location, area, building_area, interior_area, community_name, property_usage, house_structure, market_price, market_rent, base_date, remarks, house_type, construction_year, floor } = req.body;
    try {
        let firstpool = await sql.connect(config);
        await firstpool.request()
            .input('id', sql.Int, id)
            .input('location', sql.NVarChar, location)
            .input('area', sql.NVarChar, area)
            .input('building_area', sql.Decimal(10, 2), building_area)
            .input('interior_area', sql.Decimal(10, 2), interior_area)
            .input('community_name', sql.NVarChar, community_name)
            .input('property_usage', sql.NVarChar, property_usage)
            .input('house_structure', sql.NVarChar, house_structure)
            .input('market_price', sql.Decimal(10, 2), market_price)
            .input('market_rent', sql.Decimal(10, 2), market_rent)
            .input('base_date', sql.Date, base_date) // 新增
            .input('remarks', sql.NVarChar, remarks) // 新增
            .input('house_type', sql.NVarChar, house_type)
            .input('construction_year', sql.Int, construction_year)
            .input('floor', sql.NVarChar, floor)
            .query('UPDATE RealEstate SET location = @location, area = @area, building_area = @building_area, interior_area = @interior_area, community_name = @community_name, property_usage = @property_usage, house_structure = @house_structure, market_price = @market_price, market_rent = @market_rent, base_date = @base_date, remarks = @remarks, house_type = @house_type, construction_year = @construction_year, floor = @floor WHERE id = @id');

        res.send('RealEstate updated successfully');
        firstpool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});


// 删除房产
app.delete('/api/deleteRealEstateData/:id', async (req, res) => {
    const { id } = req.params;
    try {
        let firstpool = await sql.connect(config);
        await firstpool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM RealEstate WHERE id = @id');
        res.send('RealEstate deleted successfully');
        firstpool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});



//下载报告

//获取下载表数据
// 获取 Template 表数据
app.get('/api/getTemplateData', async (req, res) => {
    try {
        let firstpool = await sql.connect(config);
        let templateResult = await firstpool.request().query('SELECT * FROM Report_Template');
        res.json({ Template: templateResult.recordset });
        firstpool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// 下载文件的路由
app.get('/download/:templateId/:file', (req, res) => {
    const templateId = req.params.templateId;
    const fileName = req.params.file; // 获取文件名
    //注意这里的文件位置
    const directoryPath = path.join(__dirname, './public/downloads/Templates', templateId);

    // 确保目录存在
    if (!fs.existsSync(directoryPath)) {
        return res.status(404).send('Directory not found 未找到资源');
    }

    const filePath = path.join(directoryPath, fileName); // 组合文件路径

    // 确保文件存在
    if (!fs.existsSync(filePath)) {
        return res.status(404).send('File not found 未找到文件');
    }

    res.download(filePath, fileName, (err) => {
        if (err) {
            console.error('Error downloading file:', err);
            res.status(500).send('Error downloading file');
        }
    });
});

// 获取指定模板文件夹中的文件列表
app.get('/api/getTemplateFiles/:number', (req, res) => {
    const templateNumber = req.params.number;
    //注意这里的文件位置
    const directoryPath = path.join(__dirname, './public/downloads/Templates', templateNumber);

    // 确保目录存在
    if (!fs.existsSync(directoryPath)) {
        return res.status(404).send('Directory not found 未找到资源');
    }

    // 读取目录中的文件
    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error reading directory');
        }
        // 返回文件名列表
        res.json({ files });
    });
});



//根据文件名来获取链接

app.get('/api/getReportTemplate_Link/:fileName', async (req, res) => {
    const { fileName } = req.params;
    console.log('Received fileName:', fileName); // 打印接收到的文件名
    try {
        let firstpool = await sql.connect(config);
        const query = `
            SELECT share_view_link, share_download_link, internal_edit_link 
            FROM ReportTemplate_Link 
            WHERE file_name = @fileName`; // 使用参数化查询以避免 SQL 注入

        const request = firstpool.request()
            .input('fileName', sql.NVarChar(255), fileName);

        const result = await request.query(query);
        if (result.recordset.length > 0) {
            res.json(result.recordset); // 如果有多个结果，返回所有结果
        } else {
            res.status(404).send('Link not found');
        }
        firstpool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// 获取 UsedWebsites 常用网站数据
app.get('/api/getUsedWebsitesData', async (req, res) => {
    let pool;
    try {
        // 1. 首先获取数据库数据
        pool = await sql.connect(config);
        const result = await pool.request().query('SELECT * FROM UsedWebsites');

        // 2. 立即向所有客户端广播更新
        io.emit('websites-update', result.recordset);

        // 3. 同时响应HTTP请求
        res.json(result.recordset);

    } catch (err) {
        console.error('数据库查询错误:', err);
        res.status(500).send('Server Error');
    } finally {
        if (pool) {
            pool.close();
        }
    }
});
//添加新的网页链接
app.post('/api/updateWebsites', async (req, res) => {
    const { type, name, url } = req.body;

    // 验证输入
    if (!type || !name || !url) {
        return res.status(400).json({ error: '缺少必要参数: type, name, url' });
    }

    let pool;
    try {
        pool = await sql.connect(config);

        // 插入新记录
        const insertResult = await pool.request()
            .input('type', sql.NVarChar(100), type)
            .input('name', sql.NVarChar(255), name)
            .input('url', sql.NVarChar(500), url)
            .query(`
                INSERT INTO BillingApp.dbo.UsedWebsites 
                (type, name, url) 
                VALUES (@type, @name, @url)
            `);

        // 获取更新后的完整列表
        const result = await pool.request().query('SELECT * FROM UsedWebsites');

        // 广播给所有客户端
        io.emit('websites-update', result.recordset);

        res.status(200).json({ success: true });
    } catch (err) {
        console.error('添加网站链接失败:', err);
        res.status(500).json({ error: '添加网站链接失败' });
    } finally {
        if (pool) {
            pool.close();
        }
    }
});

//项目派单表
// 获取所有派单记录
app.get('/api/getProjectDispatchData', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        const result = await pool.request().query('SELECT * FROM ProjectDispatchForm');
        res.status(200).json({ ProjectDispatchForm: result.recordset });
        pool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// 添加派单记录
app.post('/api/addProjectDispatch', async (req, res) => {
    const {
        ProjectName, Branch, OrderNumber, ProjectSource,
        ProjectSourceContact, ProjectSourcePhone, Client,
        ClientContact, ClientPhone, Applicant, ApplicantContact,
        ApplicantPhone, Defendant, DefendantContact, DefendantPhone,
        ProjectType, EvaluationPurpose, PersonInCharge, EntrustDate, DispatchDate,
        ProjectNumber, CompleteProgress, Principal // 新增 Principal 字段
    } = req.body;

    try {
        let pool = await sql.connect(config);
        const result = await pool.request()
            .input('ProjectName', sql.NVarChar, ProjectName)
            .input('Branch', sql.NVarChar, Branch)
            .input('OrderNumber', sql.NVarChar, OrderNumber)
            .input('ProjectSource', sql.NVarChar, ProjectSource)
            .input('ProjectSourceContact', sql.NVarChar, ProjectSourceContact)
            .input('ProjectSourcePhone', sql.NVarChar, ProjectSourcePhone)
            .input('Client', sql.NVarChar, Client)
            .input('ClientContact', sql.NVarChar, ClientContact)
            .input('ClientPhone', sql.NVarChar, ClientPhone)
            .input('Applicant', sql.NVarChar, Applicant)
            .input('ApplicantContact', sql.NVarChar, ApplicantContact)
            .input('ApplicantPhone', sql.NVarChar, ApplicantPhone)
            .input('Defendant', sql.NVarChar, Defendant)
            .input('DefendantContact', sql.NVarChar, DefendantContact)
            .input('DefendantPhone', sql.NVarChar, DefendantPhone)
            .input('ProjectType', sql.NVarChar, ProjectType)
            .input('EvaluationPurpose', sql.NVarChar, EvaluationPurpose)
            .input('PersonInCharge', sql.NVarChar, PersonInCharge)
            .input('EntrustDate', sql.Date, EntrustDate)
            .input('DispatchDate', sql.Date, DispatchDate)
            .input('ProjectNumber', sql.NVarChar, ProjectNumber)
            .input('CompleteProgress', sql.Bit, CompleteProgress)
            .input('Principal', sql.NVarChar, Principal) // 新增 Principal 字段
            .query(`
                INSERT INTO ProjectDispatchForm (
                    ProjectName, Branch, OrderNumber, ProjectSource,
                    ProjectSourceContact, ProjectSourcePhone, Client,
                    ClientContact, ClientPhone, Applicant,
                    ApplicantContact, ApplicantPhone, Defendant,
                    DefendantContact, DefendantPhone, ProjectType,
                    EvaluationPurpose, PersonInCharge, EntrustDate, DispatchDate,
                    ProjectNumber, CompleteProgress, Principal
                ) VALUES (
                    @ProjectName, @Branch, @OrderNumber, @ProjectSource,
                    @ProjectSourceContact, @ProjectSourcePhone, @Client,
                    @ClientContact, @ClientPhone, @Applicant,
                    @ApplicantContact, @ApplicantPhone, @Defendant,
                    @DefendantContact, @DefendantPhone, @ProjectType,
                    @EvaluationPurpose, @PersonInCharge, @EntrustDate, @DispatchDate,
                    @ProjectNumber, @CompleteProgress, @Principal
                );
            `);
        res.status(201).json({ ID: result.rowsAffected[0] });
        pool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// 更新派单记录
app.put('/api/updateProjectDispatch/:id', async (req, res) => {
    const { id } = req.params;
    const {
        ProjectName, Branch, OrderNumber, ProjectSource,
        ProjectSourceContact, ProjectSourcePhone, Client,
        ClientContact, ClientPhone, Applicant, ApplicantContact,
        ApplicantPhone, Defendant, DefendantContact, DefendantPhone,
        ProjectType, EvaluationPurpose, PersonInCharge, EntrustDate, DispatchDate,
        ProjectNumber, CompleteProgress, Principal // 新增 Principal 字段
    } = req.body;

    try {
        let pool = await sql.connect(config);
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('ProjectName', sql.NVarChar, ProjectName)
            .input('Branch', sql.NVarChar, Branch)
            .input('OrderNumber', sql.NVarChar, OrderNumber)
            .input('ProjectSource', sql.NVarChar, ProjectSource)
            .input('ProjectSourceContact', sql.NVarChar, ProjectSourceContact)
            .input('ProjectSourcePhone', sql.NVarChar, ProjectSourcePhone)
            .input('Client', sql.NVarChar, Client)
            .input('ClientContact', sql.NVarChar, ClientContact)
            .input('ClientPhone', sql.NVarChar, ClientPhone)
            .input('Applicant', sql.NVarChar, Applicant)
            .input('ApplicantContact', sql.NVarChar, ApplicantContact)
            .input('ApplicantPhone', sql.NVarChar, ApplicantPhone)
            .input('Defendant', sql.NVarChar, Defendant)
            .input('DefendantContact', sql.NVarChar, DefendantContact)
            .input('DefendantPhone', sql.NVarChar, DefendantPhone)
            .input('ProjectType', sql.NVarChar, ProjectType)
            .input('EvaluationPurpose', sql.NVarChar, EvaluationPurpose)
            .input('PersonInCharge', sql.NVarChar, PersonInCharge)
            .input('EntrustDate', sql.Date, EntrustDate)
            .input('DispatchDate', sql.Date, DispatchDate)
            .input('ProjectNumber', sql.NVarChar, ProjectNumber)
            .input('CompleteProgress', sql.Bit, CompleteProgress)
            .input('Principal', sql.NVarChar, Principal) // 新增 Principal 字段
            .query(`
                UPDATE ProjectDispatchForm SET
                ProjectName = @ProjectName,
                Branch = @Branch,
                OrderNumber = @OrderNumber,
                ProjectSource = @ProjectSource,
                ProjectSourceContact = @ProjectSourceContact,
                ProjectSourcePhone = @ProjectSourcePhone,
                Client = @Client,
                ClientContact = @ClientContact,
                ClientPhone = @ClientPhone,
                Applicant = @Applicant,
                ApplicantContact = @ApplicantContact,
                ApplicantPhone = @ApplicantPhone,
                Defendant = @Defendant,
                DefendantContact = @DefendantContact,
                DefendantPhone = @DefendantPhone,
                ProjectType = @ProjectType,
                EvaluationPurpose = @EvaluationPurpose,
                PersonInCharge = @PersonInCharge,
                EntrustDate = @EntrustDate,
                DispatchDate = @DispatchDate,
                ProjectNumber = @ProjectNumber,
                CompleteProgress = @CompleteProgress,
                Principal = @Principal
                WHERE id = @id;
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).send('派单记录未找到');
        }

        res.status(200).json({ message: '派单记录更新成功' });
        pool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// 删除派单记录
app.delete('/api/deleteProjectDispatch/:id', async (req, res) => {
    const { id } = req.params;

    try {
        let pool = await sql.connect(config);
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM ProjectDispatchForm WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).send('派单记录未找到');
        }

        res.status(200).json({ message: '派单记录删除成功' });
        pool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});




//报告编号
// 获取所有报告
app.get('/api/getReportNumbers', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request().query('SELECT * FROM ReportNumberTable');
        res.json(result.recordset);
    } catch (error) {
        console.error('获取报告失败:', error);
        res.status(500).send('服务器错误');
    }
});

// 添加新报告
app.post('/api/addReportNumbers', async (req, res) => {
    const { asset_region, report_type, total_assessment_value, asset_usage, unit_assessment_price, assessment_area, report_count, issue_date, report_number, remarks } = req.body;
    try {
        let pool = await sql.connect(config);
        await pool.request()
            .input('asset_region', sql.NVarChar, asset_region)
            .input('report_type', sql.NVarChar, report_type)
            .input('total_assessment_value', sql.Decimal(18, 2), total_assessment_value)
            .input('asset_usage', sql.NVarChar, asset_usage)
            .input('unit_assessment_price', sql.Decimal(18, 2), unit_assessment_price)
            .input('assessment_area', sql.Decimal(18, 2), assessment_area)
            .input('report_count', sql.Int, report_count)
            .input('issue_date', sql.Date, issue_date)
            .input('report_number', sql.NVarChar, report_number)
            .input('remarks', sql.NVarChar, remarks)
            .query('INSERT INTO ReportNumberTable (asset_region, report_type, total_assessment_value, asset_usage, unit_assessment_price, assessment_area, report_count, issue_date, report_number, remarks) VALUES (@asset_region, @report_type, @total_assessment_value, @asset_usage, @unit_assessment_price, @assessment_area, @report_count, @issue_date, @report_number, @remarks)');
        res.status(201).send('报告添加成功');
    } catch (error) {
        console.error('添加报告失败:', error);
        res.status(500).send('服务器错误');
    }
});

// 更新报告
// 更新报告
app.put('/api/updateReportNumbers/:id', async (req, res) => {
    const { id } = req.params;
    const { asset_region, report_type, total_assessment_value, asset_usage, unit_assessment_price, assessment_area, report_count, issue_date, report_number, remarks } = req.body;
    try {
        //console.log('Issue Date:', issue_date); // 检查 issue_date 的值
        let pool = await sql.connect(config);
        await pool.request()
            .input('id', sql.Int, id)
            .input('asset_region', sql.NVarChar, asset_region)
            .input('report_type', sql.NVarChar, report_type)
            .input('total_assessment_value', sql.Decimal(18, 2), total_assessment_value)
            .input('asset_usage', sql.NVarChar, asset_usage)
            .input('unit_assessment_price', sql.Decimal(18, 2), unit_assessment_price)
            .input('assessment_area', sql.Decimal(18, 2), assessment_area)
            .input('report_count', sql.Int, report_count)
            .input('issue_date', sql.Date, issue_date) // 确保传递的是有效的日期
            .input('report_number', sql.NVarChar, report_number)
            .input('remarks', sql.NVarChar, remarks)
            .query('UPDATE ReportNumberTable SET asset_region = @asset_region, report_type = @report_type, total_assessment_value = @total_assessment_value, asset_usage = @asset_usage, unit_assessment_price = @unit_assessment_price, assessment_area = @assessment_area, report_count = @report_count, issue_date = @issue_date, report_number = @report_number, remarks = @remarks WHERE id = @id');
        res.send('报告更新成功');
    } catch (error) {
        console.error('更新报告失败:', error);
        res.status(500).send('服务器错误');
    }
});


// 删除报告
app.delete('/api/deleteReportNumbers/:id', async (req, res) => {
    const { id } = req.params;
    try {
        let pool = await sql.connect(config);
        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM ReportNumberTable WHERE id = @id');
        res.send('报告删除成功');
    } catch (error) {
        console.error('删除报告失败:', error);
        res.status(500).send('服务器错误');
    }
});



//评估收费统计
// 获取所有费用记录
app.get('/api/getAssessProjectFees', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        const result = await pool.request().query('SELECT * FROM AssessprojectfeesTable');
        res.json(result.recordset);
    } catch (error) {
        console.error('获取费用记录失败:', error);
        res.status(500).send('服务器错误');
    }
});

// 添加费用记录
app.post('/api/addAssessProjectFees', async (req, res) => {
    const { project_id, fee_amount, fee_date, fee_type, remarks } = req.body;
    try {
        let pool = await sql.connect(config);
        await pool.request()
            .input('project_id', sql.NVarChar, project_id)
            .input('fee_amount', sql.Decimal(18, 2), fee_amount)
            .input('fee_date', sql.DateTime, fee_date)
            .input('fee_type', sql.NVarChar, fee_type)
            .input('remarks', sql.NVarChar, remarks)
            .query('INSERT INTO AssessprojectfeesTable (project_id, fee_amount, fee_date, fee_type, remarks) VALUES (@project_id, @fee_amount, @fee_date, @fee_type, @remarks)');
        res.status(201).send('费用记录添加成功');
    } catch (error) {
        console.error('添加费用记录失败:', error);
        res.status(500).send('服务器错误');
    }
});

// 更新费用记录
app.put('/api/updateAssessProjectFees/:id', async (req, res) => {
    const { id } = req.params;
    const { project_id, fee_amount, fee_date, fee_type, remarks } = req.body;
    try {
        let pool = await sql.connect(config);
        await pool.request()
            .input('id', sql.Int, id)
            .input('project_id', sql.NVarChar, project_id)
            .input('fee_amount', sql.Decimal(18, 2), fee_amount)
            .input('fee_date', sql.DateTime, fee_date)
            .input('fee_type', sql.NVarChar, fee_type)
            .input('remarks', sql.NVarChar, remarks)
            .query('UPDATE AssessprojectfeesTable SET project_id = @project_id, fee_amount = @fee_amount, fee_date = @fee_date, fee_type = @fee_type, remarks = @remarks WHERE id = @id');
        res.send('费用记录更新成功');
    } catch (error) {
        console.error('更新费用记录失败:', error);
        res.status(500).send('服务器错误');
    }
});

// 删除费用记录
app.delete('/api/deleteAssessProjectFees/:id', async (req, res) => {
    const { id } = req.params;
    try {
        let pool = await sql.connect(config);
        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM AssessprojectfeesTable WHERE id = @id');
        res.send('费用记录删除成功');
    } catch (error) {
        console.error('删除费用记录失败:', error);
        res.status(500).send('服务器错误');
    }
});


//工作日志
// 获取所有工作日志
app.get('/api/getEvaluateworklogTable', async (req, res) => {
    const { project_id } = req.query; // 从查询参数获取项目编号
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .query(`SELECT * FROM EvaluateworklogTable ${project_id ? `WHERE project_id = @project_id` : ''}`);

        if (project_id) {
            pool.request().input('project_id', sql.NVarChar, project_id);
        }

        res.json(result.recordset);
        pool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// 添加工作日志
app.post('/api/addEvaluateworklogTable', async (req, res) => {
    const { project_id, communication_record, contact_time } = req.body;
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('project_id', sql.NVarChar, project_id)
            .input('communication_record', sql.NVarChar, communication_record)
            .input('contact_time', sql.Date, contact_time)
            .query('INSERT INTO EvaluateworklogTable (project_id, communication_record, contact_time) VALUES (@project_id, @communication_record, @contact_time)');

        res.status(201).json({ ID: result.rowsAffected[0] });
        pool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// 更新工作日志
app.put('/api/updateEvaluateworklogTable/:id', async (req, res) => {
    const { id } = req.params;
    const { project_id, communication_record, contact_time } = req.body;
    try {
        const pool = await sql.connect(config);
        await pool.request()
            .input('id', sql.Int, id)
            .input('project_id', sql.NVarChar, project_id)
            .input('communication_record', sql.NVarChar, communication_record)
            .input('contact_time', sql.Date, contact_time)
            .query('UPDATE EvaluateworklogTable SET project_id = @project_id, communication_record = @communication_record, contact_time = @contact_time WHERE id = @id');

        res.send('工作日志更新成功');
        pool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// 删除工作日志
app.delete('/api/deleteEvaluateworklogTable/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await sql.connect(config);
        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM EvaluateworklogTable WHERE id = @id');

        res.status(204).send(); // No Content
        pool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});



//机器设备
// 获取所有设备
app.get('/api/getMachineryEquipmentPricesTable', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query('SELECT * FROM MachineryEquipmentPricesTable');
        res.json(result.recordset);
        pool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// 添加设备
app.post('/api/addMachineryEquipmentPricesTable', async (req, res) => {
    const { name, model, manufacturer, unit, price } = req.body;
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('model', sql.NVarChar, model)
            .input('manufacturer', sql.NVarChar, manufacturer)
            .input('unit', sql.NVarChar, unit)
            .input('price', sql.Decimal(18, 2), price)
            .query('INSERT INTO MachineryEquipmentPricesTable (name, model, manufacturer, unit, price) OUTPUT INSERTED.id VALUES (@name, @model, @manufacturer, @unit, @price)');

        res.status(201).json({ ID: result.recordset[0].id });
        pool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// 更新设备
app.put('/api/updateMachineryEquipmentPricesTable/:id', async (req, res) => {
    const { id } = req.params;
    const { name, model, manufacturer, unit, price } = req.body;
    try {
        const pool = await sql.connect(config);
        await pool.request()
            .input('id', sql.Int, id)
            .input('name', sql.NVarChar, name)
            .input('model', sql.NVarChar, model)
            .input('manufacturer', sql.NVarChar, manufacturer)
            .input('unit', sql.NVarChar, unit)
            .input('price', sql.Decimal(18, 2), price)
            .query('UPDATE MachineryEquipmentPricesTable SET name = @name, model = @model, manufacturer = @manufacturer, unit = @unit, price = @price WHERE id = @id');

        res.sendStatus(204); // No Content
        pool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// 删除设备
app.delete('/api/deleteMachineryEquipmentPricesTable/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await sql.connect(config);
        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM MachineryEquipmentPricesTable WHERE id = @id');

        res.sendStatus(204); // No Content
        pool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});



//运动记录
// 获取运动选项
//  
app.get('/api/getSportsOptions', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .query('SELECT * FROM SportsApp.dbo.SportsOptions');

        res.json(result.recordset);
    } catch (error) {
        console.error('获取运动选项失败:', error);
        res.status(500).json({
            success: false,
            message: '获取运动选项失败',
            error: error.message
        });
    }
});
// 修正后的 API - 使用正确的列名 sport_type
app.get('/api/getSportsCategories', async (req, res) => {
    try {
        const { username } = req.query;
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('username', sql.VarChar, username)
            .query(`
                SELECT 
                    sport_type as sportType,
                    COUNT(*) as count,
                    SUM(DATEDIFF(SECOND, '00:00:00', duration)) as totalSeconds
                FROM SportsApp.dbo.SportsRecordingTable 
                WHERE participant = @username
                AND YEAR(date) = YEAR(GETDATE()) 
                AND MONTH(date) = MONTH(GETDATE())
                GROUP BY sport_type
                ORDER BY totalSeconds DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// 修正其他相关 API
app.get('/api/getUserSportsStats', async (req, res) => {
    try {
        const { username, period = 'today' } = req.query;
        const pool = await sql.connect(config);

        let query = '';
        if (period === 'today') {
            query = `
                SELECT COUNT(*) as count, 
                       SUM(DATEDIFF(SECOND, '00:00:00', duration)) as totalSeconds
                FROM SportsApp.dbo.SportsRecordingTable 
                WHERE participant = @username 
                AND date = CONVERT(date, GETDATE())
            `;
        } else if (period === 'month') {
            query = `
                SELECT COUNT(*) as count, 
                       SUM(DATEDIFF(SECOND, '00:00:00', duration)) as totalSeconds
                FROM SportsApp.dbo.SportsRecordingTable 
                WHERE participant = @username 
                AND YEAR(date) = YEAR(GETDATE()) 
                AND MONTH(date) = MONTH(GETDATE())
            `;
        }

        const result = await pool.request()
            .input('username', sql.VarChar, username)
            .query(query);

        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// 修正获取运动类型列表的 API
app.get('/api/getSportsTypeList', async (req, res) => {
    try {
        const { username } = req.query;
        const pool = await sql.connect(config);

        const result = await pool.request()
            .input('username', sql.VarChar, username)
            .query(`
                SELECT DISTINCT sport_type as sportType
                FROM SportsApp.dbo.SportsRecordingTable 
                WHERE participant = @username
                AND YEAR(date) = YEAR(GETDATE()) 
                AND MONTH(date) = MONTH(GETDATE())
                ORDER BY sport_type
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});
// 获取运动记录
app.get('/api/getSportsRecordingTable', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query('SELECT * FROM SportsApp.dbo.SportsRecordingTable ORDER BY date DESC, id DESC');
        res.json(result.recordset);
        // pool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// 添加运动记录 - 实时通知版本
app.post('/api/addSportsRecordingTable', async (req, res) => {
    const { sport_type, unit, quantity, date, duration, participant, remark } = req.body;

    // 验证时间格式 (HH:mm:ss)
    const isValidTime = (time) => /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/.test(time);
    if (duration && !isValidTime(duration)) {
        return res.status(400).json({ error: 'Invalid time format for duration. Expected HH:mm:ss' });
    }

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('sport_type', sql.VarChar, sport_type)
            .input('unit', sql.VarChar, unit)
            .input('quantity', sql.Int, quantity)
            .input('date', sql.Date, date)
            .input('duration', sql.VarChar(8), duration || '00:00:00')
            .input('participant', sql.VarChar, participant)
            .input('remark', sql.NVarChar, remark)
            .query(`INSERT INTO SportsApp.dbo.SportsRecordingTable 
                   (sport_type, unit, quantity, date, duration, participant, remark) 
                   VALUES (@sport_type, @unit, @quantity, @date, @duration, @participant, @remark);
                   SELECT SCOPE_IDENTITY() as id`);

        const newRecord = {
            id: result.recordset[0].id,
            sport_type,
            unit,
            quantity,
            date,
            duration: duration || '00:00:00',
            participant,
            remark
        };

        // 通知所有客户端有新的运动记录添加
        io.emit('sports_record_added', newRecord);

        res.status(201).json({
            success: true,
            message: '记录添加成功',
            id: newRecord.id,
            record: newRecord
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// 更新运动记录 - 实时通知版本
app.put('/api/updateSportsRecordingTable/:id', async (req, res) => {
    const { id } = req.params;
    const { sport_type, unit, quantity, date, duration, participant, remark } = req.body;

    // 验证时间格式
    const isValidTime = (time) => /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/.test(time);
    if (duration && !isValidTime(duration)) {
        return res.status(400).json({ error: 'Invalid time format for duration. Expected HH:mm:ss' });
    }

    try {
        const pool = await sql.connect(config);

        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('sport_type', sql.VarChar, sport_type)
            .input('unit', sql.VarChar, unit)
            .input('quantity', sql.Int, quantity)
            .input('date', sql.Date, date)
            .input('duration', sql.VarChar(8), duration || '00:00:00')
            .input('participant', sql.VarChar, participant)
            .input('remark', sql.NVarChar, remark)
            .query('UPDATE SportsApp.dbo.SportsRecordingTable SET sport_type = @sport_type, unit = @unit, quantity = @quantity, date = @date, duration = @duration, participant = @participant, remark = @remark WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Record not found' });
        }

        const updatedRecord = {
            id: parseInt(id),
            sport_type,
            unit,
            quantity,
            date,
            duration: duration || '00:00:00',
            participant,
            remark
        };

        // 通知所有客户端有运动记录更新
        io.emit('sports_record_updated', updatedRecord);

        res.status(200).json({
            success: true,
            message: '记录更新成功',
            record: updatedRecord
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// 删除运动记录 - 实时通知版本
app.delete('/api/deleteSportsRecordingTable/:id', async (req, res) => {
    const { id } = req.params;

    console.log('🗑️ 收到删除请求，ID:', id);

    if (!id || isNaN(parseInt(id))) {
        console.log('❌ 无效的ID:', id);
        return res.status(400).json({
            success: false,
            message: '无效的记录ID'
        });
    }

    const recordId = parseInt(id);

    try {
        await poolConnect;
        console.log('✅ 数据库连接成功，准备删除ID:', recordId);

        // 先获取记录信息用于通知
        const checkRequest = pool.request();
        const checkResult = await checkRequest
            .input('id', sql.Int, recordId)
            .query('SELECT id, sport_type, participant FROM SportsApp.dbo.SportsRecordingTable WHERE id = @id');

        console.log('🔍 查询结果记录数:', checkResult.recordset.length);

        if (checkResult.recordset.length === 0) {
            console.log('❌ 记录不存在，ID:', recordId);
            return res.status(404).json({
                success: false,
                message: '记录不存在或已被删除'
            });
        }

        const deletedRecord = checkResult.recordset[0];
        console.log('✅ 记录存在:', deletedRecord);

        // 执行删除
        const deleteRequest = pool.request();
        const deleteResult = await deleteRequest
            .input('id', sql.Int, recordId)
            .query('DELETE FROM SportsApp.dbo.SportsRecordingTable WHERE id = @id');

        const affectedRows = deleteResult.rowsAffected[0];
        console.log('📊 删除影响行数:', affectedRows);

        if (affectedRows === 0) {
            console.log('❌ 删除操作未影响任何行，ID:', recordId);
            return res.status(500).json({
                success: false,
                message: '记录删除失败'
            });
        }

        // 通知所有客户端有运动记录删除
        io.emit('sports_record_deleted', {
            id: recordId,
            sport_type: deletedRecord.sport_type,
            participant: deletedRecord.participant
        });

        console.log('✅ 删除成功，ID:', recordId);
        res.status(200).json({
            success: true,
            message: '记录删除成功',
            deletedRows: affectedRows,
            deletedId: recordId
        });

    } catch (err) {
        console.error('❌ 删除数据库错误:', err);
        res.status(500).json({
            success: false,
            message: '服务器错误: ' + err.message
        });
    }
});


//房屋图片上传
// 配置 multer 中间件
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const { region, location } = req.body;
        const uploadPath = path.join(__dirname, "images", "Community", region, location);

        // 如果文件夹不存在，则创建
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath); // 设置文件存储路径
    },
    filename: (req, file, cb) => {
        // 使用原始文件名
        cb(null, file.originalname);
    },
});

const upload = multer({ storage });

// 处理文件上传
app.post("/upload", upload.array("images"), (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ message: "未上传任何文件" });
        }

        res.status(200).json({ message: "文件上传成功" });
    } catch (error) {
        console.error("上传失败：", error);
        res.status(500).json({ message: "服务器错误" });
    }
});


//读取服务器图片 realestatepicturecarousel
// 定义图片目录
// API接口：获取图片列表
app.get('/api/getrealestatepicturecarouselimages', (req, res) => {
    const { region, folder } = req.query; // 从查询参数中获取 region 和 folder

    if (!region || !folder) {
        return res.status(400).json({ error: 'Region and folder are required' });
    }

    // 动态构建图片目录路径
    const imageDir = path.join(__dirname, 'images/Community', region, folder);
    console.log('Image directory path:', imageDir);

    // 读取目录中的文件
    fs.readdir(imageDir, (err, files) => {
        if (err) {
            console.error('Error reading image directory:', err);
            return res.status(500).json({ error: 'Unable to read image directory' });
        }

        // 过滤出图片文件（假设图片格式为 .jpg, .png, .jpeg）
        const imageFiles = files.filter(file => /\.(jpg|jpeg|png)$/i.test(file));

        // 构造完整的图片URL
        const imageUrls = imageFiles.map(file =>
            `http://121.4.22.55:80/backend/images/Community/${encodeURIComponent(region)}/${encodeURIComponent(folder)}/${file}`
        );

        // 返回图片URL列表
        res.json(imageUrls);
    });
});

//收入记录

// 获取所有收入记录
app.get('/api/incomerecords', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request().query('SELECT * FROM IncomeRecords');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err);
    }
});

// 添加收入记录
app.post('/api/incomerecords', async (req, res) => {
    const { Person, IncomeDate, Amount, Source, Description } = req.body;
    try {
        let pool = await sql.connect(config);
        await pool.request()
            .input('Person', sql.NVarChar, Person)
            .input('IncomeDate', sql.Date, IncomeDate)
            .input('Amount', sql.Decimal(18, 2), Amount)
            .input('Source', sql.NVarChar, Source)
            .input('Description', sql.NVarChar, Description)
            .query('INSERT INTO IncomeRecords (Person, IncomeDate, Amount, Source, Description) VALUES (@Person, @IncomeDate, @Amount, @Source, @Description)');
        res.sendStatus(201);
    } catch (err) {
        res.status(500).send(err);
    }
});

// 更新收入记录
app.put('/api/incomerecords/:id', async (req, res) => {
    const { id } = req.params;
    const { Person, IncomeDate, Amount, Source, Description } = req.body;
    try {
        let pool = await sql.connect(config);
        await pool.request()
            .input('ID', sql.Int, id)
            .input('Person', sql.NVarChar, Person)
            .input('IncomeDate', sql.Date, IncomeDate)
            .input('Amount', sql.Decimal(18, 2), Amount)
            .input('Source', sql.NVarChar, Source)
            .input('Description', sql.NVarChar, Description)
            .query('UPDATE IncomeRecords SET Person = @Person, IncomeDate = @IncomeDate, Amount = @Amount, Source = @Source, Description = @Description WHERE ID = @ID');
        res.sendStatus(200);
    } catch (err) {
        res.status(500).send(err);
    }
});

// 删除收入记录
app.delete('/api/incomerecords/:id', async (req, res) => {
    const { id } = req.params;
    try {
        let pool = await sql.connect(config);
        await pool.request()
            .input('ID', sql.Int, id)
            .query('DELETE FROM IncomeRecords WHERE ID = @ID');
        res.sendStatus(204);
    } catch (err) {
        res.status(500).send(err);
    }
});

// 检查房地产估价结果明细表是否有图片上传 
app.get('/api/checkImageExists', (req, res) => {
    const { region, folder } = req.query;

    if (!region || !folder) {
        return res.status(400).json({ error: 'Region and folder are required' });
    }

    const imageDir = path.join(__dirname, 'images/Community', region, folder);

    fs.access(imageDir, fs.constants.F_OK, (err) => {
        if (err) {
            return res.json({ exists: false });
        }
        return res.json({ exists: true });
    });
});




//聊天👇

// 获取聊天所有用户管理数据
app.get('/api/user-management', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query('SELECT * FROM ChatApp.dbo.UserManagement');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// 更新好友昵称的 API
app.post('/api/update-nickname', async (req, res) => {
    try {
        const { username, friend, newNickname } = req.body;
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('username', sql.NVarChar(50), username)
            .input('friend', sql.NVarChar(50), friend)
            .input('newNickname', sql.NVarChar(50), newNickname)
            .query(`
                UPDATE ChatApp.dbo.UserManagement
                SET friend_nickname = @newNickname
                WHERE username = @username AND friend = @friend
            `);

        if (result.rowsAffected[0] > 0) {
            res.status(200).json({ message: '昵称更新成功' });
        } else {
            res.status(404).json({ message: '未找到对应的好友记录，更新失败' });
        }

        io.emit('friendListChanged');
    } catch (error) {
        console.error('更新昵称时出错:', error);
        res.status(500).json({ message: '服务器内部错误，请稍后再试' });
    }
});

// 添加好友
// 验证用户是否存在
app.get('/api/validate-user/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('username', sql.NVarChar(50), username)
            .query('SELECT * FROM AccountLogin WHERE username = @username');

        if (result.recordset.length > 0) {
            res.status(200).json({ exists: true });
        } else {
            res.status(404).json({ exists: false, message: '用户不存在' });
        }
        io.emit('friendListChanged');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// 请求添加好友
app.post('/api/user-management', async (req, res) => {
    try {
        const { username, friend, is_friend_request_accepted = false, is_show_request = true } = req.body;
        const pool = await sql.connect(config);
        const query = `
            INSERT INTO ChatApp.dbo.UserManagement (username, friend, is_friend_request_accepted, is_show_request)
            VALUES (@username, @friend, @is_friend_request_accepted, @is_show_request)
        `;
        const request = pool.request();
        request.input('username', sql.NVarChar(50), username);
        request.input('friend', sql.NVarChar(50), friend);
        request.input('is_friend_request_accepted', sql.Bit, is_friend_request_accepted);
        request.input('is_show_request', sql.Bit, is_show_request);

        await request.query(query);
        res.status(201).json({ message: '好友请求添加成功' });

        // 发送好友请求通知给接收方
        io.emit('newFriendRequest', { sender: username, receiver: friend });
    } catch (err) {
        res.status(500).send(err.message);
    }
});


// 同意好友请求
app.put('/api/user-management/:username/:friend/accept', async (req, res) => {
    try {
        const { username, friend } = req.params;
        const pool = await sql.connect(config);
        const query = `
            UPDATE ChatApp.dbo.UserManagement
            SET is_friend_request_accepted = 1
            WHERE (username = @username AND friend = @friend)
               OR (username = @friend AND friend = @username)
        `;
        const request = pool.request();
        request.input('username', sql.NVarChar, username);
        request.input('friend', sql.NVarChar, friend);
        const result = await request.query(query);
        if (result.rowsAffected[0] > 0) {
            res.status(200).json({ message: '好友请求已同意' });
        } else {
            res.status(404).json({ message: '未找到该好友请求记录' });
        }
        io.emit('friendListChanged');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// 拒绝好友请求
app.delete('/api/user-management/:username/:friend', async (req, res) => {
    try {
        const { username, friend } = req.params;
        const pool = await sql.connect(config);
        const query = `
            DELETE FROM ChatApp.dbo.UserManagement
            WHERE (username = @username AND friend = @friend)
               OR (username = @friend AND friend = @username)
        `;
        const request = pool.request();
        request.input('username', sql.NVarChar, username);
        request.input('friend', sql.NVarChar, friend);
        const result = await request.query(query);
        // 无论是否删除了记录，都返回 200 状态码
        res.status(200).json({ message: '好友请求删除操作已处理' });

        io.emit('friendListChanged');
    } catch (err) {
        console.error('Error deleting friend request:', err);
        res.status(500).send(err.message);
    }
});

//聊天界面删除好友
app.delete('/api/user-management/:username/:friend', async (req, res) => {
    try {
        const { username, friend } = req.params;
        const pool = await sql.connect(config);
        const query = `
            DELETE FROM ChatApp.dbo.UserManagement
            WHERE username = @username AND friend = @friend
        `;
        const request = pool.request();
        request.input('username', sql.VarChar, username);
        request.input('friend', sql.VarChar, friend);
        const result = await request.query(query);
        if (result.rowsAffected[0] > 0) {
            res.status(200).json({ message: '好友已删除', success: true }); // 添加 success 字段
        } else {
            res.status(404).json({ message: '未找到该好友记录', success: false }); // 添加 success 字段
        }

        io.emit('friendListChanged');
    } catch (err) {
        res.status(500).send(err.message);
    }
});


//聊天界面上传图片功能 👇
// 修改存储配置，不依赖请求体
const storageChatImages = multer.diskStorage({
    destination: (req, file, cb) => {
        // 先存储到临时目录，等收到完整请求后再移动文件
        const tempPath = path.join(__dirname, 'images', 'ChatImages', 'temp');

        // 如果临时文件夹不存在，则递归创建
        if (!fs.existsSync(tempPath)) {
            fs.mkdirSync(tempPath, { recursive: true });
        }

        cb(null, tempPath);
    },
    filename: (req, file, cb) => {
        // 生成唯一文件名：时间戳 + 随机数 + 原扩展名
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        const ext = path.extname(file.originalname);
        const filename = `${timestamp}_${random}${ext}`;
        cb(null, filename);
    }
});

const uploadChatImage = multer({
    storage: storageChatImages,
    fileFilter: (req, file, cb) => {
        // 只检查文件类型，不依赖请求体
        if (file.mimetype.match(/image\/(jpeg|jpg|png|gif|bmp|webp)/)) {
            cb(null, true);
        } else {
            cb(new Error('只允许上传图片文件 (JPEG, JPG, PNG, GIF, BMP, WebP)'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 限制5MB
    }
});

// 上传聊天图片的API
app.post('/api/messages/uploadImage',
    uploadChatImage.single('image'),
    async (req, res) => {
        try {
            const { sender_name, receiver_name } = req.body;

            if (!sender_name || !receiver_name) {
                // 删除已上传的文件
                if (req.file) {
                    fs.unlink(req.file.path, () => { });
                }
                return res.status(400).json({ error: '发送者和接收者名称必须提供' });
            }

            if (!req.file) {
                return res.status(400).json({ error: '请选择要上传的图片' });
            }

            // 创建最终存储目录
            const finalDir = path.join(__dirname, 'images', 'ChatImages', sender_name);
            if (!fs.existsSync(finalDir)) {
                fs.mkdirSync(finalDir, { recursive: true });
            }

            const finalPath = path.join(finalDir, req.file.filename);

            // 将文件从临时目录移动到最终目录
            fs.renameSync(req.file.path, finalPath);

            const pool = await sql.connect(config);

            // 插入消息记录到数据库
            const result = await pool.request()
                .input('message_text', sql.Text, '[图片]')
                .input('sender_name', sql.VarChar(100), sender_name)
                .input('receiver_name', sql.VarChar(100), receiver_name)
                .input('message_type', sql.VarChar(50), 'image')
                .input('image_filename', sql.VarChar(255), req.file.filename)
                .query(`
                    INSERT INTO ChatApp.dbo.ChatMessages 
                    (message_text, sender_name, receiver_name, message_type, image_filename) 
                    VALUES (@message_text, @sender_name, @receiver_name, @message_type, @image_filename); 
                    SELECT SCOPE_IDENTITY() as message_id;
                `);

            const messageId = result.recordset[0].message_id;

            // 构建图片访问URL
            const imageUrl = `http://121.4.22.55:80/backend/images/ChatImages/${sender_name}/${req.file.filename}`;

            res.status(201).json({
                success: true,
                message: '图片上传成功',
                message_id: messageId,
                image_url: imageUrl,
                image_filename: req.file.filename
            });

            // 发送消息通知给接收者
            io.emit('newMessage', {
                message_id: messageId,
                message_text: '[图片]',
                sender_name,
                receiver_name,
                message_type: 'image',
                image_filename: req.file.filename,
                timestamp: new Date(),
                is_read: 0
            });

            // 触发未读消息计数更新事件
            io.emit('unreadCountsUpdated');

        } catch (error) {
            // 出错时删除已上传的文件
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlink(req.file.path, () => { });
            }

            console.error('上传聊天图片错误:', error);
            res.status(500).json({
                error: '上传失败',
                message: error.message
            });
        }
    }
);
//聊天界面上传图片功能 👆


// 获取消息
app.get('/api/messages', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query('SELECT * FROM ChatApp.dbo.ChatMessages');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// header接受参数并查询特定用户的未读消息总数
app.get('/api/headerUnreadMessages', async (req, res) => {
    try {
        const { username } = req.query;
        if (!username) {
            return res.status(400).json({ error: '用户名参数缺失' });
        }

        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('username', sql.VarChar(100), username)
            .query(`
                SELECT COUNT(*) as count 
                FROM ChatApp.dbo.ChatMessages 
                WHERE receiver_name = @username AND is_read = 0
            `);

        res.json({ count: result.recordset[0].count });
    } catch (err) {
        console.error('数据库查询错误:', err);
        res.status(500).send(err.message);
    }
});

// 新增 API 端点：获取当前用户和指定好友之间的消息
app.get('/api/messages/chatold', async (req, res) => {
    const { senderName, receiverName } = req.query;

    if (!senderName || !receiverName) {
        return res.status(400).send('senderName 和 receiverName 是必填参数');
    }

    try {
        const pool = await sql.connect(config);
        const query = `
            SELECT * 
            FROM ChatApp.dbo.ChatMessages 
            WHERE (sender_name = @senderName AND receiver_name = @receiverName)
               OR (sender_name = @receiverName AND receiver_name = @senderName)
            ORDER BY message_id ASC
        `;
        const result = await pool.request()
            .input('senderName', sql.VarChar, senderName)
            .input('receiverName', sql.VarChar, receiverName)
            .query(query);

        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});
//分页获取消息，滚动条向上滚动
app.get('/api/messages/chat', async (req, res) => {
    const { senderName, receiverName, page = 1, pageSize = 20 } = req.query;

    if (!senderName || !receiverName) {
        return res.status(400).send('senderName 和 receiverName 是必填参数');
    }

    try {
        const pool = await sql.connect(config);
        const offset = (page - 1) * pageSize;

        const query = `
            SELECT * 
            FROM ChatApp.dbo.ChatMessages 
            WHERE (sender_name = @senderName AND receiver_name = @receiverName)
               OR (sender_name = @receiverName AND receiver_name = @senderName)
            ORDER BY message_id DESC
            OFFSET @offset ROWS 
            FETCH NEXT @pageSize ROWS ONLY
        `;
        const result = await pool.request()
            .input('senderName', sql.VarChar, senderName)
            .input('receiverName', sql.VarChar, receiverName)
            .input('offset', sql.Int, offset)
            .input('pageSize', sql.Int, parseInt(pageSize))
            .query(query);

        // 直接返回数据库中的时间，不要做任何转换
        const messages = result.recordset.map(msg => {
            // 确保时间戳是有效的 Date 对象
            if (msg.timestamp) {
                // 如果数据库返回的是字符串，确保它被正确解析
                msg.timestamp = new Date(msg.timestamp).toISOString();
            }
            return msg;
        });

        res.json(messages.reverse());
    } catch (err) {
        console.error('API错误:', err);
        res.status(500).send(err.message);
    }
});
// 发送消息
// 发送消息（修改支持消息类型）
app.post('/api/messages', async (req, res) => {
    const { message_text, sender_name, receiver_name, message_type = 'text', image_filename = null } = req.body;
    try {
        const pool = await sql.connect(config);

        // 使用当前时间，让数据库存储正确的时间戳
        const now = new Date();

        const result = await pool.request()
            .input('message_text', sql.Text, message_text)
            .input('sender_name', sql.VarChar(100), sender_name)
            .input('receiver_name', sql.VarChar(100), receiver_name)
            .input('message_type', sql.VarChar(50), message_type)
            .input('image_filename', sql.VarChar(255), image_filename)
            .input('timestamp', sql.DateTime, now) // 使用当前时间对象
            .query(`
                INSERT INTO ChatApp.dbo.ChatMessages 
                (message_text, sender_name, receiver_name, message_type, image_filename, timestamp) 
                VALUES (@message_text, @sender_name, @receiver_name, @message_type, @image_filename, @timestamp); 
                SELECT SCOPE_IDENTITY() as message_id;
            `);

        const messageId = result.recordset[0].message_id;

        res.status(201).send('Message added');

        // 发送消息通知给接收者 - 使用 ISO 字符串格式
        io.emit('newMessage', {
            message_id: messageId,
            message_text,
            sender_name,
            receiver_name,
            message_type,
            image_filename,
            timestamp: now.toISOString() // 使用 ISO 格式
        });

        // 触发消息已读事件和未读消息计数更新事件
        io.emit('messagesRead', [messageId]);
        io.emit('unreadCountsUpdated');

    } catch (err) {
        res.status(500).send(err.message);
    }
});
// 标记消息为已读
// 标记消息为已读
app.put('/api/messages/read', async (req, res) => {
    const { messageIds } = req.body;
    try {
        const pool = await sql.connect(config);
        for (const id of messageIds) {
            await pool.request()
                .input('message_id', sql.BigInt, id)
                .query('UPDATE ChatApp.dbo.ChatMessages SET is_read = 1 WHERE message_id = @message_id');
        }
        res.status(200).send('Messages marked as read');

        io.emit('messagesRead', messageIds); // 触发消息已读事件
        io.emit('unreadCountsUpdated'); // 触发未读消息计数更新事件
    } catch (err) {
        res.status(500).send(err.message);
    }
});


//按下输入框的时候，开始发送消息的时候  将所有未读的消息标记为已读
app.put('/api/messages/markAllAsRead', async (req, res) => {
    const { sender_name, receiver_name } = req.body;
    try {
        const pool = await sql.connect(config);

        // 更新所有符合条件的消息为已读
        const result = await pool.request()
            .input('sender_name', sql.NVarChar, sender_name)
            .input('receiver_name', sql.NVarChar, receiver_name)
            .query('UPDATE ChatApp.dbo.ChatMessages SET is_read = 1 WHERE sender_name = @sender_name AND receiver_name = @receiver_name');

        // 获取更新后的消息 ID
        const updatedMessages = await pool.request()
            .input('sender_name', sql.NVarChar, sender_name)
            .input('receiver_name', sql.NVarChar, receiver_name)
            .query('SELECT message_id FROM ChatApp.dbo.ChatMessages WHERE sender_name = @sender_name AND receiver_name = @receiver_name AND is_read = 1');

        const messageIds = updatedMessages.recordset.map(msg => msg.message_id);

        // 广播消息已读事件给所有客户端
        io.emit('messagesRead', messageIds);

        res.status(200).send('All messages marked as read');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// 删除消息
// 删除消息（同时删除图片文件）
app.delete('/api/messages', async (req, res) => {
    const { messageIds } = req.body;
    try {
        const pool = await sql.connect(config);

        // 先查询要删除的消息，获取图片文件名
        const idList = messageIds.map(id => `'${id}'`).join(',');
        const queryResult = await pool.request()
            .query(`
                SELECT message_id, sender_name, message_type, image_filename 
                FROM ChatApp.dbo.ChatMessages 
                WHERE message_id IN (${idList})
            `);

        const messagesToDelete = queryResult.recordset;

        // 删除数据库中的消息
        await pool.request().query(`DELETE FROM ChatApp.dbo.ChatMessages WHERE message_id IN (${idList})`);

        // 删除对应的图片文件
        await deleteMessageImages(messagesToDelete);

        res.status(200).send('Messages deleted');

        // 通知客户端刷新消息
        io.emit('refreshMessages');
    } catch (err) {
        console.error('删除消息错误:', err);
        res.status(500).send(err.message);
    }
});
// 删除单条消息（用于socket事件）
app.delete('/api/messages/:messageId', async (req, res) => {
    const { messageId } = req.params;
    try {
        const pool = await sql.connect(config);

        // 先查询要删除的消息
        const queryResult = await pool.request()
            .input('messageId', sql.BigInt, messageId)
            .query(`
                SELECT message_id, sender_name, message_type, image_filename 
                FROM ChatApp.dbo.ChatMessages 
                WHERE message_id = @messageId
            `);

        if (queryResult.recordset.length === 0) {
            return res.status(404).send('消息不存在');
        }

        const message = queryResult.recordset[0];

        // 删除数据库中的消息
        await pool.request()
            .input('messageId', sql.BigInt, messageId)
            .query('DELETE FROM ChatApp.dbo.ChatMessages WHERE message_id = @messageId');

        // 删除对应的图片文件
        await deleteMessageImages([message]);

        res.status(200).send('Message deleted');

        // 通知客户端刷新消息
        io.emit('refreshMessages');
    } catch (err) {
        console.error('删除消息错误:', err);
        res.status(500).send(err.message);
    }
});

// 删除图片文件的辅助函数
async function deleteMessageImages(messages) {
    const deletePromises = messages.map(async (message) => {
        // 只删除图片类型的消息
        if (message.message_type === 'image' && message.image_filename) {
            const imagePath = path.join(__dirname, 'images', 'ChatImages', message.sender_name, message.image_filename);

            try {
                if (fs.existsSync(imagePath)) {
                    await fs.promises.unlink(imagePath);
                    console.log(`删除图片文件: ${imagePath}`);
                }
            } catch (error) {
                console.error(`删除图片文件失败: ${imagePath}`, error);
                // 不抛出错误，继续删除其他文件
            }
        }
    });

    await Promise.allSettled(deletePromises);
}
// 批量删除用户的所有图片消息（可选功能）
app.delete('/api/messages/user/:username/images', async (req, res) => {
    const { username } = req.params;
    try {
        const pool = await sql.connect(config);

        // 查询用户的所有图片消息
        const queryResult = await pool.request()
            .input('username', sql.VarChar(100), username)
            .query(`
                SELECT message_id, sender_name, image_filename 
                FROM ChatApp.dbo.ChatMessages 
                WHERE sender_name = @username AND message_type = 'image'
            `);

        const imageMessages = queryResult.recordset;

        // 删除数据库中的图片消息
        await pool.request()
            .input('username', sql.VarChar(100), username)
            .query(`DELETE FROM ChatApp.dbo.ChatMessages WHERE sender_name = @username AND message_type = 'image'`);

        // 删除对应的图片文件
        await deleteMessageImages(imageMessages);

        res.status(200).json({
            success: true,
            message: `成功删除 ${imageMessages.length} 条图片消息`,
            deletedCount: imageMessages.length
        });
    } catch (err) {
        console.error('删除用户图片消息错误:', err);
        res.status(500).send(err.message);
    }
});

// 查找消息
app.get('/api/messages/search', async (req, res) => {
    const { keyword } = req.query;
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('keyword', sql.NVarChar, `%${keyword}%`)
            .query('SELECT * FROM ChatApp.dbo.ChatMessages WHERE message_text LIKE @keyword');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

io.on('connection', (socket) => {
    // 服务器端代码示例
    socket.on('messagesReadByReceiver', (data) => {
        // 广播给所有连接的客户端，特别是发送者
        socket.broadcast.emit('messagesReadByReceiver', data);
    });

    socket.on('unreadCountsUpdated', (data) => {
        // 通知所有客户端更新未读计数
        socket.broadcast.emit('unreadCountsUpdated', data);
    });
});



//下面的没用
app.post('/api/dsfaadd-friend', async (req, res) => {
    const { username, friend_ip } = req.body;

    if (!username || !friend_ip) {
        return res.status(400).json({ message: '用户名和好友IP不能为空' });
    }

    try {
        const pool = await sql.connect(config);
        // 检查好友IP是否存在
        const checkFriendQuery = `SELECT * FROM ChatApp.dbo.UserManagement WHERE username = '${friend_ip}'`;
        const friendResult = await pool.request().query(checkFriendQuery);

        if (friendResult.recordset.length === 0) {
            return res.status(404).json({ message: '未找到该好友IP对应的用户' });
        }

        // 插入好友关系
        const insertQuery = `
            INSERT INTO ChatApp.dbo.UserManagement (username, friend, friend_ip, is_friend_request_accepted)
            VALUES ('${username}', '${friendResult.recordset[0].username}', '${friend_ip}', 0)
        `;
        await pool.request().query(insertQuery);

        res.status(201).json({ message: '好友请求已发送' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// 获取头像图片
app.get('/api/getuserheadimage', (req, res) => {
    const { username } = req.query; // 从查询参数中获取用户名

    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    // 动态构建图片目录路径
    const imageDir = path.join(__dirname, 'images/ChatApp', username, 'headpicture');
    //console.log('Image directory path:', imageDir);

    // 检查目录是否存在
    if (!fs.existsSync(imageDir)) {
        // 关闭对话框显示报错
        //没有找到图片
        // console.error('Image directory does not exist:', imageDir);
        return res.status(404).json({ error: 'Image directory not found' });
    }

    // 读取目录中的文件
    fs.readdir(imageDir, (err, files) => {
        if (err) {
            console.error('Error reading image directory:', err);
            return res.status(500).json({ error: 'Unable to read image directory' });
        }

        // 过滤出图片文件（假设图片格式为 .jpg, .png, .jpeg）
        const imageFiles = files.filter(file => /\.(jpg|jpeg|png)$/i.test(file));

        if (imageFiles.length === 0) {
            console.error('No image files found in directory:', imageDir);
            return res.status(404).json({ error: 'No image found' });
        }

        // 返回第一张图片的URL
        const imageUrl = `http://121.4.22.55:80/backend/images/ChatApp/${encodeURIComponent(username)}/headpicture/${imageFiles[0]}`;
        res.json({ imageUrl });
    });
});


// 下面的上传图片作废

//上传和覆盖头像图片
// 配置 multer 用于处理文件上传
// 配置 multer 存储路径
const storageheadimage = multer.diskStorage({
    destination: (req, file, cb) => {
        const { username } = req.query;
        const imageDir = path.join(__dirname, 'images/ChatApp', username, 'headpicture');

        // 检查目录是否存在，如果不存在则创建
        if (!fs.existsSync(imageDir)) {
            fs.mkdirSync(imageDir, { recursive: true });
        }

        // 删除原有的头像文件
        fs.readdir(imageDir, (err, files) => {
            if (err) {
                console.error('Error reading image directory:', err);
                return cb(err);
            }

            // 删除所有以 "avatar" 开头的文件
            files.forEach(file => {
                if (file.startsWith('avatar')) {
                    const filePath = path.join(imageDir, file);
                    fs.unlink(filePath, (unlinkErr) => {
                        if (unlinkErr) {
                            console.error('Error deleting existing avatar:', unlinkErr);
                        }
                    });
                }
            });

            // 确保删除完成后调用 cb
            cb(null, imageDir);
        });
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `avatar${ext}`); // 固定文件名为 avatar + 扩展名
    }
});

const uploadheadimage = multer({ storage: storageheadimage });

// 处理图片上传的接口
app.post('/backend/api/uploaduserheadimage', uploadheadimage.single('image'), (req, res) => {
    const { username } = req.query;
    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
    }

    // 返回新的头像 URL
    const imageUrl = `http://121.4.22.55:80/backend/images/ChatApp/${encodeURIComponent(username)}/headpicture/${req.file.filename}`;
    res.json({ imageUrl });
});




//聊天背景图片处理
// 配置存储路径和文件名
const storageChatBackground = multer.diskStorage({
    destination: (req, file, cb) => {
        const { username } = req.query;
        const imageDir = path.join(__dirname, 'images/ChatApp', username, 'chatbackgroundimage');

        // 检查目录是否存在，如果不存在则创建
        if (!fs.existsSync(imageDir)) {
            fs.mkdirSync(imageDir, { recursive: true });
        }

        // 删除原有的背景图片文件
        fs.readdir(imageDir, (err, files) => {
            if (err) {
                console.error('Error reading image directory:', err);
                return cb(err);
            }

            // 删除所有以 "backgroundimage" 开头的文件
            files.forEach(file => {
                if (file.startsWith('backgroundimage')) {
                    const filePath = path.join(imageDir, file);
                    fs.unlink(filePath, (unlinkErr) => {
                        if (unlinkErr) {
                            console.error('Error deleting existing background image:', unlinkErr);
                        }
                    });
                }
            });

            // 确保删除完成后调用 cb
            cb(null, imageDir);
        });
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `backgroundimage${ext}`); // 固定文件名为 backgroundimage + 扩展名
    }
});

const uploadChatBackground = multer({ storage: storageChatBackground });

// 处理聊天背景图片上传的接口
app.post('/backend/api/uploadchatbackground', uploadChatBackground.single('image'), (req, res) => {
    const { username } = req.query;
    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
    }

    // 返回新的背景图片 URL
    const imageUrl = `http://121.4.22.55:80/backend/images/ChatApp/${encodeURIComponent(username)}/chatbackgroundimage/${req.file.filename}`;
    res.json({ imageUrl });
});

//聊天👆


//主题设置

// 获取主题
app.get('/api/getthemesettings', async (req, res) => {
    const { username } = req.query;
    try {
        // 连接到 SQL Server
        const pool = await sql.connect(config);
        const query = `
            SELECT 
                their_font_color,
                their_bubble_color,
                my_font_color,
                my_bubble_color,
                background_color,
                use_background_image,
                navbar_font_color,  -- 新增字段
                navbar_background_color  -- 新增字段
            FROM AccountLogin
            WHERE username = @username
        `;
        const request = pool.request();
        request.input('username', sql.NVarChar, username);
        const result = await request.query(query);
        if (result.recordset.length > 0) {
            const settings = result.recordset[0];
            res.json({ success: true, settings });
        } else {
            res.json({ success: false, message: '未找到主题设置。' });
        }
        // 关闭连接
        await pool.close();
    } catch (error) {
        console.error('获取主题设置时出错:', error);
        res.status(500).json({ success: false, message: '获取主题设置失败。' });
    }
});

// 修改主题
app.post('/api/savethemesettings', upload.none(), async (req, res) => {
    const {
        username,
        theirFontColor,
        theirBubbleColor,
        myFontColor,
        myBubbleColor,
        backgroundColor,
        useBackgroundImage,
        navbarFontColor,  // 新增参数
        navbarBackgroundColor  // 新增参数
    } = req.body;
    try {
        const pool = await sql.connect(config);
        const query = `
            UPDATE AccountLogin
            SET 
                their_font_color = @theirFontColor,
                their_bubble_color = @theirBubbleColor,
                my_font_color = @myFontColor,
                my_bubble_color = @myBubbleColor,
                background_color = @backgroundColor,
                use_background_image = @useBackgroundImage,
                navbar_font_color = @navbarFontColor,  -- 新增更新字段
                navbar_background_color = @navbarBackgroundColor  -- 新增更新字段
            WHERE username = @username
        `;
        const request = pool.request();
        request.input('username', sql.NVarChar, username);
        request.input('theirFontColor', sql.NVarChar, theirFontColor);
        request.input('theirBubbleColor', sql.NVarChar, theirBubbleColor);
        request.input('myFontColor', sql.NVarChar, myFontColor);
        request.input('myBubbleColor', sql.NVarChar, myBubbleColor);
        request.input('backgroundColor', sql.NVarChar, backgroundColor);
        request.input('useBackgroundImage', sql.Bit, useBackgroundImage === '1' ? 1 : 0);
        request.input('navbarFontColor', sql.NVarChar, navbarFontColor);  // 新增输入参数
        request.input('navbarBackgroundColor', sql.NVarChar, navbarBackgroundColor);  // 新增输入参数
        await request.query(query);
        res.json({ success: true, message: '主题设置保存成功！' });
        await pool.close();
    } catch (error) {
        console.error('保存主题设置时出错:', error);
        res.status(500).json({ success: false, message: '保存失败，请重试。' });
    }
});


//新的音乐播放
// 实时监听客户端事件
// 在服务器端添加以下代码
const rooms = {}; // 存储房间信息

io.on('connection', (socket) => {
    let currentRoom = '';
    let currentUser = '';

    // 加入房间
    socket.on('joinRoom', ({ username, room }) => {
        currentRoom = room;
        currentUser = username;

        socket.join(currentRoom);

        // 初始化房间（如果不存在）
        if (!rooms[currentRoom]) {
            rooms[currentRoom] = {
                users: [],
                currentTime: 0,
                isPlaying: false,
                currentSongIndex: 0
            };
        }

        // 添加用户到房间
        const isManager = rooms[currentRoom].users.length === 0;
        rooms[currentRoom].users.push({
            id: socket.id,
            username,
            isManager
        });

        // 通知房间内所有用户更新用户列表
        io.to(currentRoom).emit('userListUpdate', rooms[currentRoom].users);

        // 向新用户发送当前状态（时间+播放状态+歌曲索引）
        socket.to(currentRoom).emit('playStateUpdate', rooms[currentRoom].isPlaying);
        socket.to(currentRoom).emit('timeSync', rooms[currentRoom].currentTime);
        socket.to(currentRoom).emit('songChange', { index: rooms[currentRoom].currentSongIndex });
    });

    // 同步时间
    socket.on('syncTime', (time) => {
        if (currentRoom && rooms[currentRoom]) {
            rooms[currentRoom].currentTime = time;
            io.to(currentRoom).emit('timeSync', time);
        }
    });

    // 更新播放状态
    socket.on('updatePlayState', (isPlaying) => {
        if (currentRoom && rooms[currentRoom]) {
            rooms[currentRoom].isPlaying = isPlaying;
            io.to(currentRoom).emit('playStateUpdate', isPlaying);
        }
    });

    // 新增：强制同步请求
    socket.on('requestSync', () => {
        if (currentRoom && rooms[currentRoom]) {
            // 只允许房间内用户请求同步
            if (rooms[currentRoom].users.some(u => u.id === socket.id)) {
                socket.to(currentRoom).emit('timeSync', rooms[currentRoom].currentTime);
                socket.to(currentRoom).emit('playStateUpdate', rooms[currentRoom].isPlaying);
                socket.to(currentRoom).emit('songChange', { index: rooms[currentRoom].currentSongIndex });
            }
        }
    });

    // 新增：切换歌曲（仅管理员）
    socket.on('songChange', ({ index }) => {
        if (currentRoom && rooms[currentRoom]) {
            // 验证是否是管理员
            const isManager = rooms[currentRoom].users.some(
                u => u.id === socket.id && u.isManager
            );

            if (isManager) {
                rooms[currentRoom].currentSongIndex = index;
                rooms[currentRoom].currentTime = 0; // 重置时间
                io.to(currentRoom).emit('songChange', { index });
                io.to(currentRoom).emit('timeSync', 0); // 同步重置时间
            }
        }
    });

    // 断开连接
    socket.on('disconnect', () => {
        if (currentRoom && rooms[currentRoom]) {
            // 从房间中移除用户
            rooms[currentRoom].users = rooms[currentRoom].users.filter(
                user => user.id !== socket.id
            );

            // 如果管理员离开，指定新的管理员
            if (rooms[currentRoom].users.length > 0) {
                const hasManager = rooms[currentRoom].users.some(user => user.isManager);
                if (!hasManager) {
                    rooms[currentRoom].users[0].isManager = true;
                    // 通知新管理员
                    io.to(rooms[currentRoom].users[0].id).emit('userListUpdate', rooms[currentRoom].users);
                }
            }

            // 更新用户列表
            io.to(currentRoom).emit('userListUpdate', rooms[currentRoom].users);

            // 清理空房间
            if (rooms[currentRoom].users.length === 0) {
                delete rooms[currentRoom];
            }
        }
    });
});
//上面的是旧的 👆


//创建一起听的音乐房间
/* #region start */
// 加入房间
// 监听 socket 连接事件
io.on('connection', (socket) => {
    // 加入房间
    socket.on('join-room', ({ roomName, username }) => {
        socket.join(`room-${roomName}`);
        console.log(`${username} 加入了房间 ${roomName}`);

        // 通知房间内其他用户有新成员加入
        socket.to(`room-${roomName}`).emit('user-joined', {
            user_name: username
        });
    });

    // 离开房间
    socket.on('leave-room', ({ roomName, username }) => {
        socket.leave(`room-${roomName}`);
        console.log(`${username} 离开了房间 ${roomName}`);

        // 通知房间内其他用户有成员离开
        socket.to(`room-${roomName}`).emit('user-left', {
            user_name: username
        });
    });

    // 播放歌曲
    socket.on('play-song', ({ roomName, songName, currentTime }) => {
        socket.to(`room-${roomName}`).emit('play-song', {
            songName,
            currentTime
        });
    });

    // 暂停歌曲
    socket.on('pause-song', ({ roomName }) => {
        socket.to(`room-${roomName}`).emit('pause-song');
    });

    // 跳转进度
    socket.on('seek-song', ({ roomName, time }) => {
        socket.to(`room-${roomName}`).emit('seek-song', { time });
    });

    // 添加音乐上传事件
    socket.on('music-uploaded', () => {
        // 广播给所有连接的客户端
        io.emit('music-list-updated');
    });

    // 添加播放模式
    socket.on('play-mode-updated', () => {
        // 广播给所有连接的客户端
        io.emit('play-mode-updated');
    });

    // 监听时长更新
    socket.on('update-listening-time', ({ roomName, roomOwner, roomUser }) => {
        // 广播给房间内所有用户
        socket.to(`room-${roomName}`).emit('listening-time-updated', {
            room_name: roomName,
            room_user: roomUser,
            listen_time: 0 // 初始值为0，实际值由数据库返回
        });
    });

});
// 更新房间状态 API
// 更新房间状态 API
app.post('/api/update-room-state', async (req, res) => {
    const { room_name, song_name, artist, current_time, is_playing, play_mode } = req.body;

    try {
        await sql.connect(config);

        // 使用参数化查询
        const request = new sql.Request();
        request.input('room_name', sql.NVarChar, room_name);
        request.input('song_name', sql.NVarChar, song_name);
        request.input('artist', sql.NVarChar, artist);
        request.input('current_time', sql.Float, current_time);
        request.input('is_playing', sql.Bit, is_playing);
        request.input('play_mode', sql.NVarChar, play_mode);

        const updateQuery = `
            UPDATE ChatApp.dbo.MusicRooms 
            SET 
                song_name = @song_name,
                artist = @artist,
                [current_time] = @current_time,
                is_playing = @is_playing,
                play_mode = @play_mode
            WHERE room_name = @room_name
        `;

        await request.query(updateQuery);

        // 获取更新后的房间信息
        const roomInfoRequest = new sql.Request();
        roomInfoRequest.input('room_name', sql.NVarChar, room_name);
        const roomInfoQuery = `SELECT * FROM ChatApp.dbo.MusicRooms WHERE room_name = @room_name`;
        const roomInfo = await roomInfoRequest.query(roomInfoQuery);

        // 通知房间内所有客户端状态更新
        io.to(`room-${roomInfo.recordset[0].room_id}`).emit('room-update', {
            roomInfo: roomInfo.recordset[0],
            users: await getRoomUsers(room_name)
        });

        res.status(200).json({ message: '房间状态更新成功' });

    } catch (err) {
        console.error('更新房间状态失败:', err);
        res.status(500).json({ error: '更新房间状态失败' });
    }
});
// 更新房间播放模式 API
app.post('/api/update-play-mode', async (req, res) => {
    const { room_name, play_mode } = req.body;

    if (!room_name || !play_mode) {
        return res.status(400).json({ error: '缺少必要参数' });
    }

    try {
        await sql.connect(config);

        // 使用正确的参数化查询语法
        const updateQuery = `
            UPDATE ChatApp.dbo.MusicRooms 
            SET play_mode = @play_mode
            WHERE room_name = @room_name
        `;

        // 使用正确的参数传递方式
        const request = new sql.Request();
        request.input('room_name', sql.NVarChar, room_name);
        request.input('play_mode', sql.NVarChar, play_mode);

        await request.query(updateQuery);

        // 通知房间内所有客户端播放模式更新
        io.to(`room-${room_name}`).emit('play-mode-updated', {
            room_name: room_name,
            play_mode: play_mode
        });

        res.status(200).json({
            success: true,
            room_name: room_name,
            play_mode: play_mode
        });

    } catch (err) {
        console.error('更新播放模式失败:', err);
        res.status(500).json({ error: '更新播放模式失败' });
    } finally {
        sql.close();
    }
});

// 辅助函数：获取房间用户
async function getRoomUsers(room_name) {
    try {
        const request = new sql.Request();
        request.input('room_name', sql.NVarChar, room_name);

        const usersQuery = `
            SELECT user_name, is_host 
            FROM ChatApp.dbo.MusicRoomUsers 
            WHERE room_name = @room_name
            ORDER BY is_host DESC, join_time ASC
        `;

        const usersResult = await request.query(usersQuery);
        return usersResult.recordset;
    } catch (err) {
        console.error('获取房间用户失败:', err);
        return [];
    }
}
// 创建房间 API

app.post('/api/create-room', async (req, res) => {
    const { room_name, password, host, play_mode = 'order' } = req.body; // 默认值为'order'

    try {
        await sql.connect(config);

        // 检查房间是否已存在
        const checkRoomQuery = `SELECT COUNT(*) AS count FROM ChatApp.dbo.MusicRooms WHERE room_name = '${room_name}'`;
        const checkResult = await sql.query(checkRoomQuery);

        if (checkResult.recordset[0].count > 0) {
            return res.status(400).json({ error: '房间名称已存在' });
        }

        // 创建房间
        const createRoomQuery = `
            INSERT INTO ChatApp.dbo.MusicRooms 
                (room_name, password, host, room_status, max_users, song_name, artist, [current_time], is_playing, play_mode)
            VALUES 
                ('${room_name}', '${password}', '${host}', '等待中', 10, '', '', 0, 0, '${play_mode}')
        `;
        await sql.query(createRoomQuery);

        // 将房主加入房间用户表
        const addHostQuery = `
            INSERT INTO ChatApp.dbo.MusicRoomUsers 
                (room_name, user_name, is_host)
            VALUES 
                ('${room_name}', '${host}', 1)
        `;
        await sql.query(addHostQuery);

        // 获取刚创建的房间信息
        const roomInfoQuery = `SELECT * FROM ChatApp.dbo.MusicRooms WHERE room_name = '${room_name}'`;
        const roomInfo = await sql.query(roomInfoQuery);

        res.status(200).json({
            room_id: roomInfo.recordset[0].room_id,
            room_name,
            message: '房间创建成功'
        });

        // 通知所有客户端有新房间创建
        io.emit('new-room-created', roomInfo.recordset[0]);

    } catch (err) {
        console.error('创建房间失败:', err);
        res.status(500).json({ error: '创建房间失败' });
    }
});

// 加入房间 API
app.post('/api/join-room', async (req, res) => {
    const { room_name, user_name, password } = req.body;

    try {
        await sql.connect(config);

        // 检查房间是否存在
        const roomQuery = `SELECT * FROM ChatApp.dbo.MusicRooms WHERE room_name = '${room_name}'`;
        const roomResult = await sql.query(roomQuery);

        if (roomResult.recordset.length === 0) {
            return res.status(404).json({ error: '房间不存在' });
        }

        const room = roomResult.recordset[0];

        // 检查密码是否正确
        if (room.password && room.password !== password) {
            return res.status(401).json({ error: '密码错误' });
        }

        // 检查用户是否已在房间中
        const userCheckQuery = `
            SELECT COUNT(*) AS count 
            FROM ChatApp.dbo.MusicRoomUsers 
            WHERE room_name = '${room_name}' AND user_name = '${user_name}'
        `;
        const userCheckResult = await sql.query(userCheckQuery);

        if (userCheckResult.recordset[0].count > 0) {
            // 修改这里：返回房间ID和房间名称
            return res.status(200).json({
                room_id: room.room_id,
                room_name: room.room_name,
                message: '您已经在房间中',
                already_in_room: true
            });
        }

        // 检查房间人数是否已满
        const userCountQuery = `
            SELECT COUNT(*) AS count 
            FROM ChatApp.dbo.MusicRoomUsers 
            WHERE room_name = '${room_name}'
        `;
        const userCountResult = await sql.query(userCountQuery);

        if (userCountResult.recordset[0].count >= room.max_users) {
            return res.status(400).json({ error: '房间人数已满' });
        }

        // 将用户加入房间
        const addUserQuery = `
            INSERT INTO ChatApp.dbo.MusicRoomUsers 
                (room_name, user_name, is_host)
            VALUES 
                ('${room_name}', '${user_name}', 0)
        `;
        await sql.query(addUserQuery);

        res.status(200).json({
            room_id: room.room_id,
            room_name,
            message: '加入房间成功'
        });

        // 通知房间内所有客户端有新用户加入
        io.to(`room-${room.room_id}`).emit('user-joined', {
            user_name,
            room_name,
            total_users: userCountResult.recordset[0].count + 1
        });

    } catch (err) {
        console.error('加入房间失败:', err);
        res.status(500).json({ error: '加入房间失败' });
    }
});

//添加查询用户所在房间的API /api/user-room
app.get('/api/user-room', async (req, res) => {
    const { username } = req.query;

    try {
        await sql.connect(config);

        const query = `
            SELECT r.room_id, r.room_name 
            FROM ChatApp.dbo.MusicRoomUsers u
            JOIN ChatApp.dbo.MusicRooms r ON u.room_name = r.room_name
            WHERE u.user_name = '${username}'
        `;

        const result = await sql.query(query);

        if (result.recordset.length > 0) {
            res.status(200).json(result.recordset[0]);
        } else {
            res.status(404).json({ error: '用户不在任何房间中' });
        }

    } catch (err) {
        console.error('查询用户房间失败:', err);
        res.status(500).json({ error: '查询用户房间失败' });
    }
});
// 获取房间信息 API
app.get('/api/room-info/:room_name', async (req, res) => {
    const { room_name } = req.params;

    try {
        await sql.connect(config);

        // 获取房间基本信息
        const roomQuery = `SELECT * FROM ChatApp.dbo.MusicRooms WHERE room_name = '${room_name}'`;
        const roomResult = await sql.query(roomQuery);

        if (roomResult.recordset.length === 0) {
            return res.status(404).json({ error: '房间不存在' });
        }

        const room = roomResult.recordset[0];

        // 获取房间用户列表
        const usersQuery = `
            SELECT user_name, is_host 
            FROM ChatApp.dbo.MusicRoomUsers 
            WHERE room_name = '${room_name}'
            ORDER BY is_host DESC, join_time ASC
        `;
        const usersResult = await sql.query(usersQuery);

        res.status(200).json({
            ...room,
            users: usersResult.recordset
        });

    } catch (err) {
        console.error('获取房间信息失败:', err);
        res.status(500).json({ error: '获取房间信息失败' });
    }
});

// 离开房间 API
// 离开房间 API
app.post('/api/leave-room', async (req, res) => {
    const { room_name, user_name } = req.body;

    try {
        await sql.connect(config);

        // 1. 获取房间信息，检查用户是否是房主
        const roomQuery = `SELECT * FROM ChatApp.dbo.MusicRooms WHERE room_name = '${room_name}'`;
        const roomResult = await sql.query(roomQuery);

        if (roomResult.recordset.length === 0) {
            return res.status(404).json({ error: '房间不存在' });
        }

        const room = roomResult.recordset[0];
        const isHost = room.host === user_name;

        // 2. 如果是房主离开，删除整个房间
        if (isHost) {
            // 先删除所有关联的用户
            const deleteUsersQuery = `
                DELETE FROM ChatApp.dbo.MusicRoomUsers 
                WHERE room_name = '${room_name}'
            `;
            await sql.query(deleteUsersQuery);

            // 删除所有关联的消息
            const deleteMessagesQuery = `
                DELETE FROM ChatApp.dbo.MusicRoomMessages 
                WHERE room_name = '${room_name}'
            `;
            await sql.query(deleteMessagesQuery);

            // 最后删除房间
            const deleteRoomQuery = `
                DELETE FROM ChatApp.dbo.MusicRooms 
                WHERE room_name = '${room_name}'
            `;
            await sql.query(deleteRoomQuery);

            // 通知所有客户端房间已解散
            io.to(`room-${room.room_id}`).emit('room-deleted', {
                room_name,
                deleted_by: user_name
            });

            return res.status(200).json({
                message: '房主离开，房间已解散',
                room_deleted: true
            });
        }

        // 3. 如果是普通用户离开，只需从用户表中删除
        const deleteUserQuery = `
            DELETE FROM ChatApp.dbo.MusicRoomUsers 
            WHERE room_name = '${room_name}' AND user_name = '${user_name}'
        `;
        await sql.query(deleteUserQuery);

        // 通知房间内所有客户端有用户离开
        io.to(`room-${room.room_id}`).emit('user-left', {
            user_name,
            room_name
        });

        res.status(200).json({
            message: '离开房间成功',
            room_deleted: false
        });

    } catch (err) {
        console.error('离开房间失败:', err);
        res.status(500).json({ error: '离开房间失败' });
    }
});
// 转让房主 API 👇
// 定义需要的函数
async function getRoomInfo(room_name) {
    const pool = await sql.connect(config);
    const result = await pool.request()
        .input('room_name', sql.NVarChar, room_name)
        .query(`
            SELECT 
                room_id, 
                room_name, 
                host, 
                created_at,
                password,
                room_status,
                max_users,
                song_name,
                artist,
                [current_time],
                is_playing
            FROM ChatApp.dbo.MusicRooms 
            WHERE room_name = @room_name
        `);
    return result.recordset[0];
}

async function getRoomUsers(room_name) {
    const pool = await sql.connect(config);
    const result = await pool.request()
        .input('room_name', sql.NVarChar, room_name)
        .query(`
            SELECT user_name, is_host, join_time 
            FROM ChatApp.dbo.MusicRoomUsers 
            WHERE room_name = @room_name
        `);
    return result.recordset;
}

app.post('/api/transfer-host', async (req, res) => {
    const { room_name, current_host, new_host } = req.body;

    try {
        const pool = await sql.connect(config);

        // 1. 验证当前请求者是房主
        const checkHost = await pool.request()
            .input('room_name', sql.NVarChar, room_name)
            .input('current_host', sql.NVarChar, current_host)
            .query(`
                SELECT COUNT(*) AS count 
                FROM ChatApp.dbo.MusicRooms 
                WHERE room_name = @room_name AND host = @current_host
            `);

        if (checkHost.recordset[0].count === 0) {
            return res.status(403).json({ error: '只有房主可以执行此操作' });
        }

        // 2. 更新房间房主
        await pool.request()
            .input('room_name', sql.NVarChar, room_name)
            .input('new_host', sql.NVarChar, new_host)
            .query(`
                UPDATE ChatApp.dbo.MusicRooms 
                SET host = @new_host 
                WHERE room_name = @room_name
            `);

        // 3. 更新用户权限
        await pool.request()
            .input('room_name', sql.NVarChar, room_name)
            .input('current_host', sql.NVarChar, current_host)
            .input('new_host', sql.NVarChar, new_host)
            .query(`
                UPDATE ChatApp.dbo.MusicRoomUsers 
                SET is_host = CASE 
                    WHEN user_name = @current_host THEN 0 
                    WHEN user_name = @new_host THEN 1 
                    ELSE is_host 
                END
                WHERE room_name = @room_name 
                AND (user_name = @current_host OR user_name = @new_host)
            `);

        // 4. 获取更新后的完整信息
        const roomInfo = await getRoomInfo(room_name);
        const users = await getRoomUsers(room_name);

        // 5. 通知所有客户端
        io.to(`room-${roomInfo.room_id}`).emit('host-transferred', {
            old_host: current_host,
            new_host: new_host,
            roomInfo: {  // 确保包含所有必要字段
                ...roomInfo,
                host: new_host  // 确保host已更新
            },
            users: users  // 确保包含更新后的用户列表
        });

        res.status(200).json({
            success: true,
            roomInfo,
            users
        });

    } catch (err) {
        console.error('转让房主失败:', err);
        res.status(500).json({ error: '转让房主失败' });
    }
});
// 转让房主 API 👆

// 获取房间消息
app.get('/api/room-messages/:room_name', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('room_name', sql.NVarChar, req.params.room_name)
            .query(`
                SELECT 
                    id, 
                    user_name, 
                    message, 
                    CONVERT(VARCHAR, sent_at, 120) AS sent_at  -- 格式化为 "YYYY-MM-DD HH:MI:SS"
                FROM ChatApp.dbo.MusicRoomMessages 
                WHERE room_name = @room_name 
                ORDER BY sent_at DESC
            `);
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('获取消息失败:', err);
        res.status(500).json({ error: '获取消息失败' });
    }
});

// 听歌的时候房间 发送消息 👇
app.post('/api/send-message', async (req, res) => {
    const { room_name, user_name, message } = req.body;
    if (!room_name || !user_name || !message) {
        return res.status(400).json({ error: '缺少必要参数' });
    }

    try {
        const pool = await sql.connect(config);
        await pool.request()
            .input('room_name', sql.NVarChar, room_name)
            .input('user_name', sql.NVarChar, user_name)
            .input('message', sql.NVarChar, message)
            .query(`
                INSERT INTO ChatApp.dbo.MusicRoomMessages 
                (room_name, user_name, message) 
                VALUES (@room_name, @user_name, @message)
            `);

        // 通知所有客户端有新消息
        io.to(`room-${room_name}`).emit('new-message', {
            user_name,
            message,
            sent_at: new Date()
        });

        res.status(200).json({ success: true });
    } catch (err) {
        console.error('发送消息失败:', err);
        res.status(500).json({ error: '发送消息失败' });
    }
});
// 听歌的时候房间 发送消息 👆
//后面还有监听



//一起听歌时长记录 👇

// 在server.js中添加以下API

// 记录或更新听歌时长
app.post('/api/update-listening-time', async (req, res) => {
    const { room_name, room_owner, room_user } = req.body;

    try {
        await sql.connect(config);

        // 1. 检查是否已有记录
        const checkQuery = `
            SELECT id, listen_time 
            FROM ChatApp.dbo.ListenMusicTogetherTimeCount 
            WHERE room_name = @room_name 
            AND room_owner = @room_owner 
            AND room_user = @room_user
        `;

        const request = new sql.Request();
        request.input('room_name', sql.NVarChar, room_name);
        request.input('room_owner', sql.NVarChar, room_owner);
        request.input('room_user', sql.NVarChar, room_user);

        const result = await request.query(checkQuery);

        // 2. 如果没有记录，则插入新记录；否则更新现有记录
        if (result.recordset.length === 0) {
            const insertQuery = `
                INSERT INTO ChatApp.dbo.ListenMusicTogetherTimeCount 
                (room_name, room_owner, room_user, listen_time)
                VALUES (@room_name, @room_owner, @room_user, 1)
            `;
            await request.query(insertQuery);
        } else {
            const updateQuery = `
                UPDATE ChatApp.dbo.ListenMusicTogetherTimeCount 
                SET listen_time = listen_time + 1 
                WHERE id = @id
            `;
            request.input('id', sql.Int, result.recordset[0].id);
            await request.query(updateQuery);
        }

        // 3. 获取更新后的时长
        const updatedResult = await request.query(checkQuery);
        const listenTime = updatedResult.recordset[0]?.listen_time || 0;

        // 4. 通知房间内所有客户端时长更新
        io.to(`room-${room_name}`).emit('listening-time-updated', {
            room_name,
            room_user,
            listen_time: listenTime
        });

        res.status(200).json({ success: true, listen_time: listenTime });

    } catch (err) {
        console.error('更新听歌时长失败:', err);
        res.status(500).json({ error: '更新听歌时长失败' });
    }
});

// 获取用户听歌时长
app.get('/api/get-listening-time', async (req, res) => {
    const { room_name, room_user } = req.query;

    try {
        await sql.connect(config);

        const query = `
            SELECT listen_time 
            FROM ChatApp.dbo.ListenMusicTogetherTimeCount 
            WHERE room_name = @room_name 
            AND room_user = @room_user
        `;

        const request = new sql.Request();
        request.input('room_name', sql.NVarChar, room_name);
        request.input('room_user', sql.NVarChar, room_user);

        const result = await request.query(query);

        if (result.recordset.length > 0) {
            res.status(200).json({
                listen_time: result.recordset[0].listen_time
            });
        } else {
            res.status(200).json({ listen_time: 0 });
        }

    } catch (err) {
        console.error('获取听歌时长失败:', err);
        res.status(500).json({ error: '获取听歌时长失败' });
    }
});
//一起听歌时长记录 👆

/* #endregion end  //创建一起听的音乐房间*/





// 获取音乐列表的 API
app.get('/api/musics', async (req, res) => {
    try {
        // 连接数据库
        await sql.connect(config);
        // 查询音乐数据
        //const result = await sql.query('SELECT title, artist, coverimage, src FROM ChatApp.dbo.Music');
        // 查询所有音乐数据（获取所有字段）
        const result = await sql.query('SELECT * FROM ChatApp.dbo.Music');


        // 返回结果
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});


// 获取用户收藏列表
app.get('/backend/api/favorites', async (req, res) => {
    try {
        const { user_name } = req.query;
        await sql.connect(config);

        const result = await sql.query`
            SELECT * FROM ChatApp.dbo.MusicFavorites 
            WHERE user_name = ${user_name}
        `;

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// 按分类获取歌曲
app.get('/backend/api/musics/by-category', async (req, res) => {
    try {
        const { category } = req.query;
        await sql.connect(config);

        const result = await sql.query`
            SELECT * FROM ChatApp.dbo.Music 
            WHERE genre = ${category}
        `;

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});
// 添加收藏
app.post('/backend/api/favorites', async (req, res) => {
    try {
        const { user_name, song_name, artist, play_count } = req.body;
        await sql.connect(config);

        await sql.query`
            INSERT INTO ChatApp.dbo.MusicFavorites (user_name, song_name, artist, play_count)
            VALUES (${user_name}, ${song_name}, ${artist}, ${play_count})
        `;

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// 取消收藏
app.delete('/backend/api/favorites', async (req, res) => {
    try {
        const { user_name, song_name } = req.body;
        await sql.connect(config);

        await sql.query`
            DELETE FROM ChatApp.dbo.MusicFavorites 
            WHERE user_name = ${user_name} AND song_name = ${song_name}
        `;

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});


//上传音乐开始
// 配置 Multer 存储

const storageMusic = multer.diskStorage({
    destination: (req, file, cb) => {
        const musicDir = path.join(__dirname, 'musics');
        if (!fs.existsSync(musicDir)) {
            fs.mkdirSync(musicDir, { recursive: true });
        }
        cb(null, musicDir);
    },
    filename: (req, file, cb) => {
        const { title, artist } = req.body;
        if (title && artist) {
            const ext = path.extname(file.originalname);
            // 歌词文件使用和音乐文件相同的前缀名
            const newFileName = `${title}-${artist}${ext}`;
            cb(null, newFileName);
        } else {
            cb(new Error('标题和歌手是文件命名必需的'), null);
        }
    }
});

const uploadMusic = multer({ storage: storageMusic });

// 处理音乐上传的接口

app.post('/backend/api/uploadmusic', uploadMusic.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
    { name: 'lyrics', maxCount: 1 }
]), async (req, res) => {
    try {
        const { title, artist, genre } = req.body; // 新增 genre 字段

        if (!title || !artist || !genre) {
            return res.status(400).json({ error: '标题、歌手和类型是必需的' });
        }

        if (!req.files.audio || !req.files.cover) {
            return res.status(400).json({ error: '音频和封面文件是必需的' });
        }

        const audioFile = req.files.audio[0];
        const coverFile = req.files.cover[0];

        // 处理歌词文件（如果有）
        if (req.files.lyrics) {
            const lyricsFile = req.files.lyrics[0];
            console.log(`歌词文件已保存: ${lyricsFile.filename}`);
        }

        const baseUrl = 'http://121.4.22.55:80/backend/musics';

        await sql.connect(config);
        const request = new sql.Request();
        const query = `
            INSERT INTO ChatApp.dbo.Music (title, artist, coverimage, src, genre)
            VALUES (@title, @artist, @coverimage, @src, @genre)
        `;
        request.input('title', sql.NVarChar(255), title);
        request.input('artist', sql.NVarChar(255), artist);
        request.input('coverimage', sql.NVarChar(255), coverFile.filename);
        request.input('src', sql.NVarChar(255), audioFile.filename);
        request.input('genre', sql.NVarChar(50), genre); // 新增 genre 参数
        await request.query(query);

        // 通知所有客户端音乐列表已更新
        io.emit('music-list-updated');

        res.json({
            message: '音乐上传成功',
            audioUrl: `${baseUrl}/${audioFile.filename}`,
            coverUrl: `${baseUrl}/${coverFile.filename}`,
            lyricsUrl: req.files.lyrics ? `${baseUrl}/${req.files.lyrics[0].filename}` : null
        });
    } catch (error) {
        console.error('上传音乐出错:', error);
        res.status(500).json({ error: '上传音乐失败' });
    }
});

//上传音乐结束

// 新增获取歌词的接口
app.get('/backend/api/lyrics/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        const lrcPath = path.join(__dirname, 'musics', filename);

        if (!fs.existsSync(lrcPath)) {
            return res.status(404).json({ error: '歌词文件不存在' });
        }

        const lrcContent = fs.readFileSync(lrcPath, 'utf-8');
        res.set('Content-Type', 'text/plain; charset=utf-8');
        res.send(lrcContent);
    } catch (error) {
        console.error('获取歌词失败:', error);
        res.status(500).json({ error: '获取歌词失败' });
    }
});


//歌曲评论 api👇
// 获取某首歌曲的所有评论
app.get('/backend/api/music-comments', async (req, res) => {
    const { music_id } = req.query;

    if (!music_id) {
        return res.status(400).json({ error: 'music_id is required' });
    }

    try {
        await sql.connect(config);
        const result = await sql.query`
            SELECT 
                comment_id, 
                music_id,
                music_title,
                music_artist,
                user_name, 
                comment_text, 
                created_at 
            FROM ChatApp.dbo.MusicComments 
            WHERE music_id = ${music_id}
            ORDER BY created_at DESC
        `;
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching comments:', err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        sql.close();
    }
});
// 获取某首歌曲的评论数量
// 获取某首歌曲的评论数量
app.get('/backend/api/music-comments/count', async (req, res) => {
    const { music_id } = req.query;

    if (!music_id) {
        return res.status(400).json({ error: 'music_id is required' });
    }

    try {
        // 直接使用 pool 查询，不需要手动 connect/close
        const result = await pool.query`
            SELECT COUNT(*) as count 
            FROM ChatApp.dbo.MusicComments 
            WHERE music_id = ${music_id}
        `;
        res.json({ count: result.recordset[0].count });
    } catch (err) {
        console.error('Error fetching comment count:', err);
        res.status(500).json({ error: 'Server error' });
    }
    // 不需要 finally { sql.close() }，连接池会自动管理
});
// 提交新评论
// 提交新评论API
app.post('/backend/api/music-comments', async (req, res) => {
    console.log('Received comment data:', req.body);
    const { music_id, music_title, music_artist, user_name, comment_text } = req.body;

    // 添加更严格的验证
    if (!music_id || isNaN(music_id)) {
        return res.status(400).json({ error: 'Valid music_id is required' });
    }
    if (!music_title || !music_artist || !user_name || !comment_text) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        await sql.connect(config);
        const result = await sql.query`
            INSERT INTO ChatApp.dbo.MusicComments 
            (music_id, music_title, music_artist, user_name, comment_text)
            VALUES 
            (${Number(music_id)}, ${music_title}, ${music_artist}, ${user_name}, ${comment_text})
        `;

        io.emit('new-comment', { music_id: Number(music_id) });
        res.json({ success: true });
    } catch (err) {
        console.error('Error submitting comment:', err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        sql.close();
    }
});
// 删除评论 (可选功能)
app.delete('/backend/api/music-comments', async (req, res) => {
    const { comment_id, user_name } = req.body;

    if (!comment_id || !user_name) {
        return res.status(400).json({ error: 'comment_id and user_name are required' });
    }

    try {
        await sql.connect(config);
        const result = await sql.query`
            DELETE FROM ChatApp.dbo.MusicComments 
            WHERE comment_id = ${comment_id} AND user_name = ${user_name}
        `;

        if (result.rowsAffected[0] > 0) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Comment not found or not authorized' });
        }
    } catch (err) {
        console.error('Error deleting comment:', err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        sql.close();
    }
});
//歌曲评论 👆


//记录用户播放歌曲记录，方便下一次打开时继续上一次的播放👇


// 保存播放历史 - 改进版
app.post('/backend/api/play-history', async (req, res) => {
    //后端打印历史播放信息
    // console.log('Received play history data:', req.body);
    const { user_name, music_id, music_title, music_artist } = req.body;

    // 严格验证
    if (!user_name) {
        return res.status(400).json({ error: 'user_name is required' });
    }
    if (!music_id || isNaN(music_id)) {
        return res.status(400).json({ error: 'Valid music_id is required' });
    }
    if (!music_title || !music_artist) {
        return res.status(400).json({ error: 'music_title and music_artist are required' });
    }

    try {
        await sql.connect(config);

        // 使用MERGE语句实现UPSERT操作
        const result = await sql.query`
            MERGE INTO ChatApp.dbo.PlayMusicHistory AS target
            USING (VALUES (${user_name}, ${Number(music_id)}, ${music_title}, ${music_artist})) 
                   AS source (user_name, music_id, music_title, music_artist)
            ON target.user_name = source.user_name
            WHEN MATCHED THEN
                UPDATE SET 
                    music_id = source.music_id,
                    music_title = source.music_title,
                    music_artist = source.music_artist,
                    last_played_at = GETDATE()
            WHEN NOT MATCHED THEN
                INSERT (user_name, music_id, music_title, music_artist)
                VALUES (source.user_name, source.music_id, source.music_title, source.music_artist);
        `;

        // 广播播放历史更新
        io.emit('play-history-updated', {
            user_name,
            music_id: Number(music_id),
            music_title,
            music_artist
        });

        res.json({ success: true });
    } catch (err) {
        console.error('Error saving play history:', err);
        res.status(500).json({ error: 'Database error' });
    } finally {
        sql.close();
    }
});

// 获取播放历史 - 改进版
app.get('/backend/api/play-history/:user_name', async (req, res) => {
    const { user_name } = req.params;
    console.log(`Fetching play history for user: ${user_name}`);

    if (!user_name) {
        return res.status(400).json({ error: 'user_name is required' });
    }

    try {
        await sql.connect(config);
        const result = await sql.query`
            SELECT TOP 1 
                h.music_id,
                h.music_title,
                h.music_artist,
                m.src,
                m.coverimage
            FROM ChatApp.dbo.PlayMusicHistory h
            JOIN ChatApp.dbo.Music m ON h.music_id = m.id
            WHERE h.user_name = ${user_name}
            ORDER BY h.last_played_at DESC
        `;

        if (result.recordset.length > 0) {
            res.json(result.recordset[0]);
        } else {
            res.status(404).json({ error: 'No play history found' });
        }
    } catch (err) {
        console.error('Error fetching play history:', err);
        res.status(500).json({ error: 'Database error' });
    } finally {
        sql.close();
    }
});


//记录用户播放歌曲记录，方便下一次打开时继续上一次的播放👆



//穿衣搭配开始
//
// 新增随机获取穿搭数据的API 今日穿搭的时候随机找一条推荐
app.get('/api/dressing-guidelines/random', async (req, res) => {
    try {
        const pool = await sql.connect(config);

        // 1. 首先获取所有有穿搭记录的日期
        const datesResult = await pool.request()
            .query(`
                SELECT DISTINCT date 
                FROM ChatApp.dbo.DressingGuidelinesData
                ORDER BY date DESC
            `);

        if (datesResult.recordset.length === 0) {
            return res.status(404).json({ error: '没有可用的穿搭数据' });
        }

        // 2. 随机选择一个日期
        const randomIndex = Math.floor(Math.random() * datesResult.recordset.length);
        const randomDate = datesResult.recordset[randomIndex].date;

        // 确保日期格式为YYYY-MM-DD
        const formattedDate = new Date(randomDate).toISOString().split('T')[0];

        // 3. 获取该日期的天气数据
        const weatherResult = await pool.request()
            .input('date', sql.Date, randomDate)
            .query(`
                SELECT 
                    CONVERT(varchar(10), date, 120) as date, 
                    mintemperature AS minTemperature, 
                    maxtemperature AS maxTemperature, 
                    weather, 
                    suggestion 
                FROM ChatApp.dbo.WeatherData
                WHERE date = @date
            `);

        if (weatherResult.recordset.length === 0) {
            return res.status(404).json({ error: '未找到对应日期的天气数据' });
        }

        // 4. 获取该日期的穿搭图片
        const imagesResult = await pool.request()
            .input('date', sql.Date, randomDate)
            .query(`
                SELECT 
                    imagesrc AS src, 
                    imagetype AS type,
                    description 
                FROM ChatApp.dbo.DressingGuidelinesData 
                WHERE date = @date
            `);

        const response = {
            ...weatherResult.recordset[0],
            images: imagesResult.recordset.map(img => ({
                ...img,
                url: `http://121.4.22.55:80/backend/images/DressingGuidelinesData/${formattedDate}/${img.src}`
            }))
        };

        res.json(response);
    } catch (err) {
        console.error('获取随机穿搭数据错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});
// 修改API返回数据中的日期格式
app.get('/api/dressing-guidelines/today', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const pool = await sql.connect(config);

        // 获取今日天气数据
        const weatherResult = await pool.request()
            .input('date', sql.Date, today)
            .query(`
                SELECT 
                    id,
                    CONVERT(varchar(10), date, 120) as date, 
                    mintemperature AS minTemperature, 
                    maxtemperature AS maxTemperature, 
                    weather, 
                    suggestion 
                FROM ChatApp.dbo.WeatherData
                WHERE date = @date
            `);

        if (weatherResult.recordset.length === 0) {
            return res.status(404).json({ error: '未找到今日天气数据' });
        }

        // 获取今日穿搭图片
        const imagesResult = await pool.request()
            .input('date', sql.Date, today)
            .query(`
                SELECT 
                    imagesrc AS src, 
                    imagetype AS type,
                    description 
                FROM ChatApp.dbo.DressingGuidelinesData 
                WHERE date = @date
            `);

        const response = {
            ...weatherResult.recordset[0],
            images: imagesResult.recordset.map(img => ({
                ...img,
                url: `http://121.4.22.55:80/backend/images/DressingGuidelinesData/${today}/${img.src}`
            }))
        };

        res.json(response);
    } catch (err) {
        console.error('获取今日穿搭数据错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 现有的穿搭搜索API
// 修改现有的搜索API
app.get('/api/dressing-guidelines/search', async (req, res) => {
    try {
        const { mode, date, weather, minTemp, maxTemp, keyword } = req.query;
        const pool = await sql.connect(config);

        let query = '';
        let request = pool.request();

        if (mode === 'date') {
            request.input('date', sql.Date, date);
            query = `
                SELECT 
                    id, -- 添加 id 字段
                    CONVERT(varchar(10), date, 120) as date, 
                    mintemperature AS minTemperature, 
                    maxtemperature AS maxTemperature, 
                    weather, 
                    suggestion 
                FROM ChatApp.dbo.WeatherData 
                WHERE date = @date
            `;
        } else if (mode === 'weather') {
            request.input('weather', sql.NVarChar, weather);
            query = `
                SELECT 
                    id, -- 添加 id 字段
                    CONVERT(varchar(10), date, 120) as date, 
                    mintemperature AS minTemperature, 
                    maxtemperature AS maxTemperature, 
                    weather, 
                    suggestion 
                FROM ChatApp.dbo.WeatherData 
                WHERE weather = @weather
            `;
        } else if (mode === 'temperature') {
            request.input('minTemp', sql.Int, minTemp);
            request.input('maxTemp', sql.Int, maxTemp);
            query = `
                SELECT 
                    id, -- 添加 id 字段
                    CONVERT(varchar(10), date, 120) as date, 
                    mintemperature AS minTemperature, 
                    maxtemperature AS maxTemperature, 
                    weather, 
                    suggestion 
                FROM ChatApp.dbo.WeatherData 
                WHERE maxtemperature >= @minTemp AND mintemperature <= @maxTemp
            `;
        } else if (mode === 'keyword') {
            request.input('keyword', sql.NVarChar, `%${keyword}%`);
            query = `
                SELECT DISTINCT 
                    w.id, -- 添加 id 字段
                    CONVERT(varchar(10), w.date, 120) as date,
                    w.mintemperature AS minTemperature, 
                    w.maxtemperature AS maxTemperature, 
                    w.weather, 
                    w.suggestion 
                FROM ChatApp.dbo.WeatherData w
                LEFT JOIN ChatApp.dbo.DressingGuidelinesData d ON w.date = d.date
                WHERE w.suggestion LIKE @keyword 
                   OR d.description LIKE @keyword
                   OR d.imagetype LIKE @keyword
                ORDER BY date
            `;
        } else {
            return res.status(400).json({ error: '无效的搜索模式' });
        }

        const weatherResults = await request.query(query);

        const resultsWithImages = await Promise.all(
            weatherResults.recordset.map(async (weatherItem) => {
                const imagesResult = await pool.request()
                    .input('date', sql.Date, weatherItem.date)
                    .query(`
                        SELECT 
                            imagesrc AS src, 
                            imagetype AS type,
                            description 
                        FROM ChatApp.dbo.DressingGuidelinesData 
                        WHERE date = @date
                    `);

                return {
                    ...weatherItem,
                    images: imagesResult.recordset.map(img => ({
                        ...img,
                        url: `http://121.4.22.55:80/backend/images/DressingGuidelinesData/${weatherItem.date}/${img.src}`
                    }))
                };
            })
        );

        res.json(resultsWithImages);
    } catch (err) {
        console.error('搜索穿搭数据错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});
//查看所有的穿衣搭配数据
// 在API中添加新端点
app.get('/api/dressing-guidelines/dates', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .query(`
                SELECT DISTINCT CONVERT(varchar(10), date, 120) as date 
                FROM ChatApp.dbo.DressingGuidelinesData
                ORDER BY date DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error('获取日期列表错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});


//穿搭评论 👇


// 穿搭评论 API
// 获取特定穿搭指南的评论
// 获取评论 API
app.get('/api/dressing-comments/:weatherdata_id', async (req, res) => {
    try {
        const { weatherdata_id } = req.params;
        const pool = await sql.connect(config);

        const result = await pool.request()
            .input('weatherdata_id', sql.Int, weatherdata_id)
            .query(`
               SELECT 
                    id, 
                    weatherdata_id, 
                    comment, 
                    CONVERT(varchar(19), created_at, 120) as created_at, -- 修改日期格式
                    user_name
                FROM ChatApp.dbo.DressingComment
                WHERE weatherdata_id = @weatherdata_id
                ORDER BY created_at DESC
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error('获取评论错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 提交新评论 API
app.post('/api/dressing-comments', async (req, res) => {
    console.log('收到评论请求:', req.body);
    try {
        const { weatherdata_id, comment, user_name } = req.body;

        if (!weatherdata_id || !comment || !user_name) {
            console.log('缺少参数:', { weatherdata_id, comment, user_name });
            return res.status(400).json({ error: '缺少必要参数' });
        }

        const pool = await sql.connect(config);

        const result = await pool.request()
            .input('weatherdata_id', sql.Int, weatherdata_id)
            .input('comment', sql.NVarChar, comment)
            .input('user_name', sql.NVarChar, user_name)
            .query(`
            INSERT INTO ChatApp.dbo.DressingComment 
            (weatherdata_id, comment, user_name)
            OUTPUT 
                INSERTED.id, 
                INSERTED.weatherdata_id, 
                INSERTED.comment, 
                CONVERT(varchar(19), INSERTED.created_at, 120) as created_at, -- 强制格式化为本地时间
                INSERTED.user_name
            VALUES (@weatherdata_id, @comment, @user_name)
        `)

        // 广播新评论给订阅该穿搭的客户端
        io.to(`comments_${weatherdata_id}`).emit('newComment', result.recordset[0]);

        res.status(201).json(result.recordset[0]);
    } catch (err) {
        console.error('提交评论错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});
// 辅助函数：获取穿搭信息
async function getOutfitInfo(dressingGuidelineId) {
    const pool = await sql.connect(config);
    const result = await pool.request()
        .input('id', sql.Int, dressingGuidelineId)
        .query(`
        SELECT date, weather, mintemperature, maxtemperature 
        FROM ChatApp.dbo.DressingGuidelinesData
        WHERE id = @id
      `);
    return result.recordset[0] || null;
}
// Socket.io 实时通知（优化版）
io.on('connection', (socket) => {
    // console.log('客户端已连接:', socket.id);

    // 客户端可以订阅特定穿搭的评论更新
    socket.on('subscribe_comments', (dressingGuidelineId) => {
        socket.join(`comments_${dressingGuidelineId}`);
        console.log(`客户端 ${socket.id} 订阅了穿搭 ${dressingGuidelineId} 的评论`);
    });

    // 客户端取消订阅
    socket.on('unsubscribe_comments', (dressingGuidelineId) => {
        socket.leave(`comments_${dressingGuidelineId}`);
    });

    socket.on('disconnect', () => {
        //  console.log('客户端断开连接:', socket.id);
    });
});
//穿搭评论 👆




//上传穿衣数据

// 配置 multer 存储 - 修改为您的成功示例模式
const storageWear = multer.diskStorage({
    destination: (req, file, cb) => {
        const { date } = req.body;
        if (!date) {
            return cb(new Error('Date is required'), null);
        }

        // 将日期格式化为 YYYY-MM-DD
        const formattedDate = date.split('-').join('-'); // 确保格式正确
        //   const uploadPath = path.join(__dirname, '..', '..', 'backend', 'images', 'DressingGuidelinesData', formattedDate);
        // 修正路径：假设脚本和 images 同级
        const uploadPath = path.join(__dirname, 'images', 'DressingGuidelinesData', formattedDate);
        // 调试：打印路径
        // console.log("文件将保存到:", uploadPath);
        // 如果文件夹不存在，则递归创建
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // 使用原始文件名
        cb(null, file.originalname);
    }
});


const uploadWear = multer({
    storage: storageWear,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('只允许上传图片文件'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 限制5MB
    }
});

app.post('/api/dressing-guidelines/upload',
    uploadWear.array('images'),
    async (req, res) => {
        try {
            const {
                date,
                minTemperature,
                maxTemperature,
                weather,
                suggestion,
                imageTypes,
                imageDescriptions
            } = req.body;

            // 验证必填字段
            if (!date || !minTemperature || !maxTemperature || !weather || !suggestion) {
                // 删除已上传的文件（如果有）
                if (req.files && req.files.length > 0) {
                    req.files.forEach(file => {
                        fs.unlink(file.path, () => { });
                    });
                }
                return res.status(400).json({ error: '所有必填字段都必须提供' });
            }

            // 验证图片
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ error: '至少上传一张图片' });
            }

            // 处理元数据
            const types = Array.isArray(imageTypes) ? imageTypes : [imageTypes];
            const descriptions = Array.isArray(imageDescriptions) ? imageDescriptions : [imageDescriptions];

            if (types.length !== req.files.length || descriptions.length !== req.files.length) {
                // 删除已上传的文件
                req.files.forEach(file => {
                    fs.unlink(file.path, () => { });
                });
                return res.status(400).json({ error: '图片元数据不完整' });
            }

            // 连接到数据库
            const pool = await sql.connect(config);

            // 插入或更新天气数据
            const weatherRequest = new sql.Request(pool);
            const weatherQuery = `
                IF EXISTS (SELECT 1 FROM ChatApp.dbo.WeatherData WHERE date = @date)
                    UPDATE ChatApp.dbo.WeatherData 
                    SET mintemperature = @minTemperature, 
                        maxtemperature = @maxTemperature, 
                        weather = @weather, 
                        suggestion = @suggestion 
                    WHERE date = @date
                ELSE
                    INSERT INTO ChatApp.dbo.WeatherData 
                        (date, mintemperature, maxtemperature, weather, suggestion)
                    VALUES 
                        (@date, @minTemperature, @maxTemperature, @weather, @suggestion)
            `;

            weatherRequest.input('date', sql.Date, date);
            weatherRequest.input('minTemperature', sql.Int, minTemperature);
            weatherRequest.input('maxTemperature', sql.Int, maxTemperature);
            weatherRequest.input('weather', sql.NVarChar(50), weather);
            weatherRequest.input('suggestion', sql.NVarChar(255), suggestion);

            await weatherRequest.query(weatherQuery);

            // 插入穿搭图片数据
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                const imageUrl = `http://121.4.22.55:80/backend/images/DressingGuidelinesData/${date}/${file.originalname}`;

                const imageRequest = new sql.Request(pool);
                const imageQuery = `
                    INSERT INTO ChatApp.dbo.DressingGuidelinesData 
                        (date, imagesrc, imagetype, description)
                    VALUES 
                        (@date, @imagesrc, @imagetype, @description)
                `;

                imageRequest.input('date', sql.Date, date);
                imageRequest.input('imagesrc', sql.NVarChar(255), file.originalname);
                imageRequest.input('imagetype', sql.NVarChar(255), types[i]);
                imageRequest.input('description', sql.NVarChar(255), descriptions[i]);

                await imageRequest.query(imageQuery);
            }

            res.json({
                success: true,
                message: '穿搭数据上传成功',
                weatherData: { date, minTemperature, maxTemperature, weather, suggestion },
                imagesCount: req.files.length,
                images: req.files.map(file => ({
                    filename: file.originalname,
                    path: `http://121.4.22.55:80/backend/images/DressingGuidelinesData/${date}/${file.originalname}`
                }))
            });

        } catch (error) {
            // 出错时删除已上传的文件
            if (req.files && req.files.length > 0) {
                req.files.forEach(file => {
                    fs.unlink(file.path, () => { });
                });
            }

            console.error('上传穿搭数据错误:', error);
            res.status(500).json({
                error: '上传失败',
                message: error.message
            });
        }
    }
);

//穿衣搭配结束


//关于网页服务的bug 👇
// 获取所有 Bug
app.get('/api/bugs', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .query(`
                SELECT 
                    id,
                    bug_description,
                    reported_by,
                    CONVERT(VARCHAR, report_date, 120) AS report_date,
                    severity,
                    status,
                    resolved_by,
                    CONVERT(VARCHAR, resolution_date, 120) AS resolution_date,
                    fix_version,
                    comments
                FROM ChatApp.dbo.BugTrackingData
                ORDER BY report_date DESC
            `);
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('获取 Bug 列表错误:', err);
        res.status(500).json({ error: '获取 Bug 列表失败' });
    }
});

// 创建新 Bug
app.post('/api/bugs', async (req, res) => {
    try {
        const {
            bug_description,
            reported_by,
            severity
        } = req.body;

        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('bug_description', sql.NVarChar, bug_description)
            .input('reported_by', sql.NVarChar, reported_by)
            .input('severity', sql.NVarChar, severity)
            .query(`
                INSERT INTO ChatApp.dbo.BugTrackingData (
                    bug_description,
                    reported_by,
                    report_date,
                    severity,
                    status
                ) VALUES (
                    @bug_description,
                    @reported_by,
                    GETDATE(),
                    @severity,
                    '待处理'
                );
                SELECT SCOPE_IDENTITY() AS id;
            `);

        // 获取新创建的 Bug
        const newBug = await pool.request()
            .input('id', sql.Int, result.recordset[0].id)
            .query(`
                SELECT 
                    id,
                    bug_description,
                    reported_by,
                    CONVERT(VARCHAR, report_date, 120) AS report_date,
                    severity,
                    status
                FROM ChatApp.dbo.BugTrackingData
                WHERE id = @id
            `);

        // 通过 Socket.io 广播新 Bug
        io.emit('new_bug', newBug.recordset[0]);

        res.status(201).json(newBug.recordset[0]);
    } catch (err) {
        console.error('提交 Bug 错误:', err);
        res.status(500).json({ error: '提交 Bug 失败' });
    }
});

// 更新 Bug
app.put('/api/bugs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            status,
            resolved_by,
            fix_version,
            comments
        } = req.body;

        const pool = await sql.connect(config);
        await pool.request()
            .input('id', sql.Int, id)
            .input('status', sql.NVarChar, status)
            .input('resolved_by', sql.NVarChar, resolved_by)
            .input('resolution_date', sql.DateTime, status === '已解决' ? new Date() : null)
            .input('fix_version', sql.NVarChar, fix_version)
            .input('comments', sql.NVarChar, comments)
            .query(`
                UPDATE ChatApp.dbo.BugTrackingData
                SET 
                    status = @status,
                    resolved_by = @resolved_by,
                    resolution_date = @resolution_date,
                    fix_version = @fix_version,
                    comments = @comments
                WHERE id = @id
            `);

        // 获取更新后的 Bug
        const updatedBug = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT 
                    id,
                    bug_description,
                    reported_by,
                    CONVERT(VARCHAR, report_date, 120) AS report_date,
                    severity,
                    status,
                    resolved_by,
                    CONVERT(VARCHAR, resolution_date, 120) AS resolution_date,
                    fix_version,
                    comments
                FROM ChatApp.dbo.BugTrackingData
                WHERE id = @id
            `);

        // 通过 Socket.io 广播更新
        io.emit('updated_bug', updatedBug.recordset[0]);

        res.status(200).json(updatedBug.recordset[0]);
    } catch (err) {
        console.error('更新 Bug 错误:', err);
        res.status(500).json({ error: '更新 Bug 失败' });
    }
});

// 删除 Bug
app.delete('/api/bugs/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const pool = await sql.connect(config);
        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM ChatApp.dbo.BugTrackingData WHERE id = @id');

        // 通过 Socket.io 广播删除
        io.emit('deleted_bug', parseInt(id));

        res.status(200).json({ message: 'Bug 删除成功' });
    } catch (err) {
        console.error('删除 Bug 错误:', err);
        res.status(500).json({ error: '删除 Bug 失败' });
    }
});

//关于网页的服务bug👆



//新的重写的记账本 👇
// 获取所有新的记账记录的API
app.get('/api/lifebookkeepinggetRecords', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query('SELECT * FROM ChatApp.dbo.LifeBookkeepingData');
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('获取数据失败:', error);
        res.status(500).json({ message: '获取数据失败' });
    }
});

// 处理添加新的记账记录的 API 路由
app.post('/api/lifebookkeepingaddRecord', async (req, res) => {
    // 1. 验证请求数据
    if (!req.body) {
        return res.status(400).json({
            success: false,
            message: '请求体不能为空'
        });
    }

    // 2. 准备数据
    const {
        transaction_date,
        amount,
        transaction_type = '支出', // 默认值
        category,
        payment_method,
        description,
        created_by
    } = req.body;

    // 3. 数据验证
    if (!amount || isNaN(parseFloat(amount))) {
        return res.status(400).json({
            success: false,
            message: '金额必须为有效数字'
        });
    }

    if (!created_by) {
        return res.status(400).json({
            success: false,
            message: '必须指定创建人'
        });
    }

    if (!transaction_date) {
        return res.status(400).json({
            success: false,
            message: '必须指定交易日期'
        });
    }

    // 4. 数据库操作
    let pool;
    try {
        // 连接数据库
        pool = await sql.connect(config);
        console.log('数据库连接成功');

        // 构建SQL查询
        const query = `
            INSERT INTO ChatApp.dbo.LifeBookkeepingData (
                transaction_date,
                amount,
                transaction_type,
                category,
                payment_method,
                description,
                created_by
            ) VALUES (
                @transaction_date,
                @amount,
                @transaction_type,
                @category,
                @payment_method,
                @description,
                @created_by
            );
            SELECT SCOPE_IDENTITY() AS new_id;
        `;

        // 执行查询
        const result = await pool.request()
            .input('transaction_date', sql.Date, transaction_date)
            .input('amount', sql.Decimal(18, 2), parseFloat(amount))
            .input('transaction_type', sql.NVarChar(50), transaction_type)
            .input('category', sql.NVarChar(100), category || null)
            .input('payment_method', sql.NVarChar(50), payment_method || null)
            .input('description', sql.NVarChar(255), description || null)
            .input('created_by', sql.NVarChar(100), created_by)
            .query(query);

        console.log('插入结果:', result);

        // 获取新插入的ID
        const newId = result.recordset[0].new_id;
        console.log(`新记录ID: ${newId}`);

        // 通知所有客户端
        const newRecord = {
            transaction_id: newId,
            transaction_date,
            amount: parseFloat(amount),
            transaction_type,
            category,
            payment_method,
            description,
            created_by
        };

        io.emit('newRecordAdded', newRecord);

        // 返回成功响应
        return res.status(200).json({
            success: true,
            message: '记录添加成功',
            data: {
                recordId: newId
            }
        });

    } catch (error) {
        console.error('数据库操作错误:', {
            message: error.message,
            stack: error.stack,
            details: error.originalError?.info?.message || '无额外错误信息'
        });

        return res.status(500).json({
            success: false,
            message: '记录添加失败',
            error: {
                code: error.code || 'UNKNOWN_ERROR',
                details: error.message
            }
        });

    } finally {
        // 确保释放连接
        if (pool) {
            try {
                await pool.close();
                console.log('数据库连接已释放');
            } catch (closeError) {
                console.error('关闭连接时出错:', closeError);
            }
        }
    }
});
//修改
app.put('/api/lifebookkeepingupdateRecord/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            transaction_date,
            amount,
            transaction_type,
            category,
            payment_method,
            description,
            note,
            created_by,
            updated_by
        } = req.body;

        const pool = await sql.connect(config);
        await pool.request()
            .input('id', sql.Int, id)
            .input('transaction_date', sql.Date, transaction_date)
            .input('amount', sql.Decimal(18, 2), amount)
            .input('transaction_type', sql.NVarChar(50), transaction_type)
            .input('category', sql.NVarChar(100), category)
            .input('payment_method', sql.NVarChar(50), payment_method)
            .input('description', sql.NVarChar(255), description)
            .input('note', sql.NVarChar(sql.MAX), note)
            .input('created_by', sql.NVarChar(100), created_by)
            .input('updated_by', sql.NVarChar(100), updated_by)
            .input('updated_date', sql.DateTime, new Date()) // 设置为当前时间
            .query(`
                UPDATE ChatApp.dbo.LifeBookkeepingData
                SET transaction_date = @transaction_date,
                    amount = @amount,
                    transaction_type = @transaction_type,
                    category = @category,
                    payment_method = @payment_method,
                    description = @description,
                    note = @note,
                    created_by = @created_by,
                    updated_by = @updated_by,
                    updated_date = @updated_date
                WHERE transaction_id = @id
            `);

        // 获取更新后的记录并发送给客户端
        const updatedRecord = await pool.request().input('id', sql.Int, id).query('SELECT * FROM ChatApp.dbo.LifeBookkeepingData WHERE transaction_id = @id');
        io.emit('recordUpdated', updatedRecord.recordset[0]);

        res.status(200).json({ message: '数据更新成功' });
    } catch (error) {
        console.error('更新数据失败:', error);
        res.status(500).json({ message: '更新数据失败' });
    }
});
//删除
app.delete('/api/lifebookkeepingdeleteRecord/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await sql.connect(config);
        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM ChatApp.dbo.LifeBookkeepingData WHERE transaction_id = @id');

        // 发送删除通知给客户端
        io.emit('recordDeleted', id);

        res.status(200).json({ message: '数据删除成功' });
    } catch (error) {
        console.error('删除数据失败:', error);
        res.status(500).json({ message: '删除数据失败' });
    }
});

//获取详细列表的ico图标
// 获取分类图标API
app.get('/getCategoryIcons', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .query('SELECT icon_name, unicode FROM ChatApp.dbo.ChatAppIconFot');

        res.json(result.recordset);
    } catch (err) {
        console.error('获取分类图标失败:', err);
        res.status(500).json({ error: '获取分类图标失败' });
    }
});

//下载账单 账单数据API
app.get('/api/transactions', async (req, res) => {
    try {
        const { start, end, username } = req.query;

        // 连接数据库
        await sql.connect(config);

        // 查询数据
        const result = await sql.query`
            SELECT 
                CONVERT(varchar, transaction_date, 120) as transaction_date,
                amount,
                transaction_type,
                category,
                payment_method,
                description,
                created_by
            FROM ChatApp.dbo.LifeBookkeepingData
            WHERE created_by = ${username}
            AND transaction_date BETWEEN ${start} AND ${end}
            ORDER BY transaction_date DESC
        `;

        res.json(result.recordset);
    } catch (error) {
        console.error('数据库查询失败:', error);
        res.status(500).json({ error: '获取账单数据失败' });
    } finally {
        sql.close();
    }
});
//新的重写的记账本 👆




//重写的项目管理器 👇
// 在现有的server.js中添加以下路由

// 项目管理API前缀 这是一个路径参数，指定了该中间件将应用于所有以 /projectapi 开头的请求。例如，像 /projectapi/projects、/projectapi/commissions 这样的请求都会触发这个中间件
// app.use('/projectapi', (req, res, next) => {
//     console.log('Project management API called，有人调用了api');
//     next();
// });
// 为什么您的原始代码不够好
// 每次请求都创建新连接（性能差）
// 关闭整个连接池（影响其他请求）
// 没有处理连接关闭时的错误



// 获取所有项目信息   API路由中使用全局pool 这个是不需要手动关闭的 使用全局连接池 这是最佳实践，避免在每个请求中创建和关闭连接
app.get('/projectapi/projects', async (req, res) => {
    try {
        const request = pool.request(); // 从池中获取请求
        const result = await request.query('SELECT * FROM ProjectManagementDB.dbo.ProjectsInformation ORDER BY assignment_time DESC');
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
    // 不需要手动关闭，连接会由连接池管理
});
//使用全局连接池 这是最佳实践 搜索哪些使用了这个，直接关键字搜索：使用全局连接池 这是最佳实践 👆

// 获取单个项目信息 API路由中使用全局pool 使用全局连接池 这是最佳实践 👇
app.get('/projectapi/projects/:id', async (req, res) => {
    try {
        const request = pool.request(); // 使用全局连接池的请求

        // 使用参数化查询更安全
        const result = await request
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM ProjectManagementDB.dbo.ProjectsInformation WHERE id = @id');

        if (result.recordset.length === 0) {
            return res.status(404).send('Project not found');
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Database query error:', err);
        res.status(500).send('Server error');
    }
    // 不需要手动关闭连接，连接池会自动管理
});

// 创建新项目
app.post('/projectapi/projects', async (req, res) => {
    try {
        const {
            project_id, project_source, branch_or_sub_institution,
            commission_number, source_contact_name, source_contact_phone,
            client_contact_name, client_contact_phone, client_name,
            project_name, project_type, evaluation_purpose,
            project_leader, draft_archive_date, contract_signing_date,
            project_progress = '进行中',
            remarks
        } = req.body;

        await sql.connect(config);
        const result = await sql.query`
            INSERT INTO ProjectManagementDB.dbo.ProjectsInformation (
                project_id, project_source, branch_or_sub_institution, 
                commission_number, source_contact_name, source_contact_phone,
                client_contact_name, client_contact_phone, client_name,
                project_name, project_type, evaluation_purpose,
                project_leader, draft_archive_date, contract_signing_date,
                project_progress, remarks
            ) 
            VALUES (
                ${project_id}, ${project_source}, ${branch_or_sub_institution}, 
                ${commission_number}, ${source_contact_name}, ${source_contact_phone},
                ${client_contact_name}, ${client_contact_phone}, ${client_name},
                ${project_name}, ${project_type}, ${evaluation_purpose},
                ${project_leader}, ${draft_archive_date}, ${contract_signing_date},
                ${project_progress}, ${remarks}
            )
            SELECT SCOPE_IDENTITY() AS id
        `;

        const newProjectId = result.recordset[0].id;
        io.emit('project_created', { id: newProjectId });
        res.status(201).json({ id: newProjectId, message: 'Project created successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    } finally {
        sql.close();
    }
});

// 更新项目信息
app.put('/projectapi/projects/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            project_id,
            project_source, branch_or_sub_institution,
            commission_number, source_contact_name, source_contact_phone,
            client_contact_name, client_contact_phone, client_name,
            project_name, project_type, evaluation_purpose,
            project_leader, draft_archive_date, contract_signing_date,
            project_progress, remarks, assignment_time
        } = req.body;

        await sql.connect(config);
        await sql.query`
            UPDATE ProjectManagementDB.dbo.ProjectsInformation SET
                project_id = ${project_id},
                project_source = ${project_source},
                branch_or_sub_institution = ${branch_or_sub_institution},
                commission_number = ${commission_number},
                source_contact_name = ${source_contact_name},
                source_contact_phone = ${source_contact_phone},
                client_contact_name = ${client_contact_name},
                client_contact_phone = ${client_contact_phone},
                client_name = ${client_name},
                project_name = ${project_name},
                project_type = ${project_type},
                evaluation_purpose = ${evaluation_purpose},
                project_leader = ${project_leader},
                draft_archive_date = ${draft_archive_date},
                contract_signing_date = ${contract_signing_date},
                project_progress = ${project_progress},
                remarks = ${remarks},
                assignment_time = ${assignment_time}
            WHERE id = ${id}
        `;

        io.emit('project_updated', { id });
        res.json({ message: 'Project updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    } finally {
        sql.close();
    }
});

// 删除项目
app.delete('/projectapi/projects/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await sql.connect(config);
        await sql.query`DELETE FROM ProjectManagementDB.dbo.ProjectsInformation WHERE id = ${id}`;

        io.emit('project_deleted', { id });
        res.json({ message: 'Project deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    } finally {
        sql.close();
    }
});



//添加项目报销 👇

// 获取特定项目的所有报销信息
app.get('/projectapi/projects/:projectId/reimbursements', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('projectId', sql.VarChar(50), req.params.projectId)
            .query(`
                SELECT * FROM ProjectManagementDB.dbo.ProjectsReimbursement 
                WHERE project_id = @projectId
                ORDER BY BusinessTripDate DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 添加新的报销信息
app.post('/projectapi/projects/:projectId/reimbursements', async (req, res) => {
    const { project_id, project_name, Location, Amount, BusinessTripDate, ReimbursementDate, Remarks, ReimbursedBy } = req.body;

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('project_id', sql.VarChar(50), project_id)
            .input('project_name', sql.VarChar(255), project_name)
            .input('Location', sql.NVarChar(100), Location)
            .input('Amount', sql.Decimal(18, 2), Amount)
            .input('BusinessTripDate', sql.Date, BusinessTripDate)
            .input('ReimbursementDate', sql.Date, ReimbursementDate)
            .input('Remarks', sql.NVarChar(255), Remarks)
            .input('ReimbursedBy', sql.NVarChar(100), ReimbursedBy)
            .query(`
                INSERT INTO ProjectManagementDB.dbo.ProjectsReimbursement 
                (project_id, project_name, Location, Amount, BusinessTripDate, ReimbursementDate, Remarks, ReimbursedBy)
                VALUES (@project_id, @project_name, @Location, @Amount, @BusinessTripDate, @ReimbursementDate, @Remarks, @ReimbursedBy);
                SELECT SCOPE_IDENTITY() AS id;
            `);

        io.emit('reimbursement_added', { id: result.recordset[0].id }); // 发送报销信息添加事件
        res.status(201).json({
            id: result.recordset[0].id,
            message: '报销信息添加成功'
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// 更新报销信息
app.put('/projectapi/projects/reimbursements/:id', async (req, res) => {
    const { Location, Amount, BusinessTripDate, ReimbursementDate, Remarks, ReimbursedBy, Whetherover } = req.body;

    try {
        const pool = await sql.connect(config);
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('Location', sql.NVarChar(100), Location)
            .input('Amount', sql.Decimal(18, 2), Amount)
            .input('BusinessTripDate', sql.Date, BusinessTripDate)
            .input('ReimbursementDate', sql.Date, ReimbursementDate)
            .input('Remarks', sql.NVarChar(255), Remarks)
            .input('ReimbursedBy', sql.NVarChar(100), ReimbursedBy)
            .input('Whetherover', sql.Bit, Whetherover)
            .query(`
                UPDATE ProjectManagementDB.dbo.ProjectsReimbursement 
                SET Location = @Location, 
                    Amount = @Amount, 
                    BusinessTripDate = @BusinessTripDate, 
                    ReimbursementDate = @ReimbursementDate, 
                    Remarks = @Remarks, 
                    ReimbursedBy = @ReimbursedBy,
                    Whetherover = @Whetherover
                WHERE id = @id
            `);

        io.emit('reimbursement_updated', { id: req.params.id }); // 发送报销信息更新事件
        res.json({ message: '报销信息更新成功' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// 删除报销信息
app.delete('/projectapi/projects/reimbursements/:id', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM ProjectManagementDB.dbo.ProjectsReimbursement WHERE id = @id');

        io.emit('reimbursement_deleted', { id: req.params.id }); // 发送报销信息删除事件
        res.json({ message: '报销信息删除成功' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

//添加项目报销 👆


//添加提成 👇

//获取字段 查询人员
app.get('/projectcommission/personnelinformation/info', async (req, res) => {
    let pool;
    try {
        // 获取连接池
        pool = await sql.connect(config);

        const query = `
            SELECT *
            FROM ProjectManagementDB.dbo.PersonnelInformation
        `;

        const result = await pool.request().query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: '没有找到任何项目信息' });
        }

        res.json(result.recordset);
    } catch (error) {
        console.error('获取所有项目信息失败:', error);
        res.status(500).json({ error: '获取所有项目信息失败' });
    } finally {
        // 确保连接被关闭
        if (pool) {
            try {
                await pool.close();
            } catch (err) {
                console.error('关闭连接池失败:', err);
            }
        }
    }
});


// 获取字段 减少不必要的填写
app.get('/hqprojectcommission/projects/:project_id/info', async (req, res) => {
    try {
        const { project_id } = req.params;

        // 添加连接池获取
        const pool = await sql.connect(config);

        const query = `
            SELECT *
            FROM ProjectManagementDB.dbo.ProjectsInformation
            WHERE project_id = @project_id
        `;

        const result = await pool.request()
            .input('project_id', sql.VarChar(50), project_id)
            .query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: '项目未找到' });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error('获取项目信息失败:', error);
        res.status(500).json({ error: '获取项目信息失败' });
    }
});
// 获取项目的提成列表
app.get('/projectapi/projects/:projectId/commissions', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('projectId', sql.VarChar(50), req.params.projectId)
            .query(`
                SELECT * FROM ProjectManagementDB.dbo.ProjectsAchievements 
                WHERE project_id = @projectId
                ORDER BY CommissionDate DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 添加新的提成信息
app.post('/projectapi/projects/:projectId/commissions', async (req, res) => {
    const {
        project_id,
        project_name,
        ReportNumber,
        project_source,
        project_type,
        region,
        project_leader,
        report_issuance_date,
        evaluation_total_price,
        contract_fee,
        actual_fee,
        ChargeDate,
        leader_commission,
        preliminary_review_fee,
        preliminary_reviewer,
        review_fee,
        review_reviewer,
        final_review_fee,
        final_reviewer,
        signature_valuator_a,
        signature_valuator_b,
        signature_valuator_a_fee,
        signature_valuator_b_fee,
        total_amount,
        CommissionDate,
        Notes
    } = req.body;

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('project_id', sql.VarChar(50), project_id)
            .input('project_name', sql.VarChar(255), project_name)
            .input('ReportNumber', sql.VarChar(50), ReportNumber)
            .input('project_source', sql.VarChar(255), project_source)
            .input('project_type', sql.VarChar(100), project_type)
            .input('region', sql.VarChar(100), region)
            .input('project_leader', sql.VarChar(100), project_leader)
            .input('report_issuance_date', sql.Date, report_issuance_date)
            .input('evaluation_total_price', sql.Decimal(18, 2), evaluation_total_price)
            .input('contract_fee', sql.Decimal(18, 2), contract_fee)
            .input('actual_fee', sql.Decimal(18, 2), actual_fee)
            .input('ChargeDate', sql.Date, ChargeDate)
            .input('leader_commission', sql.Decimal(18, 2), leader_commission)
            .input('preliminary_review_fee', sql.Decimal(18, 2), preliminary_review_fee)
            .input('preliminary_reviewer', sql.VarChar(100), preliminary_reviewer)
            .input('review_fee', sql.Decimal(18, 2), review_fee)
            .input('review_reviewer', sql.VarChar(100), review_reviewer)
            .input('final_review_fee', sql.Decimal(18, 2), final_review_fee)
            .input('final_reviewer', sql.VarChar(100), final_reviewer)
            .input('signature_valuator_a', sql.VarChar(100), signature_valuator_a)
            .input('signature_valuator_b', sql.VarChar(100), signature_valuator_b)
            .input('signature_valuator_a_fee', sql.Decimal(18, 2), signature_valuator_a_fee)
            .input('signature_valuator_b_fee', sql.Decimal(18, 2), signature_valuator_b_fee)
            .input('total_amount', sql.Decimal(18, 2), total_amount)
            .input('CommissionDate', sql.Date, CommissionDate)
            .input('Notes', sql.Text, Notes)
            .query(`
                INSERT INTO ProjectManagementDB.dbo.ProjectsAchievements
                (project_id, project_name, ReportNumber, project_source, project_type, region, project_leader,
                 report_issuance_date, evaluation_total_price, contract_fee, actual_fee, ChargeDate, 
                 leader_commission, preliminary_review_fee, preliminary_reviewer, review_fee, review_reviewer,
                 final_review_fee, final_reviewer, signature_valuator_a, signature_valuator_b, 
                 signature_valuator_a_fee, signature_valuator_b_fee, total_amount, CommissionDate, Notes)
                VALUES (@project_id, @project_name, @ReportNumber, @project_source, @project_type, @region, @project_leader,
                        @report_issuance_date, @evaluation_total_price, @contract_fee, @actual_fee, @ChargeDate, 
                        @leader_commission, @preliminary_review_fee, @preliminary_reviewer, @review_fee, @review_reviewer,
                        @final_review_fee, @final_reviewer, @signature_valuator_a, @signature_valuator_b, 
                        @signature_valuator_a_fee, @signature_valuator_b_fee, @total_amount, @CommissionDate, @Notes);
                SELECT SCOPE_IDENTITY() AS ID;
            `);

        io.emit('commission_added', { ID: result.recordset[0].ID });
        res.status(201).json({
            ID: result.recordset[0].ID,
            message: '提成信息添加成功'
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// 更新提成信息
app.put('/projectapi/projects/commissions/:id', async (req, res) => {
    const {
        ReportNumber,
        project_source,
        project_type,
        region,
        project_leader,
        report_issuance_date,
        evaluation_total_price,
        contract_fee,
        actual_fee,
        ChargeDate,
        leader_commission,
        preliminary_review_fee,
        preliminary_reviewer,
        review_fee,
        review_reviewer,
        final_review_fee,
        final_reviewer,
        signature_valuator_a,
        signature_valuator_b,
        signature_valuator_a_fee,
        signature_valuator_b_fee,
        total_amount,
        CommissionDate,
        Notes,
        Whetherticheng
    } = req.body;

    try {
        const pool = await sql.connect(config);
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('ReportNumber', sql.VarChar(50), ReportNumber)
            .input('project_source', sql.VarChar(255), project_source)
            .input('project_type', sql.VarChar(100), project_type)
            .input('region', sql.VarChar(100), region)
            .input('project_leader', sql.VarChar(100), project_leader)
            .input('report_issuance_date', sql.Date, report_issuance_date)
            .input('evaluation_total_price', sql.Decimal(18, 2), evaluation_total_price)
            .input('contract_fee', sql.Decimal(18, 2), contract_fee)
            .input('actual_fee', sql.Decimal(18, 2), actual_fee)
            .input('ChargeDate', sql.Date, ChargeDate)
            .input('leader_commission', sql.Decimal(18, 2), leader_commission)
            .input('preliminary_review_fee', sql.Decimal(18, 2), preliminary_review_fee)
            .input('preliminary_reviewer', sql.VarChar(100), preliminary_reviewer)
            .input('review_fee', sql.Decimal(18, 2), review_fee)
            .input('review_reviewer', sql.VarChar(100), review_reviewer)
            .input('final_review_fee', sql.Decimal(18, 2), final_review_fee)
            .input('final_reviewer', sql.VarChar(100), final_reviewer)
            .input('signature_valuator_a', sql.VarChar(100), signature_valuator_a)
            .input('signature_valuator_b', sql.VarChar(100), signature_valuator_b)
            .input('signature_valuator_a_fee', sql.Decimal(18, 2), signature_valuator_a_fee)
            .input('signature_valuator_b_fee', sql.Decimal(18, 2), signature_valuator_b_fee)
            .input('total_amount', sql.Decimal(18, 2), total_amount)
            .input('CommissionDate', sql.Date, CommissionDate)
            .input('Notes', sql.Text, Notes)
            .input('Whetherticheng', sql.Bit, Whetherticheng)
            .query(`
                UPDATE ProjectManagementDB.dbo.ProjectsAchievements 
                SET ReportNumber = @ReportNumber,
                    project_source = @project_source,
                    project_type = @project_type,
                    region = @region,
                    project_leader = @project_leader,
                    report_issuance_date = @report_issuance_date,
                    evaluation_total_price = @evaluation_total_price,
                    contract_fee = @contract_fee,
                    actual_fee = @actual_fee,
                    ChargeDate = @ChargeDate,
                    leader_commission = @leader_commission,
                    preliminary_review_fee = @preliminary_review_fee,
                    preliminary_reviewer = @preliminary_reviewer,
                    review_fee = @review_fee,
                    review_reviewer = @review_reviewer,
                    final_review_fee = @final_review_fee,
                    final_reviewer = @final_reviewer,
                    signature_valuator_a = @signature_valuator_a,
                    signature_valuator_b = @signature_valuator_b,
                    signature_valuator_a_fee = @signature_valuator_a_fee,
                    signature_valuator_b_fee = @signature_valuator_b_fee,
                    total_amount = @total_amount,
                    CommissionDate = @CommissionDate,
                    Notes = @Notes,
                    Whetherticheng = @Whetherticheng
                WHERE ID = @id
            `);

        io.emit('commission_updated', { ID: req.params.id });
        res.json({ message: '提成信息更新成功' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});
//更新提成状态
// 更新提成状态
app.put('/projectapi/projects/commissions/:id/status', async (req, res) => {
    try {
        const { Whetherticheng } = req.body;
        const pool = await sql.connect(config);

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('Whetherticheng', sql.Bit, Whetherticheng)
            .query(`
                UPDATE ProjectManagementDB.dbo.ProjectsAchievements 
                SET Whetherticheng = @Whetherticheng
                WHERE ID = @id
            `);

        io.emit('commission_updated', { ID: req.params.id });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// 删除提成信息
app.delete('/projectapi/projects/commissions/:id', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM ProjectManagementDB.dbo.ProjectsAchievements WHERE ID = @id');

        io.emit('commission_deleted', { ID: req.params.id });
        res.json({ message: '提成信息删除成功' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
//添加提成 👆



//重写的项目管理器 👆



//重做的工作日志 👇
// 获取指定项目的工作日志
app.get('/projectapi/projects/:project_id/logs', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('project_id', sql.VarChar(50), req.params.project_id)
            .query('SELECT * FROM ProjectManagementDB.dbo.ProjectsWorklogTable WHERE project_id = @project_id');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching logs: ', err);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

// 添加工作日志
app.post('/projectapi/projects/:project_id/logs', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const { project_name, project_leader, communication_record, contact_time } = req.body;
        const result = await pool.request()
            .input('project_id', sql.VarChar(50), req.params.project_id)
            .input('project_name', sql.VarChar(255), project_name)
            .input('project_leader', sql.VarChar(100), project_leader)
            .input('communication_record', sql.NVarChar(sql.MAX), communication_record)
            .input('contact_time', sql.Date, contact_time)
            .query('INSERT INTO ProjectManagementDB.dbo.ProjectsWorklogTable (project_id, project_name, project_leader, communication_record, contact_time) VALUES (@project_id, @project_name, @project_leader, @communication_record, @contact_time)');
        io.emit('log_added', result);
        res.json({ message: 'Log added successfully' });
    } catch (err) {
        console.error('Error adding log: ', err);
        res.status(500).json({ error: 'Failed to add log' });
    }
});

// 更新工作日志
app.put('/projectapi/projects/logs/:id', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const log_id = req.params.id;
        const { project_name, project_leader, communication_record, contact_time } = req.body;
        const result = await pool.request()
            .input('id', sql.Int, log_id)
            .input('project_name', sql.VarChar(255), project_name)
            .input('project_leader', sql.VarChar(100), project_leader)
            .input('communication_record', sql.NVarChar(sql.MAX), communication_record)
            .input('contact_time', sql.Date, contact_time)
            .query('UPDATE ProjectManagementDB.dbo.ProjectsWorklogTable SET project_name = @project_name, project_leader = @project_leader, communication_record = @communication_record, contact_time = @contact_time WHERE id = @id');
        io.emit('log_updated', result);
        res.json({ message: 'Log updated successfully' });
    } catch (err) {
        console.error('Error updating log: ', err);
        res.status(500).json({ error: 'Failed to update log' });
    }
});

// 删除工作日志
app.delete('/projectapi/projects/logs/:id', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM ProjectManagementDB.dbo.ProjectsWorklogTable WHERE id = @id');
        io.emit('log_deleted', { id: req.params.id });
        res.json({ message: 'Log deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


//重做的工作日志 👆


//重做的报销汇总处理 👇
// 获取所有报销信息（带过滤条件）
app.get('/projectapi/countreimbursements', async (req, res) => {
    try {
        const { projectId, projectName, reimbursedBy, status, startDate, endDate } = req.query;

        const pool = await sql.connect(config);
        let query = `
            SELECT * FROM ProjectManagementDB.dbo.ProjectsReimbursement 
            WHERE 1=1
        `;

        if (projectId) query += ` AND project_id LIKE '%${projectId}%'`;
        if (projectName) query += ` AND project_name LIKE '%${projectName}%'`;
        if (reimbursedBy) query += ` AND ReimbursedBy LIKE '%${reimbursedBy}%'`;
        if (status !== undefined) {
            const boolStatus = status === 'true'; // 将字符串转换为布尔值
            query += ` AND Whetherover = ${boolStatus ? 1 : 0}`;
        }
        if (startDate && endDate) {
            query += ` AND ReimbursementDate BETWEEN '${startDate}' AND '${endDate}'`;
        }

        query += ` ORDER BY ReimbursementDate DESC`;

        const result = await pool.request().query(query);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 添加新的报销信息（独立）
app.post('/projectapi/countreimbursements', async (req, res) => {
    const { project_id, project_name, Location, Amount, BusinessTripDate, ReimbursementDate, Remarks, ReimbursedBy, Whetherover } = req.body;

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('project_id', sql.VarChar(50), project_id)
            .input('project_name', sql.VarChar(255), project_name)
            .input('Location', sql.NVarChar(100), Location)
            .input('Amount', sql.Decimal(18, 2), Amount)
            .input('BusinessTripDate', sql.Date, BusinessTripDate)
            .input('ReimbursementDate', sql.Date, ReimbursementDate)
            .input('Remarks', sql.NVarChar(255), Remarks)
            .input('ReimbursedBy', sql.NVarChar(100), ReimbursedBy)
            .input('Whetherover', sql.Bit, Whetherover)
            .query(`
                INSERT INTO ProjectManagementDB.dbo.ProjectsReimbursement 
                (project_id, project_name, Location, Amount, BusinessTripDate, ReimbursementDate, Remarks, ReimbursedBy, Whetherover)
                VALUES (@project_id, @project_name, @Location, @Amount, @BusinessTripDate, @ReimbursementDate, @Remarks, @ReimbursedBy, @Whetherover);
                SELECT SCOPE_IDENTITY() AS id;
            `);

        io.emit('reimbursement_added', { id: result.recordset[0].id });
        res.status(201).json({
            id: result.recordset[0].id,
            message: '报销信息添加成功'
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});
// 更新报销信息（完整更新）
app.put('/projectapi/countreimbursements/:id', async (req, res) => {
    const { project_id, project_name, Location, Amount, BusinessTripDate, ReimbursementDate, Remarks, ReimbursedBy, Whetherover } = req.body;

    try {
        const pool = await sql.connect(config);
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('project_id', sql.VarChar(50), project_id)
            .input('project_name', sql.VarChar(255), project_name)
            .input('Location', sql.NVarChar(100), Location)
            .input('Amount', sql.Decimal(18, 2), Amount)
            .input('BusinessTripDate', sql.Date, BusinessTripDate)
            .input('ReimbursementDate', sql.Date, ReimbursementDate)
            .input('Remarks', sql.NVarChar(255), Remarks)
            .input('ReimbursedBy', sql.NVarChar(100), ReimbursedBy)
            .input('Whetherover', sql.Bit, Whetherover)
            .query(`
                UPDATE ProjectManagementDB.dbo.ProjectsReimbursement 
                SET 
                    project_id = @project_id,
                    project_name = @project_name,
                    Location = @Location,
                    Amount = @Amount,
                    BusinessTripDate = @BusinessTripDate,
                    ReimbursementDate = @ReimbursementDate,
                    Remarks = @Remarks,
                    ReimbursedBy = @ReimbursedBy,
                    Whetherover = @Whetherover
                WHERE id = @id
            `);

        io.emit('reimbursement_updated', { id: req.params.id });
        res.json({ message: '报销信息更新成功' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});
// 更新报销状态 只是状态
app.put('/projectapi/countreimbursements/:id/status', async (req, res) => {
    const { Whetherover } = req.body;

    try {
        const pool = await sql.connect(config);
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('Whetherover', sql.Bit, Whetherover)
            .query(`
                UPDATE ProjectManagementDB.dbo.ProjectsReimbursement 
                SET Whetherover = @Whetherover
                WHERE id = @id
            `);

        io.emit('reimbursement_updated', { id: req.params.id });
        res.json({ message: '报销状态更新成功' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});
// 删除报销信息
app.delete('/projectapi/countreimbursements/:id', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM ProjectManagementDB.dbo.ProjectsReimbursement WHERE id = @id');

        io.emit('reimbursement_deleted', { id: req.params.id });
        res.json({ message: '报销信息删除成功' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
//重做的报销汇总处理 👆


//重做的所有的提成汇总 👇
// 获取提成信息列表
// 获取提成信息列表 这个是多条件搜索功能
app.get('/projectapi/searchcountprojectcommissions', async (req, res) => {
    let pool;
    try {
        const { projectId, projectName, projectLeader, Whetherticheng, startDate, endDate } = req.query;

        // console.log('前端传递的参数：');
        // console.log('projectId:', projectId);
        // console.log('projectName:', projectName);
        // console.log('projectLeader:', projectLeader);
        // console.log('Whetherticheng:', Whetherticheng);
        // console.log('startDate:', startDate);
        // console.log('endDate:', endDate);

        pool = await sql.connect(config);

        let query = `
            SELECT * FROM ProjectManagementDB.dbo.ProjectsAchievements 
            WHERE 1=1
        `;

        // 使用参数化查询防止SQL注入
        const params = [];

        if (projectId) {
            query += ` AND project_id LIKE '%' + @projectId + '%'`;
            params.push({ name: 'projectId', value: projectId });
        }
        if (projectName) {
            query += ` AND project_name LIKE '%' + @projectName + '%'`;
            params.push({ name: 'projectName', value: projectName });
        }
        if (projectLeader) {
            query += ` AND project_leader LIKE '%' + @projectLeader + '%'`;
            params.push({ name: 'projectLeader', value: projectLeader });
        }
        if (Whetherticheng !== undefined) {
            // 修改这里的查询条件
            if (Whetherticheng === 'false') {
                query += ` AND (Whetherticheng IS NULL OR Whetherticheng = 0)`;
            } else {
                query += ` AND Whetherticheng = @Whetherticheng`;
            }
            params.push({ name: 'Whetherticheng', value: Whetherticheng });
        }
        if (startDate && endDate) {
            query += ` AND CommissionDate BETWEEN @startDate AND @endDate`;
            params.push({ name: 'startDate', value: startDate });
            params.push({ name: 'endDate', value: endDate });
        }

        query += ` ORDER BY CommissionDate DESC`;

        const request = pool.request();
        params.forEach(param => {
            request.input(param.name, param.value);
        });

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    } finally {
        // 确保连接被释放
        if (pool) {
            try {
                await pool.close();
            } catch (closeErr) {
                console.error('关闭连接时出错:', closeErr);
            }
        }
    }
});

// 获取单个提成信息
app.get('/projectapi/countprojectcommissions/:id', async (req, res) => {
    let pool; // 声明在 try 外部，以便 finally 可以访问
    try {
        pool = await sql.connect(config); // 建立连接
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM ProjectManagementDB.dbo.ProjectsAchievements WHERE ID = @id');

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: '提成信息未找到' });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    } finally {
        // 无论成功或失败，都确保关闭连接
        if (pool) {
            try {
                await pool.close(); // 显式关闭连接
            } catch (closeErr) {
                console.error('关闭数据库连接时出错:', closeErr);
            }
        }
    }
});

// 添加新的提成信息
app.post('/projectapi/countprojectcommissions', async (req, res) => {
    const {
        project_id, project_name, ReportNumber, project_source, project_type, region,
        project_leader, report_issuance_date, evaluation_total_price, contract_fee,
        actual_fee, ChargeDate, leader_commission, preliminary_review_fee, preliminary_reviewer,
        review_fee, review_reviewer, final_review_fee, final_reviewer, signature_valuator_a,
        signature_valuator_b, signature_valuator_a_fee, signature_valuator_b_fee, total_amount,
        CommissionDate, Notes, Whetherticheng
    } = req.body;

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('project_id', sql.VarChar(50), project_id)
            .input('project_name', sql.VarChar(255), project_name)
            .input('ReportNumber', sql.VarChar(50), ReportNumber)
            .input('project_source', sql.VarChar(255), project_source)
            .input('project_type', sql.VarChar(100), project_type)
            .input('region', sql.VarChar(100), region)
            .input('project_leader', sql.VarChar(100), project_leader)
            .input('report_issuance_date', sql.Date, report_issuance_date)
            .input('evaluation_total_price', sql.Decimal(18, 2), evaluation_total_price)
            .input('contract_fee', sql.Decimal(18, 2), contract_fee)
            .input('actual_fee', sql.Decimal(18, 2), actual_fee)
            .input('ChargeDate', sql.Date, ChargeDate)
            .input('leader_commission', sql.Decimal(18, 2), leader_commission)
            .input('preliminary_review_fee', sql.Decimal(18, 2), preliminary_review_fee)
            .input('preliminary_reviewer', sql.VarChar(100), preliminary_reviewer)
            .input('review_fee', sql.Decimal(18, 2), review_fee)
            .input('review_reviewer', sql.VarChar(100), review_reviewer)
            .input('final_review_fee', sql.Decimal(18, 2), final_review_fee)
            .input('final_reviewer', sql.VarChar(100), final_reviewer)
            .input('signature_valuator_a', sql.VarChar(100), signature_valuator_a)
            .input('signature_valuator_b', sql.VarChar(100), signature_valuator_b)
            .input('signature_valuator_a_fee', sql.Decimal(18, 2), signature_valuator_a_fee)
            .input('signature_valuator_b_fee', sql.Decimal(18, 2), signature_valuator_b_fee)
            .input('total_amount', sql.Decimal(18, 2), total_amount)
            .input('CommissionDate', sql.Date, CommissionDate)
            .input('Notes', sql.Text, Notes)
            .input('Whetherticheng', sql.Bit, Whetherticheng)
            .query(`
                INSERT INTO ProjectManagementDB.dbo.ProjectsAchievements 
                (project_id, project_name, ReportNumber, project_source, project_type, region,
                project_leader, report_issuance_date, evaluation_total_price, contract_fee,
                actual_fee, ChargeDate, leader_commission, preliminary_review_fee, preliminary_reviewer,
                review_fee, review_reviewer, final_review_fee, final_reviewer, signature_valuator_a,
                signature_valuator_b, signature_valuator_a_fee, signature_valuator_b_fee, total_amount,
                CommissionDate, Notes, Whetherticheng)
                VALUES (
                    @project_id, @project_name, @ReportNumber, @project_source, @project_type, @region,
                    @project_leader, @report_issuance_date, @evaluation_total_price, @contract_fee,
                    @actual_fee, @ChargeDate, @leader_commission, @preliminary_review_fee, @preliminary_reviewer,
                    @review_fee, @review_reviewer, @final_review_fee, @final_reviewer, @signature_valuator_a,
                    @signature_valuator_b, @signature_valuator_a_fee, @signature_valuator_b_fee, @total_amount,
                    @CommissionDate, @Notes, @Whetherticheng
                );
                SELECT SCOPE_IDENTITY() AS id;
            `);

        io.emit('commission_added', { id: result.recordset[0].id });
        res.status(201).json({
            id: result.recordset[0].id,
            message: '提成信息添加成功'
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// 更新提成信息 (使用PUT方法)
app.put('/projectapi/countprojectcommissions/:id', async (req, res) => {
    const {
        project_id, project_name, ReportNumber, project_source, project_type, region,
        project_leader, report_issuance_date, evaluation_total_price, contract_fee,
        actual_fee, ChargeDate, leader_commission, preliminary_review_fee, preliminary_reviewer,
        review_fee, review_reviewer, final_review_fee, final_reviewer, signature_valuator_a,
        signature_valuator_b, signature_valuator_a_fee, signature_valuator_b_fee, total_amount,
        CommissionDate, Notes, Whetherticheng
    } = req.body;

    let pool;
    try {
        pool = await sql.connect(config);
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('project_id', sql.VarChar(50), project_id)
            .input('project_name', sql.VarChar(255), project_name)
            .input('ReportNumber', sql.VarChar(50), ReportNumber)
            .input('project_source', sql.VarChar(255), project_source)
            .input('project_type', sql.VarChar(100), project_type)
            .input('region', sql.VarChar(100), region)
            .input('project_leader', sql.VarChar(100), project_leader)
            .input('report_issuance_date', sql.Date, report_issuance_date)
            .input('evaluation_total_price', sql.Decimal(18, 2), evaluation_total_price)
            .input('contract_fee', sql.Decimal(18, 2), contract_fee)
            .input('actual_fee', sql.Decimal(18, 2), actual_fee)
            .input('ChargeDate', sql.Date, ChargeDate)
            .input('leader_commission', sql.Decimal(18, 2), leader_commission)
            .input('preliminary_review_fee', sql.Decimal(18, 2), preliminary_review_fee)
            .input('preliminary_reviewer', sql.VarChar(100), preliminary_reviewer)
            .input('review_fee', sql.Decimal(18, 2), review_fee)
            .input('review_reviewer', sql.VarChar(100), review_reviewer)
            .input('final_review_fee', sql.Decimal(18, 2), final_review_fee)
            .input('final_reviewer', sql.VarChar(100), final_reviewer)
            .input('signature_valuator_a', sql.VarChar(100), signature_valuator_a)
            .input('signature_valuator_b', sql.VarChar(100), signature_valuator_b)
            .input('signature_valuator_a_fee', sql.Decimal(18, 2), signature_valuator_a_fee)
            .input('signature_valuator_b_fee', sql.Decimal(18, 2), signature_valuator_b_fee)
            .input('total_amount', sql.Decimal(18, 2), total_amount)
            .input('CommissionDate', sql.Date, CommissionDate)
            .input('Notes', sql.Text, Notes)
            .input('Whetherticheng', sql.Bit, Whetherticheng)
            .query(`
                UPDATE ProjectManagementDB.dbo.ProjectsAchievements 
                SET 
                    project_id = @project_id,
                    project_name = @project_name,
                    ReportNumber = @ReportNumber,
                    project_source = @project_source,
                    project_type = @project_type,
                    region = @region,
                    project_leader = @project_leader,
                    report_issuance_date = @report_issuance_date,
                    evaluation_total_price = @evaluation_total_price,
                    contract_fee = @contract_fee,
                    actual_fee = @actual_fee,
                    ChargeDate = @ChargeDate,
                    leader_commission = @leader_commission,
                    preliminary_review_fee = @preliminary_review_fee,
                    preliminary_reviewer = @preliminary_reviewer,
                    review_fee = @review_fee,
                    review_reviewer = @review_reviewer,
                    final_review_fee = @final_review_fee,
                    final_reviewer = @final_reviewer,
                    signature_valuator_a = @signature_valuator_a,
                    signature_valuator_b = @signature_valuator_b,
                    signature_valuator_a_fee = @signature_valuator_a_fee,
                    signature_valuator_b_fee = @signature_valuator_b_fee,
                    total_amount = @total_amount,
                    CommissionDate = @CommissionDate,
                    Notes = @Notes,
                    Whetherticheng = @Whetherticheng
                WHERE ID = @id
            `);

        io.emit('commission_updated', { id: req.params.id });
        res.json({ message: '提成信息更新成功' });
    } catch (err) {
        console.error('更新提成信息时出错:', err);
        res.status(400).json({
            message: '更新提成信息失败',
            error: err.message
        });
    } finally {
        if (pool) {
            try {
                await pool.close();
            } catch (closeErr) {
                console.error('关闭数据库连接时出错:', closeErr);
            }
        }
    }
});

// 更新提成状态
app.put('/projectapi/countprojectcommissions/:id/status', async (req, res) => {
    const { Whetherticheng } = req.body;
    let pool;

    try {
        pool = await sql.connect(config);
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('Whetherticheng', sql.Bit, Whetherticheng)
            .query(`
                UPDATE ProjectManagementDB.dbo.ProjectsAchievements 
                SET Whetherticheng = @Whetherticheng
                WHERE ID = @id
            `);

        io.emit('commission_updated', { id: req.params.id });
        res.json({ message: '提成状态更新成功' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    } finally {
        // 确保连接池在最后被关闭
        if (pool) {
            try {
                await pool.close();
            } catch (closeErr) {
                console.error('关闭连接池时出错:', closeErr.message);
            }
        }
    }
});

// 删除提成信息
app.delete('/projectapi/countprojectcommissions/:id', async (req, res) => {
    let pool;

    try {
        pool = await sql.connect(config)
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM ProjectManagementDB.dbo.ProjectsAchievements WHERE ID = @id')

        io.emit('commission_deleted', { id: req.params.id })
        res.json({ message: '提成信息删除成功' })
    } catch (err) {
        res.status(500).json({ message: err.message })
    } finally {
        // 确保连接池在最后被关闭
        if (pool) {
            try {
                await pool.close()
            } catch (closeErr) {
                console.error('关闭连接池时出错:', closeErr.message)
            }
        }
    }
})



//重做的所有的提成汇总 👆


//重做的个人项目管理表的首页图表 👇
// 获取项目提成数据的API
// 月度数据API
app.get('/api/projects/chartachievements', async (req, res) => {
    try {
        const { leader } = req.query;
        if (!leader) {
            return res.status(400).json({ error: '需要提供负责人参数' });
        }

        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('leader', sql.VarChar, leader)
            .query(`
               SELECT 
                   FORMAT(CommissionDate, 'yyyy-MM') AS month,
                   SUM(actual_fee) AS actualFee,
                   SUM(leader_commission) AS leaderCommission,
                   COUNT(*) AS projectCount
               FROM ProjectManagementDB.dbo.ProjectsAchievements
               WHERE CommissionDate IS NOT NULL
                 AND project_leader = @leader
               GROUP BY FORMAT(CommissionDate, 'yyyy-MM')
               ORDER BY month
           `);

        res.json(result.recordset);
    } catch (error) {
        console.error('查询数据库失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 每日数据API
app.get('/api/projects/dailyachievements', async (req, res) => {
    try {
        const { month, leader } = req.query;
        if (!month || !leader) {
            return res.status(400).json({ error: '需要提供月份和负责人参数' });
        }

        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('month', sql.VarChar, month)
            .input('leader', sql.VarChar, leader)
            .query(`
               SELECT 
                   FORMAT(CommissionDate, 'yyyy-MM-dd') AS day,
                   SUM(actual_fee) AS actualFee,
                   SUM(leader_commission) AS leaderCommission,
                   COUNT(*) AS projectCount
               FROM ProjectManagementDB.dbo.ProjectsAchievements
               WHERE CommissionDate IS NOT NULL
                 AND FORMAT(CommissionDate, 'yyyy-MM') = @month
                 AND project_leader = @leader
               GROUP BY FORMAT(CommissionDate, 'yyyy-MM-dd')
               ORDER BY day
           `);

        res.json(result.recordset);
    } catch (error) {
        console.error('查询每日数据失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 报销管理
// app.get('/projectapi/homereimbursements/stats', async (req, res) => {
//     try {
//         const pool = await sql.connect(config);
//         const result = await pool.request()
//             .query(`
//                 SELECT 
//                     COUNT(*) as totalCount,
//                     SUM(CASE WHEN Whetherover = 0 THEN 1 ELSE 0 END) as pendingCount
//                 FROM ProjectManagementDB.dbo.ProjectsReimbursement
//             `);

//         res.json({
//             totalCount: result.recordset[0].totalCount,
//             pendingCount: result.recordset[0].pendingCount
//         });
//     } catch (error) {
//         console.error('Error fetching reimbursement stats:', error);
//         res.status(500).json({ error: 'Failed to fetch reimbursement stats' });
//     }
// });

app.get('/projectapi/homereimbursements/stats', async (req, res) => {
    try {
        const request = pool.request(); // 从池中获取请求
        const result = await request.query('SELECT * FROM ProjectManagementDB.dbo.ProjectsReimbursement');
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching homereimbursements stats:', error);
        res.status(500).json({ error: 'Failed to fetch homereimbursements stats' });
    }
    // 不需要手动关闭，连接会由连接池管理
});


//提成管理
//  
// app.get('/projectapi/homeachievements/stats', async (req, res) => {
//     try {
//         const pool = await sql.connect(config);
//         const result = await pool.request()
//             .query(`
//                 SELECT 
//                     COUNT(*) as totalCount,
//                     SUM(CASE WHEN Whetherticheng = 0 OR Whetherticheng IS NULL THEN 1 ELSE 0 END) as pendingCount
//                 FROM ProjectManagementDB.dbo.ProjectsAchievements
//             `);

//         res.json({
//             totalCount: result.recordset[0].totalCount,
//             pendingCount: result.recordset[0].pendingCount
//         });
//     } catch (error) {
//         console.error('Error fetching achievements stats:', error);
//         res.status(500).json({ error: 'Failed to fetch achievements stats' });
//     }
// });
app.get('/projectapi/homeachievements/stats', async (req, res) => {
    try {
        const request = pool.request(); // 从池中获取请求
        const result = await request.query('SELECT * FROM ProjectManagementDB.dbo.ProjectsAchievements');
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching achievements stats:', error);
        res.status(500).json({ error: 'Failed to fetch achievements stats' });
    }
    // 不需要手动关闭，连接会由连接池管理
});


//重做的个人项目管理表的首页图表 👆



// 获取衣柜数据👇

// 获取衣柜数据👇
app.get('/api/getWardrobeStewardData', async (req, res) => {
    try {
        await poolConnect; // 确保连接池已连接

        const query = `
            SELECT 
                id, 
                category, 
                sub_category, 
                item_name, 
                season, 
                item_code, 
                length, 
                width,
                created_at,
                updated_at
            FROM ChatApp.dbo.WardrobeStewardData
            ORDER BY category, item_name
        `;

        const result = await pool.request().query(query);

        // 将数据按类别分组
        const groupedData = {
            tops: [],
            bottoms: [],
            dresses: [],
            shoes: [],
            accessories: []
        };

        result.recordset.forEach(item => {
            // 构建两张图片URL
            const itemImageUrl = `http://121.4.22.55:80/backend/images/WardrobeStewar/${item.category}/${item.item_code}.png`;
            const effectImageUrl = `http://121.4.22.55:80/backend/images/WardrobeStewar/${item.category}/${item.item_code}effect.png`;

            const formattedItem = {
                id: item.id,
                name: item.item_name,
                image: itemImageUrl, // 列表显示用图片
                effectImage: effectImageUrl, // 搭配预览用图片
                code: item.item_code,
                category: item.category,
                subCategory: item.sub_category,
                season: item.season,
                dimensions: {
                    length: item.length,
                    width: item.width
                }
            };

            // 根据类别分组
            switch (item.category.toLowerCase()) {
                case '上衣':
                case '衣服':
                    groupedData.tops.push(formattedItem);
                    break;
                case '裤子':
                    groupedData.bottoms.push(formattedItem);
                    break;
                case '连衣裙':
                case '裙子':
                    groupedData.dresses.push(formattedItem);
                    break;
                case '鞋子':
                    groupedData.shoes.push(formattedItem);
                    break;
                case '配饰':
                case '饰品':
                    groupedData.accessories.push(formattedItem);
                    break;
            }
        });

        res.json({
            success: true,
            data: groupedData
        });
    } catch (err) {
        console.error('Error fetching wardrobe data:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch wardrobe data'
        });
    }
});
// 获取衣柜数据👆
// 获取衣柜数据👆


//添加衣柜数据信息 👇


app.post('/api/wardrobe/add', async (req, res) => {
    try {
        const { season, category, sub_category, item_name, length, width } = req.body;

        // 获取当前时间戳（格式：YYYYMMDDHHmm）
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const timestamp = `${year}${month}${day}${hours}${minutes}`;

        // 获取类别前缀
        const prefix = getCategoryPrefix(category);
        const item_code = `${prefix}${timestamp}`;

        // 插入新记录
        const request = pool.request();
        const result = await request.input('season', sql.NVarChar, season)
            .input('category', sql.NVarChar, category)
            .input('sub_category', sql.NVarChar, sub_category)
            .input('item_name', sql.NVarChar, item_name)
            .input('length', sql.Int, length)
            .input('width', sql.Int, width)
            .input('item_code', sql.NVarChar, item_code)
            .query(`
                INSERT INTO ChatApp.dbo.WardrobeStewardData 
                (season, category, sub_category, item_name, length, width, item_code, created_at, updated_at)
                VALUES 
                (@season, @category, @sub_category, @item_name, @length, @width, @item_code, GETDATE(), GETDATE())
            `);

        res.status(201).json({ success: true, item_code });
    } catch (error) {
        console.error('添加服装失败:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});


function getCategoryPrefix(category) {
    // 中文类别映射
    const categoryMap = {
        '衣服': 'y',
        '裤子': 'k',
        '连衣裙': 'l',
        '鞋子': 'x',
        '配饰': 'p'
    };

    // 如果找到中文映射，返回对应的前缀
    if (categoryMap[category]) {
        return categoryMap[category];
    }

    // 否则返回第一个字母的小写
    return category.charAt(0).toLowerCase();
}
// 配置multer存储
const storageUpdateWardrobeSteward = multer.diskStorage({
    destination: function (req, file, cb) {
        const category = req.body.category;
        const categoryDir = path.join(__dirname, 'images', 'WardrobeStewar', category);

        // 确保目录存在
        if (!fs.existsSync(categoryDir)) {
            fs.mkdirSync(categoryDir, { recursive: true });
        }

        cb(null, categoryDir);
    },
    filename: function (req, file, cb) {
        const itemCode = req.body.item_code;
        const suffix = file.fieldname === 'item_image' ? '' : 'effect';
        cb(null, `${itemCode}${suffix}.png`);
    }
});

const uploadUpdateWardrobeSteward = multer({
    storage: storageUpdateWardrobeSteward,
    fileFilter: function (req, file, cb) {
        if (file.mimetype !== 'image/png') {
            return cb(new Error('只允许上传PNG图片'));
        }
        cb(null, true);
    }
});

// 上传图片的API
app.post('/api/wardrobe/upload-images', uploadUpdateWardrobeSteward.fields([
    { name: 'item_image', maxCount: 1 },
    { name: 'effect_image', maxCount: 1 }
]), (req, res) => {
    try {
        if (!req.files || !req.files.item_image || !req.files.effect_image) {
            return res.status(400).json({ success: false, error: '请上传两张图片' });
        }

        res.status(200).json({
            success: true,
            message: '图片上传成功',
            itemImage: req.files.item_image[0].filename,
            effectImage: req.files.effect_image[0].filename
        });
    } catch (error) {
        console.error('图片上传失败:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});
//添加衣柜数据信息 👆


//记录经期 👇
// 获取月经记录
app.get('/api/auntflo/records', async (req, res) => {
    try {
        const { username, startDate, endDate } = req.query;

        if (!username) {
            return res.status(400).json({ error: '需要用户名' });
        }

        const request = pool.request();
        let query = 'SELECT * FROM ChatApp.dbo.PeriodRecords WHERE Username = @username';

        if (startDate && endDate) {
            query += ' AND RecordDate BETWEEN @startDate AND @endDate';
            request.input('startDate', sql.Date, startDate);
            request.input('endDate', sql.Date, endDate);
        }

        request.input('username', sql.NVarChar, username);

        const result = await request.query(query);

        // 格式化返回数据
        const formattedRecords = result.recordset.map(record => ({
            ...record,
            RecordDate: new Date(record.RecordDate).toISOString().split('T')[0]
        }));

        res.json(formattedRecords);
    } catch (err) {
        console.error('获取月经记录失败:', err);
        res.status(500).json({ error: '获取月经记录失败' });
    }
});

// 添加或更新月经记录
app.post('/api/auntflo/records', async (req, res) => {
    try {
        const { username, recordDate, isPeriod, remarks, dysmenorrheaLevel, symptoms } = req.body;

        if (!username || !recordDate || isPeriod === undefined) {
            return res.status(400).json({
                error: '缺少必要字段',
                details: {
                    username: !!username,
                    recordDate: !!recordDate,
                    isPeriod: isPeriod !== undefined
                }
            });
        }

        // 验证日期格式
        if (!/^\d{4}-\d{2}-\d{2}$/.test(recordDate)) {
            return res.status(400).json({
                error: '日期格式不正确，请使用YYYY-MM-DD',
                receivedDate: recordDate
            });
        }

        const request = pool.request();
        const query = `
            BEGIN TRY
                BEGIN TRANSACTION;
                
                -- 检查记录是否存在
                DECLARE @exists BIT = 0;
                SELECT @exists = 1 
                FROM ChatApp.dbo.PeriodRecords 
                WHERE Username = @username AND RecordDate = @recordDate;
                
                IF @exists = 1
                BEGIN
                    -- 更新现有记录
                    UPDATE ChatApp.dbo.PeriodRecords
                    SET IsPeriod = @isPeriod,
                        Remarks = @remarks,
                        DysmenorrheaLevel = @dysmenorrheaLevel,
                        Symptoms = @symptoms
                    WHERE Username = @username AND RecordDate = @recordDate;
                END
                ELSE
                BEGIN
                    -- 插入新记录
                    INSERT INTO ChatApp.dbo.PeriodRecords 
                    (Username, RecordDate, IsPeriod, Remarks, DysmenorrheaLevel, Symptoms)
                    VALUES (@username, @recordDate, @isPeriod, @remarks, @dysmenorrheaLevel, @symptoms);
                END
                
                COMMIT TRANSACTION;
                SELECT 'Success' AS Result;
            END TRY
            BEGIN CATCH
                ROLLBACK TRANSACTION;
                SELECT ERROR_MESSAGE() AS Error;
            END CATCH
        `;

        request.input('username', sql.NVarChar(50), username);
        request.input('recordDate', sql.Date, recordDate);
        request.input('isPeriod', sql.Bit, isPeriod);
        request.input('remarks', sql.NVarChar(255), remarks || null);
        request.input('dysmenorrheaLevel', sql.Int, dysmenorrheaLevel || null);
        request.input('symptoms', sql.NVarChar(255), symptoms || null);

        const result = await request.query(query);

        // 检查是否有错误
        if (result.recordset && result.recordset[0] && result.recordset[0].Error) {
            throw new Error(result.recordset[0].Error);
        }

        res.json({
            success: true,
            action: result.rowsAffected[0] > 0 ? 'updated' : 'created'
        });
    } catch (err) {
        console.error('保存月经记录失败:', {
            error: err.message,
            stack: err.stack,
            requestBody: req.body
        });

        res.status(500).json({
            error: '保存月经记录失败',
            details: err.message,
            timestamp: new Date().toISOString()
        });
    }
});

// 删除月经记录
app.delete('/api/auntflo/records', async (req, res) => {
    try {
        const { username, recordDate } = req.body;

        if (!username || !recordDate) {
            return res.status(400).json({
                error: '缺少必要字段',
                details: {
                    username: !!username,
                    recordDate: !!recordDate
                }
            });
        }

        const request = pool.request();
        const query = `
            DELETE FROM ChatApp.dbo.PeriodRecords
            WHERE Username = @username AND RecordDate = @recordDate
        `;

        request.input('username', sql.NVarChar(50), username);
        request.input('recordDate', sql.Date, recordDate);

        const result = await request.query(query);

        res.json({
            success: true,
            deleted: result.rowsAffected[0] > 0
        });
    } catch (err) {
        console.error('删除月经记录失败:', {
            error: err.message,
            stack: err.stack,
            requestBody: req.body
        });

        res.status(500).json({
            error: '删除月经记录失败',
            details: err.message
        });
    }
});
//记录经期 👆


//新的报告下载模板 👇
//获取
app.get('/api/getTemplateManagement', async (req, res) => {
    try {
        let firstpool = await sql.connect(config);
        let templateResult = await firstpool.request().query('SELECT * FROM ChatApp.dbo.TemplateManagement');

        // Transform the data to match frontend structure
        const transformedData = templateResult.recordset.map(item => ({
            AssetType: item.AssetType,
            AssetTypeRemark: item.AssetTypeRemark,
            ValuationPurpose: item.ValuationPurpose,
            DocumentName: item.DocumentName,
            DocumentRemark: item.DocumentRemark
        }));

        res.json({ Template: transformedData });
        firstpool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});
//下载
// 统一的下载API
app.get('/api/downloadTemplateManagement', (req, res) => {
    console.log('收到下载请求，参数:', req.query);
    const {
        templateId,
        files,
        downloadType,
        assetType,
        valuationPurpose
    } = req.query;

    if (!files || !assetType || !valuationPurpose) {
        console.error('错误：缺少必要参数');
        return res.status(400).send('Missing required parameters');
    }

    const fileList = files.split(',');
    console.log('要下载的文件列表:', fileList);

    // 构建安全路径（不再使用templateId）
    const safeAssetType = path.normalize(assetType).replace(/^(\.\.(\/|\\|$))+/, '');
    const safeValuationPurpose = path.normalize(valuationPurpose).replace(/^(\.\.(\/|\\|$))+/, '');

    const basePath = path.join(__dirname, './public/downloads/Templates');
    console.log('基础路径:', basePath);

    // 修改这里：去掉templateId
    const directoryPath = path.join(basePath, safeAssetType, safeValuationPurpose);
    console.log('修正后的文件目录路径:', directoryPath);

    // 验证路径是否在允许的范围内
    if (!directoryPath.startsWith(basePath)) {
        console.error('错误：非法路径访问尝试');
        return res.status(400).send('Invalid path');
    }

    // 检查目录是否存在
    if (!fs.existsSync(directoryPath)) {
        console.error('错误：目录不存在');
        console.error('目录路径:', directoryPath);
        return res.status(404).send('Directory not found');
    }

    // 单文件下载
    if (downloadType === 'single' && fileList.length === 1) {
        const fileName = fileList[0];
        console.log('单文件下载:', fileName);

        const safeFileName = path.normalize(fileName).replace(/^(\.\.(\/|\\|$))+/, '');
        const filePath = path.join(directoryPath, safeFileName);
        console.log('完整文件路径:', filePath);

        if (!fs.existsSync(filePath)) {
            console.error('错误：文件不存在');
            return res.status(404).send('File not found');
        }

        console.log('开始文件下载:', filePath);
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
        res.setHeader('Content-Type', 'application/octet-stream');

        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        fileStream.on('error', (err) => {
            console.error('文件流错误:', err);
            res.status(500).send('File download error');
        });
    }
    // 多文件压缩下载（同样修改路径构建）
    else if (downloadType === 'zip' && fileList.length > 1) {
        console.log('多文件压缩下载:', fileList);

        const zip = new JSZip();
        const zipFileName = `template_files_${Date.now()}.zip`;
        const zipFilePath = path.join(__dirname, './temp', zipFileName);
        const output = fs.createWriteStream(zipFilePath);

        // 确保临时目录存在
        if (!fs.existsSync(path.join(__dirname, './temp'))) {
            fs.mkdirSync(path.join(__dirname, './temp'));
        }

        // 添加每个文件到zip
        let filesAdded = 0;
        const addFilesPromises = fileList.map(fileName => {
            return new Promise((resolve, reject) => {
                const safeFileName = path.normalize(fileName).replace(/^(\.\.(\/|\\|$))+/, '');
                const filePath = path.join(directoryPath, safeFileName);

                if (!fs.existsSync(filePath)) {
                    console.error(`文件不存在: ${filePath}`);
                    resolve(false); // 不reject，继续处理其他文件
                    return;
                }

                fs.readFile(filePath, (err, data) => {
                    if (err) {
                        console.error(`读取文件错误: ${filePath}`, err);
                        resolve(false);
                        return;
                    }

                    zip.file(fileName, data);
                    filesAdded++;
                    resolve(true);
                });
            });
        });

        Promise.all(addFilesPromises)
            .then(() => {
                if (filesAdded === 0) {
                    console.error('错误：没有有效的文件可下载');
                    return res.status(404).send('No valid files found to download');
                }

                // 生成zip文件
                zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true })
                    .pipe(output)
                    .on('finish', () => {
                        console.log('ZIP文件创建完成:', zipFilePath);

                        // 设置响应头
                        res.setHeader('Content-Type', 'application/zip');
                        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(zipFileName)}"`);

                        // 流式传输zip文件
                        const zipStream = fs.createReadStream(zipFilePath);
                        zipStream.pipe(res);

                        // 清理临时文件
                        zipStream.on('end', () => {
                            fs.unlink(zipFilePath, (err) => {
                                if (err) console.error('删除临时ZIP文件失败:', err);
                            });
                        });

                        zipStream.on('error', (err) => {
                            console.error('ZIP文件流错误:', err);
                            fs.unlink(zipFilePath, () => { }); // 尝试清理
                            res.status(500).send('Zip download error');
                        });
                    });
            })
            .catch(err => {
                console.error('创建ZIP过程中出错:', err);
                res.status(500).send('Error creating zip file');
            });
    }
});
//新的报告下载模板 👆

app.get('/api/getEvaluationFilePreview', async (req, res) => {
    console.log('收到请求'); // 添加日志
    try {
        console.log('尝试连接数据库');



        let pool = await sql.connect(config);
        console.log('数据库连接成功');
        let result = await pool.request()
            .query('SELECT CategoryName, FileName, Remarks FROM ChatApp.dbo.EvaluationFilePreview ORDER BY CategoryName, FileName');

        // 将结果按分类分组
        const groupedData = {};
        result.recordset.forEach(item => {
            if (!groupedData[item.CategoryName]) {
                groupedData[item.CategoryName] = [];
            }
            groupedData[item.CategoryName].push({
                fileName: item.FileName,
                remarks: item.Remarks
            });
        });

        // 转换为前端需要的格式
        const responseData = Object.keys(groupedData).map(categoryName => ({
            categoryName,
            files: groupedData[categoryName]
        }));

        res.json(responseData);
    } catch (err) {
        console.error('完整错误:', err); // 记录完整错误

        console.error('数据库查询错误:', err);
        res.status(500).json({ error: '获取数据失败' });
    } finally {
        sql.close(); // 关闭连接
    }
});

//获取评估文件预览👇



//获取评估文件预览👆


//使用全局连接池 这是最佳实践 搜索哪些使用了这个，直接关键字搜索：使用全局连接池 这是最佳实践 👇 2.2
// 应用关闭时关闭连接池
process.on('SIGINT', async () => {
    try {
        await pool.close();
        console.log('Connection pool closed');
        process.exit(0);
    } catch (err) {
        console.error('Error closing pool:', err);
        process.exit(1);
    }
});
//使用全局连接池 这是最佳实践 搜索哪些使用了这个，直接关键字搜索：使用全局连接池 这是最佳实践 👆 2.2



//网页报告编辑 👇 开始

//  获取网页报告编写的配套ai对应的api 
app.get('/api/getApiDatabas', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query('SELECT * FROM WebWordReports.dbo.ApiDatabas');
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('获取数据失败:', error);
        res.status(500).json({ message: '获取数据失败' });
    }
});


// 4.1 获取网页报告编写的数据库的选项
app.get('/api/getWordReportOptions', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query('SELECT * FROM WebWordReports.dbo.WordReportOptions');
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('获取数据失败:', error);
        res.status(500).json({ message: '获取数据失败' });
    }
});

// 4.2 查找网页报告 没有分页功能
app.get('/api/searchWordReportsold', async (req, res) => {
    const { documentNo } = req.query; // 使用 documentNo 作为参数名，但实际可以搜索多个字段
    try {
        const result = await pool.request()
            .input('searchTerm', sql.VarChar(255), `%${documentNo}%`) // 扩大长度以防长搜索词
            .query(`
        SELECT * 
        FROM WebWordReports.dbo.WordReportsInformation 
        WHERE 
          documentNo LIKE @searchTerm
          OR entrustingParty LIKE @searchTerm
          OR location LIKE @searchTerm
          OR appraiserNameA LIKE @searchTerm
          OR appraiserNameB LIKE @searchTerm
          OR communityName LIKE @searchTerm
          OR housePurpose LIKE @searchTerm
          OR rightsHolder LIKE @searchTerm
          OR projectID LIKE @searchTerm
          OR reportID LIKE @searchTerm          
      `);
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('搜索报告失败:', error);
        res.status(500).json({ message: '搜索报告失败' });
    }
});

// 4.2 查找网页报告 增加分页功能
app.get('/api/searchWordReports', async (req, res) => {
    const { documentNo, page = 1, pageSize = 10 } = req.query;
    const pageNum = parseInt(page);
    const size = parseInt(pageSize);
    const offset = (pageNum - 1) * size;

    try {
        // 先查询总数
        const countResult = await pool.request()
            .input('searchTerm', sql.VarChar(255), `%${documentNo}%`)
            .query(`
                SELECT COUNT(*) as total 
                FROM WebWordReports.dbo.WordReportsInformation 
                WHERE 
                    documentNo LIKE @searchTerm
                    OR entrustingParty LIKE @searchTerm
                    OR location LIKE @searchTerm
                    OR appraiserNameA LIKE @searchTerm
                    OR appraiserNameB LIKE @searchTerm
                    OR communityName LIKE @searchTerm
                    OR housePurpose LIKE @searchTerm
                    OR rightsHolder LIKE @searchTerm
                    OR projectID LIKE @searchTerm
                    OR reportID LIKE @searchTerm
            `);

        const total = countResult.recordset[0].total;

        // 再查询分页数据
        const result = await pool.request()
            .input('searchTerm', sql.VarChar(255), `%${documentNo}%`)
            .input('offset', sql.Int, offset)
            .input('pageSize', sql.Int, size)
            .query(`
                SELECT * 
                FROM WebWordReports.dbo.WordReportsInformation 
                WHERE 
                    documentNo LIKE @searchTerm
                    OR entrustingParty LIKE @searchTerm
                    OR location LIKE @searchTerm
                    OR appraiserNameA LIKE @searchTerm
                    OR appraiserNameB LIKE @searchTerm
                    OR communityName LIKE @searchTerm
                    OR housePurpose LIKE @searchTerm
                    OR rightsHolder LIKE @searchTerm
                    OR projectID LIKE @searchTerm
                    OR reportID LIKE @searchTerm
                ORDER BY reportDate DESC
                OFFSET @offset ROWS
                FETCH NEXT @pageSize ROWS ONLY
            `);

        res.status(200).json({
            reports: result.recordset,
            total: total,
            page: pageNum,
            pageSize: size,
            totalPages: Math.ceil(total / size)
        });
    } catch (error) {
        console.error('搜索报告失败:', error);
        res.status(500).json({ message: '搜索报告失败' });
    }
});

// 4.3 检查是否存在相同坐落的报告 利用这个来判断是新增还是修改
app.get('/api/checkReportByReportID', async (req, res) => {
    const { reportID } = req.query;
    try {
        const result = await pool.request()
            .input('reportID', sql.VarChar(255), reportID)
            .query('SELECT TOP 1 * FROM WebWordReports.dbo.WordReportsInformation WHERE reportID = @reportID');

        if (result.recordset.length > 0) {
            res.status(200).json(result.recordset[0]);
        } else {
            res.status(200).json(null);
        }
    } catch (error) {
        console.error('检查报告失败:', error);
        res.status(500).json({ message: '检查报告失败' });
    }
});

// 4.4 删除网页报告
app.delete('/api/deleteWordReport/:id', async (req, res) => {
    const reportId = req.params.id;
    try {
        await pool.request()
            .input('reportsID', sql.Int, reportId)
            .query('DELETE FROM WebWordReports.dbo.WordReportsInformation WHERE reportsID = @reportsID');

        // 通知所有客户端有报告删除
        io.emit('report_deleted', parseInt(reportId));

        res.status(200).json({ message: '报告删除成功' });
    } catch (error) {
        console.error('删除报告失败:', error);
        res.status(500).json({ message: '删除报告失败' });
    }
});

// 4.5 创建或更新网页报告
// 创建新报告
app.post('/api/createWordReport', async (req, res) => {
    const reportData = req.body;
    try {
        const result = await pool.request()
            .input('documentNo', sql.VarChar(50), reportData.documentNo)
            .input('entrustDate', sql.Date, reportData.entrustDate)
            .input('entrustingParty', sql.VarChar(100), reportData.entrustingParty)
            .input('assessmentCommissionDocument', sql.VarChar(255), reportData.assessmentCommissionDocument)
            .input('valueDateRequirements', sql.VarChar(500), reportData.valueDateRequirements)// 新增价值时点要求
            .input('location', sql.VarChar(255), reportData.location)
            .input('buildingArea', sql.Decimal(10, 2), reportData.buildingArea)
            .input('interiorArea', sql.Decimal(10, 2), reportData.interiorArea)
            .input('propertyCertificateNo', sql.VarChar(50), reportData.propertyCertificateNo)
            .input('housePurpose', sql.VarChar(100), reportData.housePurpose)
            .input('propertyUnitNo', sql.VarChar(50), reportData.propertyUnitNo)
            .input('rightsHolder', sql.VarChar(100), reportData.rightsHolder)
            .input('landPurpose', sql.VarChar(100), reportData.landPurpose)
            .input('sharedLandArea', sql.Decimal(10, 2), reportData.sharedLandArea)
            .input('landUseRightEndDate', sql.Date, reportData.landUseRightEndDate)
            .input('houseStructure', sql.VarChar(100), reportData.houseStructure)
            .input('coOwnershipStatus', sql.VarChar(100), reportData.coOwnershipStatus)
            .input('rightsNature', sql.VarChar(50), reportData.rightsNature)
            .input('communityName', sql.VarChar(100), reportData.communityName)
            .input('totalFloors', sql.Int, reportData.totalFloors)
            .input('floorNumber', sql.Int, reportData.floorNumber)
            .input('elevator', sql.Bit, reportData.elevator)
            .input('decorationStatus', sql.VarChar(500), reportData.decorationStatus)
            .input('ventilationStatus', sql.Bit, reportData.ventilationStatus)
            .input('spaceLayout', sql.VarChar(100), reportData.spaceLayout)
            .input('exteriorWallMaterial', sql.VarChar(100), reportData.exteriorWallMaterial)
            .input('yearBuilt', sql.Int, reportData.yearBuilt)
            .input('boundaries', sql.VarChar(255), reportData.boundaries)
            .input('valueDate', sql.Date, reportData.valueDate)
            .input('reportDate', sql.Date, reportData.reportDate)
            .input('valuationMethod', sql.VarChar(100), reportData.valuationMethod)
            .input('appraiserNameA', sql.VarChar(50), reportData.appraiserNameA)
            .input('appraiserRegNoA', sql.VarChar(50), reportData.appraiserRegNoA)
            .input('appraiserNameB', sql.VarChar(50), reportData.appraiserNameB)
            .input('appraiserRegNoB', sql.VarChar(50), reportData.appraiserRegNoB)
            .input('projectID', sql.VarChar(50), reportData.projectID) // 新增
            .input('reportID', sql.VarChar(50), reportData.reportID)    // 新增
            .input('valuationPrice', sql.Decimal(6, 0), reportData.valuationPrice) // 新增
            .input('bank', sql.VarChar(500), reportData.bank)
            .input('supermarket', sql.VarChar(500), reportData.supermarket) // 新增
            .input('hospital', sql.VarChar(500), reportData.hospital)   // 新增
            .input('school', sql.VarChar(500), reportData.school) // 新增
            .input('nearbyCommunity', sql.VarChar(500), reportData.nearbyCommunity)
            .input('busStopName', sql.VarChar(500), reportData.busStopName) // 新增
            .input('busRoutes', sql.VarChar(500), reportData.busRoutes)   // 新增
            .input('areaRoad', sql.VarChar(500), reportData.areaRoad) // 新增
            .input('hasFurnitureElectronics', sql.Bit, reportData.hasFurnitureElectronics)// 新增 是否包含家具家电
            .input('furnitureElectronicsEstimatedPrice', sql.Decimal(6, 0), reportData.furnitureElectronicsEstimatedPrice) // 新增 家具家电评估总价
            .input('landShape', sql.VarChar(500), reportData.landShape)//土地形状
            .input('streetStatus', sql.VarChar(500), reportData.streetStatus) // 临街状况             
            .input('direction', sql.VarChar(500), reportData.direction) // 方位
            .input('orientation', sql.VarChar(500), reportData.orientation)// 朝向
            .input('distance', sql.VarChar(500), reportData.distance)// 距离
            .input('parkingStatus', sql.VarChar(500), reportData.parkingStatus)// 停车状况
            .input('mortgageBasis', sql.VarChar(500), reportData.mortgageBasis)// 抵押依据
            .input('seizureBasis', sql.VarChar(500), reportData.seizureBasis)// 查封依据
            .input('utilizationStatus', sql.VarChar(500), reportData.utilizationStatus)// 利用状况
            .input('mortgageStatus', sql.Bit, reportData.mortgageStatus)//抵押状况
            .input('seizureStatus', sql.Bit, reportData.seizureStatus)//查封状况
            .input('isLeaseConsidered', sql.Bit, reportData.isLeaseConsidered)//是否考虑租约
            .input('rent', sql.Decimal(18, 2), reportData.rent)//建面月租金
            .query(`INSERT INTO WebWordReports.dbo.WordReportsInformation (
        documentNo, entrustDate, entrustingParty, assessmentCommissionDocument, valueDateRequirements, location, 
        buildingArea, interiorArea, propertyCertificateNo, housePurpose,
        propertyUnitNo, rightsHolder, landPurpose, sharedLandArea,
        landUseRightEndDate, houseStructure, coOwnershipStatus, rightsNature,
        communityName, totalFloors, floorNumber, elevator,
        decorationStatus, ventilationStatus, spaceLayout, exteriorWallMaterial,
        yearBuilt, boundaries, valueDate, reportDate,
        valuationMethod, appraiserNameA, appraiserRegNoA, appraiserNameB, appraiserRegNoB,
        projectID, reportID, valuationPrice, bank, supermarket, hospital, school, nearbyCommunity, busStopName, busRoutes, areaRoad, hasFurnitureElectronics, furnitureElectronicsEstimatedPrice, 
        landShape, streetStatus, direction, orientation, distance, parkingStatus,
        mortgageBasis, seizureBasis, utilizationStatus, mortgageStatus, seizureStatus, isLeaseConsidered, rent
      ) VALUES (
        @documentNo, @entrustDate, @entrustingParty, @assessmentCommissionDocument, @valueDateRequirements, @location,
        @buildingArea, @interiorArea, @propertyCertificateNo, @housePurpose,
        @propertyUnitNo, @rightsHolder, @landPurpose, @sharedLandArea,
        @landUseRightEndDate, @houseStructure, @coOwnershipStatus, @rightsNature,
        @communityName, @totalFloors, @floorNumber, @elevator,
        @decorationStatus, @ventilationStatus, @spaceLayout, @exteriorWallMaterial,
        @yearBuilt, @boundaries, @valueDate, @reportDate,
        @valuationMethod, @appraiserNameA, @appraiserRegNoA, @appraiserNameB, @appraiserRegNoB,
        @projectID, @reportID, @valuationPrice, @bank, @supermarket, @hospital, @school, @nearbyCommunity, @busStopName, @busRoutes, @areaRoad, @hasFurnitureElectronics, @furnitureElectronicsEstimatedPrice,
        @landShape, @streetStatus, @direction, @orientation, @distance, @parkingStatus,
        @mortgageBasis, @seizureBasis, @utilizationStatus, @mortgageStatus, @seizureStatus, @isLeaseConsidered, @rent
      ); SELECT SCOPE_IDENTITY() AS reportsID;`);

        const newReportId = result.recordset[0].reportsID;
        const newReport = {
            reportsID: newReportId,
            ...reportData
        };

        // 通知所有客户端有新报告创建
        io.emit('report_created', newReport);

        res.status(201).json(newReport);
        // 在 catch 块中添加更详细的错误信息
    } catch (error) {
        console.error('创建报告失败:', error);
        console.error('SQL 查询:', yourQueryString); // 记录完整的 SQL
        res.status(500).json({
            message: '创建报告失败',
            error: error.message
        });
    }
});

// 更新报告
app.put('/api/updateWordReport/:id', async (req, res) => {
    const reportId = req.params.id;
    const reportData = req.body;
    try {
        await pool.request()
            .input('reportsID', sql.Int, reportId)
            .input('documentNo', sql.VarChar(50), reportData.documentNo)
            .input('entrustDate', sql.Date, reportData.entrustDate)
            .input('entrustingParty', sql.VarChar(100), reportData.entrustingParty)
            .input('assessmentCommissionDocument', sql.VarChar(255), reportData.assessmentCommissionDocument)
            .input('valueDateRequirements', sql.VarChar(500), reportData.valueDateRequirements)
            .input('location', sql.VarChar(255), reportData.location)
            .input('buildingArea', sql.Decimal(10, 2), reportData.buildingArea)
            .input('interiorArea', sql.Decimal(10, 2), reportData.interiorArea)
            .input('propertyCertificateNo', sql.VarChar(50), reportData.propertyCertificateNo)
            .input('housePurpose', sql.VarChar(100), reportData.housePurpose)
            .input('propertyUnitNo', sql.VarChar(50), reportData.propertyUnitNo)
            .input('rightsHolder', sql.VarChar(100), reportData.rightsHolder)
            .input('landPurpose', sql.VarChar(100), reportData.landPurpose)
            .input('sharedLandArea', sql.Decimal(10, 2), reportData.sharedLandArea)
            .input('landUseRightEndDate', sql.Date, reportData.landUseRightEndDate)
            .input('houseStructure', sql.VarChar(100), reportData.houseStructure)
            .input('coOwnershipStatus', sql.VarChar(100), reportData.coOwnershipStatus)
            .input('rightsNature', sql.VarChar(50), reportData.rightsNature)
            .input('communityName', sql.VarChar(100), reportData.communityName)
            .input('totalFloors', sql.Int, reportData.totalFloors)
            .input('floorNumber', sql.Int, reportData.floorNumber)
            .input('elevator', sql.Bit, reportData.elevator)
            .input('decorationStatus', sql.VarChar(500), reportData.decorationStatus)
            .input('ventilationStatus', sql.Bit, reportData.ventilationStatus)
            .input('spaceLayout', sql.VarChar(100), reportData.spaceLayout)
            .input('exteriorWallMaterial', sql.VarChar(100), reportData.exteriorWallMaterial)
            .input('yearBuilt', sql.Int, reportData.yearBuilt)
            .input('boundaries', sql.VarChar(255), reportData.boundaries)
            .input('valueDate', sql.Date, reportData.valueDate)
            .input('reportDate', sql.Date, reportData.reportDate)
            .input('valuationMethod', sql.VarChar(100), reportData.valuationMethod)
            .input('appraiserNameA', sql.VarChar(50), reportData.appraiserNameA)
            .input('appraiserRegNoA', sql.VarChar(50), reportData.appraiserRegNoA)
            .input('appraiserNameB', sql.VarChar(50), reportData.appraiserNameB)
            .input('appraiserRegNoB', sql.VarChar(50), reportData.appraiserRegNoB)
            .input('projectID', sql.VarChar(50), reportData.projectID) // 新增
            .input('reportID', sql.VarChar(50), reportData.reportID)   // 新增
            .input('valuationPrice', sql.Decimal(15, 0), reportData.valuationPrice) // 新增
            .input('bank', sql.VarChar(500), reportData.bank)
            .input('supermarket', sql.VarChar(500), reportData.supermarket) // 新增
            .input('hospital', sql.VarChar(500), reportData.hospital)   // 新增
            .input('school', sql.VarChar(500), reportData.school) // 新增
            .input('nearbyCommunity', sql.VarChar(500), reportData.nearbyCommunity)
            .input('busStopName', sql.VarChar(500), reportData.busStopName) // 新增
            .input('busRoutes', sql.VarChar(500), reportData.busRoutes)   // 新增
            .input('areaRoad', sql.VarChar(500), reportData.areaRoad) // 新增
            .input('hasFurnitureElectronics', sql.Bit, reportData.hasFurnitureElectronics)// 新增 是否包含家具家电
            .input('furnitureElectronicsEstimatedPrice', sql.Decimal(6, 0), reportData.furnitureElectronicsEstimatedPrice) // 新增 家具家电评估总价
            .input('landShape', sql.VarChar(500), reportData.landShape)//土地形状
            .input('streetStatus', sql.VarChar(500), reportData.streetStatus) // 临街状况             
            .input('direction', sql.VarChar(500), reportData.direction) // 方位
            .input('orientation', sql.VarChar(500), reportData.orientation)// 朝向
            .input('distance', sql.VarChar(500), reportData.distance)// 距离
            .input('parkingStatus', sql.VarChar(500), reportData.parkingStatus)// 停车状况
            .input('mortgageBasis', sql.VarChar(500), reportData.mortgageBasis)// 抵押依据
            .input('seizureBasis', sql.VarChar(500), reportData.seizureBasis)// 查封依据
            .input('utilizationStatus', sql.VarChar(500), reportData.utilizationStatus)// 利用状况
            .input('mortgageStatus', sql.Bit, reportData.mortgageStatus)//抵押状况
            .input('seizureStatus', sql.Bit, reportData.seizureStatus)//查封状况
            .input('isLeaseConsidered', sql.Bit, reportData.isLeaseConsidered)//是否考虑租约
            .input('rent', sql.Decimal(18, 2), reportData.rent)//建面月租金
            .query(`UPDATE WebWordReports.dbo.WordReportsInformation SET
        documentNo = @documentNo,
        entrustDate = @entrustDate,
        entrustingParty = @entrustingParty,
        assessmentCommissionDocument = @assessmentCommissionDocument,
        valueDateRequirements = @valueDateRequirements,
        location = @location,
        buildingArea = @buildingArea,
        interiorArea = @interiorArea,
        propertyCertificateNo = @propertyCertificateNo,
        housePurpose = @housePurpose,
        propertyUnitNo = @propertyUnitNo,
        rightsHolder = @rightsHolder,
        landPurpose = @landPurpose,
        sharedLandArea = @sharedLandArea,
        landUseRightEndDate = @landUseRightEndDate,
        houseStructure = @houseStructure,
        coOwnershipStatus = @coOwnershipStatus,
        rightsNature = @rightsNature,
        communityName = @communityName,
        totalFloors = @totalFloors,
        floorNumber = @floorNumber,
        elevator = @elevator,
        decorationStatus = @decorationStatus,
        ventilationStatus = @ventilationStatus,
        spaceLayout = @spaceLayout,
        exteriorWallMaterial = @exteriorWallMaterial,
        yearBuilt = @yearBuilt,
        boundaries = @boundaries,
        valueDate = @valueDate,
        reportDate = @reportDate,
        valuationMethod = @valuationMethod,
        appraiserNameA = @appraiserNameA,
        appraiserRegNoA = @appraiserRegNoA,
        appraiserNameB = @appraiserNameB,
        appraiserRegNoB = @appraiserRegNoB,
        projectID = @projectID,
        reportID = @reportID,
        valuationPrice = @valuationPrice,
        bank = @bank,
        supermarket = @supermarket,
        hospital = @hospital,
        school = @school,
        nearbyCommunity = @nearbyCommunity,
        busStopName = @busStopName,
        busRoutes = @busRoutes,
        areaRoad = @areaRoad,
        hasFurnitureElectronics = @hasFurnitureElectronics,
        furnitureElectronicsEstimatedPrice = @furnitureElectronicsEstimatedPrice,
        landShape = @landShape,
        streetStatus = @streetStatus,
        direction = @direction,
        orientation = @orientation,
        distance = @distance,
        parkingStatus = @parkingStatus,
        mortgageBasis = @mortgageBasis,
        seizureBasis = @seizureBasis,
        utilizationStatus = @utilizationStatus,
        mortgageStatus = @mortgageStatus,
        seizureStatus = @seizureStatus,
        isLeaseConsidered = @isLeaseConsidered,
        rent = @rent
      WHERE reportsID = @reportsID`);

        const updatedReport = {
            reportsID: parseInt(reportId),
            ...reportData
        };

        // 通知所有客户端有报告更新
        io.emit('report_updated', updatedReport);

        res.status(200).json(updatedReport);
    } catch (error) {
        console.error('更新报告失败:', error);
        res.status(500).json({ message: '更新报告失败' });
    }
});

//查找二维码信息报告  👇
app.get('/cyywork/api/searchWordReportsReportQrCode/:reportsID', async (req, res) => {
    const { reportsID } = req.params;

    if (!reportsID) {
        return res.status(400).json({
            success: false,
            message: '报告ID不能为空'
        });
    }

    try {
        // 使用 * 查询所有字段
        const result = await pool.request()
            .input('reportsID', sql.VarChar(255), reportsID)
            .query(`
                SELECT * 
                FROM WebWordReports.dbo.WordReportsInformation 
                WHERE reportsID = @reportsID
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: '未找到对应的报告数据'
            });
        }

        const reportData = result.recordset[0];

        res.status(200).json({
            success: true,
            data: reportData
        });
    } catch (error) {
        console.error('查询报告数据失败:', error);
        res.status(500).json({
            success: false,
            message: '查询报告数据失败'
        });
    }
});
//查找二维码信息报告  👆
// 后端API路由 - 添加到你的服务器文件
app.get('/cyywork/api/searchHousePrice', async (req, res) => {
    const {
        searchTerm = '',
        page = 1,
        pageSize = 10,
        sortField = 'reportDate',
        sortOrder = 'DESC'
    } = req.query;

    const pageNum = parseInt(page);
    const size = parseInt(pageSize);
    const offset = (pageNum - 1) * size;

    try {
        // 构建搜索条件
        let whereClause = '';
        if (searchTerm) {
            whereClause = `
                WHERE documentNo LIKE '%${searchTerm}%'
                OR entrustingParty LIKE '%${searchTerm}%'
                OR location LIKE '%${searchTerm}%'
                OR appraiserNameA LIKE '%${searchTerm}%'
                OR appraiserNameB LIKE '%${searchTerm}%'
                OR communityName LIKE '%${searchTerm}%'
                OR housePurpose LIKE '%${searchTerm}%'
                OR rightsHolder LIKE '%${searchTerm}%'
                OR projectID LIKE '%${searchTerm}%'
                OR reportID LIKE '%${searchTerm}%'
                OR propertyCertificateNo LIKE '%${searchTerm}%'
            `;
        }

        // 查询总数
        const countResult = await pool.request()
            .query(`
                SELECT COUNT(*) as total 
                FROM WebWordReports.dbo.WordReportsInformation 
                ${whereClause}
            `);

        const total = countResult.recordset[0].total;

        // 查询分页数据
        const result = await pool.request()
            .query(`
                SELECT 
                    reportsID,
                    documentNo,
                    entrustDate,
                    entrustingParty,
                    location,
                    buildingArea,
                    interiorArea,
                    valueDate,
                    reportDate,
                    appraiserNameA,
                    appraiserRegNoA,
                    appraiserNameB,
                    appraiserRegNoB,
                    communityName,
                    totalFloors,
                    floorNumber,
                    housePurpose,
                    propertyUnitNo,
                    rightsHolder,
                    landPurpose,
                    sharedLandArea,
                    landUseRightEndDate,
                    houseStructure,
                    coOwnershipStatus,
                    rightsNature,
                    elevator,
                    decorationStatus,
                    ventilationStatus,
                    spaceLayout,
                    exteriorWallMaterial,
                    yearBuilt,
                    boundaries,
                    valuationMethod,
                    propertyCertificateNo,
                    projectID,
                    reportID,
                    valuationPrice,
                    assessmentCommissionDocument,
                    hasFurnitureElectronics,
                    furnitureElectronicsEstimatedPrice,
                    valueDateRequirements,
                    landShape,
                    streetStatus,
                    direction,
                    orientation,
                    distance,
                    parkingStatus,
                    mortgageStatus,
                    mortgageBasis,
                    seizureStatus,
                    seizureBasis,
                    utilizationStatus,
                    isLeaseConsidered,
                    rent
                FROM WebWordReports.dbo.WordReportsInformation 
                ${whereClause}
                ORDER BY ${sortField} ${sortOrder}
                OFFSET ${offset} ROWS
                FETCH NEXT ${size} ROWS ONLY
            `);

        res.status(200).json({
            success: true,
            data: {
                records: result.recordset,
                total: total,
                page: pageNum,
                pageSize: size,
                totalPages: Math.ceil(total / size)
            }
        });
    } catch (error) {
        console.error('搜索房屋价格失败:', error);
        res.status(500).json({
            success: false,
            message: '搜索房屋价格失败',
            error: error.message
        });
    }
});


//上传房屋查询图片 👇
const storageUploadHousePricePicture = multer.diskStorage({
    destination: (req, file, cb) => {
        const { reportsID } = req.body;
        if (!reportsID) {
            return cb(new Error('reportsID is required'), null);
        }

        // 创建基于reportsID的文件夹路径
        const uploadPath = path.join(__dirname, 'images', 'HousePricePictures', reportsID.toString());

        // 如果文件夹不存在，则递归创建
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // 使用原始文件名
        cb(null, file.originalname);
    }
});

const uploadUploadHousePricePicture = multer({
    storage: storageUploadHousePricePicture,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/image\/jpeg/)) {
            cb(null, true);
        } else {
            cb(new Error('只允许上传JPG图片文件'), false);
        }
    },
    limits: {
        fileSize: 300 * 1024 // 限制300KB，与前端一致
    }
});

// 获取已存在图片的API
app.get('/cyywork/api/GetHousePricePictures', async (req, res) => {
    try {
        const { reportsID } = req.query;

        if (!reportsID) {
            return res.status(400).json({ error: '报告ID必须提供' });
        }

        const pool = await sql.connect(config);
        const request = new sql.Request(pool);

        const query = `
            SELECT pictureFileName 
            FROM WebWordReports.dbo.HousePricePicture 
            WHERE reportsID = @reportsID
        `;

        request.input('reportsID', sql.Int, parseInt(reportsID));
        const result = await request.query(query);

        res.json({
            success: true,
            images: result.recordset
        });

    } catch (error) {
        console.error('获取房价图片错误:', error);
        res.status(500).json({
            error: '获取图片失败',
            message: error.message
        });
    }
});

// 修改上传API，添加重复检查
app.post('/cyywork/api/UploadHousePricePicture',
    uploadUploadHousePricePicture.array('images'),
    async (req, res) => {
        try {
            const { reportsID, location } = req.body;

            // 验证必填字段
            if (!reportsID) {
                // 删除已上传的文件（如果有）
                if (req.files && req.files.length > 0) {
                    req.files.forEach(file => {
                        fs.unlink(file.path, () => { });
                    });
                }
                return res.status(400).json({ error: '报告ID必须提供' });
            }

            // 验证图片
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ error: '至少上传一张图片' });
            }

            // 连接到数据库
            const pool = await sql.connect(config);

            // 获取已存在的图片文件名
            const checkRequest = new sql.Request(pool);
            const checkQuery = `
                SELECT pictureFileName 
                FROM WebWordReports.dbo.HousePricePicture 
                WHERE reportsID = @reportsID
            `;
            checkRequest.input('reportsID', sql.Int, parseInt(reportsID));
            const existingImages = await checkRequest.query(checkQuery);
            const existingFileNames = existingImages.recordset.map(img => img.pictureFileName);

            // 过滤重复文件
            const newFiles = req.files.filter(file =>
                !existingFileNames.includes(file.originalname)
            );

            // 如果有重复文件，删除它们
            const duplicateFiles = req.files.filter(file =>
                existingFileNames.includes(file.originalname)
            );

            // 删除重复的文件
            duplicateFiles.forEach(file => {
                fs.unlink(file.path, () => { });
            });

            // 如果没有新文件可上传
            if (newFiles.length === 0) {
                return res.status(400).json({
                    error: '上传失败',
                    message: '所有图片在服务器中已存在'
                });
            }

            // 插入新图片数据到HousePricePicture表
            for (let i = 0; i < newFiles.length; i++) {
                const file = newFiles[i];

                const imageRequest = new sql.Request(pool);
                const imageQuery = `
                    INSERT INTO WebWordReports.dbo.HousePricePicture 
                        (pictureFileName, reportsID)
                    VALUES 
                        (@pictureFileName, @reportsID)
                `;

                imageRequest.input('pictureFileName', sql.NVarChar(100), file.originalname);
                imageRequest.input('reportsID', sql.Int, parseInt(reportsID));

                await imageRequest.query(imageQuery);
            }

            res.json({
                success: true,
                message: `成功上传 ${newFiles.length} 张图片${duplicateFiles.length > 0 ? `，跳过 ${duplicateFiles.length} 张重复图片` : ''}`,
                reportsID: reportsID,
                location: location,
                uploadedCount: newFiles.length,
                skippedCount: duplicateFiles.length,
                images: newFiles.map(file => ({
                    filename: file.originalname,
                    path: `http://121.4.22.55:80/backend/images/HousePricePictures/${reportsID}/${file.originalname}`
                }))
            });

        } catch (error) {
            // 出错时删除已上传的文件
            if (req.files && req.files.length > 0) {
                req.files.forEach(file => {
                    fs.unlink(file.path, () => { });
                });
            }

            console.error('上传房价图片错误:', error);
            res.status(500).json({
                error: '上传失败',
                message: error.message
            });
        }
    }
);
//上传房屋查询图片👆

//查看房屋照片
// 获取房价图片列表API
app.get('/api/GetHousePricePictures', async (req, res) => {
    try {
        const { reportsID } = req.query;

        if (!reportsID) {
            return res.status(400).json({
                success: false,
                error: '报告ID必须提供'
            });
        }

        // 连接到数据库
        const pool = await sql.connect(config);
        const request = new sql.Request(pool);

        // 查询该报告的所有图片
        const query = `
            SELECT pictureFileName
            FROM WebWordReports.dbo.HousePricePicture 
            WHERE reportsID = @reportsID
        `;

        request.input('reportsID', sql.Int, parseInt(reportsID));
        const result = await request.query(query);

        res.json({
            success: true,
            reportsID: parseInt(reportsID),
            images: result.recordset
        });

    } catch (error) {
        console.error('获取房价图片错误:', error);
        res.status(500).json({
            success: false,
            error: '获取图片失败',
            message: error.message
        });
    }
});

//网页报告编辑 👆 结束



//系统主题设置 👇

// 获取用户主题设置
// Socket.IO 连接处理
io.on('connection', (socket) => {
    // console.log('主题用户连接:', socket.id);

    // 用户加入自己的房间
    socket.on('join-user-room', (username) => {
        socket.join(`user-${username}`);
        // console.log(`用户 ${username} 加入房间: user-${username}`);
    });

    // 处理主题变化实时同步
    socket.on('theme-change', (data) => {
        // 广播给同一用户的其他连接
        socket.to(`user-${data.username}`).emit('theme-updated', data);
    });

    // 处理主题保存事件
    socket.on('theme-saved', (data) => {
        // 广播给同一用户的所有连接（包括自己）
        io.to(`user-${data.username}`).emit('theme-updated', data);
    });

    socket.on('disconnect', () => {
        //  console.log('用户断开连接:', socket.id);
    });
});



// 获取用户主题设置
app.get('/api/theme/:username', async (req, res) => {
    const { username } = req.params;

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('username', sql.NVarChar(100), username)
            .query('SELECT * FROM WebWordReports.dbo.SystemThemeDB WHERE username = @username');

        if (result.recordset.length > 0) {
            res.json({
                success: true,
                data: result.recordset[0],
                // backgroundAnimation: result.recordset[0].backgroundAnimation || 'WaterWave'
            });
        } else {
            // 返回默认值，包含所有新字段
            res.json({
                success: true,
                data: {
                    background: '#FFFFFFFF',
                    hoverBackground: '#cdcecfFF',
                    fontColor: '#212529FF',
                    hoverFontColor: '#000000FF',
                    borderBrush: '#000000FF',
                    hoverBorderBrush: '#000000FF',
                    watermarkForeground: '#b3b5b6FF',
                    fontFamily: 'Arial',
                    backgroundAnimation: 'WaterWave' // 添加默认值
                }
            });
        }
    } catch (error) {
        console.error('获取主题设置失败:', error);
        res.status(500).json({
            success: false,
            message: '获取主题设置失败'
        });
    }
});

// 保存用户主题设置
app.post('/api/theme', async (req, res) => {
    const {
        username,
        fontColor,
        hoverBackground,
        hoverFontColor,
        background,
        borderBrush,
        hoverBorderBrush,
        watermarkForeground,
        fontFamily,
        backgroundAnimation
    } = req.body;

    if (!username) {
        return res.status(400).json({
            success: false,
            message: '用户名不能为空'
        });
    }

    try {
        const pool = await sql.connect(config);

        // 首先检查用户是否已有主题设置
        const checkResult = await pool.request()
            .input('username', sql.NVarChar(100), username)
            .query('SELECT id FROM WebWordReports.dbo.SystemThemeDB WHERE username = @username');

        if (checkResult.recordset.length > 0) {
            // 更新现有记录
            await pool.request()
                .input('username', sql.NVarChar(100), username)
                .input('fontColor', sql.NVarChar(9), fontColor)
                .input('hoverBackground', sql.NVarChar(9), hoverBackground)
                .input('hoverFontColor', sql.NVarChar(9), hoverFontColor)
                .input('background', sql.NVarChar(9), background)
                .input('borderBrush', sql.NVarChar(9), borderBrush)
                .input('hoverBorderBrush', sql.NVarChar(9), hoverBorderBrush)
                .input('watermarkForeground', sql.NVarChar(9), watermarkForeground)
                .input('fontFamily', sql.VarChar(255), fontFamily)
                .input('backgroundAnimation', sql.VarChar(100), backgroundAnimation || 'WaterWave')
                .query(`
          UPDATE WebWordReports.dbo.SystemThemeDB 
          SET fontColor = @fontColor, 
              hoverBackground = @hoverBackground,
              hoverFontColor = @hoverFontColor,
              background = @background, 
              borderBrush = @borderBrush, 
              hoverBorderBrush = @hoverBorderBrush,
              watermarkForeground = @watermarkForeground,
              fontFamily = @fontFamily,
              backgroundAnimation = @backgroundAnimation
          WHERE username = @username
        `);
        } else {
            // 插入新记录
            await pool.request()
                .input('username', sql.NVarChar(100), username)
                .input('fontColor', sql.NVarChar(9), fontColor)
                .input('hoverBackground', sql.NVarChar(9), hoverBackground)
                .input('hoverFontColor', sql.NVarChar(9), hoverFontColor)
                .input('background', sql.NVarChar(9), background)
                .input('borderBrush', sql.NVarChar(9), borderBrush)
                .input('hoverBorderBrush', sql.NVarChar(9), hoverBorderBrush)
                .input('watermarkForeground', sql.NVarChar(9), watermarkForeground)
                .input('fontFamily', sql.VarChar(255), fontFamily)
                .input('backgroundAnimation', sql.VarChar(100), backgroundAnimation || 'WaterWave')
                .query(`
          INSERT INTO WebWordReports.dbo.SystemThemeDB 
            (username, fontColor, hoverBackground, hoverFontColor, background, borderBrush, hoverBorderBrush, watermarkForeground, fontFamily, backgroundAnimation) 
          VALUES 
            (@username, @fontColor, @hoverBackground, @hoverFontColor, @background, @borderBrush, @hoverBorderBrush, @watermarkForeground, @fontFamily, @backgroundAnimation)
        `);
        }

        // 广播主题更新
        io.to(`user-${username}`).emit('theme-updated', {
            username,
            fontColor,
            hoverBackground,
            hoverFontColor,
            background,
            borderBrush: borderBrush || '#000000FF',
            hoverBorderBrush: hoverBorderBrush || '#000000FF',
            watermarkForeground: watermarkForeground || '#b3b5b6FF',
            fontFamily: fontFamily || 'Arial',
            backgroundAnimation: backgroundAnimation || 'WaterWave'
        });

        res.json({
            success: true,
            message: '主题设置保存成功'
        });
    } catch (error) {
        console.error('保存主题设置失败:', error);
        res.status(500).json({
            success: false,
            message: '保存主题设置失败'
        });
    }
});

// 添加 express.urlencoded 中间件来解析表单数据
app.use(express.urlencoded({ extended: true }));

// 配置 SystemTheme 专用的 multer
// 修改 systemThemeStorage 配置
const systemThemeStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        // 从查询参数或 headers 中获取用户名，而不是从 req.body
        const username = req.query.username || req.headers['x-username'];

        if (!username) {
            return cb(new Error('用户名不能为空'), null);
        }

        const userDir = path.join(__dirname, './images/SystemThemesettings', username);

        // 确保用户目录存在
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir, { recursive: true });
        }

        cb(null, userDir);
    },
    filename: function (req, file, cb) {
        cb(null, 'CustomBackground.jpg');
    }
});

const systemThemeUpload = multer({
    storage: systemThemeStorage,
    fileFilter: function (req, file, cb) {
        // 只允许图片文件
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('只支持图片文件'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 限制5MB
    }
});

// 修改上传接口，先解析表单数据再处理文件上传
app.post('/api/theme/upload-background',
    // 先解析表单数据
    (req, res, next) => {
        express.urlencoded({ extended: true })(req, res, () => {
            next();
        });
    },
    // 然后处理文件上传
    systemThemeUpload.single('backgroundImage'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: '没有上传文件'
                });
            }

            const username = req.body.username;
            if (!username) {
                // 删除已上传的文件
                if (req.file.path && fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(400).json({
                    success: false,
                    message: '用户名不能为空'
                });
            }
            // 广播图片更新事件给所有连接的客户端
            io.emit('background-image-updated', {
                username: username,
                timestamp: Date.now()
            });
            res.json({
                success: true,
                message: '背景图片上传成功',
                filePath: `/images/SystemThemesettings/${username}/CustomBackground.jpg`
            });



        } catch (error) {
            console.error('上传背景图片失败:', error);
            // 删除已上传的文件
            if (req.file && req.file.path && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({
                success: false,
                message: '上传背景图片失败'
            });
        }
    }
);
//系统主题设置 👆




//新的衣柜//reactdemo测试用的 👇

// 添加服装数据的API
app.post('/api/Reactwardrobe/add', async (req, res) => {
    try {
        const { username, email, season, category, sub_category, item_name } = req.body;

        // 验证必填字段
        if (!username || !email) {
            return res.status(400).json({
                success: false,
                error: '用户信息不能为空'
            });
        }

        // 获取当前时间戳（格式：YYYYMMDDHHmm）
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const timestamp = `${year}${month}${day}${hours}${minutes}`;

        // 获取类别前缀
        const prefix = getReactCategoryPrefix(category);
        const item_code = `${prefix}${timestamp}`;

        // 插入新记录
        const request = pool.request();
        const result = await request
            .input('username', sql.NVarChar, username)
            .input('email', sql.NVarChar, email)
            .input('season', sql.NVarChar, season)
            .input('category', sql.NVarChar, category)
            .input('sub_category', sql.NVarChar, sub_category)
            .input('item_name', sql.NVarChar, item_name)
            .input('item_code', sql.NVarChar, item_code)
            .query(`
                INSERT INTO reactDemoApp.dbo.ReactDemoWardrobeStewardData 
                (username, email, season, category, sub_category, item_name, item_code, created_at, updated_at)
                VALUES 
                (@username, @email, @season, @category, @sub_category, @item_name, @item_code, GETDATE(), GETDATE())
            `);

        res.status(201).json({ success: true, item_code });
    } catch (error) {
        console.error('添加服装失败:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});


// 修改multer存储配置，按用户名分类存储图片，支持PNG和JPG
const ReactstorageUpdateWardrobeSteward = multer.diskStorage({
    destination: function (req, file, cb) {
        const username = req.body.username;
        const category = req.body.category;
        const userDir = path.join(__dirname, 'images', 'ReactWardrobeStewar', username, category);

        // 确保目录存在
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir, { recursive: true });
        }

        cb(null, userDir);
    },
    filename: function (req, file, cb) {
        const itemCode = req.body.item_code;
        const suffix = file.fieldname === 'item_image' ? '' : 'effect';
        const fileExtension = file.mimetype === 'image/jpeg' ? '.jpg' : '.png';
        cb(null, `${itemCode}${suffix}${fileExtension}`);
    }
});

const ReactuploadUpdateWardrobeSteward = multer({
    storage: ReactstorageUpdateWardrobeSteward,
    fileFilter: function (req, file, cb) {
        // 允许PNG和JPG格式
        if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg') {
            cb(null, true);
        } else {
            cb(new Error('只允许上传PNG或JPG格式的图片'));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 限制文件大小为5MB
    }
});

// 上传图片的API
app.post('/api/Reactwardrobe/upload-images', ReactuploadUpdateWardrobeSteward.fields([
    { name: 'item_image', maxCount: 1 },
    { name: 'effect_image', maxCount: 1 }
]), (req, res) => {
    try {
        if (!req.files || !req.files.item_image || !req.files.effect_image) {
            return res.status(400).json({ success: false, error: '请上传两张图片' });
        }

        res.status(200).json({
            success: true,
            message: '图片上传成功',
            itemImage: req.files.item_image[0].filename,
            effectImage: req.files.effect_image[0].filename
        });
    } catch (error) {
        console.error('图片上传失败:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

function getReactCategoryPrefix(category) {
    // 中文类别映射
    const categoryMap = {
        '衣服': 'y',
        '裤子': 'k',
        '连衣裙': 'l',
        '鞋子': 'x',
        '配饰': 'p'
    };

    // 如果找到中文映射，返回对应的前缀
    if (categoryMap[category]) {
        return categoryMap[category];
    }

    // 否则返回第一个字母的小写
    return category.charAt(0).toLowerCase();
}


// 获取用户衣柜物品的API
app.get('/api/Reactwardrobe/items', async (req, res) => {
    try {
        const { username } = req.query;

        if (!username) {
            return res.status(400).json({
                success: false,
                error: '用户名不能为空'
            });
        }

        const request = pool.request();
        const result = await request
            .input('username', sql.NVarChar, username)
            .query(`
                SELECT 
                    item_code,
                    username,
                    email,
                    season,
                    category,
                    sub_category,
                    item_name,
                    created_at,
                    updated_at
                FROM reactDemoApp.dbo.ReactDemoWardrobeStewardData 
                WHERE username = @username
                ORDER BY created_at DESC
            `);

        res.status(200).json({
            success: true,
            items: result.recordset
        });
    } catch (error) {
        console.error('获取衣柜数据失败:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// 静态文件服务 - 提供图片访问
app.use('/images/ReactWardrobeStewar', express.static(path.join(__dirname, 'images', 'ReactWardrobeStewar')));
//和上面的是一起的


//新的衣柜//reactdemo测试用的 👆

//新的歌曲获取 react demo  👇

//获取所有歌单
app.get('/api/getallmusics', async (req, res) => {
    // 1. 从查询参数中获取 page 和 pageSize，并提供默认值
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 20; // 默认每页20条
    const searchTerm = req.query.search || ''; // 支持分页的同时也支持搜索

    // 2. 计算 OFFSET，即需要跳过多少条记录
    const offset = (page - 1) * pageSize;

    try {
        await sql.connect(config);
        const request = new sql.Request();

        // 3. 构建带有搜索条件的 WHERE 子句
        let whereClause = '';
        if (searchTerm) {
            whereClause = `WHERE title LIKE @searchTerm OR artist LIKE @searchTerm`;
            request.input('searchTerm', sql.NVarChar, `%${searchTerm}%`);
        }

        // 4. 第一条查询：获取总记录数 (非常重要！)
        // 这条查询会告诉前端一共有多少条符合条件的音乐，以便计算总页数
        const countResult = await request.query(`SELECT COUNT(*) as totalCount FROM ChatApp.dbo.Music ${whereClause}`);
        const totalCount = countResult.recordset[0].totalCount;

        // 5. 第二条查询：使用 OFFSET 和 FETCH 获取当前页的数据
        // **ORDER BY 是分页查询能够正确工作的关键**，必须有一个确定的排序规则
        const dataResult = await request.query(`
            SELECT * 
            FROM ChatApp.dbo.Music 
            ${whereClause}
            ORDER BY id ASC  -- 或者 title, created_at 等，必须有排序
            OFFSET ${offset} ROWS
            FETCH NEXT ${pageSize} ROWS ONLY;
        `);

        // 6. 返回一个包含数据和元信息的对象
        res.json({
            totalCount: totalCount,      // 总记录数
            page: page,                  // 当前页码
            pageSize: pageSize,          // 每页大小
            totalPages: Math.ceil(totalCount / pageSize), // 总页数
            data: dataResult.recordset   // 当前页的数据
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});


//获取喜欢歌单
app.get('/backend/api/reactdemofavorites', async (req, res) => {
    try {
        const { username, page = 1, pageSize = 20, search = '' } = req.query;

        if (!username) {
            return res.status(400).json({ error: '用户名不能为空' });
        }

        await sql.connect(config);
        const offset = (page - 1) * pageSize;

        // 联合查询获取完整歌曲信息
        let query = `
            SELECT 
                f.id,
                f.user_name,
                f.song_name as title,
                f.artist,
                f.play_count,
                m.src,
                m.coverimage
            FROM ChatApp.dbo.MusicFavorites f
            LEFT JOIN ChatApp.dbo.Music m ON f.song_name = m.title AND f.artist = m.artist
            WHERE f.user_name = @username
        `;

        let countQuery = `
            SELECT COUNT(*) as total 
            FROM ChatApp.dbo.MusicFavorites f
            WHERE f.user_name = @username
        `;

        // 添加搜索条件
        if (search) {
            const searchCondition = ` AND (f.song_name LIKE @search OR f.artist LIKE @search)`;
            query += searchCondition;
            countQuery += ` AND (f.song_name LIKE @search OR f.artist LIKE @search)`;
        }

        // 添加分页
        query += ` ORDER BY f.id OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`;

        // 执行查询
        const request = new sql.Request();
        request.input('username', sql.VarChar, username);
        request.input('offset', sql.Int, offset);
        request.input('pageSize', sql.Int, parseInt(pageSize));

        if (search) {
            request.input('search', sql.VarChar, `%${search}%`);
        }

        // 获取总数
        const countResult = await request.query(countQuery);
        const total = countResult.recordset[0].total;

        // 获取分页数据
        const result = await request.query(query);

        const totalPages = Math.ceil(total / pageSize);

        console.log(`找到 ${result.recordset.length} 条收藏记录，总计: ${total}，总页数: ${totalPages}`);

        res.json({
            data: result.recordset,
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            total,
            totalPages
        });

    } catch (err) {
        console.error('获取收藏列表错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

//reactdemo最近播放音乐
// 后端 API 接口 - 获取最近播放音乐 demoreact获取用户最近播放歌曲
//demoreact获取用户最近播放歌曲
app.get('/api/reactdemoRecentlyPlayedmusic', async (req, res) => {
    try {
        const { email, page = 1, pageSize = 20, search = '' } = req.query;

        if (!email) {
            return res.status(400).json({ error: '邮箱不能为空' });
        }

        await sql.connect(config);
        const offset = (page - 1) * pageSize;

        let query = `
            SELECT 
                id,
                email,
                title,
                artist,
                coverimage,
                src,
                genre,
                playtime
            FROM ChatApp.dbo.RecentlyPlayedMusic 
            WHERE email = @email
        `;

        let countQuery = `
            SELECT COUNT(*) as total 
            FROM ChatApp.dbo.RecentlyPlayedMusic 
            WHERE email = @email
        `;

        // 添加搜索条件
        if (search) {
            const searchCondition = ` AND (title LIKE @search OR artist LIKE @search OR genre LIKE @search)`;
            query += searchCondition;
            countQuery += searchCondition;
        }

        // 按播放时间倒序排列，最新的在前面
        query += ` ORDER BY playtime DESC OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`;

        // 执行查询
        const request = new sql.Request();
        request.input('email', sql.NVarChar, email);
        request.input('offset', sql.Int, offset);
        request.input('pageSize', sql.Int, parseInt(pageSize));

        if (search) {
            request.input('search', sql.NVarChar, `%${search}%`);
        }

        // 获取总数
        const countResult = await request.query(countQuery);
        const total = countResult.recordset[0].total;

        // 获取分页数据
        const result = await request.query(query);

        const totalPages = Math.ceil(total / pageSize);

        console.log(`找到 ${result.recordset.length} 条最近播放记录，总计: ${total}，总页数: ${totalPages}`);

        res.json({
            data: result.recordset,
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            total,
            totalPages
        });

    } catch (err) {
        console.error('获取最近播放列表错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});
 

//获取推荐音乐
// 后端 API 接口 - 获取推荐音乐 这是所有的歌曲推荐
app.get('/api/reactdemorecommend', async (req, res) => {
    try {
        const { category = 'ranking', page = 1, pageSize = 20, search = '' } = req.query;

        await sql.connect(config);
        const offset = (page - 1) * pageSize;

        let baseQuery = '';
        let countQuery = '';
        let orderBy = '';

        switch (category) {
            case 'ranking':
                baseQuery = `
                    SELECT 
                        id, title, artist, coverimage, src, genre, playcount,
                        ROW_NUMBER() OVER (ORDER BY playcount DESC) as rank
                    FROM ChatApp.dbo.Music 
                    WHERE playcount > 0 
                `;
                countQuery = `SELECT COUNT(*) as total FROM ChatApp.dbo.Music WHERE playcount > 0`;
                orderBy = 'ORDER BY playcount DESC';
                break;

            case 'chinese':
                baseQuery = `
                    SELECT 
                        id, title, artist, coverimage, src, genre, playcount
                    FROM ChatApp.dbo.Music 
                    WHERE genre IN ('华语', '中文', '国语', '粤语')
                `;
                countQuery = `SELECT COUNT(*) as total FROM ChatApp.dbo.Music WHERE genre IN ('华语', '中文', '国语', '粤语')`;
                orderBy = 'ORDER BY NEWID()';
                break;

            case 'western':
                baseQuery = `
                    SELECT 
                        id, title, artist, coverimage, src, genre, playcount
                    FROM ChatApp.dbo.Music 
                    WHERE genre IN ('欧美', '英文', '美国', '欧洲', '西方')
                `;
                countQuery = `SELECT COUNT(*) as total FROM ChatApp.dbo.Music WHERE genre IN ('欧美', '英文', '美国', '欧洲', '西方')`;
                orderBy = 'ORDER BY NEWID()';
                break;

            case 'japaneseKorean':
                baseQuery = `
                    SELECT 
                        id, title, artist, coverimage, src, genre, playcount
                    FROM ChatApp.dbo.Music 
                    WHERE genre IN ('日韩', '日语', '韩语', '日本', '韩国', 'K-POP', 'J-POP')
                `;
                countQuery = `SELECT COUNT(*) as total FROM ChatApp.dbo.Music WHERE genre IN ('日韩', '日语', '韩语', '日本', '韩国', 'K-POP', 'J-POP')`;
                orderBy = 'ORDER BY NEWID()';
                break;

            case 'other':
                baseQuery = `
                    SELECT 
                        id, title, artist, coverimage, src, genre, playcount
                    FROM ChatApp.dbo.Music 
                    WHERE (genre NOT IN ('华语', '中文', '国语', '粤语', '欧美', '英文', '美国', '欧洲', '西方', '日韩', '日语', '韩语', '日本', '韩国', 'K-POP', 'J-POP') OR genre IS NULL)
                `;
                countQuery = `SELECT COUNT(*) as total FROM ChatApp.dbo.Music WHERE (genre NOT IN ('华语', '中文', '国语', '粤语', '欧美', '英文', '美国', '欧洲', '西方', '日韩', '日语', '韩语', '日本', '韩国', 'K-POP', 'J-POP') OR genre IS NULL)`;
                orderBy = 'ORDER BY NEWID()';
                break;

            default:
                return res.status(400).json({ error: '无效的分类' });
        }

        // 添加搜索条件
        if (search) {
            const searchCondition = ` AND (title LIKE @search OR artist LIKE @search OR genre LIKE @search)`;
            baseQuery += searchCondition;
            countQuery += searchCondition;
        }

        // 获取总数
        const countRequest = new sql.Request();
        if (search) {
            countRequest.input('search', sql.VarChar, `%${search}%`);
        }
        const countResult = await countRequest.query(countQuery);
        const total = countResult.recordset[0].total;

        // 获取数据
        const dataQuery = `
            SELECT *,
                CASE 
                    WHEN coverimage IS NOT NULL AND coverimage != '' 
                    THEN CONCAT('http://121.4.22.55:80/backend/musics/', coverimage)
                    ELSE 'http://121.4.22.55:80/backend/musics/default.jpg'
                END as coverimage_url,
                CONCAT('http://121.4.22.55:80/backend/musics/', src) as src_url
            FROM (${baseQuery}) as filtered
            ${orderBy}
            OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
        `;

        const dataRequest = new sql.Request();
        dataRequest.input('offset', sql.Int, offset);
        dataRequest.input('pageSize', sql.Int, parseInt(pageSize));

        if (search) {
            dataRequest.input('search', sql.VarChar, `%${search}%`);
        }

        const result = await dataRequest.query(dataQuery);

        // 处理返回数据，确保字段完整
        const processedData = result.recordset.map(song => ({
            id: song.id,
            title: song.title,
            artist: song.artist,
            genre: song.genre,
            src: song.src_url, // 使用完整的 URL
            coverimage: song.coverimage_url, // 使用完整的 URL
            playcount: song.playcount || 0,
            rank: song.rank,
            duration: 0, // 如果需要可以添加时长字段
            liked: false // 默认未喜欢
        }));

        const totalPages = Math.ceil(total / pageSize);

        res.json({
            data: processedData,
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            total,
            totalPages,
            category
        });

    } catch (err) {
        console.error('获取推荐音乐错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 添加最近播放记录
app.post('/api/reactdemoRecentlyPlayedmusic', async (req, res) => {
    try {
        const { email, title, artist, coverimage, src, genre } = req.body;

        // 验证必填字段
        if (!email || !title || !artist || !src) {
            return res.status(400).json({ 
                error: '邮箱、标题、艺术家和音乐源路径为必填字段' 
            });
        }

        await sql.connect(config);

        // 先检查是否已有相同记录（同一用户同一歌曲）
        const checkQuery = `
            SELECT id FROM ChatApp.dbo.RecentlyPlayedMusic 
            WHERE email = @email AND title = @title AND artist = @artist
        `;
        
        const checkRequest = new sql.Request();
        checkRequest.input('email', sql.NVarChar, email);
        checkRequest.input('title', sql.NVarChar, title);
        checkRequest.input('artist', sql.NVarChar, artist);
        
        const existingRecord = await checkRequest.query(checkQuery);

        if (existingRecord.recordset.length > 0) {
            // 如果已存在，先删除旧的记录
            const deleteQuery = `
                DELETE FROM ChatApp.dbo.RecentlyPlayedMusic 
                WHERE email = @email AND title = @title AND artist = @artist
            `;
            await checkRequest.query(deleteQuery);
            console.log('删除旧的播放记录:', { email, title, artist });
        }

        // 检查当前用户的记录数量（包括刚刚删除的那条）
        const countQuery = `
            SELECT COUNT(*) as recordCount 
            FROM ChatApp.dbo.RecentlyPlayedMusic 
            WHERE email = @email
        `;
        
        const countRequest = new sql.Request();
        countRequest.input('email', sql.NVarChar, email);
        const countResult = await countRequest.query(countQuery);
        const recordCount = countResult.recordset[0].recordCount;
        
        // 如果记录数量达到或超过100条，删除最早的一条记录
        if (recordCount >= 100) {
            const deleteOldestQuery = `
                DELETE FROM ChatApp.dbo.RecentlyPlayedMusic 
                WHERE id IN (
                    SELECT TOP 1 id 
                    FROM ChatApp.dbo.RecentlyPlayedMusic 
                    WHERE email = @email 
                    ORDER BY playtime ASC, id ASC
                )
            `;
            
            const deleteRequest = new sql.Request();
            deleteRequest.input('email', sql.NVarChar, email);
            await deleteRequest.query(deleteOldestQuery);
            console.log('删除最早的一条记录，邮箱:', email);
        }
        
        // 插入新记录（无论是否已存在，都重新插入）
        const insertQuery = `
            INSERT INTO ChatApp.dbo.RecentlyPlayedMusic 
            (email, title, artist, coverimage, src, genre, playtime)
            VALUES (@email, @title, @artist, @coverimage, @src, @genre, GETDATE())
        `;
        
        const insertRequest = new sql.Request();
        insertRequest.input('email', sql.NVarChar, email);
        insertRequest.input('title', sql.NVarChar, title);
        insertRequest.input('artist', sql.NVarChar, artist);
        insertRequest.input('coverimage', sql.NVarChar, coverimage || '');
        insertRequest.input('src', sql.NVarChar, src);
        insertRequest.input('genre', sql.NVarChar, genre || '');
        
        await insertRequest.query(insertQuery);
        console.log('新增最近播放记录:', { email, title, artist });
        
        res.json({ 
            success: true, 
            message: existingRecord.recordset.length > 0 ? '更新记录成功' : '添加记录成功',
            action: existingRecord.recordset.length > 0 ? 'updated' : 'added'
        });

    } catch (err) {
        console.error('添加最近播放记录错误:', err);
        res.status(500).json({ 
            success: false,
            error: '服务器错误' 
        });
    }
});

//用户播放当前音乐音乐的时候将当前音乐的播放量增加+1
// 增加歌曲播放量 API
app.post('/api/reactdemoIncreasePlayCount', async (req, res) => {
    try {
        const { title, artist } = req.body;

        // 验证必填字段
        if (!title || !artist) {
            return res.status(400).json({ 
                error: '标题和艺术家为必填字段' 
            });
        }

        await sql.connect(config);

        // 检查歌曲是否存在
        const checkQuery = `
            SELECT id FROM ChatApp.dbo.Music 
            WHERE title = @title AND artist = @artist
        `;
        
        const checkRequest = new sql.Request();
        checkRequest.input('title', sql.NVarChar, title);
        checkRequest.input('artist', sql.NVarChar, artist);
        
        const existingRecord = await checkRequest.query(checkQuery);

        if (existingRecord.recordset.length > 0) {
            // 如果歌曲存在，只更新 playcount 和 updatetime 字段
            const updateQuery = `
                UPDATE ChatApp.dbo.Music 
                SET playcount = COALESCE(playcount, 0) + 1, 
                    updatetime = GETDATE()
                WHERE title = @title AND artist = @artist
            `;
            
            const updateRequest = new sql.Request();
            updateRequest.input('title', sql.NVarChar, title);
            updateRequest.input('artist', sql.NVarChar, artist);
            
            await updateRequest.query(updateQuery);

            // 获取更新后的播放量（可选，用于日志记录）
            const getCountQuery = `
                SELECT playcount FROM ChatApp.dbo.Music 
                WHERE title = @title AND artist = @artist
            `;
            const countResult = await updateRequest.query(getCountQuery);
            const newPlayCount = countResult.recordset[0].playcount;
            
            console.log('更新播放量成功:', { title, artist, newPlayCount });
            
            res.json({ 
                success: true, 
                message: '播放量更新成功',
                playcount: newPlayCount
            });
        } else {
            // 如果歌曲不存在，不创建新记录，直接返回成功但跳过计数
            console.log('歌曲不存在，跳过播放量统计:', { title, artist });
            
            res.json({ 
                success: true, 
                message: '歌曲不存在，跳过播放量统计',
                playcount: 0,
                skipped: true
            });
        }

    } catch (err) {
        console.error('更新播放量错误:', err);
        res.status(500).json({ 
            success: false,
            error: '服务器错误' 
        });
    }
});
//新的歌曲获取 react demo   👆

 
//reactdemo 歌曲评论 api👇
// 获取某首歌曲的所有评论，使用北京时间
app.get('/api/ReactDemomusic-comments', async (req, res) => {
    const { music_id } = req.query;

    if (!music_id) {
        return res.status(400).json({ error: 'music_id is required' });
    }

    try {
        await sql.connect(config);
        const result = await sql.query`
            SELECT 
                comment_id, 
                music_id,
                music_title,
                music_artist,
                user_name, 
                comment_text, 
                -- 转换为北京时间 (UTC+8)
                DATEADD(HOUR, 8, created_at) as created_at
            FROM ChatApp.dbo.MusicComments 
            WHERE music_id = ${music_id}
            ORDER BY created_at DESC
        `;
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching comments:', err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        sql.close();
    }
});

// 提交新评论 
app.post('/api/ReactDemomusiccomments', async (req, res) => {
    console.log('Received comment data:', req.body);
    const { music_id, music_title, music_artist, user_name, comment_text } = req.body;

    // 添加更严格的验证
    if (!music_id || isNaN(music_id)) {
        return res.status(400).json({ error: 'Valid music_id is required' });
    }
    if (!music_title || !music_artist || !user_name || !comment_text) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        await sql.connect(config);
        const result = await sql.query`
            INSERT INTO ChatApp.dbo.MusicComments 
            (music_id, music_title, music_artist, user_name, comment_text)
            VALUES 
            (${Number(music_id)}, ${music_title}, ${music_artist}, ${user_name}, ${comment_text})
        `;

        io.emit('new-comment', { music_id: Number(music_id) });
        res.json({ success: true });
    } catch (err) {
        console.error('Error submitting comment:', err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        sql.close();
    }
});

// 更新评论
app.put('/api/ReactDemomusiccomments/update', async (req, res) => {
    console.log('Received update comment data:', req.body);
    const { comment_id, comment_text, user_name } = req.body;

    if (!comment_id || !comment_text || !user_name) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        await sql.connect(config);
        // 验证用户是否有权限修改这条评论
        const checkResult = await sql.query`
            SELECT user_name FROM ChatApp.dbo.MusicComments 
            WHERE comment_id = ${comment_id}
        `;

        if (checkResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (checkResult.recordset[0].user_name !== user_name) {
            return res.status(403).json({ error: 'No permission to update this comment' });
        }

        // 更新评论
        const updateResult = await sql.query`
            UPDATE ChatApp.dbo.MusicComments 
            SET comment_text = ${comment_text}, updated_at = GETDATE()
            WHERE comment_id = ${comment_id}
        `;

        // 获取音乐ID用于socket通知
        const musicResult = await sql.query`
            SELECT music_id FROM ChatApp.dbo.MusicComments 
            WHERE comment_id = ${comment_id}
        `;

        if (musicResult.recordset.length > 0) {
            io.emit('comment-updated', { music_id: musicResult.recordset[0].music_id });
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Error updating comment:', err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        sql.close();
    }
});

// 删除评论
app.delete('/api/ReactDemomusiccomments/delete', async (req, res) => {
    console.log('Received delete comment data:', req.body);
    const { comment_id, user_name } = req.body;

    if (!comment_id || !user_name) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        await sql.connect(config);
        // 验证用户是否有权限删除这条评论
        const checkResult = await sql.query`
            SELECT user_name, music_id FROM ChatApp.dbo.MusicComments 
            WHERE comment_id = ${comment_id}
        `;

        if (checkResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (checkResult.recordset[0].user_name !== user_name) {
            return res.status(403).json({ error: 'No permission to delete this comment' });
        }

        const music_id = checkResult.recordset[0].music_id;

        // 删除评论
        const deleteResult = await sql.query`
            DELETE FROM ChatApp.dbo.MusicComments 
            WHERE comment_id = ${comment_id}
        `;

        io.emit('comment-updated', { music_id: music_id });
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting comment:', err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        sql.close();
    }
});

// 获取某首歌曲的评论数量
app.get('/api/ReactDemomusic-comments/count', async (req, res) => {
    const { music_id } = req.query;

    if (!music_id) {
        return res.status(400).json({ error: 'music_id is required' });
    }

    try {
        await sql.connect(config);
        const result = await sql.query`
            SELECT COUNT(*) as count 
            FROM ChatApp.dbo.MusicComments 
            WHERE music_id = ${music_id}
        `;
        res.json({ count: result.recordset[0].count });
    } catch (err) {
        console.error('Error fetching comment count:', err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        sql.close();
    }
});
//reactdemo 歌曲评论 👆


//reactdemo 登录注册 👇
// 注册接口
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;

    console.log('注册请求:', { username, email, password });

    try {
        await poolConnect;

        const existingUser = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT id FROM reactDemoApp.dbo.userAccounts WHERE email = @email');

        if (existingUser.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                message: '该邮箱已被注册'
            });
        }

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
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

            // 为用户创建默认主题设置
            await transaction.request()

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
                        email, theme_name,
                        background_color, secondary_background_color, hover_background_color, focus_background_color,
                        font_color, secondary_font_color, hover_font_color, focus_font_color, watermark_font_color, font_family,
                        border_color, secondary_border_color, hover_border_color, focus_border_color,
                        shadow_color, hover_shadow_color, focus_shadow_color, is_active
                    ) 
                    VALUES (
                         @email, @theme_name,
                        @background_color, @secondary_background_color, @hover_background_color, @focus_background_color,
                        @font_color, @secondary_font_color, @hover_font_color, @focus_font_color, @watermark_font_color, @font_family,
                        @border_color, @secondary_border_color, @hover_border_color, @focus_border_color,
                        @shadow_color, @hover_shadow_color, @focus_shadow_color, 1
                    )
                `);

            await transaction.commit();

            console.log(`用户 ${username} 注册成功，并创建了默认主题`);

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
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    console.log('登录请求:', { email, password });

    try {
        await poolConnect;

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

        if (user.is_locked) {
            return res.status(401).json({
                success: false,
                message: '账户已被锁定，请联系管理员'
            });
        }

        if (password !== user.password) {
            return res.status(401).json({
                success: false,
                message: '密码错误'
            });
        }

        await pool.request()
            .input('id', sql.Int, user.id)
            .query('UPDATE reactDemoApp.dbo.userAccounts SET last_login_time = GETDATE() WHERE id = @id');

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
            token: `jwt-token-${user.id}-${Date.now()}`
        });

    } catch (err) {
        console.error('登录错误:', err);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});
//reactdemo 登录注册 👆

//reactdemo 主题管理 👇
// ==================== 主题设置相关API ====================

 
// 假设你的 express app 和数据库连接池 (poolConnect, pool) 已经设置好
  

// 2. 获取用户所有主题
app.get('/api/UserThemeSettings', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ success: false, message: '邮箱参数不能为空' });

        await poolConnect;
        const request = pool.request().input('email', sql.NVarChar, email);

        const result = await request.query(`
            SELECT * FROM reactDemoApp.dbo.UserThemeSettings 
            WHERE email = @email 
            ORDER BY is_active DESC, id DESC
        `);
        
        res.json({ success: true, themes: result.recordset });
    } catch (error) {
        console.error('获取用户主题失败:', error);
        res.status(500).json({ success: false, message: '服务器错误: 获取主题失败' });
    }
});

// 3. 创建新主题
app.post('/api/UserThemeSettings', async (req, res) => {
  try {
    const { email, theme_name, is_active, background_animation, ...themeColors } = req.body;
    
    // 验证必需字段
    if (!email || !theme_name) {
      return res.status(400).json({ success: false, message: '邮箱和主题名称不能为空' });
    }

    // 验证主题名称长度（假设数据库中是 NVARCHAR(100)）
    if (theme_name.length > 100) {
      return res.status(400).json({ success: false, message: '主题名称过长' });
    }

    await poolConnect;
    const request = pool.request();
    
    // 处理必需字段
    request.input('email', sql.NVarChar(255), email.substring(0, 255)); // 限制长度
    request.input('theme_name', sql.NVarChar(100), theme_name.substring(0, 100));
    request.input('is_active', sql.Bit, is_active || false);
    request.input('background_animation', sql.NVarChar(50), (background_animation || 'WaterWave').substring(0, 50));
    
    const columns = ['email', 'theme_name', 'is_active', 'background_animation'];
    const values = ['@email', '@theme_name', '@is_active', '@background_animation'];

    // 处理颜色字段 - 限制长度为9（#RRGGBBAA）
    const colorFields = [
      'background_color', 'secondary_background_color', 'hover_background_color', 'focus_background_color',
      'font_color', 'secondary_font_color', 'hover_font_color', 'focus_font_color', 'watermark_font_color',
      'border_color', 'secondary_border_color', 'hover_border_color', 'focus_border_color',
      'shadow_color', 'hover_shadow_color', 'focus_shadow_color'
    ];

    for(const key of colorFields) {
      if (themeColors[key] !== undefined) {
        columns.push(key);
        values.push(`@${key}`);
        // 限制颜色值为最大9个字符 (#RRGGBBAA)
        const colorValue = String(themeColors[key] || '#ffffff').substring(0, 9);
        request.input(key, sql.NVarChar(9), colorValue);
      }
    }

    // 处理字体家族字段
    if (themeColors.font_family !== undefined) {
      columns.push('font_family');
      values.push('@font_family');
      request.input('font_family', sql.NVarChar(200), String(themeColors.font_family || '').substring(0, 200));
    }

    const result = await request.query(`
      INSERT INTO reactDemoApp.dbo.UserThemeSettings (${columns.join(', ')}) 
      OUTPUT INSERTED.*
      VALUES (${values.join(', ')});
    `);

    res.status(201).json({ success: true, theme: result.recordset[0], message: '主题创建成功' });
  } catch (error) {
    console.error('创建主题失败:', error);
    res.status(500).json({ success: false, message: '服务器错误: 创建主题失败' });
  }
});

// 4. 更新主题
app.put('/api/UserThemeSettings/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { email, ...updateData } = req.body;
        if (!email) return res.status(400).json({ success: false, message: '邮箱不能为空' });

        await poolConnect;
        const request = pool.request();
        request.input('id', sql.Int, id).input('email', sql.NVarChar, email);

        const setClauses = [];
        for (const [key, value] of Object.entries(updateData)) {
            setClauses.push(`${key} = @${key}`);
            request.input(key, sql.NVarChar, value);
        }

        if (setClauses.length === 0) return res.status(400).json({ success: false, message: '没有要更新的字段' });

        const result = await request.query(`
            UPDATE reactDemoApp.dbo.UserThemeSettings 
            SET ${setClauses.join(', ')} 
            OUTPUT INSERTED.*
            WHERE id = @id AND email = @email;
        `);

        if (result.recordset.length === 0) return res.status(404).json({ success: false, message: '主题不存在或不属于该用户' });

        res.json({ success: true, theme: result.recordset[0], message: '主题更新成功' });
    } catch (error) {
        console.error('更新主题失败:', error);
        res.status(500).json({ success: false, message: '服务器错误: 更新主题失败' });
    }
});

// 5. 设置活动主题
app.put('/api/UserThemeSettings/setActive/:id', async (req, res) => {
    const { id } = req.params;
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: '邮箱不能为空' });

    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        
        await transaction.request()
            .input('email', sql.NVarChar, email)
            .query('UPDATE reactDemoApp.dbo.UserThemeSettings SET is_active = 0 WHERE email = @email');

        const result = await transaction.request()
            .input('id', sql.Int, id)
            .input('email', sql.NVarChar, email)
            .query('UPDATE reactDemoApp.dbo.UserThemeSettings SET is_active = 1 OUTPUT INSERTED.* WHERE id = @id AND email = @email');
        
        await transaction.commit();

        if (result.recordset.length === 0) return res.status(404).json({ success: false, message: '主题不存在或不属于该用户' });
        
        res.json({ success: true, theme: result.recordset[0], message: '活动主题设置成功' });
    } catch (error) {
        await transaction.rollback();
        console.error('设置活动主题失败:', error);
        res.status(500).json({ success: false, message: '服务器错误: 设置活动主题失败' });
    }
});


// 6. 设置默认主题 (此功能在前端UI未体现，但保留API)
app.put('/api/UserThemeSettings/setDefault/:id', async (req, res) => {
    // ... 逻辑与 setActive 类似，更新 is_default 字段
});


// 7. 删除主题
app.delete('/api/UserThemeSettings/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { email } = req.body; // 从请求体获取email以验证所有权
        if (!email) return res.status(400).json({ success: false, message: '缺少Email以验证所有权' });

        await poolConnect;
        const request = pool.request()
            .input('id', sql.Int, id)
            .input('email', sql.NVarChar, email);

        const result = await request.query('DELETE FROM reactDemoApp.dbo.UserThemeSettings WHERE id = @id AND email = @email');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ success: false, message: '主题不存在或不属于该用户' });
        }

        // 删除关联的图片文件夹
        const imageDir = path.join(__dirname, 'images', 'ReactDemoUserThemeSettings', email, id.toString());
        if (fs.existsSync(imageDir)) {
            fs.rm(imageDir, { recursive: true, force: true }, (err) => {
                if (err) console.error(`删除图片目录失败: ${imageDir}`, err);
            });
        }

        res.json({ success: true, message: '主题删除成功' });
    } catch (error) {
        console.error('删除主题失败:', error);
        res.status(500).json({ success: false, message: '服务器错误: 删除主题失败' });
    }
});


// ReactDemo 主题背景图片上传配置
const reactDemoThemeStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      console.log('ReactDemo Multer 接收到的文件:', file);
      console.log('ReactDemo Multer 请求体:', req.body);
      
      // 从请求体中获取参数 - 现在应该可以获取到了
      const { email, themeId } = req.body;
      
      if (!email) {
        return cb(new Error('ReactDemo: 邮箱不能为空'));
      }
      if (!themeId) {
        return cb(new Error('ReactDemo: 主题ID不能为空'));
      }
      
      const userDir = path.join(__dirname, 'images', 'ReactDemoUserThemeSettings', email, themeId.toString());
      fs.mkdirSync(userDir, { recursive: true });
      console.log('ReactDemo 目录创建成功:', userDir);
      
      cb(null, userDir);
    } catch (error) {
      console.error('ReactDemo Multer 目录创建错误:', error);
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, 'ReactDemoCustomBackground' + ext);
  }
});

const reactDemoThemeUpload = multer({
  storage: reactDemoThemeStorage,
  fileFilter: function (req, file, cb) {
    console.log('ReactDemo 文件过滤:', file.fieldname, file.originalname);
    const allowedTypes = /jpeg|jpg|png|webp/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('ReactDemo: 只允许上传PNG, JPG或WEBP格式的图片'));
  },
  limits: { 
    fileSize: 5 * 1024 * 1024
  }
});

// ReactDemo 上传背景图片 - 使用 busboy 手动解析
app.post('/api/react-demo/upload-background', (req, res) => {
  // 手动解析 multipart/form-data
  const busboy = require('busboy');
  const bb = busboy({ headers: req.headers });
  
  const fields = {};
  let fileBuffer = null;
  let fileName = null;
  let fileMimetype = null;

  bb.on('field', (name, val) => {
    console.log(`ReactDemo 解析字段: ${name} = ${val}`);
    fields[name] = val;
  });

  bb.on('file', (name, file, info) => {
    const { filename, encoding, mimeType } = info;
    console.log(`ReactDemo 解析文件: ${name} = ${filename}`);
    
    fileName = filename;
    fileMimetype = mimeType;
    
    const chunks = [];
    file.on('data', (chunk) => {
      chunks.push(chunk);
    });
    
    file.on('end', () => {
      fileBuffer = Buffer.concat(chunks);
    });
  });

  bb.on('close', async () => {
    try {
      console.log('ReactDemo 解析完成:', { fields, fileName, fileBuffer: fileBuffer ? fileBuffer.length + ' bytes' : 'null' });

      // 验证必需参数
      const { email, themeId } = fields;
      if (!email || !themeId) {
        return res.status(400).json({ 
          success: false, 
          message: 'ReactDemo: 缺少email或themeId参数' 
        });
      }

      if (!fileBuffer) {
        return res.status(400).json({ 
          success: false, 
          message: 'ReactDemo: 没有上传文件' 
        });
      }

      // 创建目录
      const userDir = path.join(__dirname, 'images', 'ReactDemoUserThemeSettings', email, themeId.toString());
      fs.mkdirSync(userDir, { recursive: true });
      
      // 保存文件
      const fileExt = path.extname(fileName) || '.jpg';
      const savedFileName = 'CustomBackground' + fileExt;
      const filePath = path.join(userDir, savedFileName);
      
      fs.writeFileSync(filePath, fileBuffer);
      console.log('ReactDemo 文件保存成功:', filePath);

      // 更新数据库
      await poolConnect;
      const request = pool.request();
      await request
        .input('id', sql.Int, themeId)
        .input('email', sql.NVarChar, email)
        .input('background_animation', sql.NVarChar, 'CustomBackground')
        .query(`UPDATE reactDemoApp.dbo.UserThemeSettings 
                SET background_animation = @background_animation 
                WHERE id = @id AND email = @email`);

      res.json({
        success: true,
        message: 'ReactDemo: 背景图片上传并关联成功',
        filePath: filePath,
        fileName: savedFileName
      });

    } catch (error) {
      console.error('ReactDemo: 处理上传失败:', error);
      res.status(500).json({ 
        success: false, 
        message: 'ReactDemo: 处理上传失败: ' + error.message 
      });
    }
  });

  bb.on('error', (err) => {
    console.error('ReactDemo: 解析表单数据失败:', err);
    res.status(400).json({ 
      success: false, 
      message: 'ReactDemo: 解析表单数据失败: ' + err.message 
    });
  });

  req.pipe(bb);
});

// ReactDemo 获取背景图片
app.get('/api/react-demo/background-image/:email/:themeId', (req, res) => {
  try {
    const { email, themeId } = req.params;
    const imageDir = path.join(__dirname, 'images', 'ReactDemoUserThemeSettings', email, themeId);

    console.log('ReactDemo 查找背景图片:', imageDir);

    if (fs.existsSync(imageDir)) {
      const files = fs.readdirSync(imageDir);
      console.log('ReactDemo 目录中的文件:', files);
      
      // 查找以 CustomBackground 开头的文件
      const backgroundFile = files.find(f => f.startsWith('CustomBackground'));
      if (backgroundFile) {
        const imagePath = path.join(imageDir, backgroundFile);
        console.log('ReactDemo 找到背景图片:', imagePath);
        
        // 设置正确的 Content-Type
        const ext = path.extname(backgroundFile).toLowerCase();
        const contentType = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.webp': 'image/webp'
        }[ext] || 'image/jpeg';
        
        res.setHeader('Content-Type', contentType);
        return res.sendFile(imagePath);
      }
    }
    
    console.log('ReactDemo 未找到背景图片，返回透明像素');
    // 如果找不到图片，发送透明像素
    res.setHeader('Content-Type', 'image/png');
    const transparentPixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    res.send(transparentPixel);

  } catch (error) {
    console.error('ReactDemo: 获取背景图片失败:', error);
    res.status(500).json({ success: false, message: 'ReactDemo: 获取背景图片失败' });
  }
});
//reactdemo 主题管理 👆


// 启动服务器
// app.listen(port, () => {
//     console.log(`Server is running on http://localhost:${port}`);
// });
// 启动服务器
http.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

// 监听 Socket.IO 连接 实时更新
io.on('connection', (socket) => {
    // console.log('A user connected');

    // 监听客户端加入房间事件
    socket.on('join-room', (room_id) => {
        socket.join(`room-${room_id}`);
    });

    socket.on('disconnect', () => {
        // console.log('A user disconnected');
    });

});
