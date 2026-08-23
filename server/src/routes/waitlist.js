const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Join waitlist
router.post('/events/:eventId/waitlist', authenticate, async (req, res) => {
  const eventId = parseInt(req.params.eventId);
  const userId = req.user.id;
  const { category } = req.body;

  if (!category) return res.status(400).json({ error: 'category required' });

  const existing = await prisma.waitlistEntry.findFirst({
    where: { eventId, userId, category, status: { in: ['WAITING', 'OFFERED'] } },
  });
  if (existing) return res.status(409).json({ error: 'Already on waitlist for this category' });

  const lastEntry = await prisma.waitlistEntry.findFirst({
    where: { eventId, category },
    orderBy: { position: 'desc' },
  });
  const position = lastEntry ? lastEntry.position + 1 : 1;

  const entry = await prisma.waitlistEntry.create({
    data: { userId, eventId, category, position, status: 'WAITING' },
  });
  res.status(201).json(entry);
});

// Get user's waitlist entries
router.get('/waitlist', authenticate, async (req, res) => {
  const entries = await prisma.waitlistEntry.findMany({
    where: { userId: req.user.id, status: { in: ['WAITING', 'OFFERED'] } },
    include: {
      event: { include: { venue: true } },
      offers: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(entries);
});

module.exports = router;