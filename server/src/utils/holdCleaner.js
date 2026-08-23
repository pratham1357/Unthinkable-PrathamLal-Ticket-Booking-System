const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { sendWaitlistOfferEmail } = require('./email');

const prisma = new PrismaClient();

async function releaseExpiredHolds() {
  const now = new Date();
  const expired = await prisma.showSeat.findMany({
    where: { status: 'HELD', heldUntil: { lt: now } },
  });
  if (expired.length > 0) {
    await prisma.showSeat.updateMany({
      where: { status: 'HELD', heldUntil: { lt: now } },
      data: { status: 'AVAILABLE', heldBy: null, heldUntil: null },
    });
    console.log(`[Cron] Released ${expired.length} expired hold(s)`);
  }
}

async function processExpiredWaitlistOffers() {
  const now = new Date();
  const expired = await prisma.waitlistOffer.findMany({
    where: { status: 'PENDING', expiresAt: { lt: now } },
    include: { waitlistEntry: { include: { user: true, event: true } } },
  });

  for (const offer of expired) {
    await prisma.waitlistOffer.update({ where: { id: offer.id }, data: { status: 'EXPIRED' } });
    await prisma.waitlistEntry.update({ where: { id: offer.waitlistEntryId }, data: { status: 'WAITING' } });

    const entry = offer.waitlistEntry;
    const next = await prisma.waitlistEntry.findFirst({
      where: { eventId: entry.eventId, category: entry.category, status: 'WAITING', id: { not: entry.id } },
      orderBy: { position: 'asc' },
      include: { user: true, event: true },
    });

    if (next) {
      const offerExpiry = new Date(Date.now() + parseInt(process.env.WAITLIST_OFFER_MINUTES || '30') * 60 * 1000);
      await prisma.waitlistOffer.create({ data: { waitlistEntryId: next.id, expiresAt: offerExpiry, status: 'PENDING' } });
      await prisma.waitlistEntry.update({ where: { id: next.id }, data: { status: 'OFFERED' } });
      await sendWaitlistOfferEmail(next.user.email, next.user.name, next.event.title, offerExpiry);
      console.log(`[Cron] Advanced waitlist offer to user ${next.user.email}`);
    }
  }
}

function startCron() {
  cron.schedule('* * * * *', async () => {
    await releaseExpiredHolds();
    await processExpiredWaitlistOffers();
  });
  console.log('[Cron] Hold cleaner & waitlist processor started (every 1 min)');
}

module.exports = { startCron, releaseExpiredHolds };