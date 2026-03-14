import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;

export async function initDatabase() {
  if (db) return db;
  
  // Use sqlite: protocol with just filename, Tauri will handle the path
  db = await Database.load('sqlite:images.db');
  
  // Create table
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
