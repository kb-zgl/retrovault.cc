CREATE TABLE IF NOT EXISTS games (
  slug        TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  platform    TEXT NOT NULL,
  year        INTEGER,
  genre       TEXT,
  developer   TEXT,
  publisher   TEXT,
  series      TEXT,
  isHack      INTEGER DEFAULT 0,
  coverUrl    TEXT,
  defaultRom  TEXT,
  ejsCore     TEXT,
  ejsBiosUrl  TEXT,
  tags        TEXT,
  description TEXT,
  langs       TEXT,
  roms        TEXT,
  status      TEXT DEFAULT 'draft',
  source      TEXT DEFAULT 'scraped',
  createdAt   TEXT,
  updatedAt   TEXT
);

CREATE INDEX IF NOT EXISTS idx_games_platform ON games(platform);
CREATE INDEX IF NOT EXISTS idx_games_genre ON games(genre);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
