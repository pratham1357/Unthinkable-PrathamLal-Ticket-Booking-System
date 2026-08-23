const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminPass = await bcrypt.hash('admin123', 10);
  const orgPass = await bcrypt.hash('organiser123', 10);
  const custPass = await bcrypt.hash('customer123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: { email: 'admin@example.com', password: adminPass, name: 'Admin User', role: 'ADMIN' },
  });

  const organiser = await prisma.user.upsert({
    where: { email: 'organiser@example.com' },
    update: {},
    create: { email: 'organiser@example.com', password: orgPass, name: 'Event Organiser', role: 'ORGANISER' },
  });

  await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: { email: 'customer@example.com', password: custPass, name: 'Jane Customer', role: 'CUSTOMER' },
  });

  const venue = await prisma.venue.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'Grand Cineplex', location: 'Downtown Mumbai' },
  });

  // Create seats: rows A-C = PREMIUM, rows D-F = STANDARD, 8 seats each
  const existingSeats = await prisma.seat.findMany({ where: { venueId: venue.id } });
  if (existingSeats.length === 0) {
    const rows = [
      { row: 'A', cat: 'PREMIUM' }, { row: 'B', cat: 'PREMIUM' }, { row: 'C', cat: 'PREMIUM' },
      { row: 'D', cat: 'STANDARD' }, { row: 'E', cat: 'STANDARD' }, { row: 'F', cat: 'STANDARD' },
    ];
    for (const r of rows) {
      for (let n = 1; n <= 8; n++) {
        await prisma.seat.create({ data: { venueId: venue.id, row: r.row, number: n, category: r.cat } });
      }
    }
    console.log('Created 48 seats');
  }

  const allSeats = await prisma.seat.findMany({ where: { venueId: venue.id } });

  // Create two events
  const event1 = await prisma.event.findFirst({ where: { title: 'Interstellar 2' } });
  let ev1;
  if (!event1) {
    ev1 = await prisma.event.create({
      data: {
        title: 'Interstellar 2',
        description: 'The long-awaited sequel to Christopher Nolan\'s masterpiece. Cooper and Brand return for one final journey through the cosmos.',
        type: 'MOVIE',
        venueId: venue.id,
        organiserId: organiser.id,
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        premiumPrice: 450,
        standardPrice: 280,
        posterUrl: null,
      },
    });
    for (const seat of allSeats) {
      await prisma.showSeat.create({ data: { eventId: ev1.id, seatId: seat.id, status: 'AVAILABLE' } });
    }
    console.log('Created event: Interstellar 2');
  }

  const event2 = await prisma.event.findFirst({ where: { title: 'Coldplay: Music of the Spheres' } });
  if (!event2) {
    const ev2 = await prisma.event.create({
      data: {
        title: 'Coldplay: Music of the Spheres',
        description: 'Coldplay\'s world tour hits the city for one spectacular night of lights, color, and music.',
        type: 'CONCERT',
        venueId: venue.id,
        organiserId: organiser.id,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        premiumPrice: 3500,
        standardPrice: 1800,
        posterUrl: null,
      },
    });
    for (const seat of allSeats) {
      await prisma.showSeat.create({ data: { eventId: ev2.id, seatId: seat.id, status: 'AVAILABLE' } });
    }
    console.log('Created event: Coldplay: Music of the Spheres');
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });