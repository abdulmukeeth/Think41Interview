
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const PORT = 3000;
const db = require('./db');


const path = require('path');

// Serve index.html from "public" folder
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());
app.use(bodyParser.json());

let products = []; 

app.get('/products', (req, res) => {
    const query = `
        SELECT products.*, departments.name AS department 
        FROM products
        LEFT JOIN departments ON products.department_id = departments.id
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});


// GET product by ID
app.get('/products/:id', (req, res) => {
    const query = `
        SELECT products.*, departments.name AS department 
        FROM products 
        LEFT JOIN departments ON products.department_id = departments.id 
        WHERE products.id = ?
    `;
    db.get(query, [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).send('Product not found');
        res.json(row);
    });
});

function ensureDepartment(deptName, callback) {
    db.get("SELECT id FROM departments WHERE name = ?", [deptName], (err, row) => {
        if (row) return callback(null, row.id);
        db.run("INSERT INTO departments (name) VALUES (?)", [deptName], function (err) {
            if (err) return callback(err);
            callback(null, this.lastID);
        });
    });
}


// POST a new product
app.post('/products', (req, res) => {
    const { id, name, price, description, department } = req.body;

    if (!id || !name || !price || !department) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    ensureDepartment(department, (err, department_id) => {
        if (err) return res.status(500).json({ error: err.message });

        const insert = `
    INSERT INTO products (name, price, description, department_id)
    VALUES (?, ?, ?, ?)
`;
db.run(insert, [name, price, description, department_id], function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.status(201).json({ id: this.lastID, name, price, description, department });
});

    });
});


// PUT update a product
app.put('/products/:id', (req, res) => {
    const { name, price, description, department } = req.body;

    ensureDepartment(department, (err, department_id) => {
        if (err) return res.status(500).json({ error: err.message });

        const update = `
            UPDATE products
            SET name = ?, price = ?, description = ?, department_id = ?
            WHERE id = ?
        `;
        db.run(update, [name, price, description, department_id, req.params.id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).send("Product not found");
            res.json({ id: req.params.id, name, price, description, department });
        });
    });
});


// DELETE a product
app.delete('/products/:id', (req, res) => {
    db.run("DELETE FROM products WHERE id = ?", [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).send("Product not found");
        res.sendStatus(204);
    });
});


app.get('/departments', (req, res) => {
  db.all("SELECT * FROM departments", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});


app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
