const AttendanceSession = require('../models/AttendanceSession.model');
const Attendance = require('../models/Attendance.model');
const Registration = require('../models/Registration.model');


async function getDashboard(req, res) {
  try {
    const { id } = req.params;
    const { search = '', department, year, status } = req.query;

    const session = await AttendanceSession.findById(id).populate('workshop', 'title');
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const registrations = await Registration.find({ workshop: session.workshop._id }).populate(
      'student',
      'name usn email department year'
    );

    const attendanceRecords = await Attendance.find({ session: id });
    const attendanceByStudent = new Map(
      attendanceRecords.map((a) => [a.student.toString(), a.markedAt])
    );

    let participants = registrations
      .filter((r) => r.student) // 
      .map((r) => {
        const markedAt = attendanceByStudent.get(r.student._id.toString());
        return {
          studentId: r.student._id,
          name: r.student.name,
          usn: r.student.usn,
          email: r.student.email,
          department: r.student.department,
          year: r.student.year,
          status: markedAt ? 'present' : 'absent',
          markedAt: markedAt || null,
        };
      });

    const term = search.trim().toLowerCase();
    if (term) {
      participants = participants.filter(
        (p) =>
          p.name?.toLowerCase().includes(term) ||
          p.usn?.toLowerCase().includes(term) ||
          p.email?.toLowerCase().includes(term)
      );
    }
    if (department) {
      participants = participants.filter((p) => p.department === department);
    }
    if (year) {
      participants = participants.filter((p) => p.year === year);
    }
    if (status === 'present' || status === 'absent') {
      participants = participants.filter((p) => p.status === status);
    }

    const presentCount = attendanceRecords.length;
    const totalRegistered = registrations.length;

    return res.json({
      session: {
        id: session._id,
        status: session.status,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        workshopId: session.workshop._id,
        workshopTitle: session.workshop.title,
      },
      stats: {
        totalRegistered,
        present: presentCount,
        remaining: Math.max(totalRegistered - presentCount, 0),
        percentage: totalRegistered ? Math.round((presentCount / totalRegistered) * 100) : 0,
      },
      participants,
    });
  } catch (err) {
    console.error('[getDashboard]', err);
    return res.status(500).json({ message: 'Failed to load dashboard' });
  }
}

module.exports = { getDashboard };
