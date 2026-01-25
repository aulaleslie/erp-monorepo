# Cycle 6 Gap Questions: Membership + PT Session Scheduling

This document captures design decisions required before authoring CYCLE_6.md. Each question includes options with pros/cons to guide discussion.

---

## Section 1: Member Entity & Lifecycle

### Q1.1 Where does "Member" live relative to People?

**Context:** Cycle 3 introduced `people` table with types CUSTOMER/SUPPLIER/STAFF. A membership purchase converts a CUSTOMER into a "Member" with health/compliance info.

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A) Extend People table** | Add `member_status`, `member_since`, `membership_expires_at` columns to `people` where `type=CUSTOMER`. Add separate `member_profiles` table for health/compliance. | Single source of truth for person identity; reuses existing People CRUD. | Bloats People table; not all customers are members. |
| **B) Separate Members table** | Create `members` table with FK to `people.id`. Member-specific fields (status, expiry, profile) live here. | Clean separation; only active members have records; easier to query members. | Two tables to manage; need to sync person data. |
| **C) Members as separate entity (no People FK)** | Standalone `members` table copying name/contact from People at creation. | Full independence; can diverge from source person. | Data duplication; loses person history link. |

**Recommended:** Option B — clean separation while maintaining People as the master record.

**Decision:** `B`

**Notes:** _____________________________________________

---

### Q1.2 What are the possible Member statuses?

**Context:** When a membership is purchased, the member may need to complete health forms before being fully active.

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A) Simple: NEW → ACTIVE → EXPIRED → INACTIVE** | NEW = pending profile completion; ACTIVE = valid membership; EXPIRED = past expiry; INACTIVE = manual deactivation. | Simple state machine; covers basic flow. | Doesn't distinguish hold/freeze scenarios. |
| **B) Extended: NEW → PENDING_APPROVAL → ACTIVE → FROZEN → EXPIRED → INACTIVE** | Adds PENDING_APPROVAL for admin review and FROZEN for temporary holds. | Covers more business scenarios; freeze is common for gyms. | More complex; needs freeze duration tracking. |
| **C) Hybrid with sub-status** | Core: NEW, ACTIVE, INACTIVE. Add `sub_status` for PENDING_PROFILE, FROZEN, EXPIRED as transient states. | Flexible; keeps core states minimal. | Two fields to check in queries. |

**Recommended:** Discuss if freeze/hold is in scope for Cycle 6 or deferred.

**Decision:** `A`

**Include freeze/hold in Cycle 6?** `No` (Yes / No)

**Notes:** _____________________________________________

---

### Q1.3 What member profile fields are required?

**Context:** Health-related and gym compliance info needed for member profiles.

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A) Fixed schema** | Predefined columns: `emergency_contact_name`, `emergency_contact_phone`, `health_conditions` (text), `agrees_to_terms` (boolean), `terms_agreed_at`. | Simple; type-safe; easy to validate. | Rigid; different gyms may need different fields. |
**Decision:** `A` (A / B / C / D)

**If Option A or C, list required profile fields:**
- [ ] `emergency_contact_name`
- [ ] `emergency_contact_phone`
- [ ] `health_conditions`
- [x] `agrees_to_terms` + `terms_agreed_at`
- [ ] Other: _____________________________________________

**Notes:** _____________________________________________

| **B) JSONB profile** | Single `profile` JSONB column with flexible schema. Define validation rules in code. | Flexible for different tenants; no migrations for new fields. | Harder to query; validation complexity. |
| **C) Hybrid** | Core columns for universal fields + `extra_fields` JSONB for tenant-specific. | Balance of structure and flexibility. | Still need migration for core fields; JSONB needs validation. |
| **D) Configurable form fields** | Create `member_profile_fields` table for tenant-defined fields; store responses in `member_profile_values`. | Maximum flexibility; tenants can customize. | Significant complexity; EAV pattern issues; out of scope? |

**Recommended:** Option A or C for Cycle 6, defer D to future cycle.

---

### Q1.4 How is member profile completion tracked?
**Decision:** `B` (A / B / C)

**Notes:** _____________________________________________


**Context:** Member may need to fill health info before being marked ACTIVE.

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A) Boolean flag** | `is_profile_complete` on members table. Service validates required fields before setting true. | Simple; single check for completeness. | Doesn't show which fields are missing. |
| **B) Percentage/score** | `profile_completion_percent` calculated from filled vs required fields. | Shows progress; good UX for forms. | Needs recalculation on schema changes. |
| **C) Required fields list** | Store list of required field keys; validate dynamically. | Tenant-configurable requirements. | More complex; needs field registry. |

