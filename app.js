const express = require("express");
const ejs = require("ejs");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
app.use(express.json());
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
const {
  insertFaculty,
  getFacultyByInsertId,
  getFacultyByEmailAndPassword,
  updateFacultyByInsertId,
  deleteFacultyByInsertId,
  getAllFaculty,
  markFacultiesAttendance,
  getFacultyStatus,
  getFacultyCourses,
  insertFacultyLeave,
  getAllFacultyLeave,
  actionFacultyLeave,
  getAllFacultyOnLeave,
  getFacultyAttendance,
  getTotalFaculty,
  getTotalFacultyLeave,
  archiveAndDeleteFaculty,
  getApprovedLeavesForFaculty
} = require("./database_query/faculty");

const {
  insertStaff,
  getStaffByEmailAndPassword,
  getStaffByInsertId,
  getAllStaff,
  updateStaffByInsertId,
  deleteStaffByInsertId,
  markStaffsAttendance,
  updateStaffsAttendance,
  getStaffStatus,
  insertStaffLeave,
  getAllStaffLeave,
  actionStaffLeave,
  getAllStaffOnLeave,
  getStaffAttendanceCount,
  getTotalStaffCount,
  getTotalLeavesTaken,
  archiveAndDeleteStaff,
  getApprovedLeaves

} = require("./database_query/staff");

app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    },
  })
);

app.get("/", (req, res) => {
  res.render("loginAs");
});
app.get("/login", (req, res) => {
  res.render("loginAs");
});
app.get("/register", (req, res) => {
  res.render("registerAs");
});
app.get("/admin/login", (req, res) => {
  res.render("Admin/login");
});
//----------------------Staff----------------------
function isValidateStaff(req, res, next) {
  if (req.session.StaffId) {
    next();
  } else {
    res.redirect("/login");
  }
}
//-----------------StaffRegisteration---------------------
app.post("/staffRegister", async (req, res) => {
  const { name, email, password, phone_number, designation } = req.body;
  console.log(req.body);
  try {
    //Insert into staff table
    const result = await insertStaff(
      name,
      email,
      password,
      designation,
      phone_number
    );
    req.session.StaffId = result.sid;
    res.redirect(`/staffdashboard/${result.sid}`);
  } catch (error) {
    console.error("Error inserting staff:", error);
    res.status(500).json({
      success: false,
      message: "Error inserting staff",
      error: error.message,
    });
  }
});
//-----------------StaffLogin---------------------
app.post("/staffLogin", async (req, res) => {
  const { email, password } = req.body;

  try {
    const staff = await getStaffByEmailAndPassword(email, password);
    if (staff) {
      req.session.StaffId = staff.sid;
      res.redirect(`/staffdashboard/${staff.sid}`);
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.error("Error logging in staff:", error);
    res.status(500).json({
      success: false,
      message: "Error logging in staff",
      error: error.message,
    });
  }
});
//-----------------StaffDashboard---------------------
app.get("/staffdashboard/:sid", isValidateStaff, async (req, res) => {
  const sid = req.params.sid;
  const attendance = await getStaffAttendanceCount(sid);
  const totalStaffObject = await getTotalStaffCount();
  const totalStaff = totalStaffObject.count;
  const totalLeavesTakenObject = await getTotalLeavesTaken(sid);
  const totalLeavesTaken = totalLeavesTakenObject.totalLeavesTaken;
  console.log(totalLeavesTaken);
  function getWorkingDaysInMonth(year, month) {
    let count = 0;
    let date = new Date(year, month, 1);
    while (date.getMonth() === month) {
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        count++;
      }
      date.setDate(date.getDate() + 1);
    }
    return count;
  }
  try {
    const staff = await getStaffByInsertId(sid);
    if (!staff) {
      res.redirect("/login");
      return;
    }
    res.render("Staff/dashboard/dashboard2", { staff, attendance, totalStaff, totalLeavesTaken, getWorkingDaysInMonth});
  } catch (error) {
    console.error("Error fetching staff details:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching staff details",
      error: error.message,
    });
  }
});
app.get("/staffdashboard/:sid/profile", isValidateStaff, async (req, res) => {
  const sid = req.params.sid;

  try {
    const staff = await getStaffByInsertId(sid);
    if (!staff) {
      res.redirect("/login");
      return;
    }
    res.render("Staff/profile/info", { staff });
  } catch (error) {
    console.error("Error fetching staff details:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching staff details",
      error: error.message,
    });
  }
});
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return console.log(err);
    }
    res.redirect("/login");
  });
});

