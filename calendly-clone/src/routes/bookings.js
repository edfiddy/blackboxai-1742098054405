const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const auth = require('../middleware/auth');

// Create a booking
router.post('/', async (req, res) => {
  const { eventTypeId, bookerName, bookerEmail, startTime, endTime } = req.body;

  if (!eventTypeId || !bookerName || !bookerEmail || !startTime || !endTime) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check if event type exists
    db.get('SELECT * FROM event_types WHERE id = ?', [eventTypeId], (err, eventType) => {
      if (err || !eventType) {
        return res.status(404).json({ message: 'Event type not found' });
      }

      // Check if time slot is available
      db.get(
        `SELECT * FROM bookings 
         WHERE event_type_id = ? 
         AND ((start_time <= ? AND end_time > ?) 
         OR (start_time < ? AND end_time >= ?))`,
        [eventTypeId, startTime, startTime, endTime, endTime],
        (err, existingBooking) => {
          if (err) {
            return res.status(500).json({ message: 'Database error' });
          }

          if (existingBooking) {
            return res.status(400).json({ message: 'Time slot is not available' });
          }

          // Create booking
          const bookingId = uuidv4();
          db.run(
            `INSERT INTO bookings 
             (id, event_type_id, booker_name, booker_email, start_time, end_time) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [bookingId, eventTypeId, bookerName, bookerEmail, startTime, endTime],
            (err) => {
              if (err) {
                return res.status(500).json({ message: 'Error creating booking' });
              }

              res.status(201).json({
                message: 'Booking created successfully',
                booking: {
                  id: bookingId,
                  eventTypeId,
                  bookerName,
                  bookerEmail,
                  startTime,
                  endTime
                }
              });
            }
          );
        }
      );
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's bookings (as event creator)
router.get('/created', auth, (req, res) => {
  db.all(
    `SELECT b.*, et.title as event_title 
     FROM bookings b
     JOIN event_types et ON b.event_type_id = et.id
     WHERE et.user_id = ?
     ORDER BY b.start_time DESC`,
    [req.user.userId],
    (err, bookings) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      res.json({ bookings });
    }
  );
});

// Get bookings by event type
router.get('/event/:eventTypeId', auth, (req, res) => {
  const { eventTypeId } = req.params;

  db.all(
    `SELECT b.* 
     FROM bookings b
     JOIN event_types et ON b.event_type_id = et.id
     WHERE et.id = ? AND et.user_id = ?
     ORDER BY b.start_time DESC`,
    [eventTypeId, req.user.userId],
    (err, bookings) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      res.json({ bookings });
    }
  );
});

// Update booking status
router.patch('/:id/status', auth, (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  if (!['confirmed', 'cancelled', 'completed'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  db.run(
    `UPDATE bookings 
     SET status = ?
     WHERE id = ? 
     AND event_type_id IN (
       SELECT id FROM event_types WHERE user_id = ?
     )`,
    [status, id, req.user.userId],
    (err) => {
      if (err) {
        return res.status(500).json({ message: 'Error updating booking status' });
      }

      res.json({ message: 'Booking status updated successfully' });
    }
  );
});

// Cancel booking
router.delete('/:id', auth, (req, res) => {
  const { id } = req.params;

  db.run(
    `DELETE FROM bookings 
     WHERE id = ? 
     AND event_type_id IN (
       SELECT id FROM event_types WHERE user_id = ?
     )`,
    [id, req.user.userId],
    (err) => {
      if (err) {
        return res.status(500).json({ message: 'Error cancelling booking' });
      }

      res.json({ message: 'Booking cancelled successfully' });
    }
  );
});

module.exports = router;
