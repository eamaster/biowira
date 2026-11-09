-- BioWira Cloudflare D1 Database Schema and Seed Data
-- Database: biowira-db

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

-- ── Base Seeds ────────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO animal_group (group_id, group_name) VALUES
  (1, 'Mammals'),
  (2, 'Birds'),
  (3, 'Reptiles'),
  (4, 'Amphibians'),
  (5, 'Marine & Freshwater'),
  (6, 'Insects');

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
  (5, 'Human-Wildlife Conflict');

INSERT OR IGNORE INTO habitat_category (habitat_category_id, habitat_name) VALUES
  (1, 'Tropical Rainforest'),
  (2, 'Mangrove Forests & Coastal Wetlands'),
  (3, 'Rivers & Freshwater Lakes'),
  (4, 'Mountain Cloud Forests'),
  (5, 'Coral Reefs & Open Ocean');

INSERT OR IGNORE INTO level (level_id, level_number, points_required) VALUES
  (1, 1, 0),
  (2, 2, 50),
  (3, 3, 100),
  (4, 4, 200),
  (5, 5, 350),
  (6, 6, 500),
  (7, 7, 750),
  (8, 8, 1000);

INSERT OR IGNORE INTO badge (badge_id, badge_name, badge_image_url, description, badge_type, level_required, missions_required, is_active) VALUES
  (1, 'Novice Explorer', '/badges/level-1.png', 'Begin your wildlife adventure!', 'level', 1, NULL, 1),
  (2, 'Forest Scout', '/badges/level-2.png', 'Reach Level 2 in your journey!', 'level', 2, NULL, 1),
  (3, 'Wildlife Tracker', '/badges/level-3.png', 'Reach Level 3 explorer status!', 'level', 3, NULL, 1),
  (4, 'Nature Guardian', '/badges/level-4.png', 'Reach Level 4 master status!', 'level', 4, NULL, 1),
  (5, 'Master Ranger', '/badges/level-5.png', 'Reach Level 5 elite ranger status!', 'level', 5, NULL, 1),
  (6, 'First Mission Done', '/badges/mission-1.png', 'Completed your first conservation mission!', 'mission', NULL, 1, 1),
  (7, 'Mission Triple', '/badges/mission-3.png', 'Complete 3 conservation missions!', 'mission', NULL, 3, 1),
  (8, 'Mission Champion', '/badges/mission-5.png', 'Complete 5 conservation missions!', 'mission', NULL, 5, 1);

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

-- Missions (Outdoor & Indoor)
INSERT OR IGNORE INTO mission (mission_id, mission_type_id, title, description, step_1, step_2, step_3, time_limit_min, is_outdoor, is_day_only, points_reward, image_url, is_active, enabled) VALUES
  (101, 1, 'Morning Nature Spot', 'Look out into your garden, balcony, or a nearby park and spot 1 bird and 1 interesting green plant.', 'Go to a window, balcony, or outside with adult supervision.', 'Look quietly for 3 minutes to spot a bird in the sky or trees.', 'Notice 1 green plant and touch a leaf gently.', 15, 1, 1, 20, '/missions/nature-spot.png', 1, 1),
  (102, 1, 'Insect Detective', 'Search near a tree trunk or garden flower bed for 2 different tiny bugs or ants crawling around.', 'Crouch low near green foliage or soil.', 'Watch closely for movement: ants, butterflies, or beetles.', 'Sketch what they look like on your explorer journal!', 20, 1, 1, 25, '/missions/insect-detective.png', 1, 1),
  (103, 1, 'Cloud & Weather Watcher', 'Look up at the daytime sky and describe the cloud shapes and wind direction.', 'Step into an open daytime area.', 'Look up safely away from the sun and observe cloud movements.', 'Decide if it feels like rain or sunshine is coming.', 15, 1, 1, 20, '/missions/cloud-watcher.png', 1, 1),
  (104, 2, 'Rainy Day Wildlife Artist', 'Draw a colorful picture of a Malayan Tiger or Orangutan staying cozy inside the canopy.', 'Pick a blank paper and your favorite crayons or markers.', 'Draw the animal with its natural rainforest environment.', 'Write 1 cool fact you know next to your drawing.', 25, 0, 0, 20, '/missions/wildlife-artist.png', 1, 1),
  (105, 2, 'Eco-Hero Recycling Scout', 'Check around your home for 3 items (paper, plastic bottle, or cardboard) that can be recycled!', 'Walk around your room or kitchen.', 'Collect 3 recyclable items instead of throwing them in the trash.', 'Place them in your recycling bin to keep animal habitats clean.', 15, 0, 0, 25, '/missions/recycling-scout.png', 1, 1),
  (106, 2, 'Night Sound Explorer', 'Close your eyes for 2 minutes and listen carefully to nighttime sounds — crickets, rain, wind, or night birds.', 'Find a quiet, dim spot in your room.', 'Close your eyes and breathe slowly for 2 minutes.', 'Identify at least 2 natural sounds you heard in the dark.', 10, 0, 0, 20, '/missions/night-sound.png', 1, 1);

