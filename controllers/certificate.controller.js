const Attendance = require('../models/Attendance.model');
const Workshop = require('../models/Workshop.model');


async function getEligibleParticipants(req, res) {
  try {
    const { workshopId } = req.params;

    const workshop = await Workshop.findById(workshopId);
    if (!workshop) return res.status(404).json({ message: 'Workshop not found' });

    const records = await Attendance.find({ workshop: workshopId })
      .populate('student', 'name email usn department year')
      .sort({ markedAt: 1 });

    
    const seen = new Set();
    const eligibleParticipants = [];
    for (const record of records) {
      if (!record.student || seen.has(record.student._id.toString())) continue;
      seen.add(record.student._id.toString());
      eligibleParticipants.push({
        studentId: record.student._id,
        name: record.student.name,
        email: record.student.email,
        usn: record.student.usn,
        department: record.student.department,
        year: record.student.year,
        attendedAt: record.markedAt,
      });
    }

    return res.json({
      workshopId,
      workshopTitle: workshop.title,
      eligibleCount: eligibleParticipants.length,
      eligibleParticipants,
    });
  } catch (err) {
    console.error('[getEligibleParticipants]', err);
    return res.status(500).json({ message: 'Failed to fetch eligible participants' });
  }
}

module.exports = { getEligibleParticipants };