**Recommended:** Option A for simplicity; UI can show missing fields from validation.

---

## Section 2: Membership Plans & Purchases

### Q2.1 How do membership items relate to actual memberships?

**Context:** Cycle 4 defines `items` with `type=SERVICE` and `service_kind=MEMBERSHIP`. Need to track actual memberships purchased.

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A) Memberships table linked to sales line** | Create `memberships` table with FK to `document_items.id` (from sales invoice). Track `start_date`, `end_date`, `status`. | Direct link to purchase; audit trail via sales docs. | Tight coupling to sales module. |
| **B) Memberships as standalone with optional sales ref** | `memberships` table with optional `source_document_id`. Can be created manually or via purchase. | Flexibility for comps/manual entries; looser coupling. | Two creation paths to maintain. |
**Decision:** `B`

**Notes:** _____________________________________________

| **C) Membership events log** | Track membership changes as events: PURCHASED, EXTENDED, FROZEN, EXPIRED. Current state derived from events. | Full history; event-sourced pattern. | Complex queries for current state; more tables. |

**Recommended:** Option B — allows sales integration while supporting manual entries.

---

### Q2.2 How are membership extensions handled?

**Context:** When a member purchases the same or different membership item, their expiry should extend.

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A) Update existing membership** | Find active membership, extend `end_date` by purchased duration. Log extension in history table. | Simple; single active membership per member. | Loses distinct membership purchase records. |
| **B) Create new membership record** | Each purchase creates a new `memberships` row. `end_date` = previous `end_date` + duration (if contiguous). | Clear purchase history; each membership traceable. | Need logic to chain memberships; more records. |
**Decision:** `B` (A / B / C)

**Notes:** _____________________________________________

| **C) Membership credits/balance** | Track membership as days/credits. Each purchase adds credits. Consumption calculated daily. | Flexible for different plans; handles partial usage. | Complex; overkill for simple duration-based memberships. |

**Recommended:** Option B — each purchase is a record, system chains them for expiry calculation.

---

### Q2.3 When does membership activation happen?

**Context:** Should membership start immediately on purchase or on a specific date?

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A) Immediate activation** | Membership starts on invoice POSTED date. | Simple; no manual intervention. | No flexibility for future start dates. |
| **B) Configurable start date** | Allow `start_date` override on purchase. Default to purchase date if not specified. | Flexible; supports pre-purchases. | UI needs date picker; more validation. |
**Decision:** `B` (A / B / C)

**Notes:** _____________________________________________

| **C) Activation trigger** | Membership stays PENDING until explicitly activated (first check-in or admin action). | Control over when membership period begins. | Requires extra step; may confuse users. |

**Recommended:** Option B — default to immediate but allow override.

---

### Q2.4 How is membership expiry calculated?

**Context:** Memberships have duration (30 days, 3 months, 1 year, etc.) defined on the item.

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A) Calendar-based** | `end_date` = `start_date` + duration using calendar math (add months/years). | Intuitive; "1 month" from Jan 15 = Feb 15. | Edge cases: Jan 31 + 1 month = Feb 28? |
| **B) Fixed days** | Convert all durations to days. "1 month" = 30 days always. | Predictable; no calendar edge cases. | "1 month" may feel short/long depending on month. |
**Decision:** `A` (A / B / C)

**Edge case rule (if A):** _____________________________________________

**Notes:** _____________________________________________

| **C) Tenant configurable** | Setting for calendar vs fixed days per tenant. | Maximum flexibility. | More complexity; inconsistent behavior. |

**Recommended:** Option A with defined edge case handling (end of month → end of month).

---

## Section 3: PT Sessions

### Q3.1 How are PT sessions tracked?

**Context:** PT session items have `session_count`. Need to track purchased vs used sessions.

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
**Decision:** `N/A` (A / B / C)

**Notes:** PT sessions should have expiry based on the duration.

| **A) PT session balance on member** | Store `pt_sessions_remaining` on `members` table. Decrement on each scheduled session. | Simple; single balance field. | Loses detail of which purchase sessions came from. |
| **B) PT session packages table** | Create `pt_session_packages` with FK to member + source purchase. Track `total`, `used`, `remaining` per package. | Clear tracking per purchase; supports FIFO consumption. | More tables; need to pick which package to consume. |
| **C) Individual session records** | Create a `pt_sessions` row for each session purchased. Mark as SCHEDULED/COMPLETED/CANCELLED. | Maximum granularity; each session is trackable. | Many rows; N rows per N-session package. |

