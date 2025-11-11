CREATE TABLE parkingusers (id SERIAL PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL,password_hash TEXT NOT NULL,reserved_slot INT,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(100),
  slot_id INT REFERENCES parking_slots(id),
  booking_date DATE,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE parking_slots (
  id SERIAL PRIMARY KEY,
  slot_name VARCHAR(50) UNIQUE NOT NULL,
  is_available BOOLEAN DEFAULT TRUE
);


INSERT INTO parking_slots (slot_name) VALUES ('Slot 1'), ('Slot 2'), ('Slot 3'), ('Slot 4');
INSERT INTO parking_slots (slot_name) VALUES ('Slot 5'), ('Slot 6');

SELECT * FROM bookings;

SELECT * FROM parkingusers;

INSERT INTO parkingusers (email, password_hash)
VALUES
('arasi@pp.com', '$2b$10$C82fP3d5R8tQ1y7wZ0jB.9Vf2n6gJ9kK0L2mO4a.0'),
('sahil@pp.com', '$2b$10$W1eA4xS9dH7pB2gC5fJ.1vL8oK3mI0tY6uQ5zR7s'),
('zaynah@pp.com', '$2b$10$T5rF7yH2oP9wG4dV8bE.3zI0xL1cJ6mA2sU5dK8f'),
('shaheenah@pp.com', '$2b$10$N3jM0pK9qX6zA7sL4dH.5eC1vB8uY2tI7rQ4wE9g'),
('javed@pp.com', '$2b$12$BKYl3x8IOvo5Nt6hpbvYNu56d2c/SQZA4WqCG5WWXl1xT2xjHge3q'),
('sid@pp.com', '$2b$12$rXSgcyfyjAfc8CEBMyT51eLzHEFHOaSHg4ztoK9xXIFxMUsgBx1Uu');