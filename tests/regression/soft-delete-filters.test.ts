/**
 * Regression tests for soft-delete filtering.
 *
 * These tests verify that `deletedAt: null` is included in Prisma queries
 * for the highest-risk read paths. If a future change accidentally removes
 * a soft-delete filter, these tests will catch it.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Shared mock factories (hoisted so vi.mock can reference them)
// ---------------------------------------------------------------------------
const mocks = vi.hoisted(() => ({
  // Person
  personFindMany: vi.fn(),
  personCount: vi.fn(),
  personFindUnique: vi.fn(),
  // Group
  groupFindMany: vi.fn(),
  groupCount: vi.fn(),
  // RelationshipType
  relationshipTypeFindMany: vi.fn(),
  // Upcoming events helper
  getUpcomingEvents: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Mock Prisma — only the models/methods exercised by the routes under test
// ---------------------------------------------------------------------------
vi.mock('../../lib/prisma', () => ({
  prisma: {
    person: {
      findMany: mocks.personFindMany,
      findUnique: mocks.personFindUnique,
      count: mocks.personCount,
    },
    group: {
      findMany: mocks.groupFindMany,
      count: mocks.groupCount,
    },
    relationshipType: {
      findMany: mocks.relationshipTypeFindMany,
    },
  },
}));

// ---------------------------------------------------------------------------
// Mock auth — always returns a valid session with user-123
// ---------------------------------------------------------------------------
vi.mock('../../lib/auth', () => ({
  auth: vi.fn(() =>
    Promise.resolve({
      user: { id: 'user-123', email: 'test@example.com', name: 'Test' },
    })
  ),
}));

// ---------------------------------------------------------------------------
// Mock billing — allow everything
// ---------------------------------------------------------------------------
vi.mock('../../lib/billing', () => ({
  canCreateResource: vi.fn(() =>
    Promise.resolve({ allowed: true, current: 0, limit: 50, tier: 'FREE', isUnlimited: false })
  ),
  canEnableReminder: vi.fn(() =>
    Promise.resolve({ allowed: true, current: 0, limit: 5, isUnlimited: false })
  ),
  getUserUsage: vi.fn(() =>
    Promise.resolve({ people: 0, groups: 0, reminders: 0 })
  ),
}));

// ---------------------------------------------------------------------------
// Mock upcoming-events helper used by dashboard stats
// ---------------------------------------------------------------------------
vi.mock('../../lib/upcoming-events', () => ({
  getUpcomingEvents: (...args: unknown[]) => mocks.getUpcomingEvents(...args),
}));

// ---------------------------------------------------------------------------
// Import route handlers *after* all mocks are in place
// ---------------------------------------------------------------------------
import { GET as getPeople } from '../../app/api/people/route';
import { GET as getGroups } from '../../app/api/groups/route';
import { GET as getRelationshipTypes } from '../../app/api/relationship-types/route';
import { GET as searchPeople } from '../../app/api/people/search/route';
import { GET as getDashboardStats } from '../../app/api/dashboard/stats/route';

// ===========================================================================
// Tests
// ===========================================================================
describe('Soft-delete filter regression tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // 1. GET /api/people
  // -------------------------------------------------------------------------
  describe('GET /api/people', () => {
    it('should include deletedAt: null in person.findMany where clause', async () => {
      mocks.personFindMany.mockResolvedValue([]);

      const request = new Request('http://localhost/api/people');
      await getPeople(request);

      expect(mocks.personFindMany).toHaveBeenCalledTimes(1);
      const callArg = mocks.personFindMany.mock.calls[0][0];
      expect(callArg.where).toHaveProperty('deletedAt', null);
    });
  });

  // -------------------------------------------------------------------------
  // 2. GET /api/groups
  // -------------------------------------------------------------------------
  describe('GET /api/groups', () => {
    it('should include deletedAt: null in group.findMany where clause', async () => {
      mocks.groupFindMany.mockResolvedValue([]);

      const request = new Request('http://localhost/api/groups');
      await getGroups(request);

      expect(mocks.groupFindMany).toHaveBeenCalledTimes(1);
      const callArg = mocks.groupFindMany.mock.calls[0][0];
      expect(callArg.where).toHaveProperty('deletedAt', null);
    });
  });

  // -------------------------------------------------------------------------
  // 3. GET /api/relationship-types
  // -------------------------------------------------------------------------
  describe('GET /api/relationship-types', () => {
    it('should include deletedAt: null in relationshipType.findMany where clause', async () => {
      mocks.relationshipTypeFindMany.mockResolvedValue([]);

      const request = new Request('http://localhost/api/relationship-types');
      await getRelationshipTypes(request);

      expect(mocks.relationshipTypeFindMany).toHaveBeenCalledTimes(1);
      const callArg = mocks.relationshipTypeFindMany.mock.calls[0][0];
      expect(callArg.where).toHaveProperty('deletedAt', null);
    });
  });

  // -------------------------------------------------------------------------
  // 4. GET /api/people/search
  // -------------------------------------------------------------------------
  describe('GET /api/people/search', () => {
    it('should include deletedAt: null in person.findMany where clause', async () => {
      mocks.personFindMany.mockResolvedValue([]);

      const request = new Request('http://localhost/api/people/search?q=John');
      await searchPeople(request);

      expect(mocks.personFindMany).toHaveBeenCalledTimes(1);
      const callArg = mocks.personFindMany.mock.calls[0][0];
      expect(callArg.where).toHaveProperty('deletedAt', null);
    });

    it('should not query at all when search query is empty', async () => {
      const request = new Request('http://localhost/api/people/search?q=');
      const response = await searchPeople(request);
      const body = await response.json();

      expect(mocks.personFindMany).not.toHaveBeenCalled();
      expect(body.people).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // 5. GET /api/dashboard/stats
  // -------------------------------------------------------------------------
  describe('GET /api/dashboard/stats', () => {
    beforeEach(() => {
      mocks.getUpcomingEvents.mockResolvedValue([]);
    });

    it('should include deletedAt: null in person.count where clause', async () => {
      mocks.personCount.mockResolvedValue(0);
      mocks.groupCount.mockResolvedValue(0);

      const request = new Request('http://localhost/api/dashboard/stats');
      await getDashboardStats(request);

      expect(mocks.personCount).toHaveBeenCalledTimes(1);
      const callArg = mocks.personCount.mock.calls[0][0];
      expect(callArg.where).toHaveProperty('deletedAt', null);
    });

    it('should include deletedAt: null in group.count where clause', async () => {
      mocks.personCount.mockResolvedValue(0);
      mocks.groupCount.mockResolvedValue(0);

      const request = new Request('http://localhost/api/dashboard/stats');
      await getDashboardStats(request);

      expect(mocks.groupCount).toHaveBeenCalledTimes(1);
      const callArg = mocks.groupCount.mock.calls[0][0];
      expect(callArg.where).toHaveProperty('deletedAt', null);
    });
  });
});
