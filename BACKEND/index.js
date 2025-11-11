// ==========================
// IMPORTS & SETUP
// ==========================
const express = require("express");
const path = require("path");
const cors = require("cors");
const bcrypt = require("bcrypt");
const cron = require("node-cron");

const knex = require("knex")({
  client: "pg",
  connection: {
    host: "127.0.0.1",
    user: "zaynah",
    password: "1234",
    database: "hellokitty",
    port: 5432,
  },
});

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../dist")));

// ==========================
// TEST DB CONNECTION
// ==========================
knex
  .select("id", "email", "password_hash", "reserved_slot")
  .from("parkingusers")
  .then((data) =>
    console.log("Database connected:", data.length, "users found")
  )
  .catch((err) => console.error("Database error:", err.message));

// ==========================
// LOGIN ENDPOINT
// ==========================
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await knex("parkingusers").where("email", email).first();
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        reserved_slot: user.reserved_slot,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
});

// ==========================
// FETCH PARKING SLOTS (INCLUDES WHO BOOKED)
// ==========================
app.get("/api/slots", async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: "Date is required" });

  try {
    const allSlots = await knex("parking_slots").select("id", "slot_name");

    // Get bookings for that date
    const bookings = await knex("bookings")
      .where("booking_date", date)
      .select("slot_id", "user_email");

    const slots = allSlots.map((slot) => {
      const booking = bookings.find((b) => b.slot_id === slot.id);
      return {
        id: slot.id,
        slot_name: slot.slot_name,
        is_available: !booking,
        booked_by: booking ? booking.user_email : null,
      };
    });

    res.json(slots);
  } catch (err) {
    console.error("Error fetching slots:", err);
    res.status(500).json({ error: "Failed to fetch slots" });
  }
});

// ==========================
// BOOK A PARKING SLOT (1 PER WEEK)
// ==========================
app.post("/api/book", async (req, res) => {
  const { user_email, slot_id, date, start_time, end_time } = req.body;

  if (!user_email || !slot_id || !date || !start_time || !end_time) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Determine week start (Sunday) and end (Saturday)
    const bookingDate = new Date(date);
    const weekStart = new Date(bookingDate);
    weekStart.setDate(bookingDate.getDate() - bookingDate.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    // Check if user already booked this week
    const existingUserBooking = await knex("bookings")
      .where("user_email", user_email)
      .andWhere("booking_date", ">=", weekStart)
      .andWhere("booking_date", "<=", weekEnd)
      .first();

    if (existingUserBooking) {
      return res.status(403).json({
        message:
          "You already have a booking this week. Please cancel it before booking another.",
      });
    }

    // Check if slot already taken
    const existingSlot = await knex("bookings")
      .where({ booking_date: date, slot_id })
      .first();

    if (existingSlot) {
      return res.json({ message: "This slot is already booked!" });
    }

    // Insert new booking
    await knex("bookings").insert({
      user_email,
      slot_id,
      booking_date: date,
      start_time,
      end_time,
    });

    res.json({ message: "✅ Slot booked successfully!" });
  } catch (err) {
    console.error("Error booking slot:", err);
    res.status(500).json({ error: "Failed to book slot" });
  }
});

// ==========================
// CANCEL BOOKING
// ==========================
app.post("/api/cancel", async (req, res) => {
  const { user_email, date } = req.body;
  if (!user_email || !date) {
    return res.status(400).json({ error: "Missing user email or date" });
  }

  try {
    const existing = await knex("bookings")
      .where({ user_email, booking_date: date })
      .first();

    if (!existing) {
      return res.json({ message: "No booking found to cancel for this date." });
    }

    await knex("bookings")
      .where({ user_email, booking_date: date })
      .del();

    res.json({ message: "❎ Booking canceled successfully!" });
  } catch (err) {
    console.error("Error canceling booking:", err);
    res.status(500).json({ error: "Failed to cancel booking" });
  }
});

// ==========================
// SATURDAY AUTO RESET
// ==========================
cron.schedule("0 0 * * 6", async () => {
  try {
    await knex("bookings").del();
    console.log("✅ All bookings cleared on Saturday (weekly reset).");
  } catch (err) {
    console.error("Error clearing bookings:", err);
  }
});

// ==========================
// SERVE FRONTEND
// ==========================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

// ==========================
// START SERVER
// ==========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

