import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  DB: D1Database
  GEMINI_API_KEY?: string
  ELEVENLABS_API_KEY?: string
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS middleware allowing Pages and local preview
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'X-Session-Token', 'Authorization'],
  exposeHeaders: ['Content-Length', 'X-Session-Token'],
}))

// Helper: Profile code generator
const PREFIXES = ['TIG', 'FOX', 'EAG', 'OWL', 'BEA', 'WLF', 'LNX', 'DEE', 'HAR', 'OTR']
function generateProfileCode(): string {
  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)]
  const digits = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-${digits}`
}

// Helper: URL-safe Session Token generator
function generateSessionToken(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

// Helper: SHA-256 Hash
async function computeHash(text: string, voiceId: string, modelId: string, speed: number): Promise<string> {
  const input = `${text}:${voiceId}:${modelId}:${speed.toFixed(2)}`
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Helper: Authenticate session token
async function authenticate(db: D1Database, token: string | null | undefined) {
  if (!token || typeof token !== 'string' || token.trim() === '') return null
  const row = await db.prepare(`
    SELECT p.profile_id AS profileId, p.display_name AS displayName, p.profile_code AS profileCode,
           pp.current_level AS currentLevel, pp.total_points AS totalPoints,
           pp.total_quizzes AS totalQuizzes, pp.total_missions AS totalMissions,
           pp.streak_days AS streakDays
    FROM profile_session ps
    JOIN profile p ON p.profile_id = ps.profile_id
    JOIN profile_progress pp ON pp.profile_id = p.profile_id
    WHERE ps.session_token = ? AND ps.is_active = 1
  `).bind(token).first()

  if (row) {
    await db.prepare(`UPDATE profile_session SET last_used_at = CURRENT_TIMESTAMP WHERE session_token = ?`).bind(token).run()
  }
  return row as any
}

// ── Root & Health ─────────────────────────────────────────────────────────────
app.get('/', (c) => c.json({ name: 'BioWira Serverless API', version: '2.0.0', status: 'healthy' }))
app.get('/health', (c) => c.json({ status: 'ok' }))

// ── Animals Endpoints ─────────────────────────────────────────────────────────

// GET /api/v1/animals & GET /api/v2/animals
const getAnimalsHandler = async (c: any, isV2 = false) => {
  const animalClass = c.req.query('animalClass')
  const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!, 10) : null
  const offset = c.req.query('offset') ? parseInt(c.req.query('offset')!, 10) : null

  let query = `
    SELECT a.animal_id AS id,
           a.animal_id AS animalId,
           a.common_name AS commonName,
           a.scientific_name AS scientificName,
           g.group_name AS animalClass,
           cs.code AS statusCode,
           cs.label AS statusLabel,
           a.image_url AS imageUrl,
           a.avatar_path AS avatarPath,
           i.title AS imageTitle,
           i.author_name AS imageCreatorName,
           i.author_url AS imageCreatorUrl,
           i.source_name AS imageSourceName,
           i.source_url AS imageSourceUrl,
           i.license_name AS imageLicenseName,
           i.license_url AS imageLicenseUrl
    FROM animal a
    LEFT JOIN animal_group g ON g.group_id = a.group_id
    LEFT JOIN conservation_status cs ON cs.conservation_status_id = a.conservation_status_id
    LEFT JOIN image i ON i.image_id = a.image_id
  `
  const params: any[] = []

  if (animalClass) {
    query += ` WHERE LOWER(g.group_name) = LOWER(?)`
    params.push(animalClass)
  }

  query += ` ORDER BY a.animal_id`

  let totalCount = 0
  if (isV2) {
    const countQuery = `
      SELECT COUNT(*) AS count
      FROM animal a
      LEFT JOIN animal_group g ON g.group_id = a.group_id
      ${animalClass ? 'WHERE LOWER(g.group_name) = LOWER(?)' : ''}
    `
    const countRes: any = await (animalClass
      ? c.env.DB.prepare(countQuery).bind(animalClass).first()
      : c.env.DB.prepare(countQuery).first())
    totalCount = countRes?.count ?? 0
  }

  if (limit !== null) {
    query += ` LIMIT ?`
    params.push(limit)
  }
  if (offset !== null) {
    query += ` OFFSET ?`
    params.push(offset)
  }

  const stmt = params.length > 0 ? c.env.DB.prepare(query).bind(...params) : c.env.DB.prepare(query)
  const { results } = await stmt.all()

  if (isV2) {
    return c.json({ items: results ?? [], totalCount: totalCount || (results?.length ?? 0) })
  }
  return c.json(results ?? [])
}

app.get('/api/v1/animals', (c) => getAnimalsHandler(c, false))
app.get('/api/v2/animals', (c) => getAnimalsHandler(c, true))

// GET /api/v1/animals/:id & GET /api/v2/animals/:id
const getAnimalByIdHandler = async (c: any, isV2 = false) => {
  const rawId = c.req.param('id')
  const animalId = parseInt(rawId, 10)

  let animalQuery = `
    SELECT a.animal_id AS id,
           a.animal_id AS animalId,
           a.common_name AS commonName,
           a.scientific_name AS scientificName,
           g.group_name AS className,
           cs.code AS conservationCode,
           cs.label AS conservationLabel,
           cs.description AS conservationDescription,
           cs.severity_order AS severityOrder,
           a.diet,
           a.lifespan,
           a.description,
           a.image_url AS imageUrl,
           a.avatar_path AS avatarPath,
           i.title AS imageTitle,
           i.author_name AS imageCreatorName,
           i.author_url AS imageCreatorUrl,
           i.source_name AS imageSourceName,
           i.source_url AS imageSourceUrl,
           i.license_name AS imageLicenseName,
           i.license_url AS imageLicenseUrl
    FROM animal a
    LEFT JOIN animal_group g ON g.group_id = a.group_id
    LEFT JOIN conservation_status cs ON cs.conservation_status_id = a.conservation_status_id
    LEFT JOIN image i ON i.image_id = a.image_id
  `

  let animal: any = null
  if (!isNaN(animalId)) {
    animal = await c.env.DB.prepare(`${animalQuery} WHERE a.animal_id = ?`).bind(animalId).first()
  } else {
    // If queried by slug / commonName
    animal = await c.env.DB.prepare(`${animalQuery} WHERE LOWER(REPLACE(a.common_name, ' ', '-')) = LOWER(?)`).bind(rawId).first()
  }

  if (!animal) {
    return c.json({ errorCode: 'ANIMAL_NOT_FOUND', message: 'Animal not found' }, 404)
  }

  const matchedId = animal.id
  // Habitats
  const { results: habitats } = await c.env.DB.prepare(`
    SELECT hc.habitat_name AS habitatName, hd.priority, hd.emoji
    FROM habitat_detail hd
    JOIN habitat_category hc ON hc.habitat_category_id = hd.habitat_category_id
    WHERE hd.animal_id = ?
    ORDER BY hd.priority
  `).bind(matchedId).all()

  // Threats
  const { results: threats } = await c.env.DB.prepare(`
    SELECT tc.threat_name AS threatName, td.explanation, td.priority
    FROM threat_detail td
    JOIN threat_category tc ON tc.threat_category_id = td.threat_category_id
    WHERE td.animal_id = ?
    ORDER BY td.priority
  `).bind(matchedId).all()

  return c.json({
    ...animal,
    habitats: habitats ?? [],
    threats: threats ?? []
  })
}

app.get('/api/v1/animals/:id', (c) => getAnimalByIdHandler(c, false))
app.get('/api/v2/animals/:id', (c) => getAnimalByIdHandler(c, true))

// GET /api/v1/animals/:id/occurrence
app.get('/api/v1/animals/:id/occurrence', async (c) => {
  const rawId = c.req.param('id')
  const animalId = parseInt(rawId, 10)
  if (isNaN(animalId)) return c.json([], 200)

  const { results } = await c.env.DB.prepare(`
    SELECT latitude, longitude
    FROM animal_occurrence
    WHERE animal_id = ?
    ORDER BY created_at DESC
  `).bind(animalId).all()

  return c.json(results ?? [])
})

// ── Profile Endpoints ─────────────────────────────────────────────────────────

// POST /api/v1/profiles
app.post('/api/v1/profiles', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const displayName = body.displayName?.trim()
  const pin = body.pin?.trim()
  const deviceInfo = body.deviceInfo?.trim() || 'browser'

  if (!displayName || !pin) {
    return c.json({
      errorCode: 'INVALID_REQUEST',
      details: { message: 'DisplayName and Pin are required.' }
    }, 400)
  }

  const profileId = crypto.randomUUID()
  const profileCode = generateProfileCode()
  const sessionToken = generateSessionToken()

  // 1. Create Profile
  await c.env.DB.prepare(`
    INSERT INTO profile (profile_id, profile_code, pin, display_name)
    VALUES (?, ?, ?, ?)
  `).bind(profileId, profileCode, pin, displayName).run()

  // 2. Init Progress
  await c.env.DB.prepare(`
    INSERT INTO profile_progress (profile_id, current_level, total_points, streak_days)
    VALUES (?, 1, 0, 1)
  `).bind(profileId).run()

  // 3. Create Session
  await c.env.DB.prepare(`
    INSERT INTO profile_session (profile_id, session_token, device_info, is_active)
    VALUES (?, ?, ?, 1)
  `).bind(profileId, sessionToken, deviceInfo).run()

  // 4. Initial level-1 fun facts unlocking
  await c.env.DB.prepare(`
    INSERT OR IGNORE INTO profile_unlocked_fact (profile_id, animal_fun_fact_id)
    SELECT ?, f.animal_fun_fact_id
    FROM animal_fun_fact f
    JOIN level l ON l.level_id = f.level_id
    WHERE l.level_number = 1
  `).bind(profileId).run()

  // 5. Initial badge awarding
  await c.env.DB.prepare(`
    INSERT OR IGNORE INTO profile_badge (profile_id, badge_id, source)
    SELECT ?, badge_id, 'level'
    FROM badge
    WHERE badge_type = 'level' AND level_required = 1 AND is_active = 1
  `).bind(profileId).run()

  return c.json({
    profileId,
    profileCode,
    pin,
    displayName,
    sessionToken
  }, 201)
})

// GET /api/v1/profiles (AutoLogin)
app.get('/api/v1/profiles', async (c) => {
  const token = c.req.header('X-Session-Token')
  const profile = await authenticate(c.env.DB, token)
  if (!profile) return c.json({ message: 'Unauthorized' }, 401)
  return c.json(profile)
})

// DELETE /api/v1/profiles/session (Logout)
app.delete('/api/v1/profiles/session', async (c) => {
  const token = c.req.header('X-Session-Token')
  if (!token) return c.json({ message: 'Unauthorized' }, 401)

  const res = await c.env.DB.prepare(`
    UPDATE profile_session SET is_active = 0 WHERE session_token = ? AND is_active = 1
  `).bind(token).run()

  if (res.meta.changes === 0) return c.json({ message: 'Unauthorized' }, 401)
  return c.body(null, 204)
})

// POST /api/v1/profiles/restore
app.post('/api/v1/profiles/restore', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const profileCode = body.profileCode?.trim()
  const pin = body.pin?.trim()
  const deviceInfo = body.deviceInfo?.trim() || 'restored-device'

  if (!profileCode || !pin) {
    return c.json({
      errorCode: 'INVALID_REQUEST',
      details: { message: 'ProfileCode and Pin are required.' }
    }, 400)
  }

  const profile: any = await c.env.DB.prepare(`
    SELECT p.profile_id AS profileId, p.profile_code AS profileCode, p.display_name AS displayName,
           pp.current_level AS currentLevel, pp.total_points AS totalPoints, pp.streak_days AS streakDays
    FROM profile p
    JOIN profile_progress pp ON pp.profile_id = p.profile_id
    WHERE p.profile_code = ? AND p.pin = ? AND p.is_active = 1
  `).bind(profileCode, pin).first()

  if (!profile) {
    return c.json({ errorCode: 'INVALID_CREDENTIALS', message: 'Profile code or PIN is incorrect.' }, 401)
  }

  const sessionToken = generateSessionToken()
  await c.env.DB.prepare(`
    INSERT INTO profile_session (profile_id, session_token, device_info, is_active)
    VALUES (?, ?, ?, 1)
  `).bind(profile.profileId, sessionToken, deviceInfo).run()

  return c.json({
    profileId: profile.profileId,
    profileCode: profile.profileCode,
    displayName: profile.displayName,
    currentLevel: profile.currentLevel,
    totalPoints: profile.totalPoints,
    streakDays: profile.streakDays,
    sessionToken
  })
})

// ── Mission Endpoints ─────────────────────────────────────────────────────────

// GET /api/v1/missions/weather-adaptive
app.get('/api/v1/missions/weather-adaptive', async (c) => {
  const rawCode = c.req.query('weatherCode')
  const rawIsDay = c.req.query('isDay')

  if (rawCode === undefined || rawIsDay === undefined) {
    return c.json({ errorCode: 'INVALID_REQUEST', message: 'weatherCode and isDay are required' }, 400)
  }

  const weatherCode = parseInt(rawCode, 10)
  const isDay = rawIsDay === 'true' || rawIsDay === '1'

  // Look up outdoor safety from weather_condition table
  const cond: any = await c.env.DB.prepare(`
    SELECT is_outdoor_safe
    FROM weather_condition
    WHERE ? BETWEEN wmo_code_min AND wmo_code_max
    LIMIT 1
  `).bind(weatherCode).first()

  const isOutdoorSafe = cond ? cond.is_outdoor_safe === 1 : 1

  const mission: any = await c.env.DB.prepare(`
    SELECT m.mission_id AS id,
           m.title,
           m.description,
           m.step_1 AS step1,
           m.step_2 AS step2,
           m.step_3 AS step3,
           m.time_limit_min AS timeLimitMin,
           m.is_outdoor AS isOutdoor,
           m.is_day_only AS isDayOnly,
           m.points_reward AS pointsReward,
           m.image_url AS imageUrl,
           mt.type_name AS typeName
    FROM mission m
    JOIN mission_type mt ON mt.mission_type_id = m.mission_type_id
    WHERE m.is_active = 1
      AND m.enabled = 1
      AND m.is_outdoor = ?
      AND (m.is_day_only = 0 OR ? = 1)
    ORDER BY RANDOM()
    LIMIT 1
  `).bind(isOutdoorSafe ? 1 : 0, isDay ? 1 : 0).first()

  if (!mission) {
    return c.json({ errorCode: 'MISSION_NOT_FOUND', message: 'No matching mission found for current weather.' }, 404)
  }

  return c.json({
    ...mission,
    isOutdoor: Boolean(mission.isOutdoor),
    isDayOnly: Boolean(mission.isDayOnly)
  })
})

// POST /api/v1/missions/assign
app.post('/api/v1/missions/assign', async (c) => {
  const token = c.req.header('X-Session-Token')
  const profile = await authenticate(c.env.DB, token)
  if (!profile) return c.json({ message: 'Unauthorized' }, 401)

  const body = await c.req.json().catch(() => ({}))
  const missionId = body.missionId
  if (!missionId) return c.json({ errorCode: 'ASSIGN_FAILED', message: 'missionId required' }, 400)

  const res = await c.env.DB.prepare(`
    INSERT INTO profile_mission (profile_id, mission_id, weather_code, weather_temp, weather_is_day, location_lat, location_lon, status, points_earned)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'assigned', 0)
  `).bind(
    profile.profileId,
    missionId,
    body.weatherCode ?? null,
    body.weatherTemp ?? null,
    body.isDay ? 1 : 0,
    body.locationLat ?? null,
    body.locationLon ?? null
  ).run()

  return c.json({ profileMissionId: res.meta.last_row_id })
})

// POST /api/v1/missions/start
app.post('/api/v1/missions/start', async (c) => {
  const token = c.req.header('X-Session-Token')
  const profile = await authenticate(c.env.DB, token)
  if (!profile) return c.json({ message: 'Unauthorized' }, 401)

  const body = await c.req.json().catch(() => ({}))
  const profileMissionId = body.profileMissionId
  if (!profileMissionId) return c.json({ errorCode: 'MISSION_NOT_FOUND' }, 404)

  const res = await c.env.DB.prepare(`
    UPDATE profile_mission
    SET status = 'in_progress', started_at = CURRENT_TIMESTAMP
    WHERE profile_mission_id = ? AND profile_id = ? AND status = 'assigned'
  `).bind(profileMissionId, profile.profileId).run()

  if (res.meta.changes === 0) {
    return c.json({ errorCode: 'MISSION_NOT_FOUND', message: 'Mission already started or not found' }, 404)
  }

  return c.json({ success: true })
})

// POST /api/v1/missions/complete
app.post('/api/v1/missions/complete', async (c) => {
  const token = c.req.header('X-Session-Token')
  const profile = await authenticate(c.env.DB, token)
  if (!profile) return c.json({ message: 'Unauthorized' }, 401)

  const body = await c.req.json().catch(() => ({}))
  const profileMissionId = body.profileMissionId
  if (!profileMissionId) return c.json({ errorCode: 'MISSION_NOT_FOUND' }, 404)

  // 1. Fetch active assigned/in_progress mission
  const pm: any = await c.env.DB.prepare(`
    SELECT pm.profile_mission_id, pm.status, m.points_reward
    FROM profile_mission pm
    JOIN mission m ON m.mission_id = pm.mission_id
    WHERE pm.profile_mission_id = ? AND pm.profile_id = ? AND pm.status != 'completed'
  `).bind(profileMissionId, profile.profileId).first()

  if (!pm) {
    return c.json({ errorCode: 'MISSION_NOT_FOUND', message: 'Mission not found or already completed' }, 404)
  }

  const pointsEarned = pm.points_reward ?? 20

  // 2. Mark complete
  await c.env.DB.prepare(`
    UPDATE profile_mission
    SET status = 'completed', points_earned = ?, completed_at = CURRENT_TIMESTAMP
    WHERE profile_mission_id = ?
  `).bind(pointsEarned, profileMissionId).run()

  // 3. Update Progress (points & total_missions)
  const prevLevel = profile.currentLevel
  await c.env.DB.prepare(`
    UPDATE profile_progress
    SET total_points = total_points + ?, total_missions = total_missions + 1, last_active_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE profile_id = ?
  `).bind(pointsEarned, profile.profileId).run()

  // 4. Calculate new level
  await c.env.DB.prepare(`
    UPDATE profile_progress
    SET current_level = (
      SELECT COALESCE(MAX(level_number), 1)
      FROM level
      WHERE points_required <= (SELECT total_points FROM profile_progress WHERE profile_id = ?)
    )
    WHERE profile_id = ?
  `).bind(profile.profileId, profile.profileId).run()

  const updatedProgress: any = await c.env.DB.prepare(`
    SELECT current_level AS currentLevel, total_points AS totalPoints, total_missions AS totalMissions
    FROM profile_progress WHERE profile_id = ?
  `).bind(profile.profileId).first()

  const newLevel = updatedProgress.currentLevel
  const leveledUp = newLevel > prevLevel

  // 5. Unlock new fun facts
  const unlockRes = await c.env.DB.prepare(`
    INSERT OR IGNORE INTO profile_unlocked_fact (profile_id, animal_fun_fact_id)
    SELECT ?, f.animal_fun_fact_id
    FROM animal_fun_fact f
    JOIN level l ON l.level_id = f.level_id
    WHERE l.level_number <= ?
  `).bind(profile.profileId, newLevel).run()

  // 6. Award badges
  await c.env.DB.prepare(`
    INSERT OR IGNORE INTO profile_badge (profile_id, badge_id, source)
    SELECT ?, b.badge_id, 'mission'
    FROM badge b
    WHERE b.badge_type = 'level' AND b.level_required <= ? AND b.is_active = 1
  `).bind(profile.profileId, newLevel).run()

  await c.env.DB.prepare(`
    INSERT OR IGNORE INTO profile_badge (profile_id, badge_id, source)
    SELECT ?, b.badge_id, 'mission'
    FROM badge b
    WHERE b.badge_type = 'mission' AND b.missions_required <= ? AND b.is_active = 1
  `).bind(profile.profileId, updatedProgress.totalMissions).run()

  // Read recently awarded badges
  const { results: recentBadges } = await c.env.DB.prepare(`
    SELECT b.badge_name AS badgeName, b.badge_image_url AS badgeImageUrl, b.description
    FROM profile_badge pb
    JOIN badge b ON b.badge_id = pb.badge_id
    WHERE pb.profile_id = ?
  `).bind(profile.profileId).all()

  return c.json({
    totalPoints: updatedProgress.totalPoints,
    newLevel: updatedProgress.currentLevel,
    leveledUp,
    newFactsUnlocked: unlockRes.meta.changes || 0,
    newBadges: recentBadges ?? []
  })
})

// GET /api/v1/missions/history (last 3 completed)
app.get('/api/v1/missions/history', async (c) => {
  const token = c.req.header('X-Session-Token')
  const profile = await authenticate(c.env.DB, token)
  if (!profile) return c.json({ message: 'Unauthorized' }, 401)

  const { results } = await c.env.DB.prepare(`
    SELECT m.mission_id AS missionId,
           m.title,
           m.description,
           mt.type_name AS typeName,
           pm.points_earned AS pointsEarned,
           m.is_outdoor AS isOutdoor,
           m.image_url AS imageUrl,
           pm.completed_at AS completedAt
    FROM profile_mission pm
    JOIN mission m ON m.mission_id = pm.mission_id
    JOIN mission_type mt ON mt.mission_type_id = m.mission_type_id
    WHERE pm.profile_id = ? AND pm.status = 'completed'
    ORDER BY pm.completed_at DESC
    LIMIT 3
  `).bind(profile.profileId).all()

  return c.json((results ?? []).map((r: any) => ({
    ...r,
    isOutdoor: Boolean(r.isOutdoor)
  })))
})

// ── Quizzes Endpoints ─────────────────────────────────────────────────────────

// GET /api/v1/quizzes
app.get('/api/v1/quizzes', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT quiz_id AS id, title, description, topic
    FROM quiz
    ORDER BY quiz_id
  `).all()

  return c.json(results ?? [])
})

