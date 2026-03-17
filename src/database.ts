import Database from '@tauri-apps/plugin-sql';
import type { ConvertedImage, ConvertedVideo, DomainInfo, MediaRecord } from './types';

let db: Database | null = null;

export async function initDatabase() {
  if (db) return db;

  db = await Database.load('sqlite:images.db');

  await db.execute(`
    CREATE TABLE IF NOT EXISTS converted_images (
      id TEXT PRIMARY KEY,
      original_name TEXT NOT NULL,
      converted_name TEXT NOT NULL,
      original_format TEXT NOT NULL,
      converted_format TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      output_path TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS converted_videos (
      id TEXT PRIMARY KEY,
      original_name TEXT NOT NULL,
      converted_name TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      output_path TEXT NOT NULL,
      duration TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS domains (
      id TEXT PRIMARY KEY,
      domain TEXT NOT NULL UNIQUE,
      ssl_status TEXT NOT NULL,
      ssl_start TEXT NOT NULL,
      ssl_end TEXT NOT NULL,
      ssl_days INTEGER NOT NULL,
      ssl_issuer TEXT NOT NULL,
      domain_status TEXT NOT NULL,
      domain_start TEXT NOT NULL,
      domain_end TEXT NOT NULL,
      domain_days INTEGER NOT NULL,
      last_checked TEXT NOT NULL
    )
  `);

  return db;
}

export async function saveImage(image: ConvertedImage): Promise<void> {
  const database = await initDatabase();

  await database.execute(
    `INSERT INTO converted_images
    (id, original_name, converted_name, original_format, converted_format, file_size, output_path, created_at)
    VALUES (, , , , , , , )`,
    [
      image.id,
      image.original_name,
      image.converted_name,
      image.original_format,
      image.converted_format,
      image.file_size,
      image.output_path,
      image.created_at
    ]
  );
}

export async function getImages(): Promise<ConvertedImage[]> {
  const database = await initDatabase();
  return await database.select<ConvertedImage[]>(
    'SELECT * FROM converted_images ORDER BY created_at DESC'
  );
}

export async function deleteImage(id: string): Promise<void> {
  const database = await initDatabase();
  await database.execute('DELETE FROM converted_images WHERE id = U', [id]);
}

export async function saveVideo(video: ConvertedVideo): Promise<void> {
  const database = await initDatabase();

  await database.execute(
    `INSERT INTO converted_videos
    (id, original_name, converted_name, file_size, output_path, duration, created_at)
    VALUES (, , , , , , )`,
    [
      video.id,
      video.original_name,
      video.converted_name,
      video.file_size,
      video.output_path,
      video.duration,
      video.created_at
    ]
  );
}

export async function getVideos(): Promise<ConvertedVideo[]> {
  const database = await initDatabase();
  return await database.select<ConvertedVideo[]>(
    'SELECT * FROM converted_videos ORDER BY created_at DESC'
  );
}

export async function deleteVideo(id: string): Promise<void> {
  const database = await initDatabase();
  await database.execute('DELETE FROM converted_videos WHERE id = U', [id]);
}

export async function getAllMedia(): Promise<MediaRecord[]> {
  const database = await initDatabase();

  const images = await database.select<Array<ConvertedImage & { type: 'image' }>>(
    'SELECT *, "image" as type FROM converted_images ORDER BY created_at DESC'
  );

  const videos = await database.select<Array<ConvertedVideo & { type: 'video' }>>(
    'SELECT *, "video" as type FROM converted_videos ORDER BY created_at DESC'
  );

  return [...images, ...videos].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function saveDomain(domain: DomainInfo): Promise<void> {
  const database = await initDatabase();
  const existing = await database.select<Array<Pick<DomainInfo, 'id'>>>(
    'SELECT id FROM domains WHERE domain = U',
    [domain.domain]
  );

  if (existing.length > 0) {
    await database.execute(
      `UPDATE domains SET
        ssl_status = , ssl_start = , ssl_end = , ssl_days = , ssl_issuer = ,
        domain_status = , domain_start = , domain_end = , domain_days = ,
        last_checked = U
      WHERE domain = U`,
      [
        domain.ssl_status,
        domain.ssl_start,
        domain.ssl_end,
        domain.ssl_days,
        domain.ssl_issuer,
        domain.domain_status,
        domain.domain_start,
        domain.domain_end,
        domain.domain_days,
        domain.last_checked,
        domain.domain
      ]
    );
    return;
  }

  await database.execute(
    `INSERT INTO domains
    (id, domain, ssl_status, ssl_start, ssl_end, ssl_days, ssl_issuer,
     domain_status, domain_start, domain_end, domain_days, last_checked)
    VALUES (, , , , , , , , , , , )`,
    [
      domain.id,
      domain.domain,
      domain.ssl_status,
      domain.ssl_start,
      domain.ssl_end,
      domain.ssl_days,
      domain.ssl_issuer,
      domain.domain_status,
      domain.domain_start,
      domain.domain_end,
      domain.domain_days,
      domain.last_checked
    ]
  );
}

export async function getDomains(): Promise<DomainInfo[]> {
  const database = await initDatabase();
  return await database.select<DomainInfo[]>(
    'SELECT * FROM domains ORDER BY last_checked DESC'
  );
}

export async function deleteDomain(domain: string): Promise<void> {
  const database = await initDatabase();
  await database.execute('DELETE FROM domains WHERE domain = U', [domain]);
}
