---
trigger: always_on
---

# Test every endpoint created
curl http://localhost:3000/api/endpoint

# Document results in IMPLEMENTATION-LOG.md
✅ Test 1: GET /api/courses
   Result: 200 OK, returned 5 courses
   
❌ Test 2: GET /api/courses/invalid
   Result: 200 OK, should be 404
   Action: Need to fix error handling
Pages:
 Desktop view (Chrome DevTools)

 Mobile view (responsive)

 SEO meta tags

 Loading states

 Error states

Components:
 Renders correctly

 Props work as expected

 Interactions functional

 Accessible (keyboard navigation)