-- Animals & Details
INSERT OR IGNORE INTO image (image_id, url, title, author_name, source_name, license_name) VALUES
  (1, '/assets/animals/malayan-tiger.webp', 'Malayan Tiger in Taman Negara', 'BioWira Conservation Team', 'WWF Malaysia', 'CC BY-SA 4.0'),
  (2, '/assets/animals/hornbill.webp', 'Rhinoceros Hornbill perched', 'Sarawak Forestry', 'Borneo Wildlife', 'CC BY-SA 4.0'),
  (3, '/assets/animals/orangutan.webp', 'Bornean Orangutan canopy nest', 'Sepilok Center', 'Sabah Wildlife', 'CC BY-SA 4.0'),
  (4, '/assets/animals/tapir.webp', 'Malayan Tapir foraging', 'Perhilitan Malaysia', 'Wildlife Dept', 'CC BY-SA 4.0'),
  (5, '/assets/animals/proboscis-monkey.webp', 'Proboscis Monkey on mangrove branch', 'Kinabatangan Reserve', 'Borneo Nature', 'CC BY-SA 4.0'),
  (6, '/assets/animals/sun-bear.webp', 'Bornean Sun Bear climbing tree', 'BSBCC Sabah', 'Sun Bear Center', 'CC BY-SA 4.0'),
  (7, '/assets/animals/sea-turtle.webp', 'Green Sea Turtle swimming off Terengganu', 'SEATRU Malaysia', 'Turtle Sanctuary', 'CC BY-SA 4.0'),
  (8, '/assets/animals/pangolin.webp', 'Sunda Pangolin curled up', 'Wildlife Rescue Malaysia', 'Perhilitan', 'CC BY-SA 4.0'),
  (9, '/assets/animals/mousedeer.webp', 'Lesser Mousedeer in forest floor', 'Belum-Temengor Reserve', 'Forestry Dept', 'CC BY-SA 4.0'),
  (10, '/assets/animals/dugong.webp', 'Dugong in Johor seagrass meadow', 'MareCet Malaysia', 'Marine Mammal Research', 'CC BY-SA 4.0'),
  (11, '/assets/animals/crocodile.webp', 'Estuarine Crocodile basking', 'Sarawak River Reserve', 'Sarawak Forestry', 'CC BY-SA 4.0'),
  (12, '/assets/animals/sea-turtle-hawksbill.webp', 'Hawksbill Turtle on coral reef', 'Tioman Marine Park', 'Dept of Fisheries', 'CC BY-SA 4.0'),
  (13, '/assets/discovery-animals/larut-torrent-frog.webp', 'Larut Torrent Frog on mountain stream', 'BioWira Conservation Team', 'Forestry Dept Malaysia', 'CC BY-SA 4.0'),
  (14, '/assets/discovery-animals/asian-common-toad.webp', 'Asian Common Toad in forest leaf litter', 'BioWira Conservation Team', 'Borneo Wildlife Dept', 'CC BY-SA 4.0'),
  (15, '/assets/discovery-animals/wallaces-flying-frog.webp', 'Wallace''s Flying Frog gliding canopy', 'BioWira Conservation Team', 'Sarawak Forestry', 'CC BY-SA 4.0');

