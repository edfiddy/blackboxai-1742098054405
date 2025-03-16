const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const auth = require('../middleware/auth');

// Create event type
router.post('/', auth, (req, res) => {
  const { title, duration, description } = req.body;
  const userId = req.user.userId;
  const eventId = uuidv4();

  if (!title || !duration) {
    return res.status(400).json({ message: 'Title and duration are required' });
  }

  db.run(
    'INSERT INTO event_types (id, user_id, title, duration, description) VALUES (?, ?, ?, ?, ?)',
    [eventId, userId, title, duration, description],
    (err) => {
      if (err) {
        return res.status(500).json({ message: 'Error creating event type' });
      }

      res.status(201).json({
        message: 'Event type created successfully',
        event: { id: eventId, title, duration, description }
      });
    }
  );
});

// Get user's event types
router.get('/', auth, (req, res) => {
  db.all(
    'SELECT * FROM event_types WHERE user_id = ?',
    [req.user.userId],
    (err, events) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      res.json({ events });
    }
  );
});

// Update event type
router.put('/:id', auth, (req, res) => {
  const { title, duration, description } = req.body;
  const eventId = req.params.id;

  db.run(
    `UPDATE event_types 
     SET title = ?, duration = ?, description = ?
     WHERE id = ? AND user_id = ?`,
    [title, duration, description, eventId, req.user.userId],
    (err) => {
      if (err) {
        return res.status(500).json({ message: 'Error updating event type' });
      }

      res.json({ message: 'Event type updated successfully' });
    }
  );
});

// Delete event type
router.delete('/:id', auth, (req, res) => {
  db.run(
    'DELETE FROM event_types WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.userId],
    (err) => {
      if (err) {
        return res.status(500).json({ message: 'Error deleting event type' });
      }

      res.json({ message: 'Event type deleted successfully' });
    }
  );
});

// Set availability
router.post('/availability', auth, (req, res) => {
  const { availabilities } = req.body;
  const userId = req.user.userId;

  if (!Array.isArray(availabilities)) {
    return res.status(400).json({ message: 'Invalid availability format' });
  }

  // Begin transaction
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // Delete existing availability
    db.run('DELETE FROM availability WHERE user_id = ?', [userId], (err) => {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ message: 'Error updating availability' });
      }

      // Insert new availability
      const stmt = db.prepare(
        'INSERT INTO availability (id, user_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?, ?)'
      );

      availabilities.forEach((avail) => {
        stmt.run([
          uuidv4(),
          userId,
          avail.dayOfWeek,
          avail.startTime,
          avail.endTime
        ]);
      });

      stmt.finalize();
      db.run('COMMIT');

      res.json({ message: 'Availability updated successfully' });
    });
  });
});

// Get user's availability
router.get('/availability', auth, (req, res) => {
  db.all(
    'SELECT * FROM availability WHERE user_id = ? ORDER BY day_of_week, start_time',
    [req.user.userId],
    (err, availability) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      res.json({ availability });
    }
  );
});

// Get available time slots for an event type
router.get('/:id/time-slots', async (req, res) => {
  const { date } = req.query;
  const eventId = req.params.id;

  if (!date) {
    return res.status(400).json({ message: 'Date is required' });
  }

  try {
    // Get event type details
    db.get('SELECT * FROM event_types WHERE id = ?', [eventId], (err, eventType) => {
      if (err || !eventType) {
        return res.status(404).json({ message: 'Event type not found' });
      }

      // Get user's availability for the day
      const dayOfWeek = new Date(date).getDay();
      db.all(
        'SELECT * FROM availability WHERE user_id = ? AND day_of_week = ?',
        [eventType.user_id, dayOfWeek],
        (err, availabilities) => {
          if (err) {
            return res.status(500).json({ message: 'Database error' });
          }

          // Get existing bookings for the date
          db.all(
            'SELECT start_time, end_time FROM bookings WHERE event_type_id = ? AND date(start_time) = date(?)',
            [eventId, date],
            (err, bookings) => {
              if (err) {
                return res.status(500).json({ message: 'Database error' });
              }

              // Calculate available time slots
              const timeSlots = calculateTimeSlots(
                date,
                eventType.duration,
                availabilities,
                bookings
              );

              res.json({ timeSlots });
            }
          );
        }
      );
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to calculate available time slots
function calculateTimeSlots(date, duration, availabilities, bookings) {
  const timeSlots = [];
  const selectedDate = new Date(date);

  availabilities.forEach(availability => {
    const [startHour, startMinute] = availability.start_time.split(':');
    const [endHour, endMinute] = availability.end_time.split(':');
    
    let currentSlot = new Date(selectedDate);
    currentSlot.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);
    
    const endTime = new Date(selectedDate);
    endTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

    while (currentSlot < endTime) {
      const slotEnd = new Date(currentSlot.getTime() + duration * 60000);
      
      // Check if slot is available (not booked)
      const isBooked = bookings.some(booking => {
        const bookingStart = new Date(booking.start_time);
        const bookingEnd = new Date(booking.end_time);
        return (
          (currentSlot >= bookingStart && currentSlot < bookingEnd) ||
          (slotEnd > bookingStart && slotEnd <= bookingEnd)
        );
      });

      if (!isBooked && slotEnd <= endTime) {
        timeSlots.push({
          start: currentSlot.toISOString(),
          end: slotEnd.toISOString()
        });
      }

      currentSlot = slotEnd;
    }
  });

  return timeSlots;
}

module.exports = router;