// GET /api/v1/quizzes/:quizId/questions
app.get('/api/v1/quizzes/:quizId/questions', async (c) => {
  const quizId = parseInt(c.req.param('quizId'), 10)
  if (isNaN(quizId)) return c.json({ errorCode: 'QUIZ_NOT_FOUND' }, 404)

  const quiz = await c.env.DB.prepare(`SELECT quiz_id FROM quiz WHERE quiz_id = ?`).bind(quizId).first()
  if (!quiz) return c.json({ errorCode: 'QUIZ_NOT_FOUND', message: 'Quiz not found' }, 404)

  const { results: questions } = await c.env.DB.prepare(`
    SELECT q.question_id AS questionId,
           q.animal_id AS animalId,
           q.question_text AS questionText,
           q.explanation,
           q.difficulty,
           q.image_url AS imageUrl
    FROM question q
    WHERE q.quiz_id = ?
    ORDER BY q.question_id
  `).bind(quizId).all()

  const qIds = (questions ?? []).map((q: any) => q.questionId)
  if (qIds.length === 0) return c.json([])

  const { results: choices } = await c.env.DB.prepare(`
    SELECT question_id AS questionId, choice_label AS choiceLabel, choice_text AS choiceText, is_correct AS isCorrect
    FROM choice
    WHERE question_id IN (${qIds.map(() => '?').join(',')})
    ORDER BY question_id, choice_label
  `).bind(...qIds).all()

  const choiceMap = new Map<number, any[]>()
  for (const choice of (choices ?? [])) {
    const list = choiceMap.get((choice as any).questionId) ?? []
    list.push({
      choiceLabel: (choice as any).choiceLabel,
      choiceText: (choice as any).choiceText,
      isCorrect: Boolean((choice as any).isCorrect)
    })
    choiceMap.set((choice as any).questionId, list)
  }

  const payload = (questions ?? []).map((q: any) => ({
    ...q,
    difficulty: (q.difficulty ?? 'easy').toLowerCase(),
    choices: choiceMap.get(q.questionId) ?? []
  }))

  return c.json(payload)
})