**Recommended:** Option B — balance per purchase package with FIFO consumption.

---

### Q3.2 How is preferred trainer selection handled?

**Context:** When purchasing PT sessions, member should be able to select preferred trainer.

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A) Trainer on package** | `pt_session_packages.preferred_trainer_id` FK to `people` (STAFF). | Simple; one trainer per package. | Can't change preference mid-package without update. |
| **B) Trainer per session** | Each scheduled session has `trainer_id`. Preference is just a default. | Flexible; can use different trainers per session. | Need to set trainer on each booking. |
**Decision:** `C` (A / B / C)

**Notes:** _____________________________________________

| **C) Both** | Default trainer on package; override per session. Package trainer used if session trainer not specified. | Flexibility with convenience. | Slightly more complex logic. |

**Recommended:** Option C — default on package, override per session.

---

### Q3.3 How are included PT sessions in memberships handled?

**Context:** Cycle 4 allows `included_pt_sessions` on membership items (membership + PT bundle).

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A) Auto-create PT package** | When membership with `included_pt_sessions` is purchased, auto-create a `pt_session_packages` record. | Consistent tracking; same consumption logic. | Membership and PT are linked records; need cleanup on cancel. |
| **B) Separate purchase flow** | Treat included sessions as a discount on PT purchase; user must buy PT separately. | Simpler membership logic; clear separation. | Bad UX; not really "included" sessions. |
**Decision:** `A` (A / B / C)

**Notes:** _____________________________________________

| **C) Track on membership** | Store `included_pt_remaining` on the membership record itself. | Keeps bundle together; fewer records. | Inconsistent with standalone PT tracking. |

**Recommended:** Option A — auto-create PT package linked to membership.

---

## Section 4: Scheduling

### Q4.1 What is the scheduling scope?

**Context:** Need calendar UI for PT sessions. Could expand to classes/facilities later.

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A) PT sessions only** | Schedule only tracks PT sessions between member and trainer. | Focused scope; simpler to build. | Need new tables if expanding later. |
| **B) Generic scheduling** | Create flexible `schedules` table that can handle PT sessions, classes, facility bookings. | Future-proof; single scheduling system. | More complex upfront; may over-engineer. |
| **C) PT-focused with extension points** | Build for PT sessions but design schema to accommodate future types. | Balance of focus and extensibility. | Needs careful design. |

**Recommended:** Option C — PT-focused with `schedule_type` enum for future expansion.

**Decision:** `C` (A / B / C)

**Notes:** _____________________________________________

---

### Q4.2 What is the schedule slot structure?

**Context:** UI should show calendar with bookable time slots.

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A) Pre-defined slots** | Create `schedule_slots` table with available slots per trainer per day. Members book from available slots. | Clear availability; prevents double-booking. | Need to maintain slot availability; more admin work. |
| **B) Free-form booking** | Members/admins create bookings at any time. Conflict checking at booking time. | Flexible; no slot maintenance. | Harder to show availability; race conditions. |
| **C) Trainer availability + booking** | `trainer_availability` defines available hours. Bookings created within availability windows. | Shows clear availability; flexible within windows. | Two tables; need to match booking to availability. |

**Recommended:** Option C — availability windows with conflict checking.

**Decision:** `C` (A / B / C)

**Notes:** _____________________________________________

---

### Q4.3 What time granularity for slots?

**Context:** PT sessions typically 30-60 minutes. Need configurable slot duration.

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A) Fixed 60-minute slots** | All sessions are 1 hour. | Simple; consistent calendar display. | Inflexible for 30 or 90-minute sessions. |
| **B) Fixed 30-minute slots** | Sessions can be 30, 60, 90 minutes (multiples of 30). | Flexible enough for most gyms. | 15-minute sessions not supported. |
| **C) Tenant configurable** | `slot_duration_minutes` setting. Bookings must be multiples of this duration. | Maximum flexibility. | Calendar display complexity varies. |
| **D) Variable per booking** | Each booking specifies start + end time. No fixed slot duration. | Most flexible. | Calendar harder to render; no grid alignment. |

**Recommended:** Option C with default 30 minutes — configurable for tenant needs.

**Decision:** `C` (A / B / C / D)

**Default slot duration (if C):** `60` minutes

**Notes:** _____________________________________________

---

### Q4.4 How are recurring schedules handled?

