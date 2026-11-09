import { appConfig } from '@/app/config'
import type { IAnimalRepository } from './interfaces'
import type { IFunFactRepository } from './interfaces'
import type { IQuizRepository } from './interfaces'
import type { IUserRepository } from './interfaces'
import type { IProfileRepository } from './interfaces'
import type { ISessionRepository } from './interfaces'
import type { IMissionRepository } from './interfaces'
import type { IBadgeRepository } from './interfaces'

import { MockAnimalRepository } from './mock/mockAnimalRepository'
import { MockFunFactRepository } from './mock/mockFunFactRepository'
import { MockQuizRepository } from './mock/mockQuizRepository'
import { MockUserRepository } from './mock/mockUserRepository'
import { MockProfileRepository } from './mock/mockProfileRepository'
import { MockSessionRepository } from './mock/mockSessionRepository'
import { MockMissionRepository } from './mock/mockMissionRepository'
import { MockBadgeRepository } from './mock/mockBadgeRepository'

import { ApiAnimalRepository } from './api/apiAnimalRepository'
import { ApiFunFactRepository } from './api/apiFunFactRepository'
import { ApiQuizRepository } from './api/apiQuizRepository'
import { ApiUserRepository } from './api/apiUserRepository'
import { ApiProfileRepository } from './api/apiProfileRepository'
import { ApiSessionRepository } from './api/apiSessionRepository'
import { ApiMissionRepository } from './api/apiMissionRepository'
import { ApiBadgeRepository } from './api/apiBadgeRepository'

/**
 * Repository factory — per-domain source selection.
 *
 * Each domain is selected independently via appConfig.repoSources.
 * Defaults:
 *   - animals/session/profile/quizzes/funFacts/missions/badges → 'api'
 *   - user → 'mock' (no /api/user/* endpoints exist in backend contract)
 *
 * Override per-domain via optional VITE_REPO_* env vars (see .env.example).
 * Tests stub all domains to 'mock' via vitest.setup.ts.
 */
function createRepositories() {
  const s = appConfig.repoSources
  return {
    animals:  (s.animals  === 'api' ? new ApiAnimalRepository()    : new MockAnimalRepository())    as IAnimalRepository,
    funFacts: (s.funFacts === 'api' ? new ApiFunFactRepository()   : new MockFunFactRepository())   as IFunFactRepository,
    quizzes:  (s.quizzes  === 'api' ? new ApiQuizRepository()      : new MockQuizRepository())      as IQuizRepository,
    user:     (s.user     === 'api' ? new ApiUserRepository()      : new MockUserRepository())      as IUserRepository,
    profile:  (s.profile  === 'api' ? new ApiProfileRepository()   : new MockProfileRepository())   as IProfileRepository,
    session:  (s.session  === 'api' ? new ApiSessionRepository()   : new MockSessionRepository())   as ISessionRepository,
    missions: (s.missions === 'api' ? new ApiMissionRepository()   : new MockMissionRepository())   as IMissionRepository,
    badges:   (s.badges   === 'api' ? new ApiBadgeRepository()     : new MockBadgeRepository())     as IBadgeRepository,
  }
}

export const repositories = createRepositories()
