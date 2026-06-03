# AI_PLANNING.md

## LinkForge — AI-Assisted Development Planning

---

## Problem Statement

URL shorteners are everywhere, but most offer either simplicity without insight (like TinyURL) or enterprise pricing with analytics locked behind expensive tiers (like Bitly). Individuals, small businesses, and open-source projects need a **self-hostable**, **feature-rich** URL shortener that provides:

- **Short link creation** with custom aliases, expiry dates, and password protection
- **Comprehensive analytics** — click trends, device/browser breakdowns, geolocation, referrer tracking
- **Bulk operations** for creating many links at once
- **QR code generation** for every short link
- **Modern UX** with a premium feel, dark mode, and responsive design
- **No vendor lock-in** — deployable on any cloud platform

**LinkForge** solves this by providing a complete open-source solution with a decoupled frontend/backend architecture, using MongoDB for persistence and supporting deployment to Render + Vercel (or any equivalent platform).

---

## Planning Process

The development was structured in iterative phases, each building on the previous:

### Phase 1: Core Infrastructure
```
Day 1-2: Project scaffolding, database schema, authentication
Day 3-4: URL shortening, redirection, basic CRUD
Day 5-6: Analytics tracking (visits, device, geolocation)
Day 7-8: Frontend build (React + Vite + Tailwind setup)
```

### Phase 2: Feature Completion
```
Day 9-10: Analytics dashboard with charts
Day 11-12: Bulk upload with CSV validation
Day 13-14: QR code generation, password-protected links
Day 15-16: UI polish (animations, themes, responsive)
```

### Phase 3: Production Hardening
```
Day 17-18: Environment variable safety, error handling, code splitting
Day 19-20: Security audit, CORS hardening, rate limiting
Day 21-22: Documentation, deployment configuration
Day 23: Final testing and submission
```

### Key Decisions Made During Planning

1. **MongoDB over PostgreSQL**: The document model maps naturally to the analytics data (visit records with varying fields like browser, OS, device, location). MongoDB's aggregation pipeline makes analytics queries straightforward.

2. **JWT over session-based auth**: Stateless tokens are simpler to implement across separate frontend/backend deployments. 30-day expiry reduces re-login friction.

3. **Vite over Create React App**: Vite provides faster builds (especially important for the ~964 KB analytics page), native code-splitting support, and better DX with hot module replacement.

