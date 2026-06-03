import Url from '../models/Url.js';
import Visit from '../models/Visit.js';

const formatTrends = (trends) => {
  return Object.entries(trends)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
};

const buildTrendsFromVisits = (visits) => {
  const dailyTrends = {};
  const weeklyTrends = {};
  const monthlyTrends = {};

  visits.forEach((visit) => {
    const date = new Date(visit.timestamp);
    const dayKey = date.toISOString().split('T')[0];
    const weekKey = getWeekKey(date);
    const monthKey = date.toISOString().slice(0, 7);

    dailyTrends[dayKey] = (dailyTrends[dayKey] || 0) + 1;
    weeklyTrends[weekKey] = (weeklyTrends[weekKey] || 0) + 1;
    monthlyTrends[monthKey] = (monthlyTrends[monthKey] || 0) + 1;
  });

  return {
    daily: formatTrends(dailyTrends),
    weekly: formatTrends(weeklyTrends),
    monthly: formatTrends(monthlyTrends)
  };
};

const getOwnedUrlIds = async (userId) => {
  const urls = await Url.find({ userId }).select('_id clickCount createdAt expiryDate passwordProtected');
  return {
    urls,
    urlIds: urls.map((url) => url._id),
  };
};

export const getCountryBreakdown = async (req, res) => {
  try {
    let urlIds;
    if (req.params.id) {
      const url = await Url.findById(req.params.id);
      if (!url) return res.status(404).json({ success: false, message: 'URL not found' });
      if (url.userId.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Unauthorized' });
      urlIds = [url._id];
    } else {
      const { urlIds: ids } = await getOwnedUrlIds(req.user.id);
      urlIds = ids;
    }

    const visits = urlIds.length
      ? await Visit.find({ urlId: { $in: urlIds }, successful: true }).select('country').lean()
      : [];

    const countMap = {};
    visits.forEach((v) => {
      const country = v.country || 'Unknown';
      countMap[country] = (countMap[country] || 0) + 1;
    });

    const breakdown = Object.entries(countMap)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);

    res.json({ success: true, breakdown });
  } catch (error) {
    console.log('\x1b[31m%s\x1b[0m', '[COUNTRY BREAKDOWN ERROR]', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch country breakdown' });
  }
};

export const getReferrerBreakdown = async (req, res) => {
  try {
    let urlIds;
    if (req.params.id) {
      const url = await Url.findById(req.params.id);
      if (!url) return res.status(404).json({ success: false, message: 'URL not found' });
      if (url.userId.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Unauthorized' });
      urlIds = [url._id];
    } else {
      const { urlIds: ids } = await getOwnedUrlIds(req.user.id);
      urlIds = ids;
    }

    const visits = urlIds.length
      ? await Visit.find({ urlId: { $in: urlIds }, successful: true }).select('referrer').lean()
      : [];

    const countMap = {};
    visits.forEach((v) => {
      const referrer = v.referrer || 'Direct';
      countMap[referrer] = (countMap[referrer] || 0) + 1;
    });

    const breakdown = Object.entries(countMap)
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count);

    res.json({ success: true, breakdown });
  } catch (error) {
    console.log('\x1b[31m%s\x1b[0m', '[REFERRER BREAKDOWN ERROR]', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch referrer breakdown' });
  }
};

export const getWorkspaceAnalytics = async (req, res) => {
  try {
    console.log('[ANALYTICS TRACE] getWorkspaceAnalytics route hit', {
      userId: req.user?.id,
    });

    const { urls, urlIds } = await getOwnedUrlIds(req.user.id);
    console.log('[ANALYTICS TRACE] Querying workspace visits', {
      userId: req.user.id,
      urlCount: urlIds.length,
    });

    const visits = urlIds.length
      ? await Visit.find({ urlId: { $in: urlIds }, successful: true }).sort({ timestamp: -1 })
      : [];

    const totalClicks = urls.reduce((sum, url) => sum + (url.clickCount || 0), 0);
    const lastVisit = visits.length > 0 ? visits[0].timestamp : null;

    console.log('[ANALYTICS TRACE] Returning workspace analytics result', {
      userId: req.user.id,
      totalClicks,
      visits: visits.length,
      lastVisit,
    });

    res.status(200).json({
      success: true,
      analytics: {
        totalClicks,
        lastVisit,
        visits,
      }
    });
  } catch (error) {
    console.log('\x1b[31m%s\x1b[0m', '[ANALYTICS ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workspace analytics'
    });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    console.log('[ANALYTICS TRACE] getAnalytics route hit', {
      urlId: req.params.id,
      userId: req.user?.id,
    });

    const url = await Url.findById(req.params.id);

    if (!url) {
      console.warn('[ANALYTICS TRACE] getAnalytics URL not found', { urlId: req.params.id });
      return res.status(404).json({
        success: false,
        message: 'URL not found'
      });
    }

    if (url.userId.toString() !== req.user.id) {
      console.warn('[ANALYTICS TRACE] getAnalytics unauthorized', {
        urlId: url._id,
        ownerId: url.userId,
        userId: req.user.id,
      });
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this URL'
      });
    }

    console.log('[ANALYTICS TRACE] Querying successful visits', { urlId: url._id });
    const visits = await Visit.find({ urlId: url._id, successful: true }).sort({ timestamp: -1 });

    const lastVisit = visits.length > 0 ? visits[0].timestamp : null;
    console.log('[ANALYTICS TRACE] Returning analytics result', {
      urlId: url._id,
      totalClicks: url.clickCount,
      visits: visits.length,
      lastVisit,
    });

    res.status(200).json({
      success: true,
      analytics: {
        totalClicks: url.clickCount,
        lastVisit,
        createdAt: url.createdAt,
        expiryDate: url.expiryDate,
        passwordProtected: url.passwordProtected,
        visits
      }
    });
  } catch (error) {
    console.log('\x1b[31m%s\x1b[0m', '[ANALYTICS ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
};

export const getVisits = async (req, res) => {
  try {
    console.log('[ANALYTICS TRACE] getVisits route hit', {
      urlId: req.params.id,
      userId: req.user?.id,
    });

    const url = await Url.findById(req.params.id);

    if (!url) {
      console.warn('[ANALYTICS TRACE] getVisits URL not found', { urlId: req.params.id });
      return res.status(404).json({
        success: false,
        message: 'URL not found'
      });
    }

    if (url.userId.toString() !== req.user.id) {
      console.warn('[ANALYTICS TRACE] getVisits unauthorized', {
        urlId: url._id,
        ownerId: url.userId,
        userId: req.user.id,
      });
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this URL'
      });
    }

    console.log('[ANALYTICS TRACE] Querying recent visits', { urlId: url._id, limit: 100 });
    const visits = await Visit.find({ urlId: url._id, successful: true })
      .sort({ timestamp: -1 })
      .limit(100);
    console.log('[ANALYTICS TRACE] Returning visits result', {
      urlId: url._id,
      visits: visits.length,
    });

    res.status(200).json({
      success: true,
      visits
    });
  } catch (error) {
    console.log('\x1b[31m%s\x1b[0m', '[ANALYTICS ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch visits'
    });
  }
};