INSERT OR IGNORE INTO animal (animal_id, common_name, scientific_name, group_id, diet, lifespan, description, conservation_status_id, image_url, avatar_path, image_id) VALUES
  (1, 'Malayan Tiger', 'Panthera tigris jacksoni', 1, 'Carnivore', '15–20 yrs', 'The Malayan Tiger is Malaysia national animal. It has brilliant orange fur with black stripes — and no two tigers have the same stripe pattern!', 5, '/assets/animals/malayan-tiger.webp', '/avatars/tiger.png', 1),
  (2, 'Hornbill', 'Buceros rhinoceros', 2, 'Omnivore', '35–40 yrs', 'The Rhinoceros Hornbill is the iconic state bird of Sarawak. It features a bright red-orange horn-like casque resting atop its large beak.', 3, '/assets/animals/hornbill.webp', '/avatars/hornbill.png', 2),
  (3, 'Bornean Orangutan', 'Pongo pygmaeus', 1, 'Omnivore', '35–45 yrs', 'Orangutan means "person of the forest" in Malay. They are one of humanity closest cousins and make cozy leafy nests in high tree canopies each night.', 5, '/assets/animals/orangutan.webp', '/avatars/orangutan.png', 3),
  (4, 'Malayan Tapir', 'Tapirus indicus', 1, 'Herbivore', '25–30 yrs', 'With its unique black-and-white color blocking, the Malayan Tapir uses its flexible snout like a snorkel when swimming and for plucking tender shoots.', 4, '/assets/animals/tapir.webp', '/avatars/tapir.png', 4),
  (5, 'Proboscis Monkey', 'Nasalis larvatus', 1, 'Herbivore', '15–20 yrs', 'Found only on Borneo island, male proboscis monkeys have enormous noses that echo their calls through mangrove rivers and make them champion swimmers.', 4, '/assets/animals/proboscis-monkey.webp', '/avatars/proboscis.png', 5),
  (6, 'Sun Bear', 'Helarctos malayanus', 1, 'Omnivore', '20–25 yrs', 'The Sun Bear is the smallest bear in the world! It has a distinctive gold horseshoe crescent on its chest and a super long tongue for scooping honey.', 3, '/assets/animals/sun-bear.webp', '/avatars/sunbear.png', 6),
  (7, 'Green Sea Turtle', 'Chelonia mydas', 3, 'Herbivore', '60–80 yrs', 'Green Sea Turtles migrate thousands of miles across oceans and navigate back to the exact Malaysian beaches where they were born to lay their eggs.', 4, '/assets/animals/sea-turtle.webp', '/avatars/turtle.png', 7),
  (8, 'Sunda Pangolin', 'Manis javanica', 1, 'Insectivore', '15–20 yrs', 'Covered in tough keratin scales like overlapping roof tiles, pangolins roll into a tight armored ball when startled and eat thousands of ants each day.', 5, '/assets/animals/pangolin.webp', '/avatars/pangolin.png', 8),
  (9, 'Lesser Mousedeer', 'Tragulus kanchil', 1, 'Herbivore', '10–12 yrs', 'The mouse-deer (Sang Kancil) is legendary in Malaysian folklore for its wisdom and trickery. It is one of the smallest hoofed mammals on the planet.', 1, '/assets/animals/mousedeer.webp', '/avatars/mousedeer.png', 9),
  (10, 'Dugong', 'Dugong dugon', 1, 'Herbivore', '50–70 yrs', 'Often called sea cows, gentle dugongs graze peacefully on underwater seagrass meadows in the warm coastal waters of Johor and Sabah.', 3, '/assets/animals/dugong.webp', '/avatars/dugong.png', 10),
  (11, 'Estuarine Crocodile', 'Crocodylus porosus', 3, 'Carnivore', '70+ yrs', 'The Saltwater Crocodile is the largest living reptile in the world, with prehistoric armor and the strongest recorded bite force on Earth.', 1, '/assets/animals/crocodile.webp', '/avatars/crocodile.png', 11),
  (12, 'Hawksbill Sea Turtle', 'Eretmochelys imbricata', 3, 'Carnivore', '50–60 yrs', 'Famous for its distinctive bird-like hooked beak and beautiful amber shell, this turtle keeps coral reefs healthy by eating sea sponges.', 5, '/assets/animals/sea-turtle-hawksbill.webp', '/avatars/hawksbill.png', 12),
  (13, 'Larut Torrent Frog', 'Limnonectes larutensis', 4, 'Insectivore', '5–8 yrs', 'The Larut Torrent Frog lives near rushing, fast-flowing mountain streams in the Larut Hills of Perak. Its webbed feet and muscular legs allow it to leap between slippery wet rocks without falling.', 3, '/assets/discovery-animals/larut-torrent-frog.webp', '/assets/discovery-animals/larut-torrent-frog.webp', 13),
  (14, 'Asian Common Toad', 'Duttaphrynus melanostictus', 4, 'Insectivore', '5–10 yrs', 'The Asian Common Toad is a common nocturnal amphibian found in rainforest undergrowth, gardens, and near forest streams across Malaysia, eating lots of insects every night.', 1, '/assets/discovery-animals/asian-common-toad.webp', '/assets/discovery-animals/asian-common-toad.webp', 14),
  (15, 'Wallace''s Flying Frog', 'Rhacophorus nigropalmatus', 4, 'Carnivore', '5–8 yrs', 'Wallace''s Flying Frog can glide through the air using huge webbed feet and flaps of skin on its limbs, gliding from tree to tree in the tropical rainforest.', 1, '/assets/discovery-animals/wallaces-flying-frog.webp', '/assets/discovery-animals/wallaces-flying-frog.webp', 15);

