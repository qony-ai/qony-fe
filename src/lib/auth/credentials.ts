import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export interface StoredAuthUser {
  id: string;
  username: string;
  name: string;
  email: string;
  password_hash: string;
  password_salt: string;
  created_at: string;
  updated_at: string;
}

const authDataDirectory = path.join(process.cwd(), ".data");
const authUsersPath = path.join(authDataDirectory, "auth-users.json");

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

function validateUsername(username: string) {
  return /^[a-z0-9._-]{3,24}$/.test(username);
}

function validatePassword(password: string) {
  return password.trim().length >= 6;
}

function deriveDisplayName(username: string) {
  const parts = username
    .split(/[._-]+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase() + part.slice(1));

  return parts.join(" ") || username;
}

function deriveEmail(username: string) {
  return `${username}@qony.ai`;
}

function hasValidActorEmailShape(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeStoredEmail(email: string, username: string) {
  const normalized = email.trim().toLowerCase();

  if (hasValidActorEmailShape(normalized) && !normalized.endsWith("@qony.local")) {
    return normalized;
  }

  return deriveEmail(username);
}

function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString("hex");
}

function verifyPassword(password: string, salt: string, expectedHash: string) {
  const actual = Buffer.from(hashPassword(password, salt), "hex");
  const expected = Buffer.from(expectedHash, "hex");

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

async function ensureAuthDirectory() {
  await mkdir(authDataDirectory, { recursive: true });
}

async function readUsers() {
  try {
    const raw = await readFile(authUsersPath, "utf8");
    const parsed = JSON.parse(raw) as StoredAuthUser[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    const normalizedUsers = parsed.map((user) => ({
      ...user,
      email: normalizeStoredEmail(user.email, user.username),
    }));

    const changed = normalizedUsers.some(
      (user, index) => user.email !== parsed[index]?.email,
    );

    if (changed) {
      await writeUsers(normalizedUsers);
    }

    return normalizedUsers;
  } catch {
    return [];
  }
}

async function writeUsers(users: StoredAuthUser[]) {
  await ensureAuthDirectory();
  await writeFile(authUsersPath, JSON.stringify(users, null, 2), "utf8");
}

export async function registerCredentialUser(input: {
  username: string;
  password: string;
}) {
  const username = normalizeUsername(input.username);
  const password = input.password;

  if (!validateUsername(username)) {
    throw new Error(
      "Username must be 3-24 characters and use only letters, numbers, dot, dash, or underscore.",
    );
  }

  if (!validatePassword(password)) {
    throw new Error("Password must contain at least 6 characters.");
  }

  const users = await readUsers();
  if (users.some((user) => user.username === username)) {
    throw new Error("Username already exists.");
  }

  const now = new Date().toISOString();
  const salt = randomBytes(16).toString("hex");
  const user: StoredAuthUser = {
    id: randomBytes(16).toString("hex"),
    username,
    name: deriveDisplayName(username),
    email: deriveEmail(username),
    password_hash: hashPassword(password, salt),
    password_salt: salt,
    created_at: now,
    updated_at: now,
  };

  await writeUsers([...users, user]);
  return user;
}

export async function authenticateCredentialUser(input: {
  username: string;
  password: string;
}) {
  const username = normalizeUsername(input.username);
  const password = input.password;

  if (!validateUsername(username) || !validatePassword(password)) {
    return null;
  }

  const users = await readUsers();
  const user = users.find((entry) => entry.username === username);
  if (!user) {
    return null;
  }

  if (!verifyPassword(password, user.password_salt, user.password_hash)) {
    return null;
  }

  return user;
}

export function buildSessionFromStoredUser(user: StoredAuthUser) {
  return {
    username: user.username,
    email: normalizeStoredEmail(user.email, user.username),
    name: user.name,
  };
}
