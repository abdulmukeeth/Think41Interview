
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const PORT = 3000;

const path = require('path');

// Serve index.html from "public" folder
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());
app.use(bodyParser.json());

let products = []; 

// GET all products
app.get('/products', (req, res) => {
    res.json(products);
});

// GET product by ID
app.get('/products/:id', (req, res) => {
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (product) res.json(product);
    else res.status(404).send('Product not found');
});

// POST a new product
app.post('/products', (req, res) => {
    const newProduct = req.body;

    // Prevent duplicates by ID
    const exists = products.find(p => p.id === newProduct.id);
    if (exists) {
        return res.status(400).json({ error: "Product with this ID already exists." });
    }

    products.push(newProduct);
    res.status(201).json(newProduct);
});

// PUT update a product
app.put('/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
        products[index] = { ...products[index], ...req.body };
        res.json(products[index]);
    } else {
        res.status(404).send('Product not found');
    }
});

// DELETE a product
app.delete('/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
        products.splice(index, 1);
        res.sendStatus(204);
    } else {
        res.status(404).send('Product not found');
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