// GET /api/v1/quizzes/questions/random?count={n}
app.get('/api/v1/quizzes/questions/random', async (c) => {
  const count = parseInt(c.req.query('count') ?? '5', 10)
  if (isNaN(count) || count < 1) return c.json({ errorCode: 'INVALID_COUNT' }, 400)

  const { results: questions } = await c.env.DB.prepare(`
    SELECT q.question_id AS questionId,
           q.animal_id AS animalId,
           q.question_text AS questionText,
           q.explanation,
           q.difficulty,
           q.image_url AS imageUrl
    FROM question q
    ORDER BY RANDOM()
    LIMIT ?
  `).bind(count).all()

  const qIds = (questions ?? []).map((q: any) => q.questionId)
  if (qIds.length === 0) return c.json([])

  const { results: choices } = await c.env.DB.prepare(`
    SELECT question_id AS questionId, choice_label AS choiceLabel, choice_text AS choiceText, is_correct AS isCorrect
    FROM choice
    WHERE question_id IN (${qIds.map(() => '?').join(',')})
    ORDER BY question_id, choice_label
  `).bind(...qIds).all()

  const choiceMap = new Map<number, any[]>()
  for (const choice of (choices ?? [])) {
    const list = choiceMap.get((choice as any).questionId) ?? []
    list.push({
      choiceLabel: (choice as any).choiceLabel,
      choiceText: (choice as any).choiceText,
      isCorrect: Boolean((choice as any).isCorrect)
    })
    choiceMap.set((choice as any).questionId, list)
  }

  return c.json((questions ?? []).map((q: any) => ({
    ...q,
    choices: choiceMap.get(q.questionId) ?? []
  })))
})