**Context:** Trainers may have fixed weekly availability (e.g., Mon/Wed/Fri 9am-5pm).

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A) Manual daily entry** | Admin enters availability for each day manually. | Simple; no recurrence logic. | Tedious for regular schedules. |
| **B) Weekly template** | Define weekly template (Mon: 9-17, Tue: 10-18, etc.). System generates daily slots. | Easy setup; handles most cases. | Exceptions (holidays, sick days) need overrides. |
| **C) iCal-style recurrence** | Full RRULE support for complex patterns. | Maximum flexibility. | Complex to implement; overkill for most gyms. |
| **D) Template + overrides** | Weekly template as default. Allow date-specific overrides (blocked, extended, modified). | Good balance; handles exceptions. | Two sources to check for availability. |

**Recommended:** Option D — weekly template with date overrides.

**Decision:** `D` (A / B / C / D)

**Notes:** _____________________________________________

---

### Q4.5 What booking statuses are needed?

**Context:** PT session bookings go through lifecycle from creation to completion.

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A) Simple: SCHEDULED → COMPLETED / CANCELLED / NO_SHOW** | Basic states covering main outcomes. | Simple; covers most cases. | No confirmed vs pending distinction. |
| **B) Extended: PENDING → CONFIRMED → COMPLETED / CANCELLED / NO_SHOW** | PENDING = requested, CONFIRMED = approved by trainer/admin. | Supports approval workflow. | Extra step may slow booking. |
| **C) With rescheduling: Add RESCHEDULED** | Track when a booking was moved to a new time. | Audit trail for changes. | RESCHEDULED is transient; may just update existing. |

**Recommended:** Option A for MVP; Option B if trainer confirmation is required.

**Decision:** `A`

**Require trainer confirmation?** `Yes` (Yes / No)

**Notes:** _____________________________________________

---

### Q4.6 Who can create/modify bookings?

**Context:** Need to define permissions for scheduling.

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A) Admin/staff only** | Only staff with permissions can create/modify bookings. | Full control; no member self-service. | More admin workload. |
| **B) Member self-service** | Members can book available slots directly. | Less admin work; better UX. | Need member-facing UI; potential for abuse. |
| **C) Hybrid** | Members can request; staff confirms. Or members book, staff can modify. | Balance of convenience and control. | More complex permissions model. |

**Recommended:** Start with Option A; member self-service is separate future feature.

**Decision:** `A` (A / B / C)

**Notes:** _____________________________________________

---

## Section 5: Notifications & Expiry

### Q5.1 What expiry notifications are needed?

**Context:** Push notifications for membership expiring soon.

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A) Single notification** | One notification N days before expiry (configurable). | Simple; single touchpoint. | May not be enough notice. |
| **B) Multiple notifications** | Notify at 30, 7, 1 days before expiry (configurable list). | Multiple reminders increase retention. | More notifications to manage; potential spam. |
| **C) Escalating notifications** | Different channels at different times (email at 30d, push at 7d, SMS at 1d). | Multi-channel approach. | Requires multiple notification channels. |

**Recommended:** Option B with configurable intervals.

**Decision:** `B` (A / B / C)

**Notification intervals (if B):** `7, 5, 3, 1` days before expiry (comma-separated, e.g., 30, 7, 1)

**Notes:** _____________________________________________

---

### Q5.2 How are notifications delivered?

**Context:** System needs to send notifications to members.

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A) In-app only** | Notifications visible in app when member logs in. | Simple; no external dependencies. | Member may not log in; misses notification. |
| **B) Email** | Send email notifications. | Reliable delivery; standard approach. | Needs email service integration. |
| **C) Push notifications** | Mobile/browser push notifications. | Immediate; high visibility. | Needs push infrastructure; member must enable. |
| **D) Multi-channel** | Support multiple channels; member chooses preference. | Maximum reach. | Complex; multiple integrations. |

**Recommended:** Option B (email) for Cycle 6; A (in-app) as fallback. Push/SMS deferred.

**Decision:** `___` (A / B / C / D)

**Notes:** we don't have member facing UI just yet. so just notify admin

---

### Q5.3 How is the notification job scheduled?

**Context:** Need to check expiring memberships daily and send notifications.

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A) Cron job** | Scheduled task runs daily (e.g., 8am) to check and send notifications. | Simple; predictable timing. | Needs cron/scheduler setup. |
| **B) BullMQ scheduled jobs** | Use BullMQ repeat jobs for daily check. | Reuses existing worker infrastructure. | BullMQ repeat jobs can be tricky. |
| **C) Database trigger + outbox** | On membership create/update, calculate notification dates and insert into outbox. | Event-driven; accurate timing. | Complex; many outbox entries. |

