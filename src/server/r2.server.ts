/**
 * R2 server-only client. Do NOT import from client code.
 * R2 is S3-compatible — we use the AWS S3 SDK pointed at the R2 endpoint.
 */
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

let _client: S3Client | null = null;
export function r2(): S3Client {
  if (_client) return _client;
  _client = new S3Client({
    region: "auto",
    endpoint: env("R2_ENDPOINT"),
    credentials: {
      accessKeyId: env("R2_ACCESS_KEY_ID"),
      secretAccessKey: env("R2_SECRET_ACCESS_KEY"),
    },
  });
  return _client;
}

export function bucket(): string {
  return env("R2_BUCKET");
}

/** Private bucket name (no public domain attached). Used for PII like contact messages. */
export function privateBucket(): string {
  const configured = process.env.R2_PRIVATE_BUCKET?.trim().replace(/[.\s]+$/g, "");
  const looksLikeSecretValue = /^[a-f0-9]{64}$/i.test(configured ?? "") || configured?.startsWith("cfat_");
  if (configured && configured !== process.env.R2_ACCOUNT_ID && !looksLikeSecretValue) return configured;
  return "private";
}

/** Read JSON from a specific bucket. */
export async function readJsonFrom<T = unknown>(bucketName: string, key: string): Promise<T | null> {
  try {
    const out = await r2().send(new GetObjectCommand({ Bucket: bucketName, Key: key }));
    const text = await out.Body!.transformToString();
    return JSON.parse(text) as T;
  } catch (err: any) {
    if (err?.$metadata?.httpStatusCode === 404 || err?.name === "NoSuchKey") return null;
    console.error("[r2.readJsonFrom] FAILED", {
      bucket: bucketName,
      key,
      endpoint: process.env.R2_ENDPOINT,
      accessKeyIdPrefix: (process.env.R2_ACCESS_KEY_ID || "").slice(0, 6),
      errName: err?.name,
      errCode: err?.Code || err?.code,
      httpStatus: err?.$metadata?.httpStatusCode,
      message: err?.message,
    });
    throw err;
  }
}

/** Write JSON to a specific bucket. */
export async function writeJsonTo(bucketName: string, key: string, value: unknown): Promise<void> {
  await r2().send(new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: JSON.stringify(value, null, 2),
    ContentType: "application/json; charset=utf-8",
    CacheControl: "no-store",
  }));
}

/** Build a public URL for a stored object using R2_PUBLIC_BASE_URL. */
export function publicUrl(key: string): string {
  let base = env("R2_PUBLIC_BASE_URL").trim();
  if (!/^https?:\/\//i.test(base)) base = "https://" + base;
  base = base.replace(/\/+$/, "");
  const k = key.replace(/^\/+/, "");
  return `${base}/${k}`;
}

/** Read a JSON object from R2. Returns null if not found. */
export async function readJson<T = unknown>(key: string): Promise<T | null> {
  try {
    const out = await r2().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
    const text = await out.Body!.transformToString();
    return JSON.parse(text) as T;
  } catch (err: any) {
    if (err?.$metadata?.httpStatusCode === 404 || err?.name === "NoSuchKey") return null;
    throw err;
  }
}

/** Write a JSON object to R2. */
export async function writeJson(key: string, value: unknown): Promise<void> {
  await r2().send(new PutObjectCommand({
    Bucket: bucket(),
    Key: key,
    Body: JSON.stringify(value, null, 2),
    ContentType: "application/json; charset=utf-8",
    CacheControl: "no-cache, max-age=0",
  }));
}

/** Upload raw bytes (e.g. for media). */
export async function putObject(key: string, body: Uint8Array | Buffer | string, contentType: string): Promise<string> {
  await r2().send(new PutObjectCommand({
    Bucket: bucket(),
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  }));
  return publicUrl(key);
}

export async function deleteObject(key: string): Promise<void> {
  await r2().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
}

export async function listObjects(prefix: string): Promise<string[]> {
  const out = await r2().send(new ListObjectsV2Command({ Bucket: bucket(), Prefix: prefix }));
  return (out.Contents ?? []).map((o) => o.Key!).filter(Boolean);
}

/** Generate a presigned PUT URL so the browser can upload directly to R2. */
export async function presignPut(key: string, contentType: string, expiresInSeconds = 300): Promise<string> {
  return getSignedUrl(
    r2(),
    new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: contentType }),
    { expiresIn: expiresInSeconds },
  );
}
