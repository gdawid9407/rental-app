const { createClient } = require('@supabase/supabase-js');
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

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupTestUser() {
  console.log('--- Tworzenie użytkownika testowego ---');
  const testEmail = 'test@example.com';
  const testPassword = 'tester123';
  const testNick = 'Tester';

  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: { username: testNick }
    }
  });

  if (error) {
    if (error.message.includes('already registered')) {
      console.log('Użytkownik testowy już istnieje. Można go używać.');
    } else {
      console.error('Błąd rejestracji:', error.message);
    }
  } else {
    console.log('Sukces! Użytkownik testowy stworzony.');
    console.log(`Email: ${testEmail}`);
    console.log(`Hasło: ${testPassword}`);
  }
}

setupTestUser();
