---
trigger: always_on
---

EVERY file MUST have:
1. File Header Comment:
typescript
/**
 * Course Listing API Route
 * 
 * Provides paginated list of published courses with filtering and sorting.
 * 
 * @endpoint GET /api/courses
 * @auth Not required (public)
 * @phase Phase 1: Courses Module
 * @author Agent (Antigravity)
 * @created 2026-02-15
 * @updated 2026-02-15
 */
2. Function Documentation:
typescript
/**
 * Fetches courses from Supabase with applied filters
 * 
 * @param filters - Object containing category, level, search params
 * @param pagination - Page number and limit
 * @returns Promise<{ courses: Course[], total: number }>
 * @throws Error if Supabase query fails
 */
async function fetchCourses(filters: Filters, pagination: Pagination) {
  // Implementation
}
3. Complex Logic Comments:
typescript
// Calculate access percentage based on installment payments
// Formula: (payments_made / total_payments) * 100
// Example: 2/4 payments = 50% course access
const accessPercentage = (plan.payments_made / plan.total_payments) * 100;