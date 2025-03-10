const fabric = require('fabric').fabric;
const fs = require('fs');
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const app = express();
const PORT = 8080;

app.use(helmet());
app.use(express.json({ limit: '1mb' }));

const authenticate = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token || token !== 'your-secret-token') {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
};

app.post('/save-data', authenticate, (req, res) => {
    const receivedData = req.body;
    if (!receivedData || !receivedData.canvas || typeof receivedData.canvas !== 'object') {
        return res.status(400).json({ message: 'Invalid canvas data' });
    }
    fs.writeFile('./canvas-data.json', JSON.stringify(receivedData.canvas), (err) => {
        if (err) {
            console.error('Error writing file:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.json({ message: 'Data saved successfully' });
    });
});

app.get('/load-data', authenticate, (req, res) => {
    fs.readFile('./canvas-data.json', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        try {
            res.json(JSON.parse(data));
        } catch (e) {
            console.error('Error parsing JSON:', e);
            res.status(500).json({ message: 'Invalid data format' });
        }
    });
});

app.use(express.static(path.join(__dirname, 'client-side'), { extensions: ['html', 'js', 'css'] }));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
