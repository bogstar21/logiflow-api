// ============================================
// LOGIFLOW API — Main Server
// ============================================

const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- SUPABASE CONNECTION ---
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- ROUTES ---

// Test route
app.get("/", (req, res) => {
    res.json({ message: "LogiFlow API is running! 🚀" });
});

// GET all deliveries
app.get("/api/deliveries", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("entregas")
            .select("*");

        if (error) throw error;
        res.json({ success: true, data });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET one delivery
app.get("/api/deliveries/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from("entregas")
            .select("*")
            .eq("delivery_id", id)  // ← updated!
            .single();

        if (error) throw error;
        res.json({ success: true, data });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET driver route
app.get("/api/driver/:driverId", async (req, res) => {
    try {
        const { driverId } = req.params;

        const { data, error } = await supabase
            .from("entregas")
            .select("*")
            .eq("driver_id", driverId);  // ← updated!

        if (error) throw error;

        if (data.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Driver not found"
            });
        }

        res.json({ success: true, data });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT update delivery status
app.put("/api/deliveries/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { status, photo_url } = req.body;  // ← updated!

        const { data, error } = await supabase
            .from("entregas")
            .update({
                status,
                photo_url,                    // ← updated!
                updated_at: new Date()        // ← updated!
            })
            .eq("delivery_id", id)          // ← updated!
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, data });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// This MUST be at the very bottom of index.js!
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});