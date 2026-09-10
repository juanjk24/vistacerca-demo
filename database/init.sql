-- VistaCerca - esquema inicial (prototipo académico)
-- Los datos de clasificación NO constituyen diagnóstico médico.

CREATE TABLE IF NOT EXISTS users (
  id       SERIAL PRIMARY KEY,
  name     TEXT NOT NULL,
  age      INT,
  city     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assessments (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users(id),
  result      TEXT NOT NULL CHECK (result IN ('GREEN', 'YELLOW', 'RED')),
  blur_vision BOOLEAN NOT NULL DEFAULT false,
  eye_burning BOOLEAN NOT NULL DEFAULT false,
  persistent_symptoms BOOLEAN NOT NULL DEFAULT false,
  high_screen_time BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partners (
  id   SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  city TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS appointments (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users(id),
  partner_id INT NOT NULL REFERENCES partners(id),
  date       TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'PENDING'
             CHECK (status IN ('PENDING','CONFIRMED','ATTENDED','RESCHEDULED','NO_SHOW')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contadores agregados escritos por analytics-worker
CREATE TABLE IF NOT EXISTS analytics (
  key   TEXT PRIMARY KEY,
  value BIGINT NOT NULL DEFAULT 0
);

-- Datos semilla de aliados
INSERT INTO partners (name, type, city) VALUES
  ('Óptica Central',   'OPTICA',     'Mocoa'),
  ('Centro Visual',    'OPTOMETRIA', 'Mocoa'),
  ('Visión Plus',      'OPTICA',     'Villagarzón'),
  ('Clínica Oftalmológica Putumayo', 'SALUD', 'Mocoa')
ON CONFLICT DO NOTHING;

-- Datos semilla de un usuario para la demo rápida
INSERT INTO users (name, age, city) VALUES ('Juan Cuellar', 27, 'Mocoa')
ON CONFLICT DO NOTHING;