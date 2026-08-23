const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Organiser's events
router.get('/organiser/events', authenticate, requireRole('ORGANISER', 'ADMIN'), async (req, res) => {
  const events = await prisma.event.findMany({
    where: { organiserId: req.user.id },
    include: { venue: true },
    orderBy: { date: 'desc' },
  });
  res.json(events);
});

// Event summary/revenue
router.get('/organiser/events/:id/summary', authenticate, requireRole('ORGANISER', 'ADMIN'), async (req, res) => {
  const eventId = parseInt(req.params.id);
  const event = await prisma.event.findUnique({ where: { id: eventId }, include: { venue: true } });
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const bookings = await prisma.booking.findMany({
    where: { eventId, status: 'CONFIRMED' },
    include: { bookingSeats: { include: { showSeat: { include: { seat: true } } } }, user: { select: { name: true, email: true } } },
  });

  const totalRevenue = bookings.reduce((s, b) => s + b.totalAmount, 0);
  const totalSeats = await prisma.showSeat.count({ where: { eventId } });
  const bookedSeats = await prisma.showSeat.count({ where: { eventId, status: 'BOOKED' } });
  const heldSeats = await prisma.showSeat.count({ where: { eventId, status: 'HELD' } });

  res.json({ event, bookings, totalRevenue, totalSeats, bookedSeats, heldSeats, availableSeats: totalSeats - bookedSeats - heldSeats });
});

module.exports = router;