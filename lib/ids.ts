import { customAlphabet } from "nanoid";

const urlSafe = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const newBoardId = customAlphabet(urlSafe, 10);
export const newAdminToken = customAlphabet(urlSafe, 32);
