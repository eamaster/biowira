import fs from 'fs';

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

const dataset = JSON.parse(fs.readFileSync('scripts/aws_full_dataset.json', 'utf8'));
const quizzesMockSrc = fs.readFileSync('src/mocks/quizzes.ts', 'utf8');

// Parse mock questions to complement AWS quizzes
const mockQuestions = [];
const qRegex = /{\s*id:\s*(\d+),\s*animalId:\s*(\d+),\s*questionText:\s*'([^']+)',\s*explanation:\s*'([^']+)',\s*difficulty:\s*'([^']+)',\s*options:\s*\[([\s\S]*?)\]\s*}/g;
let match;
while ((match = qRegex.exec(quizzesMockSrc)) !== null) {
  const qId = parseInt(match[1], 10);
  const animalId = parseInt(match[2], 10);
  const questionText = match[3];
  const explanation = match[4];
  const difficulty = match[5];
  const optsRaw = match[6];
  const optRegex = /{\s*label:\s*'([^']+)',\s*text:\s*'([^']+)',\s*isCorrect:\s*(true|false)\s*}/g;
  const choices = [];
  let optMatch;
  while ((optMatch = optRegex.exec(optsRaw)) !== null) {
    choices.push({
      label: optMatch[1],
      text: optMatch[2],
      isCorrect: optMatch[3] === 'true'
    });
  }
  mockQuestions.push({ qId, animalId, questionText, explanation, difficulty, choices });
}

