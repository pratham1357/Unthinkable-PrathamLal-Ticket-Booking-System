const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// List events with optional filter
router.get('/', async (req, res) => {
  const { type, search } = req.query;
  const where = {};
  if (type) where.type = type;
  if (search) where.title = { contains: search };

  const events = await prisma.event.findMany({
    where,
    include: { venue: true, organiser: { select: { name: true } } },
    orderBy: { date: 'asc' },
  });
  res.json(events);
});

router.get('/:id', async (req, res) => {
  const event = await prisma.event.findUnique({
    where: { id: parseInt(req.params.id) },
    include: { venue: true, organiser: { select: { name: true } } },
  });
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json(event);
});

// Seat map for an event
router.get('/:id/seats', async (req, res) => {
  const eventId = parseInt(req.params.id);
  const now = new Date();

  // Auto-release expired holds before returning seat map
  await prisma.showSeat.updateMany({
    where: { eventId, status: 'HELD', heldUntil: { lt: now } },
    data: { status: 'AVAILABLE', heldBy: null, heldUntil: null },
  });

  const showSeats = await prisma.showSeat.findMany({
    where: { eventId },
    include: { seat: true },
    orderBy: [{ seat: { row: 'asc' } }, { seat: { number: 'asc' } }],
  });
  res.json(showSeats);
});

// Hold seats
router.post('/:id/hold', authenticate, async (req, res) => {
  const eventId = parseInt(req.params.id);
  const userId = req.user.id;
  const { seatIds } = req.body;

  if (!seatIds || seatIds.length === 0) return res.status(400).json({ error: 'No seats provided' });

  const ttl = parseInt(process.env.HOLD_TTL_MINUTES || '10');
  const heldUntil = new Date(Date.now() + ttl * 60 * 1000);
  const now = new Date();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const seats = await tx.showSeat.findMany({
        where: { id: { in: seatIds }, eventId },
      });

      if (seats.length !== seatIds.length) throw new Error('INVALID_SEATS');

      for (const seat of seats) {
        const isAvailable = seat.status === 'AVAILABLE' ||
          (seat.status === 'HELD' && seat.heldUntil && seat.heldUntil < now && seat.heldBy === userId);
        if (!isAvailable) throw new Error(`SEAT_UNAVAILABLE:${seat.id}`);
      }

      // Release any existing holds this user has on this event before new hold
      await tx.showSeat.updateMany({
        where: { eventId, heldBy: userId, status: 'HELD' },
        data: { status: 'AVAILABLE', heldBy: null, heldUntil: null },
      });

      await tx.showSeat.updateMany({
        where: { id: { in: seatIds }, eventId },
        data: { status: 'HELD', heldBy: userId, heldUntil },
      });

      return { heldUntil, seatIds };
    });

    res.json({ message: 'Seats held', heldUntil: result.heldUntil, seatIds: result.seatIds });
  } catch (err) {
    if (err.message === 'INVALID_SEATS') return res.status(400).json({ error: 'Invalid seat selection' });
    if (err.message.startsWith('SEAT_UNAVAILABLE')) return res.status(409).json({ error: 'One or more seats are no longer available' });
    console.error(err);
    res.status(500).json({ error: 'Hold failed' });
  }
});

// Create event (organiser/admin)
router.post('/', authenticate, requireRole('ORGANISER', 'ADMIN'), async (req, res) => {
  const { title, description, type, venueId, date, premiumPrice, standardPrice, posterUrl } = req.body;
  if (!title || !venueId || !date || !premiumPrice || !standardPrice) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const event = await prisma.event.create({
    data: {
      title, description: description || '', type: type || 'MOVIE',
      venueId: parseInt(venueId), organiserId: req.user.id,
      date: new Date(date), premiumPrice: parseFloat(premiumPrice),
      standardPrice: parseFloat(standardPrice), posterUrl: posterUrl || null,
    },
  });

  // Create ShowSeat entries for all venue seats
  const seats = await prisma.seat.findMany({ where: { venueId: parseInt(venueId) } });
  for (const seat of seats) {
    await prisma.showSeat.create({ data: { eventId: event.id, seatId: seat.id, status: 'AVAILABLE' } });
  }

  res.status(201).json(event);
});

module.exports = router;