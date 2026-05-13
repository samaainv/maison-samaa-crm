DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS pending_changes;
DROP TABLE IF EXISTS deals;
DROP TABLE IF EXISTS campaigns;
DROP TABLE IF EXISTS properties;
DROP TABLE IF EXISTS leads;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'agent',
  avatar TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  source TEXT,
  project_interest TEXT,
  status TEXT DEFAULT 'New',
  notes TEXT,
  assigned_to INTEGER,
  imported_from TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);

CREATE TABLE properties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  project_name TEXT,
  unit_type TEXT,
  property_type TEXT,
  status TEXT DEFAULT 'Available',
  price REAL NOT NULL,
  area_sqm REAL,
  bedrooms INTEGER,
  bathrooms INTEGER,
  location TEXT,
  city TEXT,
  description TEXT,
  features TEXT,
  images TEXT,
  listed_by INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (listed_by) REFERENCES users(id)
);

CREATE TABLE deals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER NOT NULL,
  property_id INTEGER,
  stage TEXT DEFAULT 'Lead',
  stage_order INTEGER DEFAULT 0,
  value REAL,
  notes TEXT,
  assigned_to INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);

CREATE TABLE pending_changes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  status TEXT DEFAULT 'pending',
  submitted_by INTEGER,
  reviewed_by INTEGER,
  review_note TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  reviewed_at TEXT,
  FOREIGN KEY (submitted_by) REFERENCES users(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

CREATE TABLE campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT,
  status TEXT DEFAULT 'draft',
  subject TEXT,
  content TEXT,
  target_audience TEXT,
  scheduled_date TEXT,
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  created_by INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT,
  description TEXT,
  lead_id INTEGER,
  user_id INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Seed data
INSERT INTO users (username, email, password_hash, full_name, role) VALUES
  ('admin', 'admin@maisonsamaa.com', 'f505e7a310f2c42defc64dcfe3ca59c9$e234a1dc0967c3a949865fec1f82019bb539d06b593ac48da58986ffa4c93b1a', 'Vlad Samaa', 'admin'),
  ('agent1', 'agent@maisonsamaa.com', 'f505e7a310f2c42defc64dcfe3ca59c9$e234a1dc0967c3a949865fec1f82019bb539d06b593ac48da58986ffa4c93b1a', 'Sarah Agent', 'agent');

INSERT INTO leads (name, phone, email, source, project_interest, status, assigned_to) VALUES
  ('Omar Hassan', '+971501234567', 'omar@example.com', 'Instagram', 'Origami', 'New', 1),
  ('Layla Mohammed', '+971502345678', 'layla@example.com', 'Facebook', 'Zahw', 'Contacted', 2),
  ('Ahmed Al Rashid', '+971503456789', 'ahmed@example.com', 'Web', 'Taj City', 'Follow-up', 1),
  ('Noor Saleh', '+971504567890', 'noor@example.com', 'Referral', 'Origami', 'New', 2),
  ('Khalid Amiri', '+971505678901', 'khalid@example.com', 'Facebook', 'Zahw', 'Closed', 1),
  ('Mona Adel', '+971506789012', 'mona@example.com', 'Instagram', 'Taj City', 'New', 2);

INSERT INTO properties (title, slug, project_name, unit_type, status, price, area_sqm, bedrooms, bathrooms, listed_by) VALUES
  ('Zahw Crystal 2BR Suite', 'zahw-crystal-2br', 'Zahw', '2BR', 'Available', 2800000, 120, 2, 2, 1),
  ('Origami Signature Villa', 'origami-signature-villa', 'Origami', 'Villa', 'Available', 12000000, 650, 6, 7, 1),
  ('Taj City Executive Penthouse', 'taj-city-penthouse', 'Taj City', 'Penthouse', 'Available', 8500000, 320, 4, 5, 2),
  ('Zahw Pearl Studio', 'zahw-pearl-studio', 'Zahw', 'Studio', 'Reserved', 950000, 42, 0, 1, 2),
  ('Origami 3BR Garden Suite', 'origami-3br-garden', 'Origami', '3BR', 'Sold', 4500000, 185, 3, 3, 1);

INSERT INTO deals (lead_id, property_id, stage, stage_order, value, assigned_to) VALUES
  (1, 1, 'Presentation', 1, 2800000, 1),
  (2, 2, 'Site Visit', 1, 12000000, 2),
  (3, 3, 'Reservation', 1, 8500000, 1),
  (4, 4, 'Lead', 1, 950000, 2);

INSERT INTO campaigns (name, type, status, subject, content, target_audience, sent_count, opened_count, clicked_count, created_by) VALUES
  ('Zahw Launch Campaign', 'Email', 'Sent', 'Introducing Zahw', 'Be among the first...', 'All Leads', 250, 180, 65, 1),
  ('Origami Villa Open House', 'Social Media', 'Active', 'Experience Origami', 'Join us for a tour...', 'High-Value Leads', 0, 0, 0, 1);