let sql = `-- BioWira Cloudflare D1 Database Schema and Seed Data
-- Database: biowira-db
-- Synced from AWS Reference System with Full 31 Wildlife Species

PRAGMA foreign_keys = ON;

-- 1. Reference Tables
CREATE TABLE IF NOT EXISTS animal_group (
  group_id INTEGER PRIMARY KEY,
  group_name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS conservation_status (
  conservation_status_id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  severity_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS threat_category (
  threat_category_id INTEGER PRIMARY KEY,
  threat_name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS habitat_category (
  habitat_category_id INTEGER PRIMARY KEY,
  habitat_name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS level (
  level_id INTEGER PRIMARY KEY,
  level_number INTEGER NOT NULL UNIQUE,
  points_required INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS badge (
  badge_id INTEGER PRIMARY KEY,
  badge_name TEXT NOT NULL,
  badge_image_url TEXT,
  description TEXT,
  badge_type TEXT NOT NULL,
  level_required INTEGER,
  missions_required INTEGER,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS mission_type (
  mission_type_id INTEGER PRIMARY KEY,
  type_name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS weather_condition (
  weather_condition_id INTEGER PRIMARY KEY,
  wmo_code_min INTEGER NOT NULL,
  wmo_code_max INTEGER NOT NULL,
  condition_name TEXT,
  is_outdoor_safe INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS image (
  image_id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  title TEXT,
  author_name TEXT,
  author_url TEXT,
  source_name TEXT,
  source_url TEXT,
  license_name TEXT,
  license_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS animal (
  animal_id INTEGER PRIMARY KEY AUTOINCREMENT,
  common_name TEXT NOT NULL,
  scientific_name TEXT NOT NULL,
  group_id INTEGER REFERENCES animal_group(group_id),
  diet TEXT,
  lifespan TEXT,
  description TEXT,
  conservation_status_id INTEGER REFERENCES conservation_status(conservation_status_id),
  image_url TEXT,
  avatar_path TEXT,
  image_id INTEGER REFERENCES image(image_id),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS animal_occurrence (
  animal_occurrence_id INTEGER PRIMARY KEY AUTOINCREMENT,
  animal_id INTEGER NOT NULL REFERENCES animal(animal_id),
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  location_name TEXT,
  observed_at TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS threat_detail (
  threat_detail_id INTEGER PRIMARY KEY AUTOINCREMENT,
  animal_id INTEGER NOT NULL REFERENCES animal(animal_id),
  threat_category_id INTEGER NOT NULL REFERENCES threat_category(threat_category_id),
  explanation TEXT NOT NULL,
  priority INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS habitat_detail (
  habitat_detail_id INTEGER PRIMARY KEY AUTOINCREMENT,
  animal_id INTEGER NOT NULL REFERENCES animal(animal_id),
  habitat_category_id INTEGER NOT NULL REFERENCES habitat_category(habitat_category_id),
  priority INTEGER DEFAULT 1,
  emoji TEXT DEFAULT '🌳'
);

CREATE TABLE IF NOT EXISTS mission (
  mission_id INTEGER PRIMARY KEY AUTOINCREMENT,
  mission_type_id INTEGER NOT NULL REFERENCES mission_type(mission_type_id),
  title TEXT NOT NULL,
  description TEXT,
  step_1 TEXT,
  step_2 TEXT,
  step_3 TEXT,
  time_limit_min INTEGER DEFAULT 15,
  is_outdoor INTEGER NOT NULL,
  is_day_only INTEGER NOT NULL,
  points_reward INTEGER NOT NULL DEFAULT 20,
  image_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  enabled INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS quiz (
  quiz_id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  topic TEXT
);

CREATE TABLE IF NOT EXISTS question (
  question_id INTEGER PRIMARY KEY AUTOINCREMENT,
  quiz_id INTEGER NOT NULL REFERENCES quiz(quiz_id),
  animal_id INTEGER REFERENCES animal(animal_id),
  question_text TEXT NOT NULL,
  explanation TEXT,
  difficulty TEXT NOT NULL DEFAULT 'easy',
  image_url TEXT
);

CREATE TABLE IF NOT EXISTS choice (
  choice_id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL REFERENCES question(question_id),
  choice_label TEXT NOT NULL,
  choice_text TEXT NOT NULL,
  is_correct INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS animal_fun_fact (
  animal_fun_fact_id INTEGER PRIMARY KEY AUTOINCREMENT,
  animal_id INTEGER NOT NULL REFERENCES animal(animal_id),
  emoji TEXT DEFAULT '💡',
  fact_text TEXT NOT NULL,
  fact_image_url TEXT,
  fact_order INTEGER NOT NULL DEFAULT 1,
  level_id INTEGER NOT NULL REFERENCES level(level_id),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profile (
  profile_id TEXT PRIMARY KEY,
  profile_code TEXT NOT NULL UNIQUE,
  pin TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profile_progress (
  profile_progress_id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id TEXT NOT NULL UNIQUE REFERENCES profile(profile_id),
  current_level INTEGER NOT NULL DEFAULT 1,
  total_points INTEGER NOT NULL DEFAULT 0,
  total_quizzes INTEGER NOT NULL DEFAULT 0,
  total_correct INTEGER NOT NULL DEFAULT 0,
  total_missions INTEGER NOT NULL DEFAULT 0,
  streak_days INTEGER NOT NULL DEFAULT 1,
  last_active_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profile_session (
  profile_session_id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id TEXT NOT NULL REFERENCES profile(profile_id),
  session_token TEXT NOT NULL UNIQUE,
  device_info TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT,
  last_used_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profile_unlocked_fact (
  profile_id TEXT NOT NULL REFERENCES profile(profile_id),
  animal_fun_fact_id INTEGER NOT NULL REFERENCES animal_fun_fact(animal_fun_fact_id),
  PRIMARY KEY(profile_id, animal_fun_fact_id)
);

CREATE TABLE IF NOT EXISTS profile_badge (
  profile_badge_id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id TEXT NOT NULL REFERENCES profile(profile_id),
  badge_id INTEGER NOT NULL REFERENCES badge(badge_id),
  source TEXT NOT NULL,
  earned_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(profile_id, badge_id)
);

CREATE TABLE IF NOT EXISTS profile_mission (
  profile_mission_id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id TEXT NOT NULL REFERENCES profile(profile_id),
  mission_id INTEGER NOT NULL REFERENCES mission(mission_id),
  weather_code INTEGER,
  weather_temp REAL,
  weather_is_day INTEGER,
  location_lat REAL,
  location_lon REAL,
  status TEXT NOT NULL DEFAULT 'assigned',
  points_earned INTEGER NOT NULL DEFAULT 0,
  assigned_at TEXT DEFAULT CURRENT_TIMESTAMP,
  started_at TEXT,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS profile_history (
  profile_history_id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id TEXT NOT NULL REFERENCES profile(profile_id),
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  points_earned INTEGER NOT NULL,
  level_before INTEGER NOT NULL,
  level_after INTEGER,
  leveled_up INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tts_audio_cache (
  text_hash TEXT NOT NULL,
  voice_id TEXT NOT NULL,
  model_id TEXT NOT NULL,
  speed REAL NOT NULL DEFAULT 1.0,
  mime_type TEXT NOT NULL DEFAULT 'audio/mpeg',
  audio_content BLOB NOT NULL,
  timings_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(text_hash, voice_id, model_id)
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_animal_group ON animal(group_id);
CREATE INDEX IF NOT EXISTS idx_animal_occ ON animal_occurrence(animal_id);
CREATE INDEX IF NOT EXISTS idx_question_quiz ON question(quiz_id);
CREATE INDEX IF NOT EXISTS idx_choice_q ON choice(question_id);
CREATE INDEX IF NOT EXISTS idx_fun_fact_animal ON animal_fun_fact(animal_id);
CREATE INDEX IF NOT EXISTS idx_session_token ON profile_session(session_token);
CREATE INDEX IF NOT EXISTS idx_prof_miss_prof ON profile_mission(profile_id);

-- ── Reference Seeds ────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO animal_group (group_id, group_name) VALUES
  (1, 'Mammals'),
  (2, 'Amphibians'),
  (3, 'Birds'),
  (4, 'Reptiles'),
  (5, 'Insects'),
  (6, 'Marine & Freshwater');

INSERT OR IGNORE INTO conservation_status (conservation_status_id, code, label, description, severity_order) VALUES
  (1, 'LC', 'Least Concern', 'Lowest risk of extinction', 1),
  (2, 'NT', 'Near Threatened', 'Likely to become endangered in the near future', 2),
  (3, 'VU', 'Vulnerable', 'High risk of endangerment in the wild', 3),
  (4, 'EN', 'Endangered', 'Very high risk of extinction in the wild', 4),
  (5, 'CR', 'Critically Endangered', 'Extremely high risk of extinction in the wild', 5);

INSERT OR IGNORE INTO threat_category (threat_category_id, threat_name) VALUES
  (1, 'Hunting & Poaching'),
  (2, 'Habitat Loss & Deforestation'),
  (3, 'Climate Change'),
  (4, 'Pollution'),
  (5, 'Human-Wildlife Conflict'),
  (6, 'Losing Their Homes'),
  (7, 'Plastic & Marine Pollution'),
  (8, 'Illegal Pet Trade');

INSERT OR IGNORE INTO habitat_category (habitat_category_id, habitat_name) VALUES
  (1, 'Tropical Rainforest'),
  (2, 'Mangrove Forests & Coastal Wetlands'),
  (3, 'Rivers & Freshwater Lakes'),
  (4, 'Mountain Cloud Forests'),
  (5, 'Coral Reefs & Open Ocean'),
  (6, 'Forest'),
  (7, 'Freshwater'),
  (8, 'Marine');

INSERT OR IGNORE INTO level (level_id, level_number, points_required) VALUES
  (1, 1, 0),
  (2, 2, 50),
  (3, 3, 100),
  (4, 4, 200),
  (5, 5, 350),
  (6, 6, 500),
  (7, 7, 750),
  (8, 8, 1000);

-- Badges (from AWS reference)
`;

for (const b of dataset.badges) {
  sql += `INSERT OR IGNORE INTO badge (badge_id, badge_name, badge_image_url, description, badge_type, level_required, missions_required, is_active) VALUES (${b.id}, ${escapeSql(b.badgeName)}, ${escapeSql(b.badgeImageUrl)}, ${escapeSql(b.description)}, ${escapeSql(b.badgeType)}, ${b.levelRequired || 'NULL'}, ${b.missionsRequired || 'NULL'}, 1);\n`;
}

sql += `
INSERT OR IGNORE INTO mission_type (mission_type_id, type_name) VALUES
  (1, 'Outdoor'),
  (2, 'Indoor'),
  (3, 'Discovery'),
  (4, 'Creative');

INSERT OR IGNORE INTO weather_condition (weather_condition_id, wmo_code_min, wmo_code_max, condition_name, is_outdoor_safe) VALUES
  (1, 0, 0, 'Clear Sky', 1),
  (2, 1, 3, 'Mainly Clear / Partly Cloudy', 1),
  (3, 45, 48, 'Foggy', 0),
  (4, 51, 55, 'Drizzle', 0),
  (5, 61, 65, 'Rain', 0),
  (6, 71, 77, 'Snowfall', 0),
  (7, 80, 82, 'Rain Showers', 0),
  (8, 95, 99, 'Thunderstorm', 0);

INSERT OR IGNORE INTO mission (mission_id, mission_type_id, title, description, step_1, step_2, step_3, time_limit_min, is_outdoor, is_day_only, points_reward, image_url, is_active, enabled) VALUES
  (101, 1, 'Morning Nature Spot', 'Look out into your garden, balcony, or a nearby park and spot 1 bird and 1 interesting green plant.', 'Go to a window, balcony, or outside with adult supervision.', 'Look quietly for 3 minutes to spot a bird in the sky or trees.', 'Notice 1 green plant and touch a leaf gently.', 15, 1, 1, 20, '/missions/nature-spot.png', 1, 1),
  (102, 1, 'Insect Detective', 'Search near a tree trunk or garden flower bed for 2 different tiny bugs or ants crawling around.', 'Crouch low near green foliage or soil.', 'Watch closely for movement: ants, butterflies, or beetles.', 'Sketch what they look like on your explorer journal!', 20, 1, 1, 25, '/missions/insect-detective.png', 1, 1),
  (103, 1, 'Cloud & Weather Watcher', 'Look up at the daytime sky and describe the cloud shapes and wind direction.', 'Step into an open daytime area.', 'Look up safely away from the sun and observe cloud movements.', 'Decide if it feels like rain or sunshine is coming.', 15, 1, 1, 20, '/missions/cloud-watcher.png', 1, 1),
  (104, 2, 'Rainy Day Wildlife Artist', 'Draw a colorful picture of a Malayan Tiger or Orangutan staying cozy inside the canopy.', 'Pick a blank paper and your favorite crayons or markers.', 'Draw the animal with its natural rainforest environment.', 'Write 1 cool fact you know next to your drawing.', 25, 0, 0, 20, '/missions/wildlife-artist.png', 1, 1),
  (105, 2, 'Eco-Hero Recycling Scout', 'Check around your home for 3 items (paper, plastic bottle, or cardboard) that can be recycled!', 'Walk around your room or kitchen.', 'Collect 3 recyclable items instead of throwing them in the trash.', 'Place them in your recycling bin to keep animal habitats clean.', 15, 0, 0, 25, '/missions/recycling-scout.png', 1, 1),
  (106, 2, 'Night Sound Explorer', 'Close your eyes for 2 minutes and listen carefully to nighttime sounds — crickets, rain, wind, or night birds.', 'Find a quiet, dim spot in your room.', 'Close your eyes and breathe slowly for 2 minutes.', 'Identify at least 2 natural sounds you heard in the dark.', 10, 0, 0, 20, '/missions/night-sound.png', 1, 1);

-- ── 31 Animals & Media ────────────────────────────────────────────────────────
`;