**Recommended:** Option B — leverage existing BullMQ infrastructure from Cycle ALTER.

**Decision:** `B` (A / B / C)

**Notes:** _____________________________________________

---

### Q5.4 Should expired memberships be auto-transitioned?

**Context:** When membership passes expiry date, should status change automatically?

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A) Auto-transition** | Daily job sets status=EXPIRED for memberships past end_date. | Accurate status; no manual work. | Need to handle edge cases (grace period?). |
| **B) Query-time status** | Status stays ACTIVE; queries check `end_date < now()` for effective status. | No jobs needed; always accurate. | Inconsistent stored vs actual status; query complexity. |
| **C) Hybrid** | Query-time for display; periodic job updates status for reporting. | Best of both; eventual consistency. | Two sources of truth temporarily. |

**Recommended:** Option A with configurable grace period (default 0 days).

**Decision:** `A` (A / B / C)

**Grace period (if A):** `0` days (default 0)

**Notes:** _____________________________________________

---

## Section 6: Calendar UI

### Q6.1 What calendar views are required?

**Context:** UI should show daily/weekly/monthly views like Google Calendar.

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A) All three (day/week/month)** | Full calendar views with toggle. | Complete feature; matches user expectations. | More UI work. |
| **B) Week view only** | Focus on weekly scheduling. | Simpler; covers main use case. | Less flexibility for viewing. |
| **C) Week + day detail** | Week overview; click to see day detail. | Good balance; drill-down pattern. | Missing month overview. |

**Recommended:** Option A — full calendar experience is expected.

**Decision:** `B` (A / B / C)

**Notes:** _____________________________________________

---

### Q6.2 What calendar library to use?

**Context:** Need a React-compatible calendar component.

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A) FullCalendar** | Popular, feature-rich calendar. MIT for basic; premium features paid. | Mature; drag-drop support; good docs. | Large bundle; premium features need license. |
| **B) react-big-calendar** | MIT-licensed; Google Calendar-like. | Free; customizable; lighter than FullCalendar. | Less polished; fewer built-in features. |
| **C) Custom with date-fns/dayjs** | Build calendar grid using utility libraries. | Full control; minimal dependencies. | Significant development effort. |
| **D) shadcn/ui calendar** | Use shadcn date picker and build grid. | Consistent with existing UI; Tailwind-native. | Need to build scheduling features manually. |

**Recommended:** Option B (react-big-calendar) — free, proven, good balance.

**Decision:** `D` (A / B / C / D)

**Notes:** _____________________________________________

---

### Q6.3 How is trainer filtering handled?

**Context:** Calendar should filter by trainer to show their schedule.

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A) Single trainer view** | Dropdown to select one trainer; shows their schedule. | Simple; focused view. | Can't compare trainers. |
| **B) Multi-trainer view** | Select multiple trainers; color-coded events. | Compare availability across trainers. | UI complexity; color management. |
| **C) Resource view** | Side-by-side columns per trainer (like resource view in calendars). | Clear comparison; professional look. | Complex UI; horizontal scrolling with many trainers. |

**Recommended:** Option A for MVP; Option B/C as enhancement.

**Decision:** `B` (A / B / C)

**Notes:** _____________________________________________

---

### Q6.4 How are bookings created from calendar?

**Context:** User clicks on calendar to create a booking.

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A) Click to open modal** | Click time slot; modal opens with prefilled time; complete booking form. | Standard pattern; full form validation. | Extra click to complete. |
| **B) Drag to create** | Drag on calendar to select time range; modal opens. | Intuitive; visual selection. | Complex to implement; touch device issues. |
| **C) Quick create + edit** | Click creates tentative booking; click again to edit details. | Fast creation; fewer steps. | May create incomplete bookings. |

**Recommended:** Option A — click to modal is reliable and works on all devices.

**Decision:** `A` (A / B / C)

**Notes:** _____________________________________________

---

## Section 7: Integration with Sales

### Q7.1 How does purchase trigger membership/PT creation?

**Context:** When sales invoice is POSTED, membership/PT packages should be created.

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A) Synchronous in posting handler** | Sales posting handler creates memberships/PT packages in same transaction. | Atomic; all-or-nothing. | Coupling between sales and membership modules. |
| **B) Outbox event + worker** | Sales posts to outbox; worker creates memberships/PT packages. | Decoupled; resilient to failures. | Eventual consistency; delay in creation. |
| **C) Hybrid** | Create membership stub synchronously; worker enriches/activates. | Fast creation; async for notifications. | Two-phase creation logic. |

