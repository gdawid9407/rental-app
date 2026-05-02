const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const match = line.match(/^([^#\s=]+)\s*=\s*(.*)$/);
    if (match) {
      let value = match[2].trim();
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      env[match[1]] = value;
    }
  });
  return env;
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Błąd: Brak zmiennych w .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const dbPath = path.resolve(__dirname, '../local_backup.db');
const tempSqlPath = path.resolve(__dirname, '../temp_sync.sql');

const tableNames = [
  'properties',
  'calendar_entries',
  'property_notes',
  'custom_bill_categories',
  'property_leases',
  'meter_readings',
  'property_contacts'
];

async function sync() {
  console.log('--- Rozpoczynanie synchronizacji dynamicznej ---');
  let sqlCommands = 'PRAGMA foreign_keys=OFF;\n';
  
  for (const tableName of tableNames) {
    console.log(`Pobieranie ${tableName}...`);
    const { data, error } = await supabase.from(tableName).select('*');
    
    if (error) {
      console.error(`Błąd ${tableName}:`, error.message);
      continue;
    }

    if (!data || data.length === 0) {
      // Jeśli nie ma danych, a tabela nie istnieje, stwórz pustą (opcjonalne, ale lepiej mieć cokolwiek)
      sqlCommands += `CREATE TABLE IF NOT EXISTS ${tableName} (id TEXT PRIMARY KEY);\n`;
      console.log(`Tabela ${tableName} jest pusta.`);
      continue;
    }

    const columns = Object.keys(data[0]);
    // Mapowanie typów: większość tekst, liczby jako REAL
    const schemaParts = columns.map(col => {
      const sampleVal = data[0][col];
      if (typeof sampleVal === 'number') return `"${col}" REAL`;
      return `"${col}" TEXT`;
    });

    sqlCommands += `DROP TABLE IF EXISTS "${tableName}";\n`;
    sqlCommands += `CREATE TABLE "${tableName}" (${schemaParts.join(', ')});\n`;

    for (const row of data) {
      const values = columns.map(col => {
        const val = row[col];
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
        if (typeof val === 'boolean') return val ? 1 : 0;
        if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
        return val;
      });
      sqlCommands += `INSERT INTO "${tableName}" ("${columns.join('", "')}") VALUES (${values.join(',')});\n`;
    }
    console.log(`Przygotowano ${data.length} rekordów dla ${tableName}.`);
  }

  fs.writeFileSync(tempSqlPath, sqlCommands);

  try {
    execSync(`sqlite3 "${dbPath}" < "${tempSqlPath}"`);
    console.log('--- Synchronizacja zakończona pomyślnie! ---');
  } catch (err) {
    console.error('Błąd zapisu:', err.message);
  } finally {
    if (fs.existsSync(tempSqlPath)) fs.unlinkSync(tempSqlPath);
  }
}

sync().catch(console.error);