//--------------------------Faculty--------------------------
function isValidateFaculty(req, res, next) {
  if (req.session.FacultyId) {
    next();
  } else {
    res.redirect("/login");
  }
}
//-----------------FacultyRegisteration---------------------
app.post("/facultyRegister", async (req, res) => {
  const { name, email, password, phone_number, department } = req.body;
  try {
    //Insert into faculty table
    const result = await insertFaculty(
      name,
      email,
      password,
      department,
      phone_number
    );
    req.session.FacultyId = result.fid;
    res.redirect(`/facultydashboard/${result.fid}`);
  } catch (error) {
    console.error("Error inserting faculty:", error);
    res.status(500).json({
      success: false,
      message: "Error inserting faculty",
      error: error.message,
    });
  }
});
//-----------------FacultyLogin---------------------
app.post("/facultyLogin", async (req, res) => {
  const { email, password } = req.body;

  try {
    const fac = await getFacultyByEmailAndPassword(email, password);
    console.log(fac);
    if (fac) {
      req.session.FacultyId = fac.fid;
      res.redirect(`/facultydashboard/${fac.fid}`);
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.error("Error logging in faculty:", error);
    res.status(500).json({
      success: false,
      message: "Error logging in faculty",
      error: error.message,
    });
  }
});
//-----------------FacultyDashboard---------------------
app.get("/facultydashboard/:fid", isValidateFaculty, async (req, res) => {
  const fid = req.params.fid;
  const attendance = await getFacultyAttendance(fid);
  const totalFacultyObject = await getTotalFaculty();
  const totalFaculty = totalFacultyObject.totalFaculty;
  const totalFacultyLeaveTakenObject = await getTotalFacultyLeave(fid);
  const totalFacultyLeaveTaken = totalFacultyLeaveTakenObject ? totalFacultyLeaveTakenObject.count : 0;  // console.log(totalFacultyLeaveTaken);
  console.log(typeof attendance);
  console.log(attendance);
  function getWorkingDaysInMonth(year, month) {
    let count = 0;
    let date = new Date(year, month, 1);
    while (date.getMonth() === month) {
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        count++;
      }
      date.setDate(date.getDate() + 1);
    }
    return count;
  }
  try {
    const faculty = await getFacultyByInsertId(fid);
    const courses = await getFacultyCourses(fid);
    if (!faculty) {
      res.redirect("/login");
      return;
    }
    res.render("Faculty/dashboard/dashboard2", { faculty, courses, attendance, totalFaculty, totalFacultyLeaveTaken, getWorkingDaysInMonth });
  } catch (error) {
    console.error("Error fetching faculty details:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching faculty details",
      error: error.message,
    });
  }
});
app.get(
  "/facultydashboard/:fid/profile",
  isValidateFaculty,
  async (req, res) => {
    const fid = req.params.fid;

    try {
      const faculty = await getFacultyByInsertId(fid);
      if (!faculty) {
        res.redirect("/login");
        return;
      }
      res.render("Faculty/profile/info", { faculty });
    } catch (error) {
      console.error("Error fetching faculty details:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching faculty details",
        error: error.message,
      });
    }
  }
);

app.post("/facultydashboard/:facultyId/applyLeave", async (req, res) => {
  const { name, from_date, to_date, reason } = req.body;
  const faculty_id = req.params.facultyId;
  await insertFacultyLeave({
    facultyId: faculty_id,
    fromDate: from_date,
    toDate: to_date,
    reason: reason,
  }); // Make sure to pass the correct object properties
  res.redirect(`/facultydashboard/${faculty_id}`);
});

app.get("/facultydashboard/:facultyId/applyLeave", async (req, res) => {
  const faculty = await getFacultyByInsertId(req.params.facultyId);
  res.render("Faculty/dashboard/applyLeave", { faculty });
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return console.log(err);
    }
    res.redirect("/login");
  });
});

app.get("/staffdashboard/:staffId/applyLeave", async (req, res) => {
  const staff = await getStaffByInsertId(req.params.staffId);
  res.render("Staff/dashboard/applyLeave", { staff });
});

app.post("/staffdashboard/:staffId/applyLeave", async (req, res) => {
  const { name, from_date, to_date, reason } = req.body;
  const staff_id = req.params.staffId;
  await insertStaffLeave({
    staffId: staff_id,
    fromDate: from_date,
    toDate: to_date,
    reason: reason,
  }); // Make sure to pass the correct object properties
  res.redirect(`/staffdashboard/${staff_id}`);
});

// -------- Admin --------//
app.get("/admin", (req, res) => {
  res.render("Admin/login");
});

