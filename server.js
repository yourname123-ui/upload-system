const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 静态文件服务 - 指向 public 文件夹
app.use(express.static(path.join(__dirname, 'public')));

// ============ 数据存储 ============
// Vercel 使用 /tmp 目录
const DATA_DIR = '/tmp';
const DATA_FILE = path.join(DATA_DIR, 'records.json');

function readRecords() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        }
    } catch (err) {
        console.error('读取失败:', err.message);
    }
    return [];
}

function writeRecords(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('写入失败:', err.message);
    }
}

// 初始化
if (!fs.existsSync(DATA_FILE)) {
    writeRecords([]);
}

// ============ 上传配置 ============
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
});

// ============ 路由 ============

// 1. 上传
app.post('/api/upload', upload.single('qrImage'), (req, res) => {
    try {
        const { shareCode } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: '请上传二维码图片' });
        }
        if (!shareCode || !shareCode.trim()) {
            return res.status(400).json({ error: '请输入充值口令' });
        }

        const base64 = file.buffer.toString('base64');
        const imageData = `data:${file.mimetype};base64,${base64}`;

        const records = readRecords();
        const newRecord = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            shareCode: shareCode.trim(),
            qrImage: imageData,
            fileName: file.originalname,
            fileSize: file.size,
            ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '未知',
            createdAt: new Date().toLocaleString('zh-CN'),
            type: 'recharge'
        };
        records.push(newRecord);
        writeRecords(records);

        res.json({ success: true, message: '提交成功！', data: newRecord });
    } catch (err) {
        console.error('上传错误:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 2. 获取记录
app.get('/api/records', (req, res) => {
    try {
        const records = readRecords();
        res.json(records);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. 删除记录
app.delete('/api/records/:id', (req, res) => {
    try {
        const { id } = req.params;
        let records = readRecords();
        records = records.filter(r => r.id !== id);
        writeRecords(records);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. 清空
app.delete('/api/clear', (req, res) => {
    try {
        writeRecords([]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ 启动 ============
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('========================================');
    console.log('✅ 充值系统启动成功！');
    console.log(`📍 地址: http://localhost:${PORT}`);
    console.log('========================================');
});
