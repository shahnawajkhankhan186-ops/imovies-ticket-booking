import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import {
  User,
  Movie,
  Theatre,
  Screen,
  Show,
  ShowSeat,
  Coupon,
  Setting,
} from '../src/models/index.js';
import {
  ROLES,
  USER_STATUS,
  MOVIE_STATUS,
  CERTIFICATES,
  FORMATS,
  SEAT_CATEGORIES,
  SEAT_STATUS,
  CELL_KIND,
  COUPON_TYPE,
  SHOW_STATUS,
} from '../src/constants/enums.js';
import { createISTInstant, formatISTDateOnly } from '../src/utils/ist-date.js';

// Helper to generate screen layout cells
function generateScreenLayout(numRows, numCols, aisleCols = [4, 9], blockedSeats = ['C1', 'C12']) {
  const rowLetters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'.slice(0, numRows);
  const cells = [];
  let seatCount = 0;

  for (let r = 0; r < numRows; r++) {
    const rowChar = rowLetters[r];
    // Assign category based on row depth
    let category = SEAT_CATEGORIES.REGULAR;
    if (r < 2) {
      category = SEAT_CATEGORIES.RECLINER; // front/top rows
    } else if (r < Math.ceil(numRows * 0.6)) {
      category = SEAT_CATEGORIES.PREMIUM;
    }

    for (let c = 1; c <= numCols; c++) {
      if (aisleCols.includes(c)) {
        // Aisle cell
        cells.push({
          row: r + 1,
          col: c,
          label: '',
          category: 'NONE',
          kind: CELL_KIND.AISLE,
        });
      } else {
        const label = `${rowChar}${c}`;
        const isBlocked = blockedSeats.includes(label);
        cells.push({
          row: r + 1,
          col: c,
          label,
          category: isBlocked ? 'NONE' : category,
          kind: isBlocked ? CELL_KIND.BLOCKED : CELL_KIND.SEAT,
        });
        if (!isBlocked) seatCount++;
      }
    }
  }

  return { cells, totalSeats: seatCount };
}

