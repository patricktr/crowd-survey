"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const NAME_KEY = "crowdsurvey:name";
const ADMIN_KEY = "crowdsurvey:admin";
const STORAGE_EVENT = "crowdsurvey:storage";

export type AdminBoardEntry = {
  boardId: string;
  title: string;
  adminToken: string;
  createdAt: string;
};

function readRaw(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, raw: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (raw === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, raw);
    window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail: { key } }));
  } catch {
    /* ignore quota errors */
  }
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(STORAGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(STORAGE_EVENT, callback);
  };
}

function useRawLocalStorage(key: string): string | null {
  const getSnapshot = useCallback(() => readRaw(key), [key]);
  const getServerSnapshot = useCallback(() => null, []);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useStoredName(): {
  name: string | null;
  hydrated: boolean;
  setName: (name: string) => void;
  clearName: () => void;
} {
  const raw = useRawLocalStorage(NAME_KEY);
  const name = useMemo<string | null>(() => {
    if (raw == null) return null;
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === "string" && parsed.length > 0 ? parsed : null;
    } catch {
      return null;
    }
  }, [raw]);

  const setName = useCallback((n: string) => {
    const cleaned = n.replace(/\s+/g, " ").trim();
    if (!cleaned) return;
    writeRaw(NAME_KEY, JSON.stringify(cleaned));
  }, []);

  const clearName = useCallback(() => {
    writeRaw(NAME_KEY, null);
  }, []);

  return {
    name,
    hydrated: typeof window !== "undefined",
    setName,
    clearName,
  };
}

export function useAdminBoards(): {
  boards: AdminBoardEntry[];
  hydrated: boolean;
  add: (entry: AdminBoardEntry) => void;
  remove: (boardId: string) => void;
  tokenFor: (boardId: string) => string | null;
} {
  const raw = useRawLocalStorage(ADMIN_KEY);
  const boards = useMemo<AdminBoardEntry[]>(() => {
    if (raw == null) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as AdminBoardEntry[]) : [];
    } catch {
      return [];
    }
  }, [raw]);

  const add = useCallback((entry: AdminBoardEntry) => {
    const current = readBoards();
    const next = [entry, ...current.filter((b) => b.boardId !== entry.boardId)];
    writeRaw(ADMIN_KEY, JSON.stringify(next));
  }, []);

  const remove = useCallback((boardId: string) => {
    const current = readBoards();
    const next = current.filter((b) => b.boardId !== boardId);
    writeRaw(ADMIN_KEY, JSON.stringify(next));
  }, []);

  const tokenFor = useCallback(
    (boardId: string) =>
      boards.find((b) => b.boardId === boardId)?.adminToken ?? null,
    [boards]
  );

  return {
    boards,
    hydrated: typeof window !== "undefined",
    add,
    remove,
    tokenFor,
  };
}

function readBoards(): AdminBoardEntry[] {
  const raw = readRaw(ADMIN_KEY);
  if (raw == null) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AdminBoardEntry[]) : [];
  } catch {
    return [];
  }
}

export function readAdminTokenFor(boardId: string): string | null {
  return readBoards().find((b) => b.boardId === boardId)?.adminToken ?? null;
}
