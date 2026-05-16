import { sql } from "./db";
import { newAdminToken, newBoardId } from "./ids";

export type Board = {
  id: string;
  title: string;
  description: string | null;
  closed: boolean;
  createdAt: string;
};

export type BoardWithAdmin = Board & { adminToken: string };

export type QuestionWithAgreements = {
  id: string;
  boardId: string;
  authorName: string;
  body: string;
  createdAt: string;
  agreements: { name: string; createdAt: string }[];
};

export async function createBoard(input: {
  title: string;
  description: string | null;
}): Promise<BoardWithAdmin> {
  const id = newBoardId();
  const adminToken = newAdminToken();
  const [row] = await sql<
    {
      id: string;
      admin_token: string;
      title: string;
      description: string | null;
      closed: boolean;
      created_at: Date;
    }[]
  >`
    INSERT INTO boards (id, admin_token, title, description)
    VALUES (${id}, ${adminToken}, ${input.title}, ${input.description})
    RETURNING id, admin_token, title, description, closed, created_at
  `;
  return {
    id: row.id,
    adminToken: row.admin_token,
    title: row.title,
    description: row.description,
    closed: row.closed,
    createdAt: row.created_at.toISOString(),
  };
}

export async function getBoard(id: string): Promise<Board | null> {
  const rows = await sql<
    {
      id: string;
      title: string;
      description: string | null;
      closed: boolean;
      created_at: Date;
    }[]
  >`SELECT id, title, description, closed, created_at FROM boards WHERE id = ${id}`;
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    closed: r.closed,
    createdAt: r.created_at.toISOString(),
  };
}

export async function verifyAdmin(
  id: string,
  token: string
): Promise<boolean> {
  const rows = await sql<{ admin_token: string }[]>`
    SELECT admin_token FROM boards WHERE id = ${id}
  `;
  if (rows.length === 0) return false;
  const stored = rows[0].admin_token;
  if (stored.length !== token.length) return false;
  let mismatch = 0;
  for (let i = 0; i < stored.length; i++) {
    mismatch |= stored.charCodeAt(i) ^ token.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function updateBoard(
  id: string,
  patch: { title?: string; description?: string | null; closed?: boolean }
): Promise<Board | null> {
  const updates: Record<string, unknown> = { updated_at: sql`NOW()` };
  if (patch.title !== undefined) updates.title = patch.title;
  if (patch.description !== undefined) updates.description = patch.description;
  if (patch.closed !== undefined) updates.closed = patch.closed;

  const rows = await sql<
    {
      id: string;
      title: string;
      description: string | null;
      closed: boolean;
      created_at: Date;
    }[]
  >`
    UPDATE boards
    SET ${sql(updates)}
    WHERE id = ${id}
    RETURNING id, title, description, closed, created_at
  `;
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    closed: r.closed,
    createdAt: r.created_at.toISOString(),
  };
}

export async function deleteBoard(id: string): Promise<void> {
  await sql`DELETE FROM boards WHERE id = ${id}`;
}

export async function listQuestionsWithAgreements(
  boardId: string
): Promise<QuestionWithAgreements[]> {
  const rows = await sql<
    {
      id: string;
      board_id: string;
      author_name: string;
      body: string;
      created_at: Date;
      agreements: { name: string; created_at: string }[] | null;
    }[]
  >`
    SELECT
      q.id::text AS id,
      q.board_id,
      q.author_name,
      q.body,
      q.created_at,
      COALESCE(
        (
          SELECT json_agg(json_build_object('name', a.name, 'created_at', a.created_at) ORDER BY a.created_at ASC)
          FROM agreements a
          WHERE a.question_id = q.id
        ),
        '[]'::json
      ) AS agreements
    FROM questions q
    WHERE q.board_id = ${boardId}
    ORDER BY q.created_at ASC
  `;
  return rows.map((r) => ({
    id: r.id,
    boardId: r.board_id,
    authorName: r.author_name,
    body: r.body,
    createdAt: r.created_at.toISOString(),
    agreements: (r.agreements ?? []).map((a) => ({
      name: a.name,
      createdAt: new Date(a.created_at).toISOString(),
    })),
  }));
}

export async function createQuestion(input: {
  boardId: string;
  authorName: string;
  body: string;
}): Promise<{ id: string }> {
  const [row] = await sql<{ id: string }[]>`
    INSERT INTO questions (board_id, author_name, body)
    VALUES (${input.boardId}, ${input.authorName}, ${input.body})
    RETURNING id::text
  `;
  return { id: row.id };
}

export async function deleteQuestion(id: string): Promise<string | null> {
  const rows = await sql<{ board_id: string }[]>`
    DELETE FROM questions WHERE id = ${id}::bigint
    RETURNING board_id
  `;
  return rows[0]?.board_id ?? null;
}

export async function getQuestionBoardId(
  questionId: string
): Promise<string | null> {
  const rows = await sql<{ board_id: string }[]>`
    SELECT board_id FROM questions WHERE id = ${questionId}::bigint
  `;
  return rows[0]?.board_id ?? null;
}

export async function addAgreement(input: {
  questionId: string;
  name: string;
}): Promise<"added" | "exists"> {
  const rows = await sql<{ name: string }[]>`
    INSERT INTO agreements (question_id, name)
    SELECT ${input.questionId}::bigint, ${input.name}
    WHERE NOT EXISTS (
      SELECT 1 FROM agreements
      WHERE question_id = ${input.questionId}::bigint
        AND LOWER(name) = LOWER(${input.name})
    )
    RETURNING name
  `;
  return rows.length > 0 ? "added" : "exists";
}

export async function removeAgreement(input: {
  questionId: string;
  name: string;
}): Promise<void> {
  await sql`
    DELETE FROM agreements
    WHERE question_id = ${input.questionId}::bigint
      AND LOWER(name) = LOWER(${input.name})
  `;
}
