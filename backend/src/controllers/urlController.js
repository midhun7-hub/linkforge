import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import Url from '../models/Url.js';
import Visit from '../models/Visit.js';
import { parseUserAgent, enrichWithGeolocation } from '../utils/analyticsHelper.js';

export const createUrl = async (req, res) => {
  try {
    const { originalUrl, customAlias, expiryDate, password } = req.body;
    const userId = req.user.id;

    console.log('\x1b[36m%s\x1b[0m', '[URL TRACE] Creating URL...');
    console.log('\x1b[36m%s\x1b[0m', `[URL TRACE] DB=${Url.db?.name || 'unknown'} collection=${Url.collection?.name || 'unknown'}`);

    let shortCode;
    let shortUrl;

    if (customAlias) {
      const existingAlias = await Url.findOne({ customAlias });
      if (existingAlias) {
        console.log('\x1b[31m%s\x1b[0m', '[URL ERROR] Custom alias already exists:', customAlias);
        return res.status(400).json({
          success: false,
          message: 'Custom alias already exists'
        });
      }
      shortCode = customAlias;
    } else {
      shortCode = nanoid(8);
    }

    shortUrl = `${process.env.BACKEND_URL}/${shortCode}`;

    const urlData = {
      userId,
      originalUrl,
      shortCode,
      shortUrl,
      expiryDate: expiryDate || null,
      passwordProtected: !!password,
      passwordHash: null
    };

    // Hash password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      urlData.passwordHash = await bcrypt.hash(password, salt);
    }

    // IMPORTANT: Do not store null for customAlias.
    // The schema uses a unique+sparse index; setting null would still be indexed and cause E11000 duplicates.
    if (customAlias) {
      urlData.customAlias = customAlias;
    }

    const url = await Url.create(urlData);
    console.log('\x1b[36m%s\x1b[0m', `[URL TRACE] URL created _id=${url._id}`);

    console.log('\x1b[32m%s\x1b[0m', '[URL CREATED] Short URL Generated:');
    console.log('\x1b[32m%s\x1b[0m', shortUrl);

    res.status(201).json({
      success: true,
      message: 'URL shortened successfully',
      url
    });
  } catch (error) {
    console.log('\x1b[31m%s\x1b[0m', '[URL ERROR] URL creation failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create short URL'
    });
  }
};

export const getUrls = async (req, res) => {
  try {
    const userId = req.user.id;
    const urls = await Url.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      urls
    });
  } catch (error) {
    console.log('\x1b[31m%s\x1b[0m', '[URL ERROR] URL fetch failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch URLs'
    });
  }
};

export const getUrlById = async (req, res) => {
  try {
    const url = await Url.findById(req.params.id);

    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found'
      });
    }

    if (url.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this URL'
      });
    }

    res.status(200).json({
      success: true,
      url
    });
  } catch (error) {
    console.log('\x1b[31m%s\x1b[0m', '[URL ERROR] URL fetch failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch URL'
    });
  }
};

export const updateUrl = async (req, res) => {
  try {
    const { originalUrl, expiryDate } = req.body;
    const url = await Url.findById(req.params.id);

    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found'
      });
    }

    if (url.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this URL'
      });
    }

    url.originalUrl = originalUrl || url.originalUrl;
    url.expiryDate = expiryDate || url.expiryDate;
    await url.save();

    console.log('\x1b[32m%s\x1b[0m', '[URL UPDATED] URL ID:', url._id);

    res.status(200).json({
      success: true,
      message: 'URL updated successfully',
      url
    });
  } catch (error) {
    console.log('\x1b[31m%s\x1b[0m', '[URL ERROR] URL update failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update URL'
    });
  }
};

export const deleteUrl = async (req, res) => {
  try {
    const start = Date.now();
    const url = await Url.findById(req.params.id);
    const afterFind = Date.now();

    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found'
      });
    }

    if (url.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this URL'
      });
    }

    await Url.findByIdAndDelete(req.params.id);
    const afterUrlDelete = Date.now();
    await Visit.deleteMany({ urlId: req.params.id });
    const afterVisitDelete = Date.now();

    console.log('[DELETE TIMING] db_find_ms', afterFind - start);
    console.log('[DELETE TIMING] db_url_delete_ms', afterUrlDelete - afterFind);
    console.log('[DELETE TIMING] db_visit_delete_ms', afterVisitDelete - afterUrlDelete);
    console.log('[DELETE TIMING] backend_total_ms', afterVisitDelete - start);

    console.log('\x1b[32m%s\x1b[0m', '[URL DELETED] URL ID:', req.params.id);

    res.status(200).json({
      success: true,
      message: 'URL deleted successfully'
    });
  } catch (error) {
    console.log('\x1b[31m%s\x1b[0m', '[URL ERROR] URL deletion failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete URL'
    });
  }
};

