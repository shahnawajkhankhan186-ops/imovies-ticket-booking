import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { Screen } from '../src/models/Screen.js';
import { Show } from '../src/models/Show.js';
import { ShowSeat } from '../src/models/ShowSeat.js';
import { SEAT_CATEGORIES } from '../src/constants/enums.js';

async function updateLayout() {
  console.log('\x1b[34m[MIGRATION]\x1b[0m Connecting to MongoDB Atlas...');
  await mongoose.connect(env.MONGODB_URI);
  console.log('\x1b[32m[CONNECTED]\x1b[0m Connected to database:', mongoose.connection.name);

  // 1. Update all Screens
  const screens = await Screen.find();
  console.log(`Found ${screens.length} screens to update.`);

  for (const screen of screens) {
    const totalRows = screen.layout.rows || 8;
    for (const cell of screen.layout.cells) {
      if (cell.kind === 'SEAT') {
        if (cell.row <= 2) {
          cell.category = SEAT_CATEGORIES.REGULAR; // First section: REGULAR (A, B)
        } else if (cell.row <= Math.ceil(totalRows * 0.6)) {
          cell.category = SEAT_CATEGORIES.PREMIUM; // Second section: PREMIUM (C, D, E)
        } else {
          cell.category = SEAT_CATEGORIES.RECLINER; // Last section: RECLINER (F, G, H)
        }
      }
    }

    screen.categoryConfig = [
      { category: SEAT_CATEGORIES.REGULAR, defaultPricePaise: 20000 },
      { category: SEAT_CATEGORIES.PREMIUM, defaultPricePaise: 30000 },
      { category: SEAT_CATEGORIES.RECLINER, defaultPricePaise: 40000 },
    ];
    await screen.save();
    console.log(`✓ Updated Screen "${screen.name}"`);
  }

  // 2. High-speed parallel batch update for all Shows & ShowSeats
  const shows = await Show.find().select('_id pricing');
  console.log(`Found ${shows.length} shows. Executing parallel batch seat updates...`);

  await Promise.all(
    shows.map(async (show) => {
      const regPrice = show.pricing?.REGULAR || 20000;
      const premPrice = show.pricing?.PREMIUM || 30000;
      const recPrice = show.pricing?.RECLINER || 40000;

      return Promise.all([
        // Rows A and B -> REGULAR
        ShowSeat.updateMany(
          { showId: show._id, seatLabel: { $regex: '^[ABab]' } },
          { $set: { category: SEAT_CATEGORIES.REGULAR, price: regPrice } }
        ),
        // Rows C, D, and E -> PREMIUM
        ShowSeat.updateMany(
          { showId: show._id, seatLabel: { $regex: '^[CDEcde]' } },
          { $set: { category: SEAT_CATEGORIES.PREMIUM, price: premPrice } }
        ),
        // Rows F and beyond -> RECLINER
        ShowSeat.updateMany(
          { showId: show._id, seatLabel: { $regex: '^[^ABCDEabcde]' } },
          { $set: { category: SEAT_CATEGORIES.RECLINER, price: recPrice } }
        ),
      ]);
    })
  );

  console.log('\x1b[32m[SUCCESS]\x1b[0m All screens and show seats migrated successfully!');
  await mongoose.disconnect();
  console.log('MongoDB connection closed.');
  process.exit(0);
}

updateLayout().catch((err) => {
  console.error('\x1b[31m[ERROR]\x1b[0m Migration failed:', err);
  process.exit(1);
});