-- Animal occurrences (sightings for Discover map)
INSERT OR IGNORE INTO animal_occurrence (animal_id, latitude, longitude, location_name, observed_at, notes) VALUES
  (1, 4.38, 102.40, 'Taman Negara National Park', '2024-03-15', 'Camera trap sighting in primary rainforest'),
  (1, 5.52, 101.45, 'Royal Belum State Park', '2024-05-20', 'Pugmark track verified along riverbank'),
  (2, 1.60, 110.35, 'Kubah National Park, Sarawak', '2024-04-10', 'Pair observed flying across canopy'),
  (3, 5.86, 117.95, 'Sepilok Orangutan Sanctuary, Sabah', '2024-02-18', 'Mother and juvenile feeding in fig tree'),
  (4, 3.82, 102.35, 'Krau Wildlife Reserve, Pahang', '2024-06-01', 'Tracks photographed at salt lick'),
  (5, 5.53, 118.25, 'Kinabatangan River, Sabah', '2024-04-22', 'Troop resting in mangrove tree branches'),
  (6, 5.85, 117.94, 'Bornean Sun Bear Conservation Centre', '2024-03-12', 'Adult climbing dipterocarp trunk'),
  (7, 5.60, 103.02, 'Redang Island Marine Park, Terengganu', '2024-07-04', 'Nesting female tagged by rangers'),
  (8, 2.50, 103.35, 'Endau-Rompin National Park, Johor', '2024-01-29', 'Night camera trap verified active forager'),
  (9, 4.45, 102.30, 'Taman Negara, Pahang', '2024-05-14', 'Sighting near forest walking trail'),
  (10, 2.25, 104.10, 'Sibu Island Seagrass Beds, Johor', '2024-06-19', 'Acoustic monitoring detected feeding'),
  (11, 1.55, 110.50, 'Batang Lupar River, Sarawak', '2024-03-08', 'Adult observed basking at low tide'),
  (12, 2.82, 104.17, 'Tioman Island Marine Park, Pahang', '2024-07-15', 'Observed feeding on sponges near reef wall'),
  (13, 4.86, 100.75, 'Bukit Larut (Maxwell Hill), Perak', '2024-05-10', 'Spotted resting on mossy boulder near cascading waterfall'),
  (14, 3.15, 101.70, 'FRIM Forest Reserve, Selangor', '2024-06-12', 'Active in moist rainforest leaf litter after dusk'),
  (15, 1.60, 110.15, 'Kubah National Park, Sarawak', '2024-08-20', 'Gliding from high canopy to lower branch');