4. **Render + Vercel over a monolith**: Separating backend and frontend allows independent scaling, technology-specific hosting (Node.js on Render, static SPA on Vercel's CDN), and easier maintenance.

---

## Feature Breakdown

### 1. Authentication System
- **Registration**: Email + name + password with bcrypt hashing
- **Login**: Email + password → JWT (30-day expiry)
- **Profile**: GET endpoint returning user data
- **Password Change**: Requires current + new password
- **Account Deletion**: Removes user + all URLs + all visits
- **Rate Limiting**: Auth endpoints limited to 5 attempts per 15-min window in production

### 2. URL Management
- **Create**: Accepts originalUrl + optional alias, expiryDate, password
- **Short Code Generation**: 8-character nanoid by default, user-supplied alias optional
- **Custom Alias Validation**: Checks uniqueness; sparse index prevents null collisions
- **Expiry**: URLs past expiry return 410 Gone with branded HTML page
- **Password Protection**: bcrypt-verified; redirects to frontend verification page
- **CRUD**: Full Create/Read/Update/Delete with ownership enforcement

### 3. Analytics Engine
- **Visit Capture**: Every redirect logs IP, user-agent, referrer, timestamp
- **Device Classification**: User-agent parsed into Desktop/Mobile/Tablet + browser name
- **Geolocation**: IP → country/city via ipapi.co (falls back to "Unknown")
- **Trend Aggregation**: MongoDB $dateToString pipeline groups clicks by day/week/month
- **Workspace Analytics**: Aggregate across all user URLs
- **Country & Referrer Breakdowns**: Top-N lists with percentage calculations

### 4. Bulk Operations
- **CSV Upload**: Client-side parsing with validation, duplicate detection, preview
- **API Endpoint**: Accepts array of URL objects; creates with error isolation
- **Results Export**: Downloadable CSV of created URLs with status

### 5. QR Code Generation
- **Client-side**: Uses `qrcode` npm package to generate data URLs
- **Download**: PNG export with one click
- **Copy**: URL copy with toast feedback

### 6. UI/UX Features
- **Glassmorphism design** with backdrop blur and semi-transparent cards
- **Framer Motion** for page transitions and component animations
- **Animated counters** for hero metrics (total clicks, active links)
- **Dark/Light mode** with CSS variables and theme persistence
- **Skeleton loading** states for analytics page
- **Code splitting**: AnalyticsPage and BulkUploadPage are lazy-loaded

---

## Database Design Decisions

### Collections

#### 1. `users`
```
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique, indexed),
  password: String (required, select: false),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```
- **Why `select: false` on password**: Prevents accidental exposure in API responses; must explicitly use `.select('+password')`
- **Email index**: Unique index ensures no duplicate registrations

#### 2. `urls`
```
{
  _id: ObjectId,
  userId: ObjectId (ref: User, indexed),
  originalUrl: String (required),
  shortCode: String (required, indexed),
  shortUrl: String (required),
  customAlias: String (sparse unique index),
  passwordProtected: Boolean (default: false),
  passwordHash: String,
  startDate: Date,
  expiryDate: Date,
  status: String (enum: active/expired/disabled, default: active),
  clickCount: Number (default: 0),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```
- **Sparse index on customAlias**: Allows `null` values for non-custom URLs while enforcing uniqueness on non-null aliases
- **Compound query support**: `$or` on `shortCode` and `customAlias` for redirect lookups
- **`clickCount` denormalization**: Avoids counting visits on every page load; updated via `$inc` atomically

#### 3. `visits`
```
{
  _id: ObjectId,
  urlId: ObjectId (ref: Url, indexed),
  ipAddress: String,
  browser: String,
  device: String,
  operatingSystem: String,
  country: String,
  city: String,
  referrer: String,
  successful: Boolean (default: true),
  timestamp: Date (auto, indexed)
}
```
- **Denormalized data**: Browser, device, OS, country, city stored per-visit to preserve historical accuracy (user-agent parsing or geolocation may change over time)
- **Index on timestamp**: Enables efficient date-range queries for trend aggregation
- **Index on urlId**: All analytics queries filter by URL

### Schema Design Rationale

| Decision | Alternative | Why Chosen |
|----------|-------------|------------|
| Denormalized `clickCount` on URLs | Counting visits on each request | Performance: instant display without aggregation |
| Separate visits collection | Embedded visits in URL documents | Scalability: a single URL can have millions of visits |
| `select: false` on password | In-app filtering | Security: prevents accidental leaks in query results |
| Sparse index on customAlias | Regular unique index | Flexibility: allows null values for non-custom URLs |
| Date strings in aggregation | JavaScript date math | Accuracy: MongoDB's `$dateToString` handles timezones |

---

## API Design Decisions

### RESTful Convention
- **`/api/auth/*`**: Authentication (no resource ID, session-based operations)
- **`/api/urls/*`**: URL CRUD (resource-oriented with `:id` parameter)
- **`/api/analytics/*`**: Analytics queries (read-only, sub-resources for visits/trends/breakdowns)
- **`/api/bulk/*`**: Bulk operations (non-standard CRUD)

### Why Separate Analytics Endpoints?

Rather than embedding analytics in the URL resource (`GET /api/urls/:id/analytics`), analytics has its own router:

1. **Separation of concerns**: URL CRUD and analytics have different caching, rate-limiting, and error-handling requirements
2. **Workspace-level queries**: Analytics endpoints support "all links" aggregation without cluttering the URLs API
3. **Future extensibility**: Adding analytics features (export, real-time, historical) won't affect URL management

### Response Format
- **Success**: `{ success: true, data: {...} }`
- **Error**: `{ success: false, message: "..." }`
- **List endpoints**: Return array under a named key (`urls`, `visits`, `analytics`)
- **HTTP status codes**: 200 (success), 201 (created), 400 (validation), 401 (auth), 403 (forbidden), 404 (not found), 410 (expired), 429 (rate limited), 500 (server error)

### Security Middleware Stack
```
Request → Helmet → CORS → Rate Limiter → Mongo Sanitize → XSS Clean → Routes → Auth Middleware (if protected) → Validation → Controller
```
Each layer addresses a specific attack vector:
- **Helmet**: Sets HTTP security headers (CSP, HSTS, X-Frame-Options, etc.)
- **CORS**: Restricts cross-origin requests to configured frontend URL
- **Rate Limiter**: Prevents brute-force and DoS attacks
- **Mongo Sanitize**: Strips `$` and `.` from inputs to prevent NoSQL injection
- **XSS Clean**: Sanitizes user input against cross-site scripting
- **Auth Middleware**: Verifies JWT and attaches user to request

---

## AI-Assisted Development Workflow

### How AI (Claude/Cline) Assisted

1. **Code Generation**: Rapid prototyping of controllers, models, and routes
   - Prompt: *"Create an Express controller for URL CRUD with analytics tracking"*
   - AI generated the full controller with error handling, visit tracking, and password verification

2. **Schema Design**: MongoDB schema optimization
   - AI suggested `select: false` for passwords, sparse indexes for custom aliases, and compound indexes for analytics queries

3. **Error Handling Patterns**: AI recommended structured error responses, centralized error middleware, and user-friendly messages for different HTTP status codes

4. **Performance Optimization**: AI identified code-splitting opportunities (AnalyticsPage, BulkUploadPage), suggested stale-time caching for analytics queries, and recommended lazy loading for heavy chart libraries

5. **Security Hardening**: AI audited environment variable usage, identified the localhost fallback vulnerability in `api.js`, and suggested the production validation in `index.js`

6. **Deployment Configuration**: AI generated Render and Vercel configuration with exact environment variable mappings

### Prompt Patterns Used

- **Architecture**: *"Design a URL shortener with MongoDB, Express, React. What's the data model?"*
- **Debugging**: *"Why is the analytics aggregation slow? Here's the query..."*
- **Security**: *"Audit this auth middleware for vulnerabilities..."*
- **Production Readiness**: *"What happens if JWT_SECRET is missing in production?"*

### What AI Did NOT Do

- **UI design decisions** — Layout, colors, component structure were manually designed
- **Business logic decisions** — Password strength rules, rate limit thresholds, token expiry duration were deliberate human choices
- **Final testing** — Manual testing was performed to verify all flows
- **Deployment** — The actual deployment configuration was verified against Render/Vercel documentation

---

## Lessons Learned

1. **Environment variable safety must be intentional**: The `|| 'http://localhost:5000'` fallback pattern is a latent production bug. Always fail fast in production.

2. **Code splitting is essential for chart-heavy pages**: Recharts alone adds ~300 KB to the bundle. Lazy loading the AnalyticsPage reduces initial load time significantly.

3. **Denormalization improves read performance**: Storing `clickCount` on the URL document avoids expensive aggregation queries on every dashboard load.

4. **Sparse indexes solve the null-value uniqueness problem**: Custom aliases can be null for non-custom URLs while remaining unique for user-supplied values.

5. **AI is most effective for well-scoped tasks**: Broad "build the app" prompts produce generic code. Specific "add production env validation to index.js" prompts produce production-quality code.