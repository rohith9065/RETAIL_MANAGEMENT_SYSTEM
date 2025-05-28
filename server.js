const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const path = require("path");
require("dotenv").config(); // Load environment variables
const orderRoutes = require("./routes/order"); // Add this after other requires

const app = express();
const PORT = process.env.PORT || 3002; // Changed port to 3002

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use("/api", orderRoutes); // Integrate order routes

// MySQL connection setup
const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "root", // Replace with your MySQL password
    database: process.env.DB_NAME || "ecommerce" // Replace with your database name
});

db.connect(err => {
    if (err) {
        console.error("Error connecting to MySQL:", err);
        process.exit(1);
    }
    console.log("Connected to MySQL database.");
});

// Serve static files
app.use(express.static(__dirname)); // Serve static files from the root directory
app.use(express.static("public")); // Serve static files from the "public" folder
app.use("/uploads", express.static("uploads")); // Serve uploaded images

// Root route to serve home.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "home.html")); // Serve home.html
});

// Route to serve cart.html
app.get("/cart.html", (req, res) => {
    res.sendFile(path.join(__dirname, "cart.html")); // Serve cart.html
});

// Serve buying.html
app.get("/buying.html", (req, res) => {
    res.sendFile(path.join(__dirname, "buying.html"));
});

// Paginated products endpoint
app.get("/api/products", (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 10; // Number of products per page
    const offset = (page - 1) * limit;

    const query = "SELECT id, name, price, image FROM products LIMIT ? OFFSET ?";
    db.query(query, [limit, offset], (err, results) => {
        if (err) {
            console.error("Error fetching products from database:", err);
            return res.status(500).json({ error: "Failed to fetch products" });
        }

        const products = results.map(product => ({
            id: product.id,
            name: product.name,
            price: product.price,
            image: `/uploads/${product.image}` // Ensure images are served from the correct path
        }));

        res.json({ products });
    });
});

// Endpoint to fetch product details by ID
app.get("/api/product/:id", (req, res) => {
    const productId = req.params.id;

    const query = "SELECT id, name, price, image, description, specifications FROM products WHERE id = ?";
    db.query(query, [productId], (err, results) => {
        if (err) {
            console.error("Error fetching product details:", err);
            return res.status(500).json({ error: "Failed to fetch product details" });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Product not found" });
        }

        const product = results[0];

        // Parse the `specifications` column (assumes JSON format)
        try {
            product.specifications = product.specifications
                ? JSON.parse(product.specifications)
                : [];
        } catch (parseError) {
            console.error("Error parsing specifications:", parseError.message);
            product.specifications = []; // Fallback to an empty array
        }

        res.json(product);
    });
});

// Endpoint for user login
app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
    }

    const query = "SELECT * FROM users WHERE email = ? AND password = ?";
    db.query(query, [email, password], (err, results) => {
        if (err) {
            console.error("Error during login:", err);
            return res.status(500).json({ error: "Internal server error." });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        // Login successful
        res.json({ message: "Login successful", user: results[0] });
    });
});

// Endpoint to save customer data
app.post("/api/customers", (req, res) => {
    const { name, phone_number, pin } = req.body;

    if (!name || !phone_number || !pin) {
        return res.status(400).json({ error: "Name, phone number, and pin are required." });
    }

    const query = "INSERT INTO customer (name, phone_number, pin, created_at) VALUES (?, ?, ?, NOW())";
    db.query(query, [name, phone_number, pin], (err, result) => {
        if (err) {
            if (err.code === "ER_DUP_ENTRY") {
                return res.status(409).json({ error: "Phone number already registered." });
            }
            console.error("Error saving customer data:", err);
            return res.status(500).json({ error: "Failed to save customer data." });
        }

        res.json({ message: "Customer registered successfully.", customerId: result.insertId });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
