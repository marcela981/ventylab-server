# Analytics

Teaching panels, the student's own summary and the anonymized research export. The analytics feature has no tables: it composes the public facades of other features, and no feature imports it.

## Endpoints

| Route | Access | Purpose |
| --- | --- | --- |
| `GET /api/analytics/groups/:groupId/dashboard` | `analytics:read` (TEACHER, ADMIN) | One row per student member: progress by section, level and module; counted grade per evaluation and average; simulation sessions (count, average score, average time to stabilize); AI usage per use case with the percentage of useful ratings; ventilator hours. |
| `GET /api/analytics/groups/:groupId/export.csv` | `analytics:read` | Grades and progress of the same dashboard as RFC 4180 CSV (`toCsv`, formula-injection guard). |
| `GET /api/analytics/students/:userId/timeline?from=&to=` | `analytics:read` | Lesson completions, evaluation attempts (start and submission), simulation sessions and reservations, newest first. Default range: last 30 days; at most 366 days (422 otherwise); 200 entries per source, 500 in total. Each source is read with one extra row, and `truncated` is true when any source or the merged total was capped. |
| `GET /api/analytics/evaluations/:evaluationId/stats` | `analytics:read` | Average, median, min, max, histogram in 0.5 buckets on the 0–5 scale and pass rate (passing grade from `evaluation.passingGrade`) over graded attempts, plus per-question correct rate and difficulty index. For a teacher only the attempts in the teacher's attempt scope count (see Scope); ADMIN gets the whole evaluation. |
| `GET /api/analytics/research/export.csv?groupId=` | `analytics:research-export` (ADMIN) | Anonymized long-format dataset for the thesis analysis. |
| `GET /api/me/summary` | Any authenticated user, self only (the ID comes from the JWT) | Progress per section, published grades, active and upcoming evaluations, latest notes, AI tutor conversations and simulation sessions, upcoming reservations, unread notifications. |

## Scope

- ADMIN sees every group, student and evaluation, with whole-evaluation statistics and whole grade history.
- A teacher's manageable groups are the STUDENT groups the teacher created or supervises through an active TEACHER group the teacher belongs to, read with one query (`GroupsFacade.getManageableStudentGroupIds`, optionally narrowed to candidate groups).
- Group panels: the group must be one of the manageable groups.
- Student timeline: the target must be a user with role STUDENT who is a member of one of the manageable groups (`GroupsFacade.isStudentMemberOfAny`, one query).
- Evaluation statistics: the evaluation must be assigned to one of the manageable groups (one query intersecting the assigned groups), or, when it has no assignments (legacy), the teacher must be its creator.
- Attempt scope: for a teacher, every attempt read (evaluation statistics and per-question analysis, dashboard and group CSV grades, timeline attempts) is limited to attempts whose assignment belongs to one of the manageable groups, or attempts without an assignment of evaluations the teacher created. This is the same rule as grading, so a teacher of group A never aggregates or sees group B attempts of a shared evaluation.
- Lesson progress, simulation sessions, AI usage and ratings, and ventilator reservations are per user and not tied to a group or evaluation, so panels show the student's whole history for them.
- Out of scope answers 403 (`analytics.out_of_scope`); a missing group or evaluation answers 404. The scope check runs on every request, also when the panel is cached.

## Cache

`AnalyticsCache` keeps each panel in memory for 60 s. The key carries the panel, its resource (group, evaluation or student and range) and the requester scope (`admin`, or `user:<id>:<sorted manageable group ids>` for a teacher), so one requester never receives another's cached entry and a change in the teacher's groups starts a new entry. Concurrent requests share one load; failed loads are not cached; at most 500 entries. The timeline's default end is rounded up to the minute so repeated default requests share an entry.

## Query budget (30-student dashboard, cold cache)

One batched facade call per feature, each with a fixed number of Prisma operations whatever the group size:

| Step | Prisma operations |
| --- | --- |
| Scope (group summary; teacher: plus manageable group ids, which also give the attempt scope) | 2 (admin 1) |
| Group members | 1 |
| Progress (`getProgressForUsers`): published structure (sections, levels, modules), published lessons with their filtered published-page count, completed page views of all users (`IN`), lesson completion records of all users (`IN`) | 6 |
| Published grades (`getGradesForUsers`, `IN`, teacher attempt scope in the same query) | 1 |
| Simulation (`getSessionStatsForUsers`, one grouped `$queryRaw` with `IN`) | 1 |
| AI telemetry (`getUsageForUsers`, one `groupBy` with `IN`) | 1 |
| AI ratings (`getHelpfulnessForUsers`, one grouped `$queryRaw` with `IN`) | 1 |
| Ventilator hours (`getVentilatorUsageForUsers`, one `findMany` with `IN`) | 1 |
| **Total** | **14 (admin 13)** |

A Prisma operation that selects a relation (members with their user, grades with their evaluation title) may be split by Prisma into more than one SQL statement; the count above is Prisma operations. The feature batches run in parallel. `GetGroupDashboardUseCase` has a spec asserting each batch method is called exactly once for 30 students.

Other panels: evaluation statistics take 10 Prisma operations for a teacher (reference, manageable groups among the assigned ones, 4 aggregates, graded grades, questions, graded count, graded answers; admin 9); the timeline takes 6 for a teacher (manageable groups, membership, one read per source; admin 4).

## Derived metrics

- **Counted grade**: the latest published attempt of each evaluation; the average is over evaluations.
- **Time to stabilize**: the `value` of the `TIME_TO_STABILIZE` criterion in the persisted `summary.breakdown` of each session (seconds until every target was met and held). Sessions without a persisted summary, or that never stabilized (`value` null), are left out of the average; the metric is null when no session qualifies. No session is replayed.
- **Difficulty index**: mean share of the question points earned over graded attempts (manual score over automatic; an unanswered question counts 0). **Correct rate**: share of graded attempts with full points.
- **Ventilator hours**: reservations held by the student (`USER` holder, not group reservations), from start to the earliest of scheduled end, now, or the last update of a cancelled or preempted reservation.
- **Useful percentage**: ratings marked helpful over ratings given, per AI use case of the rated call (`unknown` when the rating has no linked call).

## Research export

- Requires `ANALYTICS_EXPORT_SALT` (optional environment variable, at least 16 characters). Without it the route answers 503 (`analytics.export_not_configured`) and reads nothing.
- Participants: users with role STUDENT who are members of STUDENT groups (all, or `groupId`). A student in several groups is exported once, under the first group by identifier.
- Columns: `participant, group, domain, item, metric, value`. `participant` is `HMAC-SHA256(userId)` and `group` is `HMAC-SHA256(groupId)`, keyed by the salt, as lowercase hex; evaluation items are `HMAC-SHA256("evaluation:" + evaluationId)` (domain separated, because an evaluation can identify the group it was assigned to); the same salt gives the same pseudonyms across exports, so changing it unlinks old and new files.
- Domains: `progress` (overall and per section), `grades` (counted grade per evaluation), `simulation` (session count, average score, average time to stabilize), `ai_telemetry` (calls, tokens and average latency per use case) and `ai_ratings` (ratings, helpful rate and dimension means per use case). Items are `overall`, section identifiers (published curriculum content shared by every group), pseudonymized evaluations, `all` or AI use case names.
- No names, emails or user, group, evaluation, attempt or session identifiers are written; the export spec seeds names, emails, student-code-like strings and raw identifiers into the sources and checks the allowed values of every column. User accounts have no student-code field.