**Recommended:** Option A for reliability — membership should exist immediately after purchase.

**Decision:** `A` (A / B / C)

**Notes:** _____________________________________________

---

### Q7.2 What happens on invoice cancellation/credit note?

**Context:** If sale is reversed, what happens to created memberships?

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A) Auto-deactivate** | Credit note automatically deactivates linked membership/PT package. | Consistent; no orphan memberships. | May deactivate used memberships; needs policy. |
| **B) Manual handling** | Credit note flags membership for review; admin decides. | Human judgment for edge cases. | Admin overhead; inconsistent handling. |
| **C) Prorated refund tracking** | Track used vs remaining; credit note only covers unused portion. | Fair; accurate refunds. | Complex calculation; needs usage tracking. |

**Recommended:** Option B for Cycle 6 — flag for review; C is future enhancement.

**Decision:** `B` (A / B / C)

**Notes:** _____________________________________________

---

## Section 8: Permissions

### Q8.1 What permissions are needed for Cycle 6?

**Context:** Need to define permission codes for membership and scheduling features.

| Proposed Permissions | Description |
|---------------------|-------------|
| `members.read` | View member list and details |
| `members.create` | Create new members (from People) |
| `members.update` | Edit member profile and status |
| `members.delete` | Deactivate members |
| `memberships.read` | View membership records |
| `memberships.create` | Create manual memberships |
| `memberships.update` | Modify memberships (extend, freeze) |
| `memberships.cancel` | Cancel memberships |
| `pt_sessions.read` | View PT session packages and bookings |
| `pt_sessions.create` | Create PT packages (manual) |
| `pt_sessions.update` | Modify PT packages |
| `schedules.read` | View calendar and bookings |
| `schedules.create` | Create bookings |
| `schedules.update` | Modify bookings (reschedule) |
| `schedules.delete` | Cancel bookings |
| `trainer_availability.read` | View trainer availability |
| `trainer_availability.update` | Manage trainer availability |

**Question:** Is this granularity appropriate, or should permissions be consolidated?

**Decision:** `Keep as proposed` (Keep as proposed / Consolidate)

**If consolidate, how?** _____________________________________________

**Additional permissions needed:** _____________________________________________

**Permissions to remove:** _____________________________________________

---

## Section 9: Data Model Summary (Pending Decisions)

### Proposed Tables (subject to answers above)

| Table | Purpose | Key FKs |
|-------|---------|---------|
| `members` | Member record linked to People | `person_id`, `tenant_id` |
| `member_profiles` | Health/compliance info | `member_id` |
| `memberships` | Individual membership purchases | `member_id`, `item_id`, `document_item_id` |
| `membership_history` | Extensions, freezes, status changes | `membership_id` |
| `pt_session_packages` | Purchased PT session bundles | `member_id`, `item_id`, `document_item_id`, `preferred_trainer_id` |
| `trainer_availability` | Trainer weekly templates | `trainer_id` (person), `tenant_id` |
| `trainer_availability_overrides` | Date-specific availability changes | `trainer_availability_id` |
| `schedule_bookings` | Individual PT session bookings | `pt_session_package_id`, `member_id`, `trainer_id` |
| `notification_queue` | Pending notifications | `member_id`, `type`, `scheduled_for` |

---

## Section 10: Out of Scope Candidates

The following may be explicitly deferred from Cycle 6:

1. **Member self-service portal** — members booking their own sessions
2. **Group classes scheduling** — different from 1:1 PT sessions
3. **Facility/equipment booking** — room reservations, equipment checkout
4. **Payment integration** — actual payment processing (sales handles invoicing)
5. **Attendance/check-in** — member check-in at gym entrance
6. **Mobile push notifications** — email only for Cycle 6
7. **Membership freeze/hold** — temporary suspension of membership
8. **Membership transfers** — transferring membership to another person
9. **Waitlist for fully-booked slots** — notification when slot opens

**Question:** Should any of these be pulled into Cycle 6 scope?

**Include in Cycle 6:**
- [ ] Member self-service portal
- [x] Group classes scheduling
- [ ] Facility/equipment booking
- [ ] Payment integration
- [x] Attendance/check-in
- [ ] Mobile push notifications
- [ ] Membership freeze/hold
- [ ] Membership transfers
- [ ] Waitlist for fully-booked slots (deferred)

**Notes:** _____________________________________________

---

## Next Steps

1. Review and answer questions in each section
2. Finalize data model based on decisions
3. Draft CYCLE_6.md with EPICs and tickets following existing patterns
4. Estimate complexity and split if needed

