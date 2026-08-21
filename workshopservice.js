/*
  This is the ONLY file you should replace when the real Workshop/Registration
  module is merged.

  Required workshop shape:
  {
    _id,
    title,
    status: "active" | "upcoming" | "completed" | "finished" | "cancelled",
    registrationStart?,
    registrationDeadline?
  }

  Required registration lookup:
  getRegistration(workshopId, usn) -> {
    registered: true/false,
    studentId,
    usn,
    studentName
  }

  For the current clone, WORKSHOP_DEV_MODE=true lets you test with the
  development workshop below. Set it to false once the real Workshop and
  Registration models/services are available.
*/

const mongoose = require("mongoose");

async function getWorkshopModel() {
  try {
    // Replace this with the actual model name/path supplied by the Workshop team.
    return require("../models/Workshop");
  } catch {
    return null;
  }
}

async function listWorkshops() {
  const Model = await getWorkshopModel();

  if (Model) {
    return Model.find({}).sort({ date: 1 }).lean();
  }

  if (process.env.WORKSHOP_DEV_MODE === "true") {
    return [
      {
        _id: new mongoose.Types.ObjectId("64b000000000000000000001"),
        title: "DEV Workshop - replace with real Workshop data",
        status: "active"
      },
      {
        _id: new mongoose.Types.ObjectId("64b000000000000000000002"),
        title: "DEV Upcoming Workshop",
        status: "upcoming"
      }
    ];
  }

  throw new Error("Workshop model is not connected yet");
}

async function getWorkshopById(workshopId) {
  const Model = await getWorkshopModel();

  if (Model) {
    return Model.findById(workshopId).lean();
  }

  if (process.env.WORKSHOP_DEV_MODE === "true") {
    return (await listWorkshops()).find(
      (w) => String(w._id) === String(workshopId)
    ) || null;
  }

  throw new Error("Workshop model is not connected yet");
}

async function getRegistration(workshopId, usn) {
  /*
    Replace this function with the real Registration model/service.

    Example later:
      return Registration.findOne({
        workshopId,
        usn: usn.toUpperCase(),
        status: "registered"
      }).lean();

    The attendance controller deliberately refuses to mark attendance
    when this function says the student is not registered.
  */

  if (process.env.WORKSHOP_DEV_MODE === "true") {
    return {
      registered: true,
      studentId: usn.toUpperCase(),
      usn: usn.toUpperCase(),
      studentName: "Development Student"
    };
  }

  throw new Error("Registration module is not connected yet");
}

async function getActiveWorkshops() {
  const workshops = await listWorkshops();
  return workshops.filter(
    (w) => String(w.status).toLowerCase() === "active"
  );
}

module.exports = {
  listWorkshops,
  getWorkshopById,
  getActiveWorkshops,
  getRegistration
};