-- Threats
INSERT OR IGNORE INTO threat_detail (animal_id, threat_category_id, explanation, priority) VALUES
  (1, 1, 'Illegal poaching for body parts threatens remaining wild tigers.', 1),
  (1, 2, 'Forest fragmentation isolates breeding populations.', 2),
  (2, 2, 'Loss of mature hollow nesting trees due to logging.', 1),
  (3, 2, 'Oil palm plantation expansion shrinks natural canopy corridors.', 1),
  (4, 5, 'Highway and road collisions when crossing between forest patches.', 1),
  (5, 2, 'Clearing of coastal mangrove forests for development.', 1),
  (6, 1, 'Poaching and capture for the illegal pet trade.', 1),
  (7, 4, 'Ocean plastics and entanglement in commercial fishing nets.', 1),
  (8, 1, 'Pangolins are the most trafficked wild mammals in the world.', 1),
  (9, 2, 'Forest edge clearance and feral predator attacks.', 1),
  (10, 4, 'Damage to seagrass beds by boat propellers and coastal siltation.', 1),
  (11, 5, 'Hunting and conflict near human riverside settlements.', 1),
  (12, 3, 'Coral bleaching and rising sand temperatures affecting hatchling gender.', 1),
  (13, 2, 'Water pollution and disturbance to clean mountain stream habitats.', 1),
  (14, 2, 'Agricultural clearing and loss of moist microclimates.', 1),
  (15, 2, 'Logging of tall primary emergent trees required for gliding.', 1);

-- Habitats
INSERT OR IGNORE INTO habitat_detail (animal_id, habitat_category_id, priority, emoji) VALUES
  (1, 1, 1, '🌲'),
  (2, 1, 1, '🌳'),
  (3, 1, 1, '🌿'),
  (4, 1, 1, '🌱'),
  (5, 2, 1, '🌊'),
  (6, 1, 1, '🍃'),
  (7, 5, 1, '🐢'),
  (8, 1, 1, '🍂'),
  (9, 1, 1, '🍄'),
  (10, 5, 1, '🌊'),
  (11, 3, 1, '🐊'),
  (12, 5, 1, '🪸'),
  (13, 1, 1, '🐸'),
  (14, 1, 1, '🐸'),
  (15, 1, 1, '🐸');