app.post("/admin", (req, res) => {
  const { email, password } = req.body;
  if (email === "admin@iiitg.ac.in" && password === "admin@123") {
    res.redirect("/admin/dashboard");
  } else {
    res.redirect("admin");
  }
});

app.get("/admin/dashboard", (req, res) => {
  res.render("Admin/home");
});

// Staff routes
app.get("/admin/staff/view", async (req, res) => {
  const staffs = await getAllStaff();
  res.render("Admin/staff/index", { staffs });
});

app.get("/admin/staff/:staffId/edit", async (req, res) => {
  const staff = await getStaffByInsertId(req.params.staffId);
  res.render("Admin/staff/edit", { staff });
});

app.post("/admin/staff/:staffId/edit", async (req, res) => {
  const { name, email, password, phone_number, designation } = req.body;
  await updateStaffByInsertId(
    req.params.staffId,
    name,
    email,
    password,
    designation,
    phone_number
  );
  res.redirect("/admin/staff/view");
});

app.get("/admin/staff/:staffId/profile", async (req, res) => {
  try {
    const staff = await getStaffByInsertId(req.params.staffId);
    const staffStatus = await getStaffStatus(req.params.staffId);
    res.render("Admin/staff/profile", { staff, staffStatus });
  } catch (error) {
    console.error("Error fetching staff profile:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/admin/staff/:staffId/delete", async (req, res) => {
  try {
    await archiveAndDeleteStaff(req.params.staffId);
    res.redirect("/admin/staff/view");
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting staff member');
  }
});

app.get("/admin/staff/attendance", async (req, res) => {
  const staffs = await getAllStaff();
  const todayDate = new Date();
  const formattedDate = todayDate.toISOString().slice(0, 10); // Getting YYYY-MM-DD format
  const staffsOnLeave = await getAllStaffOnLeave(formattedDate);
  console.log(staffsOnLeave);
  console.log(staffs);
  res.render("Admin/staff/attendance", { staffs, staffsOnLeave });
});

app.post("/admin/staff/attendance", async (req, res) => {

  const { attendance_present, attendance_absent, attendance_onleave } =
    req.body;
  console.log(attendance_present, attendance_absent, attendance_onleave);
  await markStaffsAttendance(
    attendance_present,
    attendance_absent,
    attendance_onleave
  );
  res.redirect("/admin/staff/thanks");

});

app.get("/admin/staff/thanks", async (req, res) => {
  res.render("Admin/staff/thanks");
});


// Edit page route



app.get("/admin/staff/leave", async (req, res) => {
  const leaveRequests = await getAllStaffLeave();
  res.render("Admin/leave/staff_leave", { leaveRequests: leaveRequests });
});

app.post("/admin/acceptLeave", async (req, res) => {
  const { leaveId, from_date, to_date } = req.body;

  // Convert date strings to DATE format
  const formatDateToISO = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formattedFromDate = formatDateToISO(from_date);
  const formattedToDate = formatDateToISO(to_date);

  try {
    await actionStaffLeave(
      leaveId,
      formattedFromDate,
      formattedToDate,
      "approved"
    );
    res.redirect("/admin/staff/leave");
  } catch (error) {
    console.error("Error accepting leave:", error);
    res.status(500).send("Error accepting leave");
  }
});

app.post("/admin/rejectLeave", async (req, res) => {
  const { leaveId, from_date, to_date } = req.body;

  // Convert date strings to DATE format
  const formatDateToISO = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formattedFromDate = formatDateToISO(from_date);
  const formattedToDate = formatDateToISO(to_date);

  try {
    await actionStaffLeave(
      leaveId,
      formattedFromDate,
      formattedToDate,
      "rejected"
    );
    res.redirect("/admin/staff/leave");
  } catch (error) {
    console.error("Error accepting leave:", error);
    res.status(500).send("Error accepting leave");
  }
});

// Faculty routes
app.get("/admin/faculty/view", async (req, res) => {
  const faculties = await getAllFaculty();
  res.render("Admin/faculty/index", { faculties });
});

app.get("/admin/faculty/:facultyId/edit", async (req, res) => {
  const faculty = await getFacultyByInsertId(req.params.facultyId);
  res.render("Admin/faculty/edit", { faculty });
});

app.post("/admin/faculty/:facultyId/edit", async (req, res) => {
  const { name, email, password, phone_number, department } = req.body;
  await updateFacultyByInsertId(
    req.params.facultyId,
    name,
    email,
    password,
    department,
    phone_number
  );
  res.redirect("/admin/faculty/view");
});

app.get("/admin/faculty/:facultyId/profile", async (req, res) => {
  try {
    const faculty = await getFacultyByInsertId(req.params.facultyId);
    const facultyStatus = await getFacultyStatus(req.params.facultyId);
    res.render("Admin/faculty/profile", { faculty, facultyStatus });
  } catch (error) {
    console.error("Error fetching faculty profile:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/admin/faculty/:facultyId/delete", async (req, res) => {
  try {
    await archiveAndDeleteFaculty(req.params.facultyId);
    res.redirect("/admin/faculty/view");
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting faculty member');
  }
});

app.get("/admin/faculty/attendance", async (req, res) => {
  const facultys = await getAllFaculty();
  const todayDate = new Date();
  const formattedDate = todayDate.toISOString().slice(0, 10); 
  const facultysOnLeave = await getAllFacultyOnLeave(formattedDate);
  console.log(facultysOnLeave);

  res.render("Admin/faculty/attendance", { facultys, facultysOnLeave });
});
app.post("/admin/faculty/attendance", async (req, res) => {
  const { attendance_present, attendance_absent, attendance_onleave } =
    req.body;
  await markFacultiesAttendance(
    attendance_present,
    attendance_absent,
    attendance_onleave
  );
  res.redirect("/admin/faculty/thanks");
});

app.get("/admin/faculty/thanks", async (req, res) => {
  res.render("Admin/faculty/thanks");
});

app.get("/admin/faculty/leave", async (req, res) => {
  const leaveRequests = await getAllFacultyLeave();
  res.render("Admin/leave/faculty_leave", { leaveRequests: leaveRequests });
});

app.post("/admin/acceptFacultyLeave", async (req, res) => {
  const { leaveId, from_date, to_date } = req.body;

  // Convert date strings to DATE format
  const formatDateToISO = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formattedFromDate = formatDateToISO(from_date);
  const formattedToDate = formatDateToISO(to_date);

  try {
    await actionFacultyLeave(
      leaveId,
      formattedFromDate,
      formattedToDate,
      "approved"
    );
    res.redirect("/admin/faculty/leave");
  } catch (error) {
    console.error("Error accepting leave:", error);
    res.status(500).send("Error accepting leave");
  }
});

app.post("/admin/rejectFacultyLeave", async (req, res) => {
  const { leaveId, from_date, to_date } = req.body;

  // Convert date strings to DATE format
  const formatDateToISO = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formattedFromDate = formatDateToISO(from_date);
  const formattedToDate = formatDateToISO(to_date);

  try {
    await actionFacultyLeave(
      leaveId,
      formattedFromDate,
      formattedToDate,
      "rejected"
    );
    res.redirect("/admin/faculty/leave");
  } catch (error) {
    console.error("Error rejecting leave:", error);
    res.status(500).send("Error rejecting leave");
  }
});
app.get("/admin/goBack", (req, res) => {
  res.redirect("/Admin/dashboard");
});
app.get("/admin/goback2", (req, res) => {
  res.redirect("/admin/faculty/view");
});
app.get("/admin/goback3", (req, res) => {
  res.redirect("/admin/staff/view");
});
app.get("/admin/goback4", (req, res) => {
  res.redirect("/facultydashboard/:fid");
});
// app.get('/viewRecords/:facultyId', async (req, res) => {
//   try {
//     // Fetch facultyStatus from your database or compute it here
//     const facultyStatus = await getFacultyStatus(req.params.facultyId);

//     // Pass facultyStatus to the template
//     res.render('Faculty/leaverecord/leave', { facultyStatus });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Error fetching faculty status');
//   }
// });
// app.get('/viewStaffRecords/:staffId', async (req, res) => {
//   try {
//     // Fetch staffStatus from your database or compute it here
//     //const staff = await getStaffByInsertId(req.params.staffId);
//     const staffStatus = await getStaffStatus(req.params.staffId);

//     // Pass staffStatus to the template
//     res.render('Staff/leaverecord/leave', { staffStatus });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Error fetching staff status');
//   }
// });
app.get('/viewStaffRecords/:staffId', async (req, res) => {
  try {
    const staffStatus = await getApprovedLeaves(req.params.staffId);
    res.render('Staff/leaverecord/leave', { staffStatus });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching staff status');
  }
});
app.get('/viewRecords/:facultyId', async (req, res) => {
  try {
    const facultyStatus = await getApprovedLeavesForFaculty(req.params.facultyId);
    res.render('Faculty/leaverecord/leave', { facultyStatus });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching faculty status');
  }
});
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