const groupMap = {
  'mammals': 1,
  'amphibians': 2,
  'birds': 3,
  'reptiles': 4,
  'insects': 5,
  'marine & freshwater': 6
};

const statusMap = {
  'LC': 1,
  'NT': 2,
  'VU': 3,
  'EN': 4,
  'CR': 5
};

const threatMap = {
  'hunting & poaching': 1,
  'habitat loss & deforestation': 2,
  'climate change': 3,
  'pollution': 4,
  'human-wildlife conflict': 5,
  'losing their homes': 6,
  'plastic & marine pollution': 7,
  'illegal pet trade': 8
};

const habitatMap = {
  'tropical rainforest': 1,
  'mangrove forests & coastal wetlands': 2,
  'rivers & freshwater lakes': 3,
  'mountain cloud forests': 4,
  'coral reefs & open ocean': 5,
  'forest': 6,
  'freshwater': 7,
  'marine': 8
};

// 1. Images
for (const a of dataset.animals) {
  const imgId = a.id;
  const localUrl = a.imageUrl?.replace('https://biowira.dpdns.org', '') || a.imageUrl;
  sql += `INSERT OR IGNORE INTO image (image_id, url, title, author_name, author_url, source_name, source_url, license_name, license_url) VALUES (${imgId}, ${escapeSql(localUrl)}, ${escapeSql(a.imageTitle)}, ${escapeSql(a.imageCreatorName)}, ${escapeSql(a.imageCreatorUrl)}, ${escapeSql(a.imageSourceName)}, ${escapeSql(a.imageSourceUrl)}, ${escapeSql(a.imageLicenseName)}, ${escapeSql(a.imageLicenseUrl)});\n`;
}