export const getWorkspaceTrends = async (req, res) => {
  try {
    console.log('[TRENDS TRACE] getWorkspaceTrends route hit', {
      userId: req.user?.id,
    });

    const { urls, urlIds } = await getOwnedUrlIds(req.user.id);
    console.log('[TRENDS TRACE] Querying workspace visits for trends', {
      userId: req.user.id,
      urlCount: urlIds.length,
    });

    const visits = urlIds.length
      ? await Visit.find({ urlId: { $in: urlIds }, successful: true }).sort({ timestamp: 1 })
      : [];

    const trends = buildTrendsFromVisits(visits);
    console.log('[TRENDS TRACE] Returning workspace trend result', {
      userId: req.user.id,
      urlCount: urls.length,
      visits: visits.length,
      dailyPoints: trends.daily.length,
      weeklyPoints: trends.weekly.length,
      monthlyPoints: trends.monthly.length,
      totalDailyClicks: trends.daily.reduce((sum, point) => sum + point.count, 0),
    });

    res.status(200).json({
      success: true,
      trends
    });
  } catch (error) {
    console.log('\x1b[31m%s\x1b[0m', '[ANALYTICS ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workspace trends'
    });
  }
};

export const getTrends = async (req, res) => {
  try {
    console.log('[TRENDS TRACE] getTrends route hit', {
      urlId: req.params.id,
      userId: req.user?.id,
    });

    const url = await Url.findById(req.params.id);

    if (!url) {
      console.warn('[TRENDS TRACE] URL not found', { urlId: req.params.id });
      return res.status(404).json({
        success: false,
        message: 'URL not found'
      });
    }

    if (url.userId.toString() !== req.user.id) {
      console.warn('[TRENDS TRACE] Unauthorized trends request', {
        urlId: url._id,
        ownerId: url.userId,
        userId: req.user.id,
      });
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this URL'
      });
    }

    console.log('[TRENDS TRACE] Querying visits for trends', { urlId: url._id });
    const visits = await Visit.find({ urlId: url._id, successful: true }).sort({ timestamp: 1 });
    console.log('[TRENDS TRACE] Trend source visits found', {
      urlId: url._id,
      visits: visits.length,
      clickCount: url.clickCount,
    });

    const trends = buildTrendsFromVisits(visits);

    console.log('[TRENDS TRACE] Returning trend result', {
      urlId: url._id,
      dailyPoints: trends.daily.length,
      weeklyPoints: trends.weekly.length,
      monthlyPoints: trends.monthly.length,
      totalDailyClicks: trends.daily.reduce((sum, point) => sum + point.count, 0),
    });

    res.status(200).json({
      success: true,
      trends
    });
  } catch (error) {
    console.log('\x1b[31m%s\x1b[0m', '[ANALYTICS ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trends'
    });
  }
};

function getWeekKey(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}