-- Fun Facts
INSERT OR IGNORE INTO animal_fun_fact (animal_fun_fact_id, animal_id, emoji, fact_text, fact_image_url, fact_order, level_id) VALUES
  (1, 1, '🐯', 'One tiger roar can be heard over 3 kilometers away through the dense rainforest!', '/assets/facts/tiger-roar.webp', 1, 1),
  (2, 1, '🐾', 'Tiger stripes are like human fingerprints — no two tigers have the exact same pattern!', '/assets/facts/tiger-stripes.webp', 2, 2),
  (3, 2, '🪶', 'Hornbills use their giant hollow casque as an amplifier to make loud honking calls that ring through the forest!', '/assets/facts/hornbill-call.webp', 1, 1),
  (4, 2, '🍒', 'Hornbills are called "farmers of the forest" because they spread fruit seeds across miles of canopy!', '/assets/facts/hornbill-seeds.webp', 2, 3),
  (5, 3, '🦧', 'Orangutans make brand new leafy sleeping nests high in tree canopies every single night in just 10 minutes!', '/assets/facts/orangutan-nest.webp', 1, 1),
  (6, 3, '🧠', 'Orangutans use giant leaves as umbrellas when it pours rain and use sticks to scoop termites!', '/assets/facts/orangutan-tools.webp', 2, 2),
  (7, 4, '🌿', 'Baby tapirs are born with brown coats and white polka dots like watermelons for perfect camouflage!', '/assets/facts/tapir-baby.webp', 1, 1),
  (8, 4, '🏊', 'Tapirs are extraordinary swimmers and can use their long bendy snouts like a diver snorkel underwater!', '/assets/facts/tapir-snout.webp', 2, 3),
  (9, 5, '🐒', 'Proboscis monkeys have webbed feet and hands which make them the best swimmers of all monkeys!', '/assets/facts/proboscis-swim.webp', 1, 1),
  (10, 6, '🍯', 'Sun Bears have an ultra-long 25cm tongue designed specifically for raiding bee hives for delicious honey!', '/assets/facts/sunbear-tongue.webp', 1, 1),
  (11, 7, '🏝️', 'Green Sea Turtles remember the Earth magnetic field to swim thousands of miles back to their exact birth beach!', '/assets/facts/turtle-nesting.webp', 1, 1),
  (12, 8, '🛡️', 'A pangolin can roll up so tightly that even a hungry adult tiger cannot pry it open!', '/assets/facts/pangolin-roll.webp', 1, 1),
  (13, 9, '🦌', 'Sang Kancil, the Mousedeer, is so tiny it weighs only 2 kilograms — about the size of a little rabbit!', '/assets/facts/mousedeer-size.webp', 1, 1),
  (14, 10, '🌱', 'A single adult dugong can graze on up to 40 kilograms of green seagrass every single day!', '/assets/facts/dugong-eat.webp', 1, 1),
  (15, 11, '🐊', 'Saltwater crocodiles have iron-strong jaws that exert over 3,700 pounds of pressure per square inch!', '/assets/facts/croc-jaws.webp', 1, 1),
  (16, 12, '🪸', 'Hawksbill sea turtles eat toxic sea sponges that other creatures cannot touch, protecting vulnerable coral reefs!', '/assets/facts/hawksbill-reef.webp', 1, 1);

-- Quizzes
INSERT OR IGNORE INTO quiz (quiz_id, title, description, topic) VALUES
  (1, 'Rainforest Animals Quiz', 'Test your knowledge about amazing Malaysian rainforest wildlife!', 'Rainforest Animals'),
  (2, 'Sky & River Explorers', 'Discover fascinating facts about birds, crocodiles, and marine life!', 'Birds & Marine'),
  (3, 'Wildlife Conservation Heroes', 'Learn how young rangers can protect our endangered species!', 'Conservation');