// GET /api/v1/quizzes/animals/:animalId/questions?count={n}
app.get('/api/v1/quizzes/animals/:animalId/questions', async (c) => {
  const animalId = parseInt(c.req.param('animalId'), 10)
  const count = parseInt(c.req.query('count') ?? '5', 10)
  if (isNaN(count) || count < 1) return c.json({ errorCode: 'INVALID_COUNT' }, 400)

  const { results: questions } = await c.env.DB.prepare(`
    SELECT q.question_id AS questionId,
           q.animal_id AS animalId,
           q.question_text AS questionText,
           q.explanation,
           q.difficulty,
           q.image_url AS imageUrl
    FROM question q
    WHERE q.animal_id = ?
    ORDER BY RANDOM()
    LIMIT ?
  `).bind(animalId, count).all()

  const qIds = (questions ?? []).map((q: any) => q.questionId)
  if (qIds.length === 0) return c.json([])

  const { results: choices } = await c.env.DB.prepare(`
    SELECT question_id AS questionId, choice_label AS choiceLabel, choice_text AS choiceText, is_correct AS isCorrect
    FROM choice
    WHERE question_id IN (${qIds.map(() => '?').join(',')})
    ORDER BY question_id, choice_label
  `).bind(...qIds).all()

  const choiceMap = new Map<number, any[]>()
  for (const choice of (choices ?? [])) {
    const list = choiceMap.get((choice as any).questionId) ?? []
    list.push({
      choiceLabel: (choice as any).choiceLabel,
      choiceText: (choice as any).choiceText,
      isCorrect: Boolean((choice as any).isCorrect)
    })
    choiceMap.set((choice as any).questionId, list)
  }

  return c.json((questions ?? []).map((q: any) => ({
    ...q,
    choices: choiceMap.get(q.questionId) ?? []
  })))
})

