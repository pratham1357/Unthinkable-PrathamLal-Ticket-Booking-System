# System Design — Ticket Booking System

## Overview

A full-stack ticket booking platform supporting movies and concerts. Three roles: Admin, Organiser, Customer. Built with Node.js/Express, Prisma/SQLite, React/Vite, JWT authentication.

---

## Seat Data Model

Each `Venue` has many `Seat` records, each tagged with a `category` (PREMIUM, STANDARD) and a `row`/`number`. When an `Event` is created for a venue, a `ShowSeat` record is generated for every seat in that venue. `ShowSeat` tracks per-event seat state:

- `status`: AVAILABLE | HELD | BOOKED
- `heldBy`: userId (nullable)
- `heldUntil`: timestamp (nullable)

This allows the same physical seat to have independent state across different events showing at the same venue.

---

## Seat Hold & TTL

When a customer selects seats and clicks "Hold Seats":

1. The backend receives an array of seatIds for a specific eventId.
2. Inside a **Prisma transaction**, it reads all target `ShowSeat` rows with a lock.
3. For each seat, it checks: `status === AVAILABLE` or (`status === HELD` and `heldUntil < now`).
4. If any seat fails this check, the transaction rolls back and returns a 409 error.
5. If all seats pass, they are updated: `status = HELD`, `heldBy = userId`, `heldUntil = now + HOLD_TTL_MINUTES`.
6. The hold expiry timestamp is returned to the frontend, which displays a live countdown timer.

`HOLD_TTL_MINUTES` is a `.env` variable defaulting to 10, easily changed to 1 for demo purposes.

---

## Auto-Release

Expired holds are cleaned up two ways:

1. **On-read**: Every time seat availability is queried, the query filters out or updates rows where `status = HELD AND heldUntil < now`. This ensures logical correctness without relying on background processes.
2. **Scheduled cleaner**: A `node-cron` job runs every minute, finding expired HELD seats and setting them back to AVAILABLE. It also checks for expired waitlist offers and advances the queue.

This dual approach means the system is correct even if the cron job is delayed.

---

## Concurrency Protection

The critical path is the hold operation. Two simultaneous requests for the same seat must not both succeed.

Prisma transactions on SQLite use serializable isolation — concurrent writes to the same row are serialized. The transaction:

1. Reads current seat status inside the transaction.
2. Validates availability.
3. Updates atomically.

If two requests arrive simultaneously for seat A1:
- Request 1 enters the transaction, reads A1 as AVAILABLE, updates to HELD, commits.
- Request 2 enters the transaction, reads A1 as HELD (or waits for lock), fails the availability check, and returns a 409 Conflict.

This is enforced server-side. The frontend check is only UX convenience and is never trusted as the source of truth.

---

## Waitlist Auto-Assignment Flow

When a customer tries to book a sold-out category:

1. Customer clicks "Join Waitlist" — creates a `WaitlistEntry` with `status = WAITING`, `position` auto-incremented per event+category.
2. When another customer cancels a booking that releases seats in that category:
   - The cancellation handler queries the next `WaitlistEntry` where `status = WAITING` for that event+category, ordered by `position`.
   - A `WaitlistOffer` is created: `status = PENDING`, `expiresAt = now + WAITLIST_OFFER_MINUTES`.
   - The waitlisted customer's entry is updated to `status = OFFERED`.
   - An email notification is sent (or logged in dev mode).
3. The customer sees the offer on their dashboard and has a time-limited window to complete booking.
4. If they complete booking within the window: offer marked `ACCEPTED`, booking created normally.
5. If the offer expires: the cron job marks it `EXPIRED`, the waitlist entry returns to `WAITING`, and the next customer in queue receives an offer.

---

## Booking Flow

1. Customer holds seats (transaction-protected).
2. Customer confirms booking — backend verifies hold is still valid and belongs to this user.
3. `Booking` and `BookingSeat` records created, `ShowSeat.status` updated to BOOKED.
4. QR code generated encoding the booking reference (e.g. `UBS-7F29A1`).
5. Email sent with QR code attachment.
6. Booking confirmation returned to frontend.

---

## QR Generation & Email

QR codes are generated server-side using the `qrcode` npm package. The QR encodes the booking reference string. In development mode with no email credentials configured, the system logs the email content to the console and returns the QR as a base64 data URL in the API response. With email credentials set in `.env`, it delivers via Nodemailer (any SMTP provider).

---

## Known Limitations

- SQLite serialization handles concurrency correctly for a single-server deployment. For horizontal scaling, a database with row-level locking (PostgreSQL) would be preferred.
- Real-time seat map updates use polling (3-second interval) rather than WebSockets, which is acceptable for a placement project demo.
- Email delivery in demo mode logs to console; configure SMTP credentials for real delivery.