async function seed() {
  console.log('\x1b[34m[SEED]\x1b[0m Starting idempotent database seed...');

  if (!env.MONGODB_URI) {
    console.error('\x1b[31m[FATAL] MONGODB_URI is not set. Aborting seed.\x1b[0m');
    process.exit(1);
  }

  // Connect
  await mongoose.connect(env.MONGODB_URI);
  const host = mongoose.connection.host;
  const dbName = mongoose.connection.name;

  console.log(
    `\x1b[32m[DB CONNECTED]\x1b[0m Host: \x1b[36m${host}\x1b[0m | Database: \x1b[35m${dbName}\x1b[0m | Environment: \x1b[33m${env.NODE_ENV}\x1b[0m`
  );

  // Guard against accidental production seed
  if (/prod/i.test(dbName) || env.NODE_ENV === 'production') {
    console.error('\x1b[31m[FATAL] Refusing to run seed script against a production database!\x1b[0m');
    process.exit(1);
  }

  // 1. Seed Global Settings
  await Setting.getSettings();
  console.log('✓ Global settings initialized');

  // 2. Seed Admin & Demo Users
  const adminPasswordHash = await User.hashPassword('Admin@123');
  const userPasswordHash = await User.hashPassword('User@123');

  const usersData = [
    {
      name: 'System Administrator',
      email: 'admin@imovies.com',
      passwordHash: adminPasswordHash,
      role: ROLES.ADMIN,
      status: USER_STATUS.ACTIVE,
      phone: '9999999999',
    },
    {
      name: 'Prolemda Admin',
      email: 'prolemda@gmail.com',
      passwordHash: adminPasswordHash,
      role: ROLES.ADMIN,
      status: USER_STATUS.ACTIVE,
      phone: '9893989398',
    },
    {
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      passwordHash: userPasswordHash,
      role: ROLES.USER,
      status: USER_STATUS.ACTIVE,
      phone: '9876543210',
    },
    {
      name: 'Priya Patel',
      email: 'priya@example.com',
      passwordHash: userPasswordHash,
      role: ROLES.USER,
      status: USER_STATUS.ACTIVE,
      phone: '9876543211',
    },
    {
      name: 'Amit Verma',
      email: 'amit@example.com',
      passwordHash: userPasswordHash,
      role: ROLES.USER,
      status: USER_STATUS.ACTIVE,
      phone: '9876543212',
    },
  ];

  for (const u of usersData) {
    await User.findOneAndUpdate(
      { email: u.email },
      { $set: u },
      { upsert: true, new: true, runValidators: true }
    );
  }
  console.log(`✓ ${usersData.length} users seeded (1 admin, 3 demo users)`);

  // 3. Seed Theatres
  const theatresData = [
    {
      name: 'IMovies PVR Icon',
      city: 'Mumbai',
      address: 'High Street Phoenix, Senapati Bapat Marg, Lower Parel, Mumbai - 400013',
      contact: '+91 22 4333 4444',
      coordinates: { lat: 18.9953, lng: 72.8242 },
    },
    {
      name: 'IMovies INOX Megaplex',
      city: 'Bengaluru',
      address: 'Phoenix Marketcity, Whitefield Main Rd, Mahadevapura, Bengaluru - 560048',
      contact: '+91 80 6726 6666',
      coordinates: { lat: 12.9972, lng: 77.6974 },
    },
  ];

  const seededTheatres = [];
  for (const t of theatresData) {
    const theatre = await Theatre.findOneAndUpdate(
      { name: t.name, city: t.city },
      { $set: t },
      { upsert: true, new: true, runValidators: true }
    );
    seededTheatres.push(theatre);
  }
  console.log(`✓ ${seededTheatres.length} theatres seeded`);

  // 4. Seed Screens with Layouts
  const screen1Layout = generateScreenLayout(8, 12, [4, 9], ['C1', 'C12']); // 80 seats
  const screen2Layout = generateScreenLayout(6, 10, [4, 8], ['B1']);       // 47 seats
  const screen3Layout = generateScreenLayout(7, 10, [3, 8], ['D10']);      // 55 seats

  const screensData = [
    {
      theatreId: seededTheatres[0]._id,
      name: 'Audi 1 — IMAX Laser',
      totalSeats: screen1Layout.totalSeats,
      layout: { rows: 8, cols: 12, cells: screen1Layout.cells },
      categoryConfig: [
        { category: SEAT_CATEGORIES.RECLINER, defaultPricePaise: 45000 },
        { category: SEAT_CATEGORIES.PREMIUM, defaultPricePaise: 32000 },
        { category: SEAT_CATEGORIES.REGULAR, defaultPricePaise: 22000 },
      ],
    },
    {
      theatreId: seededTheatres[0]._id,
      name: 'Audi 2 — Dolby Atmos',
      totalSeats: screen2Layout.totalSeats,
      layout: { rows: 6, cols: 10, cells: screen2Layout.cells },
      categoryConfig: [
        { category: SEAT_CATEGORIES.RECLINER, defaultPricePaise: 40000 },
        { category: SEAT_CATEGORIES.PREMIUM, defaultPricePaise: 29000 },
        { category: SEAT_CATEGORIES.REGULAR, defaultPricePaise: 19000 },
      ],
    },
    {
      theatreId: seededTheatres[1]._id,
      name: 'Screen 1 — BigPix 4K',
      totalSeats: screen3Layout.totalSeats,
      layout: { rows: 7, cols: 10, cells: screen3Layout.cells },
      categoryConfig: [
        { category: SEAT_CATEGORIES.RECLINER, defaultPricePaise: 42000 },
        { category: SEAT_CATEGORIES.PREMIUM, defaultPricePaise: 30000 },
        { category: SEAT_CATEGORIES.REGULAR, defaultPricePaise: 20000 },
      ],
    },
  ];

  const seededScreens = [];
  for (const s of screensData) {
    const screen = await Screen.findOneAndUpdate(
      { theatreId: s.theatreId, name: s.name },
      { $set: s },
      { upsert: true, new: true, runValidators: true }
    );
    seededScreens.push(screen);
  }
  console.log(`✓ ${seededScreens.length} screens with rich layout grids seeded`);

  // 5. Seed 8 Movies
  const moviesData = [
    {
      title: 'Inception',
      posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
      trailerUrl: 'https://www.youtube.com/watch?v=YoHD9XEInc0',
      synopsis: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
      cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Elliot Page', 'Tom Hardy', 'Cillian Murphy'],
      director: 'Christopher Nolan',
      durationMinutes: 148,
      genres: ['Sci-Fi', 'Action', 'Adventure'],
      languages: ['English', 'Hindi'],
      certificate: CERTIFICATES.UA,
      releaseDate: new Date('2010-07-16'),
      status: MOVIE_STATUS.NOW_SHOWING,
    },
    {
      title: 'Interstellar',
      posterUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1600&auto=format&fit=crop&q=80',
      trailerUrl: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
      synopsis: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft along with a team of researchers to find a new planet for humans.',
      cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain', 'Michael Caine'],
      director: 'Christopher Nolan',
      durationMinutes: 169,
      genres: ['Sci-Fi', 'Drama', 'Adventure'],
      languages: ['English', 'Hindi'],
      certificate: CERTIFICATES.UA,
      releaseDate: new Date('2014-11-07'),
      status: MOVIE_STATUS.NOW_SHOWING,
    },
    {
      title: 'The Dark Knight',
      posterUrl: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1600&auto=format&fit=crop&q=80',
      trailerUrl: 'https://www.youtube.com/watch?v=EXeTwQWrcwY',
      synopsis: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
      cast: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart', 'Michael Caine', 'Gary Oldman'],
      director: 'Christopher Nolan',
      durationMinutes: 152,
      genres: ['Action', 'Crime', 'Drama'],
      languages: ['English', 'Hindi'],
      certificate: CERTIFICATES.UA,
      releaseDate: new Date('2008-07-18'),
      status: MOVIE_STATUS.NOW_SHOWING,
    },
    {
      title: 'Oppenheimer',
      posterUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80',
      trailerUrl: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
      synopsis: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
      cast: ['Cillian Murphy', 'Emily Blunt', 'Matt Damon', 'Robert Downey Jr.', 'Florence Pugh'],
      director: 'Christopher Nolan',
      durationMinutes: 180,
      genres: ['Biography', 'Drama', 'History'],
      languages: ['English', 'Hindi'],
      certificate: CERTIFICATES.A,
      releaseDate: new Date('2023-07-21'),
      status: MOVIE_STATUS.NOW_SHOWING,
    },
    {
      title: 'Dune: Part Two',
      posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&auto=format&fit=crop&q=80',
      trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
      synopsis: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
      cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Javier Bardem', 'Austin Butler'],
      director: 'Denis Villeneuve',
      durationMinutes: 166,
      genres: ['Action', 'Adventure', 'Sci-Fi'],
      languages: ['English', 'Hindi'],
      certificate: CERTIFICATES.UA,
      releaseDate: new Date('2024-03-01'),
      status: MOVIE_STATUS.NOW_SHOWING,
    },
    {
      title: 'Kalki 2898 AD',
      posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
      trailerUrl: 'https://www.youtube.com/watch?v=kQDd1AhGIHk',
      synopsis: 'A modern-day avatar of Vishnu, a Hindu god, who is believed to have descended to the earth to protect the world from evil forces.',
      cast: ['Prabhas', 'Amitabh Bachchan', 'Kamal Haasan', 'Deepika Padukone'],
      director: 'Nag Ashwin',
      durationMinutes: 181,
      genres: ['Action', 'Sci-Fi', 'Fantasy'],
      languages: ['Hindi', 'Telugu', 'Tamil'],
      certificate: CERTIFICATES.UA,
      releaseDate: new Date('2024-06-27'),
      status: MOVIE_STATUS.NOW_SHOWING,
    },
    {
      title: 'Avatar: Fire and Ash',
      posterUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=600&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1600&auto=format&fit=crop&q=80',
      trailerUrl: 'https://www.youtube.com/watch?v=d9MyW72ELq0',
      synopsis: 'The Sully family encounters a new, volatile Na\'vi tribe known as the Ash People on Pandora.',
      cast: ['Sam Worthington', 'Zoe Saldana', 'Sigourney Weaver', 'Stephen Lang'],
      director: 'James Cameron',
      durationMinutes: 190,
      genres: ['Action', 'Adventure', 'Sci-Fi'],
      languages: ['English', 'Hindi'],
      certificate: CERTIFICATES.UA,
      releaseDate: new Date('2025-12-19'),
      status: MOVIE_STATUS.NOW_SHOWING,
    },
    {
      title: 'Jawan',
      posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
      trailerUrl: 'https://www.youtube.com/watch?v=MWOlnZSnXwk',
      synopsis: 'A high-octane action thriller outlining the emotional journey of a man set out to correct the wrongs in society against formidable corrupt forces.',
      cast: ['Shah Rukh Khan', 'Nayanthara', 'Vijay Sethupathi', 'Deepika Padukone'],
      director: 'Atlee',
      durationMinutes: 169,
      genres: ['Action', 'Thriller'],
      languages: ['Hindi', 'Tamil', 'Telugu'],
      certificate: CERTIFICATES.UA,
      releaseDate: new Date('2023-09-07'),
      status: MOVIE_STATUS.NOW_SHOWING,
    },
    {
      title: 'Gladiator II',
      posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&auto=format&fit=crop&q=80',
      trailerUrl: 'https://www.youtube.com/watch?v=4rgYUipGJNo',
      synopsis: 'Years after witnessing the death of Maximus at the hands of his uncle, Lucius must enter the Colosseum after the powerful emperors of Rome conquer his home.',
      cast: ['Paul Mescal', 'Pedro Pascal', 'Denzel Washington', 'Connie Nielsen'],
      director: 'Ridley Scott',
      durationMinutes: 148,
      genres: ['Action', 'Drama', 'Adventure'],
      languages: ['English', 'Hindi'],
      certificate: CERTIFICATES.A,
      releaseDate: new Date('2024-11-22'),
      status: MOVIE_STATUS.UPCOMING,
    },
  ];

  const seededMovies = [];
  for (const m of moviesData) {
    const movie = await Movie.findOneAndUpdate(
      { title: m.title },
      { $set: m },
      { upsert: true, new: true, runValidators: true }
    );
    seededMovies.push(movie);
  }
  console.log(`✓ ${seededMovies.length} movies seeded (6 Now Showing, 2 Upcoming)`);

  // 6. Seed ~40 Shows across the next 7 days in IST
  const nowShowingMovies = seededMovies.filter((m) => m.status === MOVIE_STATUS.NOW_SHOWING);
  const showTimes = ['10:00', '13:45', '17:30', '21:15']; // 4 IST showtimes per day
  let showCount = 0;
  let seatInventoryCount = 0;

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + dayOffset);
    const dateStr = formatISTDateOnly(targetDate);

    // Distribute across screens
    for (let sIdx = 0; sIdx < seededScreens.length; sIdx++) {
      const screen = seededScreens[sIdx];
      const theatre = seededTheatres.find((t) => t._id.equals(screen.theatreId));

      // 4 shows per screen per day = 3 screens * 4 shows * 7 days = 84 shows!
      const timesForThisScreen = showTimes;

      for (let tIdx = 0; tIdx < timesForThisScreen.length; tIdx++) {
        const timeStr = timesForThisScreen[tIdx];
        const movieIndex = (dayOffset * 4 + sIdx * 4 + tIdx) % nowShowingMovies.length;
        const movie = nowShowingMovies[movieIndex];

        const startInstant = createISTInstant(dateStr, timeStr);
        const endInstant = new Date(startInstant.getTime() + (movie.durationMinutes + 20) * 60 * 1000);

        // Fetch pricing from screen category config
        const pricing = {
          RECLINER: screen.categoryConfig.find((c) => c.category === SEAT_CATEGORIES.RECLINER)?.defaultPricePaise || 40000,
          PREMIUM: screen.categoryConfig.find((c) => c.category === SEAT_CATEGORIES.PREMIUM)?.defaultPricePaise || 30000,
          REGULAR: screen.categoryConfig.find((c) => c.category === SEAT_CATEGORIES.REGULAR)?.defaultPricePaise || 20000,
        };

        const show = await Show.findOneAndUpdate(
          {
            screenId: screen._id,
            startTime: startInstant,
          },
          {
            $set: {
              movieId: movie._id,
              screenId: screen._id,
              theatreId: theatre._id,
              startTime: startInstant,
              endTime: endInstant,
              language: movie.languages[0],
              format: screen.name.includes('IMAX') ? FORMATS.IMAX : FORMATS.TWO_D,
              pricing,
              status: SHOW_STATUS.SCHEDULED,
            },
          },
          { upsert: true, new: true, runValidators: true }
        );
        showCount++;

        // Pre-populate ShowSeat inventory for this show from Screen layout
        const seatDocs = [];
        for (const cell of screen.layout.cells) {
          if (cell.kind === CELL_KIND.SEAT && cell.label) {
            const price = pricing[cell.category] || pricing.REGULAR;
            seatDocs.push({
              showId: show._id,
              seatLabel: cell.label,
              category: cell.category,
              price,
              status: SEAT_STATUS.AVAILABLE,
            });
          }
        }

        // Upsert ShowSeat inventory idempotently in bulk
        if (seatDocs.length > 0) {
          const ops = seatDocs.map((seat) => ({
            updateOne: {
              filter: { showId: seat.showId, seatLabel: seat.seatLabel },
              update: { $setOnInsert: seat },
              upsert: true,
            },
          }));
          await ShowSeat.bulkWrite(ops, { ordered: false });
        }
        seatInventoryCount += seatDocs.length;
      }
    }
  }

  console.log(`✓ ${showCount} shows seeded across the next 7 days in IST`);
  console.log(`✓ ${seatInventoryCount} ShowSeat inventory records verified with compound indexes`);

  // 7. Seed Demo Coupons
  const couponsData = [
    {
      code: 'WELCOME50',
      discountType: COUPON_TYPE.PERCENT,
      discountValue: 50, // 50%
      maxDiscount: 15000, // max ₹150 in paise
      minAmount: 20000, // min ₹200 in paise
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2030-12-31'),
      usageLimit: 5000,
      perUserLimit: 2,
      isActive: true,
    },
    {
      code: 'FLAT100',
      discountType: COUPON_TYPE.FLAT,
      discountValue: 10000, // ₹100 flat in paise
      maxDiscount: 10000,
      minAmount: 0, // no minimum amount required
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2030-12-31'),
      usageLimit: 2000,
      perUserLimit: 10,
      isActive: true,
    },
    {
      code: 'IMOVIES20',
      discountType: COUPON_TYPE.PERCENT,
      discountValue: 20, // 20%
      maxDiscount: 20000, // max ₹200 in paise
      minAmount: 25000, // min ₹250 in paise
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2030-12-31'),
      usageLimit: 10000,
      perUserLimit: 3,
      isActive: true,
    },
  ];

  for (const c of couponsData) {
    await Coupon.findOneAndUpdate(
      { code: c.code },
      { $set: c },
      { upsert: true, new: true, runValidators: true }
    );
  }
  console.log(`✓ ${couponsData.length} promotional coupons seeded`);

  console.log('\n\x1b[32m[SEED SUCCESS]\x1b[0m All models and seed fixtures successfully created!');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('\x1b[31m[SEED FAILED]\x1b[0m Error seeding database:', err);
  process.exit(1);
});