// POST /api/v1/quizzes/save-progress
app.post('/api/v1/quizzes/save-progress', async (c) => {
  const token = c.req.header('X-Session-Token')
  const profile = await authenticate(c.env.DB, token)
  if (!profile) return c.json({ message: 'Unauthorized' }, 401)

  const body = await c.req.json().catch(() => ({}))
  const totalQuestions = body.totalQuestions
  const correctAnswers = body.correctAnswers

  if (!totalQuestions || totalQuestions < 1) {
    return c.json({ errorCode: 'INVALID_TOTAL_QUESTIONS' }, 400)
  }
  if (correctAnswers === undefined || correctAnswers < 0 || correctAnswers > totalQuestions) {
    return c.json({ errorCode: 'INVALID_CORRECT_ANSWERS' }, 400)
  }

  const pointsEarned = correctAnswers * 5
  const score = Math.round((correctAnswers / totalQuestions) * 100)
  const prevLevel = profile.currentLevel

  // 1. Insert history
  await c.env.DB.prepare(`
    INSERT INTO profile_history (profile_id, score, total_questions, correct_answers, points_earned, level_before)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(profile.profileId, score, totalQuestions, correctAnswers, pointsEarned, prevLevel).run()

  // 2. Add points & update quiz counters
  await c.env.DB.prepare(`
    UPDATE profile_progress
    SET total_points = total_points + ?, total_quizzes = total_quizzes + 1, total_correct = total_correct + ?, last_active_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE profile_id = ?
  `).bind(pointsEarned, correctAnswers, profile.profileId).run()

  // 3. Update level
  await c.env.DB.prepare(`
    UPDATE profile_progress
    SET current_level = (
      SELECT COALESCE(MAX(level_number), 1)
      FROM level
      WHERE points_required <= (SELECT total_points FROM profile_progress WHERE profile_id = ?)
    )
    WHERE profile_id = ?
  `).bind(profile.profileId, profile.profileId).run()

  const updatedProgress: any = await c.env.DB.prepare(`
    SELECT current_level AS currentLevel, total_points AS totalPoints
    FROM profile_progress WHERE profile_id = ?
  `).bind(profile.profileId).first()

  const newLevel = updatedProgress.currentLevel
  const leveledUp = newLevel > prevLevel

  // 4. Unlock fun facts
  const factRes = await c.env.DB.prepare(`
    INSERT OR IGNORE INTO profile_unlocked_fact (profile_id, animal_fun_fact_id)
    SELECT ?, f.animal_fun_fact_id
    FROM animal_fun_fact f
    JOIN level l ON l.level_id = f.level_id
    WHERE l.level_number <= ?
  `).bind(profile.profileId, newLevel).run()

  // 5. Award badges
  await c.env.DB.prepare(`
    INSERT OR IGNORE INTO profile_badge (profile_id, badge_id, source)
    SELECT ?, b.badge_id, 'quiz'
    FROM badge b
    WHERE b.badge_type = 'level' AND b.level_required <= ? AND b.is_active = 1
  `).bind(profile.profileId, newLevel).run()

  const { results: recentBadges } = await c.env.DB.prepare(`
    SELECT b.badge_name AS badgeName, b.badge_image_url AS badgeImageUrl, b.description
    FROM profile_badge pb
    JOIN badge b ON b.badge_id = pb.badge_id
    WHERE pb.profile_id = ?
  `).bind(profile.profileId).all()

  return c.json({
    totalPoints: updatedProgress.totalPoints,
    newLevel: updatedProgress.currentLevel,
    leveledUp,
    newFactsUnlocked: factRes.meta.changes || 0,
    newBadges: recentBadges ?? []
  })
})

// ── Fun Facts Endpoints ───────────────────────────────────────────────────────

// GET /api/v1/fun-facts
app.get('/api/v1/fun-facts', async (c) => {
  const token = c.req.header('X-Session-Token')
  const profile = await authenticate(c.env.DB, token)
  if (!profile) return c.json({ message: 'Unauthorized' }, 401)

  const { results: facts } = await c.env.DB.prepare(`
    SELECT f.animal_fun_fact_id AS id,
           f.animal_id AS animalId,
           f.emoji,
           f.fact_text AS factText,
           f.fact_image_url AS factImageUrl,
           f.fact_order AS factOrder,
           l.level_number AS unlockLevelNumber,
           CASE WHEN puf.animal_fun_fact_id IS NOT NULL OR l.level_number <= ? THEN 1 ELSE 0 END AS isUnlocked
    FROM animal_fun_fact f
    JOIN level l ON l.level_id = f.level_id
    LEFT JOIN profile_unlocked_fact puf ON puf.animal_fun_fact_id = f.animal_fun_fact_id AND puf.profile_id = ?
    ORDER BY f.fact_order, f.animal_fun_fact_id
  `).bind(profile.currentLevel, profile.profileId).all()

  const payload = (facts ?? []).map((f: any) => ({
    id: f.id,
    animalId: f.animalId,
    emoji: f.emoji,
    factText: f.factText,
    factImageUrl: f.factImageUrl,
    factOrder: f.factOrder,
    unlockLevelNumber: f.unlockLevelNumber,
    accessStatus: f.isUnlocked ? 'unlocked' : 'locked',
    levelsNeeded: Math.max(0, f.unlockLevelNumber - profile.currentLevel),
    userLevel: profile.currentLevel,
    userPoints: profile.totalPoints,
    alreadyUnlocked: Boolean(f.isUnlocked)
  }))

  return c.json(payload)
})

// GET /api/v1/fun-facts/:animalId
app.get('/api/v1/fun-facts/:animalId', async (c) => {
  const token = c.req.header('X-Session-Token')
  const profile = await authenticate(c.env.DB, token)
  if (!profile) return c.json({ message: 'Unauthorized' }, 401)

  const rawId = c.req.param('animalId')
  const animalId = parseInt(rawId, 10)
  if (isNaN(animalId)) return c.json([], 200)

  const { results: facts } = await c.env.DB.prepare(`
    SELECT f.animal_fun_fact_id AS id,
           f.animal_id AS animalId,
           f.emoji,
           f.fact_text AS factText,
           f.fact_image_url AS factImageUrl,
           f.fact_order AS factOrder,
           l.level_number AS unlockLevelNumber,
           CASE WHEN puf.animal_fun_fact_id IS NOT NULL OR l.level_number <= ? THEN 1 ELSE 0 END AS isUnlocked
    FROM animal_fun_fact f
    JOIN level l ON l.level_id = f.level_id
    LEFT JOIN profile_unlocked_fact puf ON puf.animal_fun_fact_id = f.animal_fun_fact_id AND puf.profile_id = ?
    WHERE f.animal_id = ?
    ORDER BY f.fact_order, f.animal_fun_fact_id
  `).bind(profile.currentLevel, profile.profileId, animalId).all()

  const payload = (facts ?? []).map((f: any) => ({
    id: f.id,
    animalId: f.animalId,
    emoji: f.emoji,
    factText: f.factText,
    factImageUrl: f.factImageUrl,
    factOrder: f.factOrder,
    unlockLevelNumber: f.unlockLevelNumber,
    accessStatus: f.isUnlocked ? 'unlocked' : 'locked',
    levelsNeeded: Math.max(0, f.unlockLevelNumber - profile.currentLevel),
    userLevel: profile.currentLevel,
    userPoints: profile.totalPoints,
    alreadyUnlocked: Boolean(f.isUnlocked)
  }))

  return c.json(payload)
})

// ── Badges Endpoints ─────────────────────────────────────────────────────────

// GET /api/v1/badges
app.get('/api/v1/badges', async (c) => {
  const token = c.req.header('X-Session-Token')
  const profile = await authenticate(c.env.DB, token)
  if (!profile) return c.json({ message: 'Unauthorized' }, 401)

  const { results: badges } = await c.env.DB.prepare(`
    SELECT b.badge_id AS id,
           b.badge_name AS badgeName,
           b.badge_image_url AS badgeImageUrl,
           b.description,
           b.badge_type AS badgeType,
           b.level_required AS levelRequired,
           b.missions_required AS missionsRequired,
           pb.source,
           pb.earned_at AS earnedAt,
           CASE WHEN pb.profile_badge_id IS NOT NULL THEN 1 ELSE 0 END AS isUnlocked
    FROM badge b
    LEFT JOIN profile_badge pb ON pb.badge_id = b.badge_id AND pb.profile_id = ?
    WHERE b.is_active = 1
    ORDER BY b.badge_type, b.badge_id
  `).bind(profile.profileId).all()

  const payload = (badges ?? []).map((b: any) => {
    let progressPercentage = 0
    if (b.isUnlocked) {
      progressPercentage = 100
    } else if (b.badgeType === 'level' && b.levelRequired) {
      progressPercentage = Math.min(100, Math.floor((profile.currentLevel / b.levelRequired) * 100))
    } else if (b.badgeType === 'mission' && b.missionsRequired) {
      progressPercentage = Math.min(100, Math.floor((profile.totalMissions / b.missionsRequired) * 100))
    }

    return {
      id: b.id,
      badgeName: b.badgeName,
      badgeImageUrl: b.badgeImageUrl,
      description: b.description,
      badgeType: b.badgeType,
      levelRequired: b.levelRequired,
      missionsRequired: b.missionsRequired,
      source: b.source,
      earnedAt: b.earnedAt,
      isUnlocked: Boolean(b.isUnlocked),
      currentLevel: profile.currentLevel,
      totalPoints: profile.totalPoints,
      totalMissions: profile.totalMissions,
      progressPercentage
    }
  })

  return c.json(payload)
})

// ── AI Animal Chat Endpoints ─────────────────────────────────────────────────

// POST /api/Chat/ask & POST /api/v1/Chat/ask
const handleChatAsk = async (c: any) => {
  const body = await c.req.json().catch(() => ({}))
  const userMessage = body.userMessage?.trim()
  const animalType = body.animalType?.trim()
  const sessionId = c.req.query('sessionId') || crypto.randomUUID()

  if (!userMessage || !animalType) {
    return c.json({ errorCode: 'INVALID_REQUEST', message: 'userMessage and animalType are required' }, 400)
  }

  const apiKey = c.env.GEMINI_API_KEY
  if (apiKey) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: `You are a friendly, educational ${animalType} in Malaysia's tropical rainforest. Stay strictly in character, make cheerful animal sounds, and give fun, child-friendly facts about wildlife conservation!`
            }]
          },
          contents: [{
            role: 'user',
            parts: [{ text: userMessage }]
          }]
        })
      })

      if (res.ok) {
        const data: any = await res.json()
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (reply) {
          return c.json({ sessionId, animalType, reply: reply.trim() })
        }
      }
    } catch (err) {
      console.error('Gemini call error:', err)
    }
  }

  // Fallback friendly in-character reply
  const fallbackReplies: Record<string, string[]> = {
    'malayan-tiger': [
      "ROAR! Hello young explorer! I'm patrolling the majestic forests of Taman Negara today. What would you like to discover?",
      "Grrr-hello! My orange and black stripes keep me hidden between tall trees. Keep protecting our forest home!"
    ],
    'orangutan': [
      "Ooh-ooh aah-aah! *swings down from leafy canopy* Did you know I build a fluffy nest high in the trees every night?",
      "Hello friend! *eats a delicious wild fig* The canopy is full of wonder today. Ask me anything!"
    ],
    'hornbill': [
      "HONK HONK! *flaps giant black wings* I can see the entire rainforest from up here in the clouds!",
      "Greeting from the sky! My casque makes my calls ring across mountains. What adventures are you on today?"
    ]
  }

  const list = fallbackReplies[animalType.toLowerCase()] ?? [
    `Hello explorer! As a friendly ${animalType}, I'm so happy you're learning about Malaysia's precious wildlife today!`
  ]
  const reply = list[Math.floor(Math.random() * list.length)]

  return c.json({ sessionId, animalType, reply })
}