---

## Section 11: Follow-up Questions (Based on Answers)

### Q11.1 PT Session Package Tracking (Clarification for Q3.1)

**Context:** You answered N/A for Q3.1 with note "PT sessions should have expiry based on duration." This implies PT packages also expire. Please confirm:

| Option | Description |
|--------|-------------|
| **A) Package with expiry** | `pt_session_packages` tracks `total`, `used`, `remaining` + `expiry_date`. Sessions not used by expiry are forfeited. |
| **B) Package without expiry** | PT sessions never expire; member can use them anytime. |
| **C) Configurable per item** | PT session items define `duration_value`/`duration_unit` for package expiry. |

**Decision:** `C` (A / B / C)

**If A or C, should expiry be from purchase date or first session?** `purchase` (purchase / first_session)

**Notes:** _____________________________________________

---

### Q11.2 Booking Status Clarification (Q4.5 Contradiction)

**Context:** You selected Option A (simple statuses: SCHEDULED → COMPLETED/CANCELLED/NO_SHOW) but also said "Require trainer confirmation? Yes". These are contradictory — trainer confirmation implies PENDING → CONFIRMED flow (Option B).

**Please clarify:**

| Option | Description |
|--------|-------------|
| **A) No confirmation** | Admin creates booking → SCHEDULED immediately. No trainer approval needed. |
| **B) With confirmation** | Admin creates booking → PENDING. Trainer confirms → CONFIRMED. Then → COMPLETED/CANCELLED/NO_SHOW. |

**Decision:** `A` (A / B)

**Notes:** _____________________________________________

---

### Q11.3 Notification Delivery for Admin (Q5.2 Clarification)

**Context:** You noted "we don't have member facing UI just yet, so just notify admin." Please clarify:

| Option | Description |
|--------|-------------|
| **A) In-app notifications for admin** | Show badge/bell icon in admin dashboard with expiring memberships. |
| **B) Email to admin** | Send daily digest email to tenant admins with expiring memberships. |
| **C) Both** | In-app + email notifications. |
| **D) Dashboard widget only** | No push notifications; admin checks "Expiring Soon" widget on dashboard. |

**Decision:** `A` (A / B / C / D)

**Who receives notifications?** `users with specific permission` (all admins / users with specific permission / configurable)

**Notes:** _____________________________________________

---

### Q11.4 Calendar Expiry Edge Case (Q2.4)

**Context:** You selected calendar-based expiry but didn't specify edge case rule. What happens for:
- Jan 31 + 1 month = ?
- Mar 31 + 1 month = ?

| Option | Description |
|--------|-------------|
| **A) Clamp to end of month** | Jan 31 + 1 month = Feb 28/29. Mar 31 + 1 month = Apr 30. |
| **B) Overflow to next month** | Jan 31 + 1 month = Mar 2/3. |
| **C) Use last day if original was last day** | If start was last day of month, end is also last day of target month. |

**Decision:** `C` (A / B / C)

**Notes:** _____________________________________________

---

## Section 12: Additional Scope Questions

You've added these to Cycle 6 scope. Please answer the following:

### Q12.1 Group Classes - Basic Structure

**Context:** Group classes differ from PT sessions (1:many vs 1:1).

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A) Simple classes** | Fixed schedule, fixed capacity. Members book spots. No packages needed. | Simple; covers basic group fitness. | No class packages or punch cards. |
| **B) Class packages** | Members buy class packages (e.g., 10-class pack). Deduct on attendance. | Flexible pricing; common gym model. | More tracking complexity. |
| **C) Membership includes classes** | Membership grants unlimited class access. No separate booking needed. | Simple for all-inclusive memberships. | Can't sell standalone class packages. |
| **D) Hybrid** | Membership may include class access; standalone packages also available. | Maximum flexibility. | Complex logic. |

**Decision:** `B` (A / B / C / D)

**Notes:** I chose B but need you to suggest. the idea is for user to be able to buy class package. in membership, if class package is bought, means admin will ask user about the class members. max class member will depend on service configuration.

---

### Q12.1b Group Classes - Clarification Needed

**Context:** Based on your notes, it sounds like a "class package" is actually a **private group session** (like group PT), not a public group fitness class. Please confirm:

| Option | Description |
|--------|-------------|
| **A) Private group session** | One member purchases a package for X sessions. They specify who joins (e.g., bring 2 friends). Max participants defined on the item. Like "group PT" where one person pays for the whole group. |
| **B) Public group class** | Gym schedules classes (Yoga, Spin, etc.). Multiple members independently book spots. Each member needs their own class pass/membership. |
| **C) Both** | Support both private group sessions (PT-style) and public group classes. |

