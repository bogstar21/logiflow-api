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
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

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

// POST /api/photos/upload
app.post("/api/photos/upload", async (req, res) => {
    try {
        const { base64, deliveryId } = req.body;

        // Convert base64 to buffer
        const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        // Upload to Supabase Storage
        const fileName = `${deliveryId}_${Date.now()}.jpg`;
        const { error: uploadError } = await supabase
            .storage
            .from("evidencias")
            .upload(fileName, buffer, {
                contentType: "image/jpeg",
                upsert: true
            });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase
            .storage
            .from("evidencias")
            .getPublicUrl(fileName);

        const photoUrl = urlData.publicUrl;

        // Update delivery with photo URL
        const { data, error } = await supabase
            .from("entregas")
            .update({
                status: "delivered",
                photo_url: photoUrl,
                updated_at: new Date()
            })
            .eq("delivery_id", deliveryId)
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, photo_url: photoUrl, data });

    } catch (error) {
        console.error("Photo upload error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// This MUST be at the very bottom of index.js!
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});