const express = require("express");
const router = express.Router();
const db = require("../db"); // Adjust path to your DB connection

router.post("/order", async (req, res) => {
  const { productId, name, phone, pin, address, paymentMode } = req.body;

  if (!productId || !name || !phone || !pin || !address || !paymentMode) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    // 1. Find or insert customer
    const [customerRows] = await db.execute(
      "SELECT id FROM customer WHERE phone_number = ?",
      [phone]
    );

    let customerId;
    if (customerRows.length === 0) {
      const [result] = await db.execute(
        "INSERT INTO customer (name, phone_number, pin) VALUES (?, ?, ?)",
        [name, phone, pin]
      );
      customerId = result.insertId;
    } else {
      customerId = customerRows[0].id;
    }

    // 2. Get product price
    const [productRows] = await db.execute(
      "SELECT price FROM products WHERE id = ?",
      [productId]
    );

    if (productRows.length === 0) {
      return res.status(404).json({ message: "Product not found." });
    }

    const price = productRows[0].price;

    // 3. Insert order without created_at (auto timestamp)
    await db.execute(
      `INSERT INTO orders (customer_id, product_id, address, phone, payment_mode, order_amount) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [customerId, productId, address, phone, paymentMode, price]
    );

    res.json({ message: "Order placed successfully!" });
  } catch (err) {
    console.error("Order insertion error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