**Decision:** `A` (A / B / C)

**If A: Who are the "class members" added by the purchaser?**
- [x] Other existing members (from People)
- [ ] Non-members (guests with just a name)
- [ ] Both

**Notes:** _____________________________________________

---

### Q12.2 Group Classes - Capacity & Waitlist

**Context:** Classes have limited capacity.

| Option | Description |
|--------|-------------|
| **A) Hard cap** | When class is full, booking is blocked. No waitlist. |
| **B) Waitlist auto-promote** | When someone cancels, first waitlisted member is auto-booked and notified. |
| **C) Waitlist manual** | Admin manually promotes from waitlist. |

**Decision:** `A` (A / B / C)

**Default class capacity:** `configurable per class` (number or "configurable per class")

**Notes:** in this current case, class package is defined by membership class member. so one member buy class package, the admin will include other member as class member.

---

### Q12.3 Group Classes - Instructor Assignment

**Context:** Who teaches group classes?

| Option | Description |
|--------|-------------|
| **A) Fixed instructor per class** | Each class has assigned instructor. |
| **B) Rotating instructors** | Class can have different instructors on different days. |
| **C) No instructor tracking** | Just track the class; instructor is informational only. |

**Decision:** `A` (A / B / C)

**Notes:** _____________________________________________

---

### Q12.4 Attendance/Check-in - Method

**Context:** How do members check in?

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A) Manual by staff** | Staff marks member as checked in from admin UI. | Simple; no hardware needed. | Slow for busy gyms. |
| **B) QR code scan** | Member shows QR code (from app/email); staff scans. | Fast; verifiable. | Needs member to have QR code accessible. |
| **C) Member code entry** | Staff enters member code/ID manually. | No QR needed. | Manual entry errors. |
| **D) Barcode/card scan** | Physical membership card with barcode. | Industry standard. | Needs barcode scanner hardware. |

**Decision:** `A/B` (A / B / C / D)

**Notes:** so pt session can have these conditions. sometimes pt session bought without membership commitment. so, the deduction will be handled by trainer, by the help of admin, trainer will tell which member(s) he/she will train, depends on the package, it will deduct the quota. as for member, the admin can enter the member id or member name or member phone to help member do the checkin. in the future, I will need QR scanner so member can self service.

---

### Q12.5 Attendance/Check-in - What Gets Recorded

**Context:** What does check-in track?

| Option | Description |
|--------|-------------|
| **A) Gym entry only** | Just log that member entered the gym. |
| **B) Gym entry + class attendance** | Track both general entry and class participation. |
| **C) Entry + class + PT session** | Complete attendance tracking across all activities. |

**Decision:** `C` (A / B / C)

**Should check-in validate active membership?** `Yes` (Yes / No)

**Should expired members be blocked at check-in?** `Yes` (Yes / No / Warn only)

**Notes:** _____________________________________________

---

### Q12.6 Waitlist - Scope

**Context:** You added waitlist for fully-booked slots. Clarify scope:

| Option | Description |
|--------|-------------|
| **A) PT sessions only** | Waitlist for PT session bookings when trainer slot is taken. |
| **B) Group classes only** | Waitlist for full group classes. |
| **C) Both PT and classes** | Waitlist system for all booking types. |
| **D) Defer to future** | Remove waitlist from Cycle 6 scope; add later. |

**Decision:** `D` (A / B / C / D)

**Notes:** Deferred to future cycle. Focus on core scheduling first.

---

## Section 13: Scope Confirmation

Given the additions (group classes, attendance, waitlist), this cycle is quite large. Please confirm:

**Split Cycle 6 into phases?**
- [ ] **Phase A:** Members + Memberships + PT Sessions (core)
- [ ] **Phase B:** Scheduling + Calendar UI
- [ ] **Phase C:** Group Classes + Attendance + Waitlist

**Or keep as single cycle?** `single` (Single / Split)

**Notes:** you can breakdown the tasks to as tiny as possible. no need to split

---

## References

- [CYCLE_3.md](CYCLE_3.md) — People module patterns
- [CYCLE_4.md](CYCLE_4.md) — Catalog items with membership/PT service_kind
- [CYCLE_5.md](CYCLE_5.md) — Sales documents and approval patterns
- [CYCLE_ALTER.md](CYCLE_ALTER.md) — Document engine, outbox, BullMQ patterns