// 2. Animals
for (const a of dataset.animals) {
  const gId = groupMap[String(a.className).toLowerCase()] || 1;
  const csCode = a.conservationCode?.trim() || 'LC';
  const csId = statusMap[csCode] || 1;
  const slug = a.commonName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const avatar = `/avatars/${slug}.png`;
  const localUrl = a.imageUrl?.replace('https://biowira.dpdns.org', '') || a.imageUrl;
  sql += `INSERT OR REPLACE INTO animal (animal_id, common_name, scientific_name, group_id, diet, lifespan, description, conservation_status_id, image_url, avatar_path, image_id) VALUES (${a.id}, ${escapeSql(a.commonName)}, ${escapeSql(a.scientificName)}, ${gId}, ${escapeSql(a.diet)}, ${escapeSql(a.lifespan)}, ${escapeSql(a.description)}, ${csId}, ${escapeSql(localUrl)}, ${escapeSql(avatar)}, ${a.id});\n`;
}

// 3. Threats
sql += `\n-- Animal Threats\n`;
let tdId = 1;
for (const a of dataset.animals) {
  if (Array.isArray(a.threats)) {
    for (const t of a.threats) {
      const catId = threatMap[String(t.threatName).toLowerCase()] || 2;
      sql += `INSERT OR IGNORE INTO threat_detail (threat_detail_id, animal_id, threat_category_id, explanation, priority) VALUES (${tdId++}, ${a.id}, ${catId}, ${escapeSql(t.explanation)}, 1);\n`;
    }
  }
}

// 4. Habitats
sql += `\n-- Animal Habitats\n`;
let hdId = 1;
for (const a of dataset.animals) {
  if (Array.isArray(a.habitats)) {
    for (const h of a.habitats) {
      const catId = habitatMap[String(h.habitatName).toLowerCase()] || 1;
      const emoji = h.emoji || '🌿';
      sql += `INSERT OR IGNORE INTO habitat_detail (habitat_detail_id, animal_id, habitat_category_id, priority, emoji) VALUES (${hdId++}, ${a.id}, ${catId}, 1, ${escapeSql(emoji)});\n`;
    }
  }
}

// 5. Occurrences
sql += `\n-- Animal Occurrences\n`;
let occId = 1;
for (const o of dataset.occurrences) {
  for (const item of o.items) {
    const createdAt = item.createdAt ? escapeSql(item.createdAt) : 'CURRENT_TIMESTAMP';
    sql += `INSERT OR REPLACE INTO animal_occurrence (animal_occurrence_id, animal_id, latitude, longitude, created_at) VALUES (${occId++}, ${o.animalId}, ${item.latitude}, ${item.longitude}, ${createdAt});\n`;
  }
}