app.post('/api/Chat/ask', handleChatAsk)
app.post('/api/v1/Chat/ask', handleChatAsk)

// ── TTS Endpoints ─────────────────────────────────────────────────────────────

// POST /api/v1/tts/generate
app.post('/api/v1/tts/generate', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const text = body.text?.trim()
  const voiceId = body.voiceId?.trim() || 'rCmVtv8cYU60uhlsOo1M'
  const modelId = body.modelId?.trim() || 'eleven_multilingual_v2'
  const speed = Number(body.speed ?? 1.0)

  if (!text) return c.json({ errorCode: 'INVALID_REQUEST', message: 'Text is required.' }, 400)

  const textHash = await computeHash(text, voiceId, modelId, speed)
  const origin = new URL(c.req.url).origin

  // 1. Check cache in D1
  const cached: any = await c.env.DB.prepare(`
    SELECT text_hash, timings_json, mime_type, speed
    FROM tts_audio_cache
    WHERE text_hash = ? AND voice_id = ? AND model_id = ?
  `).bind(textHash, voiceId, modelId).first()

  if (cached) {
    let timings = []
    try { timings = JSON.parse(cached.timings_json || '[]') } catch {}
    return c.json({
      textHash,
      voiceId,
      modelId,
      speed: cached.speed,
      mimeType: cached.mime_type || 'audio/mpeg',
      cached: true,
      audioUrl: `${origin}/api/v1/tts/audio/${textHash}`,
      timings
    })
  }

  // 2. Generate timings estimate for narration
  const words = text.split(/\s+/).filter(Boolean)
  const wordDuration = 0.35 / speed
  let currentStart = 0
  const timings = words.map((w: string) => {
    const start = currentStart
    const end = start + wordDuration
    currentStart = end
    return { word: w, start, end }
  })

  return c.json({
    textHash,
    voiceId,
    modelId,
    speed,
    mimeType: 'audio/mpeg',
    cached: false,
    audioUrl: `${origin}/api/v1/tts/audio/${textHash}`,
    timings
  })
})

// GET /api/v1/tts/audio/:textHash
app.get('/api/v1/tts/audio/:textHash', async (c) => {
  const textHash = c.req.param('textHash')
  const row: any = await c.env.DB.prepare(`
    SELECT audio_content, mime_type
    FROM tts_audio_cache
    WHERE text_hash = ?
    LIMIT 1
  `).bind(textHash).first()

  if (!row || !row.audio_content) {
    return c.json({ errorCode: 'TTS_AUDIO_NOT_FOUND', message: 'Audio not found' }, 404)
  }

  return new Response(row.audio_content, {
    headers: {
      'Content-Type': row.mime_type || 'audio/mpeg',
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  })
})

export default app

