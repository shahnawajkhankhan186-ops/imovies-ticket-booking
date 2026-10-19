import { Movie } from '../models/Movie.js';
import { Theatre } from '../models/Theatre.js';
import { Show } from '../models/Show.js';
import { Review } from '../models/Review.js';
import { getShowSeatsWithStatus } from '../services/seatAvailability.service.js';
import { getISTDayRange, formatISTDateOnly } from '../utils/ist-date.js';
import { MOVIE_STATUS, SHOW_STATUS, SEAT_STATUS } from '../constants/enums.js';
import { MESSAGES } from '../constants/messages.js';

export async function getMovies(req, res, next) {
  try {
    const { status, language, genre, q, city, page = 1, limit = 12 } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    } else {
      filter.status = { $ne: MOVIE_STATUS.ARCHIVED };
    }

    if (language) {
      filter.languages = language;
    }

    if (genre) {
      filter.genres = genre;
    }

    if (q && q.trim() !== '') {
      filter.$text = { $search: q.trim() };
    }

    // Filter by city: find theatres in this city, then find movies with shows in those theatres
    if (city && city.trim() !== '') {
      const theatres = await Theatre.find({ city: new RegExp(`^${city.trim()}$`, 'i') }).select('_id');
      const theatreIds = theatres.map((t) => t._id);
      const activeShows = await Show.find({
        theatreId: { $in: theatreIds },
        startTime: { $gte: new Date() },
        status: SHOW_STATUS.SCHEDULED,
      }).select('movieId');

      const movieIdsWithShows = [...new Set(activeShows.map((s) => s.movieId.toString()))];
      
      // Also include any movies with status NOW_SHOWING so freshly added movies are never hidden!
      const allNowShowing = await Movie.find({ status: MOVIE_STATUS.NOW_SHOWING }).select('_id');
      const allNowShowingIds = allNowShowing.map((m) => m._id.toString());

      filter._id = { $in: [...new Set([...movieIdsWithShows, ...allNowShowingIds])] };
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [movies, total] = await Promise.all([
      Movie.find(filter).sort({ releaseDate: -1, createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Movie.countDocuments(filter),
    ]);

    // Attach review counts and ratings
    const movieIds = movies.map((m) => m._id);
    const ratings = await Review.aggregate([
      { $match: { movieId: { $in: movieIds } } },
      {
        $group: {
          _id: '$movieId',
          avgRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    const ratingMap = new Map();
    ratings.forEach((r) => {
      ratingMap.set(r._id.toString(), {
        avgRating: Number(r.avgRating.toFixed(1)),
        reviewCount: r.reviewCount,
      });
    });

    const enrichedMovies = movies.map((m) => ({
      ...m,
      avgRating: ratingMap.get(m._id.toString())?.avgRating || null,
      reviewCount: ratingMap.get(m._id.toString())?.reviewCount || 0,
    }));

    return res.status(200).json({
      movies: enrichedMovies,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    next(error);
  }
}

export async function getMovieById(req, res, next) {
  try {
    const movie = await Movie.findById(req.params.id).lean();
    if (!movie) {
      return res.status(404).json({
        error: MESSAGES.RESOURCE_NOT_FOUND,
        code: 'NOT_FOUND',
      });
    }

    // Aggregated rating & reviews
    const reviews = await Review.find({ movieId: movie._id })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const ratingStats = await Review.aggregate([
      { $match: { movieId: movie._id } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    return res.status(200).json({
      movie: {
        ...movie,
        avgRating: ratingStats[0] ? Number(ratingStats[0].avgRating.toFixed(1)) : null,
        reviewCount: ratingStats[0] ? ratingStats[0].reviewCount : 0,
        recentReviews: reviews.map((r) => ({
          _id: r._id,
          userName: r.userId?.name || 'Anonymous',
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMovieShows(req, res, next) {
  try {
    const { id } = req.params;
    const { city, date } = req.query;

    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({
        error: MESSAGES.RESOURCE_NOT_FOUND,
        code: 'NOT_FOUND',
      });
    }

    // Default to today in IST
    const targetDateStr = date || formatISTDateOnly(new Date());
    const { startUTC, endUTC } = getISTDayRange(targetDateStr);

    const theatreQuery = {};
    if (city && city.trim() !== '') {
      theatreQuery.city = new RegExp(`^${city.trim()}$`, 'i');
    }

    const matchingTheatres = await Theatre.find(theatreQuery).lean();
    const theatreIds = matchingTheatres.map((t) => t._id);

    // Shows for this movie in matching theatres within IST day range
    const now = new Date();
    const effectiveStart = startUTC < now ? now : startUTC;

    const shows = await Show.find({
      movieId: movie._id,
      theatreId: { $in: theatreIds },
      startTime: { $gte: effectiveStart, $lte: endUTC },
      status: SHOW_STATUS.SCHEDULED,
    })
      .populate('screenId', 'name totalSeats')
      .sort({ startTime: 1 })
      .lean();

    // Group by Theatre
    const theatreMap = new Map();
    matchingTheatres.forEach((t) => {
      theatreMap.set(t._id.toString(), {
        theatre: t,
        screens: new Map(),
      });
    });

    for (const show of shows) {
      const tKey = show.theatreId.toString();
      if (!theatreMap.has(tKey)) continue;

      const group = theatreMap.get(tKey);
      const sKey = show.screenId._id.toString();

      if (!group.screens.has(sKey)) {
        group.screens.set(sKey, {
          screen: show.screenId,
          shows: [],
        });
      }

      // Check availability indicator
      const totalSeats = show.screenId.totalSeats || 60;
      const bookedOrHeldSeats = await getShowSeatsWithStatus(show._id);
      const availableCount = bookedOrHeldSeats.filter((s) => s.status === SEAT_STATUS.AVAILABLE).length;

      let availability = 'AVAILABLE';
      const availableRatio = availableCount / totalSeats;
      if (availableCount === 0) {
        availability = 'SOLD_OUT';
      } else if (availableRatio < 0.25) {
        availability = 'FILLING_FAST';
      }

      // Price starting from lowest category
      const startingPrice = Math.min(...Object.values(show.pricing));

      group.screens.get(sKey).shows.push({
        _id: show._id,
        startTime: show.startTime,
        endTime: show.endTime,
        language: show.language,
        format: show.format,
        pricing: show.pricing,
        startingPrice,
        availability,
        availableSeatsCount: availableCount,
      });
    }

    // Convert nested map to clean JSON array
    const result = [];
    for (const [, val] of theatreMap.entries()) {
      const screenList = [];
      for (const [, sVal] of val.screens.entries()) {
        if (sVal.shows.length > 0) {
          screenList.push({
            screen: sVal.screen,
            shows: sVal.shows,
          });
        }
      }
      if (screenList.length > 0) {
        result.push({
          theatre: val.theatre,
          screens: screenList,
        });
      }
    }

    return res.status(200).json({
      date: targetDateStr,
      theatres: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCities(req, res, next) {
  try {
    const cities = await Theatre.distinct('city');
    return res.status(200).json({
      cities: cities.sort(),
    });
  } catch (error) {
    next(error);
  }
}

export async function getShowSeats(req, res, next) {
  try {
    const show = await Show.findById(req.params.id)
      .populate('movieId', 'title posterUrl durationMinutes certificate')
      .populate('theatreId', 'name city address')
      .populate('screenId')
      .lean();

    if (!show) {
      return res.status(404).json({
        error: MESSAGES.RESOURCE_NOT_FOUND,
        code: 'NOT_FOUND',
      });
    }

    // Fetch seats with authoritative resolved status
    const seats = await getShowSeatsWithStatus(show._id);

    return res.status(200).json({
      show: {
        _id: show._id,
        startTime: show.startTime,
        endTime: show.endTime,
        language: show.language,
        format: show.format,
        pricing: show.pricing,
        movie: show.movieId,
        theatre: show.theatreId,
        screen: {
          _id: show.screenId._id,
          name: show.screenId.name,
          layout: show.screenId.layout,
        },
      },
      seats,
    });
  } catch (error) {
    next(error);
  }
}
