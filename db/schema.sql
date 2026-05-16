CREATE TABLE IF NOT EXISTS boards (
  id           TEXT PRIMARY KEY,
  admin_token  TEXT NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  closed       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questions (
  id           BIGSERIAL PRIMARY KEY,
  board_id     TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  author_name  TEXT NOT NULL,
  body         TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS questions_board_id_created_at_idx
  ON questions(board_id, created_at DESC);

CREATE TABLE IF NOT EXISTS agreements (
  question_id  BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS agreements_question_name_lower_uidx
  ON agreements(question_id, LOWER(name));
