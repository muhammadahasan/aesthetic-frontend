// admin/overview.js and admin/appointments.js
$(document).ready(function () {
  // Check authentication
  if (!auth.requireAuth()) return;

  // Now you can safely make authenticated API calls
  // The headers are already set up by auth.js

  // Your admin page specific code here
  loadAppointments();
  // etc...
});