export const redirectUrl = async (req, res) => {
  try {
    const { shortCode } = req.params;
    const url = await Url.findOne({ $or: [{ shortCode }, { customAlias: shortCode }] });

    if (!url) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Link Not Found - LinkForge</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              text-align: center;
              color: white;
              padding: 40px;
            }
            h1 { font-size: 48px; margin-bottom: 20px; }
            p { font-size: 18px; opacity: 0.9; }
            a { color: white; text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>404</h1>
            <p>This link does not exist or has been deleted.</p>
            <p><a href="${process.env.FRONTEND_URL}">Return to LinkForge</a></p>
          </div>
        </body>
        </html>
      `);
    }

    if (url.expiryDate && new Date(url.expiryDate) < new Date()) {
      url.status = 'expired';
      await url.save();

      return res.status(410).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Link Expired - LinkForge</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              text-align: center;
              color: white;
              padding: 40px;
            }
            h1 { font-size: 48px; margin-bottom: 20px; }
            p { font-size: 18px; opacity: 0.9; }
            a { color: white; text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Link Expired</h1>
            <p>This link has expired and is no longer active.</p>
            <p><a href="${process.env.FRONTEND_URL}">Return to LinkForge</a></p>
          </div>
        </body>
        </html>
      `);
    }

    // Check if URL requires password
    if (url.passwordProtected && url.passwordHash) {
      // Redirect to frontend password verification page
      return res.redirect(`${process.env.FRONTEND_URL}/verify-password?code=${shortCode}`);
    }

    const ua = req.headers['user-agent'] || '';
    const ip = req.ip || req.connection.remoteAddress;
    const referrer = req.headers.referer || 'Direct';

    const { browser, operatingSystem, device } = parseUserAgent(ua);
    const geo = await enrichWithGeolocation(ip);

    const visitData = {
      urlId: url._id,
      ipAddress: ip,
      browser,
      device,
      operatingSystem,
      country: geo.country,
      city: geo.city,
      referrer,
      successful: true
    };

    const session = await mongoose.startSession();
    let visit;
    let updatedClickCount = url.clickCount;

    try {
      await session.withTransaction(async () => {
        const [createdVisit] = await Visit.create([visitData], { session });
        const updatedUrl = await Url.findByIdAndUpdate(
          url._id,
          { $inc: { clickCount: 1 } },
          { new: true, session }
        );

        visit = createdVisit;
        updatedClickCount = updatedUrl.clickCount;
      });
    } finally {
      await session.endSession();
    }

    url.clickCount = updatedClickCount;

    console.log('[VISIT TRACE] Stored redirect analytics visit', {
      visitId: visit._id,
      urlId: url._id,
      shortCode,
      clickCount: url.clickCount,
      browser: visit.browser,
      device: visit.device,
      successful: visit.successful,
      timestamp: visit.timestamp,
    });

    console.log('\x1b[32m%s\x1b[0m', '[REDIRECT] Short Code:', shortCode, '->', url.originalUrl);

    res.redirect(url.originalUrl);
  } catch (error) {
    console.log('\x1b[31m%s\x1b[0m', '[REDIRECT ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Redirect failed'
    });
  }
};

export const getPublicStats = async (req, res) => {
  try {
    const { shortCode } = req.params;
    const url = await Url.findOne({ $or: [{ shortCode }, { customAlias: shortCode }] });

    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found'
      });
    }

    res.status(200).json({
      success: true,
      stats: {
        shortUrl: url.shortUrl,
        clickCount: url.clickCount,
        createdAt: url.createdAt,
        expiryDate: url.expiryDate
      }
    });
  } catch (error) {
    console.log('\x1b[31m%s\x1b[0m', '[STATS ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats'
    });
  }
};

export const verifyPassword = async (req, res) => {
  try {
    const { shortCode } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    const url = await Url.findOne({ $or: [{ shortCode }, { customAlias: shortCode }] });

    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found'
      });
    }

    if (!url.passwordProtected || !url.passwordHash) {
      return res.status(400).json({
        success: false,
        message: 'This URL does not require a password'
      });
    }

    if (url.expiryDate && new Date(url.expiryDate) < new Date()) {
      url.status = 'expired';
      await url.save();
      return res.status(410).json({
        success: false,
        message: 'This link has expired'
      });
    }

    const passwordMatch = await bcrypt.compare(password, url.passwordHash);

    if (!passwordMatch) {
      return res.status(403).json({
        success: false,
        message: 'Incorrect password'
      });
    }

    const ua = req.headers['user-agent'] || '';
    const ip = req.ip || req.connection.remoteAddress;
    const referrer = req.headers.referer || 'Direct';

    const { browser, operatingSystem, device } = parseUserAgent(ua);
    const geo = await enrichWithGeolocation(ip);

    const visitData = {
      urlId: url._id,
      ipAddress: ip,
      browser,
      device,
      operatingSystem,
      country: geo.country,
      city: geo.city,
      referrer,
      successful: true
    };

    const session = await mongoose.startSession();
    let visit;
    let updatedClickCount = url.clickCount;

    try {
      await session.withTransaction(async () => {
        const [createdVisit] = await Visit.create([visitData], { session });
        const updatedUrl = await Url.findByIdAndUpdate(
          url._id,
          { $inc: { clickCount: 1 } },
          { new: true, session }
        );

        visit = createdVisit;
        updatedClickCount = updatedUrl.clickCount;
      });
    } finally {
      await session.endSession();
    }

    url.clickCount = updatedClickCount;

    console.log('[VISIT TRACE] Stored password analytics visit', {
      visitId: visit._id,
      urlId: url._id,
      shortCode,
      clickCount: url.clickCount,
      browser: visit.browser,
      device: visit.device,
      successful: visit.successful,
      timestamp: visit.timestamp,
    });

    console.log('\x1b[32m%s\x1b[0m', '[PASSWORD VERIFIED] Short Code:', shortCode);

    res.status(200).json({
      success: true,
      message: 'Password verified',
      originalUrl: url.originalUrl,
      redirectUrl: url.originalUrl
    });
  } catch (error) {
    console.log('\x1b[31m%s\x1b[0m', '[PASSWORD VERIFY ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Password verification failed'
    });
  }
};
