const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all venues
router.get('/admin/venues', authenticate, requireRole('ADMIN'), async (req, res) => {
  const venues = await prisma.venue.findMany({ include: { _count: { select: { seats: true } } } });
  res.json(venues);
});

// Create venue
router.post('/admin/venues', authenticate, requireRole('ADMIN'), async (req, res) => {
  const { name, location, layout } = req.body;
  if (!name || !location) return res.status(400).json({ error: 'name and location required' });

  const venue = await prisma.venue.create({ data: { name, location } });

  // layout: { premium: { rows: ['A','B','C'], seatsPerRow: 8 }, standard: { rows: ['D','E','F'], seatsPerRow: 8 } }
  if (layout) {
    for (const [cat, config] of Object.entries(layout)) {
      for (const row of config.rows) {
        for (let n = 1; n <= config.seatsPerRow; n++) {
          await prisma.seat.create({ data: { venueId: venue.id, row, number: n, category: cat.toUpperCase() } });
        }
      }
    }
  }

  const created = await prisma.venue.findUnique({ where: { id: venue.id }, include: { seats: true } });
  res.status(201).json(created);
});

// Get all users (admin)
router.get('/admin/users', authenticate, requireRole('ADMIN'), async (req, res) => {
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, createdAt: true } });
  res.json(users);
});

// Platform revenue overview
router.get('/admin/overview', authenticate, requireRole('ADMIN'), async (req, res) => {
  const totalBookings = await prisma.booking.count({ where: { status: 'CONFIRMED' } });
  const revenue = await prisma.booking.aggregate({ where: { status: 'CONFIRMED' }, _sum: { totalAmount: true } });
  const totalEvents = await prisma.event.count();
  const totalUsers = await prisma.user.count();
  res.json({ totalBookings, totalRevenue: revenue._sum.totalAmount || 0, totalEvents, totalUsers });
});

module.exports = router;