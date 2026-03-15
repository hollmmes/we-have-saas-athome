import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;

export async function initDatabase() {
  if (db) return db;
  
  // Use sqlite: protocol with just filename, Tauri will handle the path
  db = await Database.load('sqlite:images.db');
  
  // Create images table
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
  
  // Create videos table
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
  
  // Create domains table
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

export async function saveImage(image: any) {
  const database = await initDatabase();
  
  await database.execute(
    `INSERT INTO converted_images 
    (id, original_name, converted_name, original_format, converted_format, file_size, output_path, created_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
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

export async function getImages(): Promise<any[]> {
  const database = await initDatabase();
  
  const result = await database.select(
    'SELECT * FROM converted_images ORDER BY created_at DESC'
  );
  
  return result as any[];
}

export async function deleteImage(id: string) {
  const database = await initDatabase();
  
  await database.execute(
    'DELETE FROM converted_images WHERE id = ?',
    [id]
  );
}

export async function saveVideo(video: any) {
  const database = await initDatabase();
  
  await database.execute(
    `INSERT INTO converted_videos 
    (id, original_name, converted_name, file_size, output_path, duration, created_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
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

export async function getVideos(): Promise<any[]> {
  const database = await initDatabase();
  
  const result = await database.select(
    'SELECT * FROM converted_videos ORDER BY created_at DESC'
  );
  
  return result as any[];
}

export async function deleteVideo(id: string) {
  const database = await initDatabase();
  
  await database.execute(
    'DELETE FROM converted_videos WHERE id = ?',
    [id]
  );
}

export async function getAllMedia(): Promise<any[]> {
  const database = await initDatabase();
  
  const images = await database.select(
    'SELECT *, "image" as type FROM converted_images ORDER BY created_at DESC'
  ) as any[];
  
  const videos = await database.select(
    'SELECT *, "video" as type FROM converted_videos ORDER BY created_at DESC'
  ) as any[];
  
  // Combine and sort by date
  const all = [...images, ...videos].sort((a: any, b: any) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  
  return all;
}

export async function saveDomain(domain: any) {
  const database = await initDatabase();
  
  // Check if domain exists
  const existing = await database.select(
    'SELECT id FROM domains WHERE domain = ?',
    [domain.domain]
  ) as any[];
  
  if (existing.length > 0) {
    // Update existing
    await database.execute(
      `UPDATE domains SET 
        ssl_status = ?, ssl_start = ?, ssl_end = ?, ssl_days = ?, ssl_issuer = ?,
        domain_status = ?, domain_start = ?, domain_end = ?, domain_days = ?,
        last_checked = ?
      WHERE domain = ?`,
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
  } else {
    // Insert new
    await database.execute(
      `INSERT INTO domains 
      (id, domain, ssl_status, ssl_start, ssl_end, ssl_days, ssl_issuer, 
       domain_status, domain_start, domain_end, domain_days, last_checked) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
}

export async function getDomains(): Promise<any[]> {
  const database = await initDatabase();
  
  const result = await database.select(
    'SELECT * FROM domains ORDER BY last_checked DESC'
  );
  
  return result as any[];
}

export async function deleteDomain(domain: string) {
  const database = await initDatabase();
  
  await database.execute(
    'DELETE FROM domains WHERE domain = ?',
    [domain]
  );
}