// 6. Fun Facts
sql += `\n-- Fun Facts\n`;
for (const f of dataset.funFacts) {
  const lId = f.unlockLevelNumber || 1;
  sql += `INSERT OR IGNORE INTO animal_fun_fact (animal_fun_fact_id, animal_id, emoji, fact_text, fact_image_url, fact_order, level_id) VALUES (${f.id}, ${f.animalId || 1}, ${escapeSql(f.emoji)}, ${escapeSql(f.factText)}, ${escapeSql(f.factImageUrl)}, ${f.factOrder || 1}, ${lId});\n`;
}

// 7. Quizzes, Questions, and Choices
sql += `\n-- Quizzes\n`;
sql += `INSERT OR IGNORE INTO quiz (quiz_id, title, description, topic) VALUES (1, 'Rainforest Wildlife Quiz', 'Test your knowledge about Malaysian wildlife!', 'Biodiversity');\n`;

// Insert AWS quizzes
let qIdCounter = 1;
let choiceIdCounter = 1;
const insertedQuestions = new Set();

for (const qGroup of dataset.quizzes) {
  for (const q of qGroup.questions) {
    const qKey = `${q.animalId}:${q.questionText}`;
    if (!insertedQuestions.has(qKey)) {
      insertedQuestions.add(qKey);
      const curQId = qIdCounter++;
      sql += `INSERT OR IGNORE INTO question (question_id, quiz_id, animal_id, question_text, explanation, difficulty) VALUES (${curQId}, 1, ${q.animalId}, ${escapeSql(q.questionText)}, ${escapeSql(q.explanation)}, ${escapeSql(q.difficulty)});\n`;
      for (const ch of q.choices) {
        sql += `INSERT OR IGNORE INTO choice (choice_id, question_id, choice_label, choice_text, is_correct) VALUES (${choiceIdCounter++}, ${curQId}, ${escapeSql(ch.choiceLabel)}, ${escapeSql(ch.choiceText)}, ${ch.isCorrect ? 1 : 0});\n`;
      }
    }
  }
}

// Insert mock complement questions
for (const mq of mockQuestions) {
  const qKey = `${mq.animalId}:${mq.questionText}`;
  if (!insertedQuestions.has(qKey)) {
    insertedQuestions.add(qKey);
    const curQId = qIdCounter++;
    sql += `INSERT OR IGNORE INTO question (question_id, quiz_id, animal_id, question_text, explanation, difficulty) VALUES (${curQId}, 1, ${mq.animalId}, ${escapeSql(mq.questionText)}, ${escapeSql(mq.explanation)}, ${escapeSql(mq.difficulty)});\n`;
    for (const ch of mq.choices) {
      sql += `INSERT OR IGNORE INTO choice (choice_id, question_id, choice_label, choice_text, is_correct) VALUES (${choiceIdCounter++}, ${curQId}, ${escapeSql(ch.label)}, ${escapeSql(ch.text)}, ${ch.isCorrect ? 1 : 0});\n`;
    }
  }
}

// 8. TTS Audio Cache (all 31 animals with authentic timings)
sql += `\n-- TTS Audio Cache\n`;
for (const item of dataset.tts) {
  const timingsJson = JSON.stringify(item.timings || []);
  sql += `INSERT OR REPLACE INTO tts_audio_cache (text_hash, voice_id, model_id, speed, mime_type, audio_content, timings_json) VALUES (${escapeSql(item.textHash)}, ${escapeSql(item.voiceId || 'rCmVtv8cYU60uhlsOo1M')}, ${escapeSql(item.modelId || 'eleven_multilingual_v2')}, ${item.speed || 1.0}, 'audio/mpeg', X'00', ${escapeSql(timingsJson)});\n`;
}

fs.writeFileSync('worker/schema.sql', sql, 'utf8');
console.log('Successfully generated worker/schema.sql! Total size:', sql.length, 'bytes');

