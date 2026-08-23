const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { generateQR } = require('../utils/qr');
const { sendBookingEmail, sendWaitlistOfferEmail } = require('../utils/email');

const router = express.Router();
const prisma = new PrismaClient();

function makeReference() {
  return 'UBS-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Create booking
router.post('/', authenticate, async (req, res) => {
  const { eventId, seatIds } = req.body;
  const userId = req.user.id;
  const now = new Date();

  if (!eventId || !seatIds || seatIds.length === 0) {
    return res.status(400).json({ error: 'eventId and seatIds required' });
  }

  try {
    const booking = await prisma.$transaction(async (tx) => {
      const heldSeats = await tx.showSeat.findMany({
        where: { id: { in: seatIds }, eventId: parseInt(eventId), status: 'HELD', heldBy: userId, heldUntil: { gt: now } },
        include: { seat: true },
      });

      if (heldSeats.length !== seatIds.length) {
        throw new Error('HOLD_EXPIRED');
      }

      const event = await tx.event.findUnique({ where: { id: parseInt(eventId) } });
      const totalAmount = heldSeats.reduce((sum, ss) => {
        const price = ss.seat.category === 'PREMIUM' ? event.premiumPrice : event.standardPrice;
        return sum + price;
      }, 0);

      let reference = makeReference();
      while (await tx.booking.findUnique({ where: { reference } })) {
        reference = makeReference();
      }

      const newBooking = await tx.booking.create({
        data: { reference, userId, eventId: parseInt(eventId), totalAmount, status: 'CONFIRMED' },
      });

      for (const ss of heldSeats) {
        await tx.showSeat.update({ where: { id: ss.id }, data: { status: 'BOOKED', heldBy: null, heldUntil: null, bookedBy: userId } });
        await tx.bookingSeat.create({ data: { bookingId: newBooking.id, showSeatId: ss.id } });
      }

      return newBooking;
    });

    const qrCode = await generateQR(booking.reference);
    await prisma.booking.update({ where: { id: booking.id }, data: { qrCode } });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    await sendBookingEmail(user.email, user.name, booking, qrCode);

    res.status(201).json({ ...booking, qrCode });
  } catch (err) {
    if (err.message === 'HOLD_EXPIRED') return res.status(409).json({ error: 'Seat hold expired. Please select seats again.' });
    console.error(err);
    res.status(500).json({ error: 'Booking failed' });
  }
});

// Get user's bookings
router.get('/', authenticate, async (req, res) => {
  const bookings = await prisma.booking.findMany({
    where: { userId: req.user.id },
    include: {
      bookingSeats: { include: { showSeat: { include: { seat: true } } } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const events = await prisma.event.findMany({
    where: { id: { in: bookings.map(b => b.eventId) } },
    include: { venue: true },
  });
  const eventMap = Object.fromEntries(events.map(e => [e.id, e]));

  res.json(bookings.map(b => ({ ...b, event: eventMap[b.eventId] || null })));
});

// Get single booking
router.get('/:id', authenticate, async (req, res) => {
  const booking = await prisma.booking.findFirst({
    where: { id: parseInt(req.params.id), userId: req.user.id },
    include: { bookingSeats: { include: { showSeat: { include: { seat: true } } } } },
  });
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const event = await prisma.event.findUnique({ where: { id: booking.eventId }, include: { venue: true } });
  res.json({ ...booking, event });
});

// Cancel booking
router.post('/:id/cancel', authenticate, async (req, res) => {
  const booking = await prisma.booking.findFirst({
    where: { id: parseInt(req.params.id), userId: req.user.id, status: 'CONFIRMED' },
    include: { bookingSeats: { include: { showSeat: { include: { seat: true } } } } },
  });
  if (!booking) return res.status(404).json({ error: 'Booking not found or already cancelled' });

  await prisma.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } });

  for (const bs of booking.bookingSeats) {
    await prisma.showSeat.update({ where: { id: bs.showSeatId }, data: { status: 'AVAILABLE', bookedBy: null } });
  }

  // Trigger waitlist for released seat categories
  const categories = [...new Set(booking.bookingSeats.map(bs => bs.showSeat.seat.category))];
  for (const category of categories) {
    const next = await prisma.waitlistEntry.findFirst({
      where: { eventId: booking.eventId, category, status: 'WAITING' },
      orderBy: { position: 'asc' },
      include: { user: true, event: true },
    });
    if (next) {
      const offerExpiry = new Date(Date.now() + parseInt(process.env.WAITLIST_OFFER_MINUTES || '30') * 60 * 1000);
      await prisma.waitlistOffer.create({ data: { waitlistEntryId: next.id, expiresAt: offerExpiry, status: 'PENDING' } });
      await prisma.waitlistEntry.update({ where: { id: next.id }, data: { status: 'OFFERED' } });
      await sendWaitlistOfferEmail(next.user.email, next.user.name, next.event.title, offerExpiry);
    }
  }

  res.json({ message: 'Booking cancelled' });
});

module.exports = router;