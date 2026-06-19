const express = require('express');
const { query } = require('../db');

const router = express.Router();

router.get('/extensions', async (req, res, next) => {
  try {
    const rows = await query(`
      SELECT e.*, l.name AS branch_name, l.municipality, l.maps_url, l.status AS location_status
      FROM extensions e
      LEFT JOIN locations l ON l.id = e.location_id AND l.is_active = 1
      WHERE e.is_visible = 1
      ORDER BY CAST(e.extension AS UNSIGNED), e.extension
    `);
    res.json({ data: rows });
  } catch (error) {
    next(error);
  }
});

router.get('/locations', async (req, res, next) => {
  try {
    const rows = await query(`
      SELECT id, branch_number, store_type, name, municipality, maps_url, status, is_pending
      FROM locations
      WHERE is_active = 1
      ORDER BY municipality, name
    `);
    res.json({ data: rows });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
