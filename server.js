const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Serve static assets (CSS, JS, Images)
app.use(express.static(__dirname));

// Route Definitions
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/wire', (req, res) => {
    res.sendFile(path.join(__dirname, 'wire.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Redirect old .html requests to clean URLs
app.get('/index.html', (req, res) => res.redirect('/'));
app.get('/dashboard.html', (req, res) => res.redirect('/dashboard'));
app.get('/wire.html', (req, res) => res.redirect('/wire'));
app.get('/admin.html', (req, res) => res.redirect('/admin'));

app.listen(PORT, () => {
    console.log(`NovaBank System running at http://localhost:${PORT}`);
});