-- Questions & Choices
INSERT OR IGNORE INTO question (question_id, quiz_id, animal_id, question_text, explanation, difficulty, image_url) VALUES
  (1, 1, 1, 'What is Malaysia''s national animal?', 'The Malayan Tiger appears prominently on Malaysia''s coat of arms and is a national symbol.', 'easy', '/assets/quiz/q1.webp'),
  (2, 1, 3, 'What does the word "Orangutan" mean in Malay?', '"Orang" means person, and "hutan" means forest, hence "person of the forest".', 'easy', '/assets/quiz/q2.webp'),
  (3, 1, 4, 'What do baby Malayan tapirs look like when they are born?', 'Baby tapirs have white stripes and spots like watermelons for rainforest camouflage.', 'medium', '/assets/quiz/q3.webp'),
  (4, 1, 6, 'Why does the Sun Bear have such an extraordinarily long tongue?', 'Its 25cm tongue allows it to extract honey and termites from deep inside tree hollows.', 'medium', '/assets/quiz/q4.webp'),
  (5, 2, 2, 'Why are Hornbills often called the "farmers of the rainforest"?', 'They eat whole jungle fruits and spread healthy seeds across long flying distances.', 'easy', '/assets/quiz/q5.webp'),
  (6, 2, 5, 'What special physical trait makes Proboscis Monkeys expert swimmers?', 'They have webbed toes and fingers that paddle efficiently through mangrove rivers.', 'medium', '/assets/quiz/q6.webp'),
  (7, 2, 11, 'Which reptile in Malaysia possesses the most powerful bite in the world?', 'The Saltwater Crocodile has the highest measured bite force of any living creature.', 'easy', '/assets/quiz/q7.webp'),
  (8, 3, 7, 'How do female Green Sea Turtles find their way back to their birth beach?', 'They navigate using Earth''s magnetic field lines and ocean currents.', 'medium', '/assets/quiz/q8.webp'),
  (9, 3, 8, 'What armor covers the body of a Sunda Pangolin?', 'Their body is covered in tough keratin scales, the same protein found in human fingernails!', 'easy', '/assets/quiz/q9.webp'),
  (10, 3, 10, 'What is the main food source of Dugongs in coastal waters?', 'Dugongs are strict vegetarians that graze exclusively on lush seagrass beds.', 'easy', '/assets/quiz/q10.webp');

INSERT OR IGNORE INTO choice (question_id, choice_label, choice_text, is_correct) VALUES
  (1, 'A', 'Orangutan', 0),
  (1, 'B', 'Malayan Tiger', 1),
  (1, 'C', 'Sun Bear', 0),
  (1, 'D', 'Malayan Tapir', 0),

  (2, 'A', 'Tree Climber', 0),
  (2, 'B', 'Red Giant', 0),
  (2, 'C', 'Person of the Forest', 1),
  (2, 'D', 'Gentle King', 0),

  (3, 'A', 'Completely black and white like adults', 0),
  (3, 'B', 'Spotted and striped like a watermelon', 1),
  (3, 'C', 'Bright orange like a tiger', 0),
  (3, 'D', 'Covered in golden fur', 0),

  (4, 'A', 'To scoop honey and insects from tree hollows', 1),
  (4, 'B', 'To cool down in the heat', 0),
  (4, 'C', 'To catch fish in rivers', 0),
  (4, 'D', 'To make loud roaring sounds', 0),

  (5, 'A', 'They plant trees with their feet', 0),
  (5, 'B', 'They disperse large fruit seeds throughout the canopy', 1),
  (5, 'C', 'They eat harmful insects on crops', 0),
  (5, 'D', 'They dig soil for worms', 0),

  (6, 'A', 'Webbed toes and fingers', 1),
  (6, 'B', 'Gills for breathing underwater', 0),
  (6, 'C', 'Flippers like seals', 0),
  (6, 'D', 'A waterproof shell', 0),

  (7, 'A', 'Monitor Lizard', 0),
  (7, 'B', 'Estuarine Crocodile', 1),
  (7, 'C', 'Reticulated Python', 0),
  (7, 'D', 'King Cobra', 0),

  (8, 'A', 'By following GPS satellites', 0),
  (8, 'B', 'By smelling coastal trees', 0),
  (8, 'C', 'By sensing Earth''s magnetic field', 1),
  (8, 'D', 'By listening to wave echoes', 0),

  (9, 'A', 'Sharp bone spikes', 0),
  (9, 'B', 'Tough keratin scales', 1),
  (9, 'C', 'Thick iron plates', 0),
  (9, 'D', 'Rough sandpaper skin', 0),

  (10, 'A', 'Seagrass meadows', 1),
  (10, 'B', 'Small fish and crabs', 0),
  (10, 'C', 'Seaweed and coral', 0),
  (10, 'D', 'Plankton and jellyfish', 0);
