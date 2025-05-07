$(document).ready(function () {
  // Check authentication
  if (!auth.requireAuth()) return;

  const itemsPerPage = 10; // Handle 10 items per page
  let allAppointments = []; // Store all appointments for client-side pagination
  const doctorData = JSON.parse(localStorage.getItem("doctorData"));
  // Initialize doctor info
  if (doctorData?.name && doctorData?.specialization) {
    $("#doctor-name").text(doctorData.name);
    $("#doctor-name1").text(doctorData.name);
    $("#doctor-specialization").text(doctorData.specialization);
  }
  // Debug: Log when script initializes
  console.log("Appointments script initialized");

  // Function to fetch appointments
  function fetchAppointments(page = 1) {
    console.log(`Fetching appointments for page ${page}`); // Debug: Log page number
    const doctorData = JSON.parse(localStorage.getItem("doctorData") || "{}");
    const doctorToken = localStorage.getItem("doctorToken");
    const doctorId = doctorData._id;

    if (!doctorId || !doctorToken) {
      console.error("Doctor ID or token not found in localStorage");
      alert(
        "Doctor ID or token not found in localStorage. Please log in again."
      );
      return;
    }

    const apiUrl = `${window.appConfig.API_BASE_URL}/doctor/get-appointments/${doctorId}`;

    $.ajax({
      url: apiUrl,
      method: "GET",
      headers: {
        Authorization: `Bearer ${doctorToken}`,
      },
      success: function (response) {
        console.log("API Response:", response); // Debug: Log the response

        $("#main-table-tbody").empty();

        if (Array.isArray(response) && response.length > 0) {
          allAppointments = response; // Store all appointments

          // Calculate pagination
          const totalItems = allAppointments.length;
          const totalPages = Math.ceil(totalItems / itemsPerPage);
          const startIndex = (page - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const pageAppointments = allAppointments.slice(startIndex, endIndex);

          // Populate table with up to 10 appointments
          pageAppointments.forEach((appointment) => {
            // Determine button states based on status
            const status = appointment.status?.toLowerCase();
            let checkButtonClass = "bg-[#158E72]";
            let crossButtonClass = "bg-[#ED1D4E]";
            let checkButtonDisabled = "";
            let crossButtonDisabled = "";

            if (status === "reject" || status === "completed") {
              checkButtonClass = "bg-[#158E7266]";
              crossButtonClass = "bg-[#ED1D4E66]";
              checkButtonDisabled = "disabled";
              crossButtonDisabled = "disabled";
            } else if (status === "booked") {
              checkButtonClass = "bg-[#158E7266]";
              checkButtonDisabled = "disabled";
            }

            const row = `
              <tr class="hover:bg-gray-50">
                <td class="py-3 px-4">${appointment.slot || "N/A"}</td>
                <td class="py-3 px-4">${appointment.patientName || "N/A"}</td>
                <td class="py-3 px-4">${appointment.patientEmail || "N/A"}</td>
                <td class="py-3 px-4">${
                  formatDate(appointment.date) || "N/A"
                }</td>
                <td class="py-3 px-4">
                  <span class="inline-flex items-center">
                    <span class="w-2 h-2 rounded-full bg-${getStatusColor(
                      appointment.status
                    )} mr-2"></span>
                    ${appointment.status || "N/A"}
                  </span>
                </td>
                <td class="py-3 px-4">
                  <button class="${checkButtonClass} text-white rounded-md py-2 px-3 mr-2 action-button" data-id="${
              appointment._id
            }" data-action="booked" ${checkButtonDisabled}>
                    <i class="fa-solid fa-check"></i>
                  </button>
                  <button class="${crossButtonClass} text-white rounded-md py-2 px-3 mr-2 action-button" data-id="${
              appointment._id
            }" data-action="reject" ${crossButtonDisabled}>
                    <i class="fa-solid fa-xmark"></i>
                  </button>
                  <button class="bg-[#7F7F7F] text-white rounded-md py-2 px-3 mr-2 view-button" data-id="${
                    appointment?.patientId?._id
                  }">
                    <i class="fa-solid fa-eye"></i>
                  </button>
                </td>
              </tr>
            `;
            $("#main-table-tbody").append(row);
          });

          // Update pagination UI
          updatePagination(page, totalPages);
        } else {
          console.warn("No appointments found in response");
          $("#main-table-tbody").append(
            '<tr><td colspan="6" class="py-3 px-4 text-center">No appointments found.</td></tr>'
          );
          updatePagination(1, 1);
        }
      },
      error: function (xhr, status, error) {
        console.error("AJAX Error:", xhr.status, xhr.responseText);
        let errorMsg = "Failed to fetch appointments. Please try again.";
        if (xhr.status === 401) errorMsg = "Unauthorized. Please log in again.";
        else if (xhr.status === 404) errorMsg = "Appointments not found.";
        alert(errorMsg);
        $("#main-table-tbody").append(
          '<tr><td colspan="6" class="py-3 px-4 text-center">Error loading appointments.</td></tr>'
        );
        updatePagination(1, 1);
      },
    });
  }

  // region patient details modal
  // Attach click event for view buttons
  $("tbody")
    .off("click", ".view-button")
    .on("click", ".view-button", function () {
      const patientId = $(this).attr("data-id");
      console.log(`View button clicked: patientId=${patientId}`);

      // Log doctorToken and API URL
      const doctorToken = localStorage.getItem("doctorToken");
      console.log("Doctor Token:", doctorToken);
      const apiUrl = `${window.appConfig.API_BASE_URL}/doctor/appointment/patient/${patientId}`;
      console.log("API URL:", apiUrl);

      // Check if doctorToken exists
      if (!doctorToken) {
        console.error("Error: doctorToken is missing or undefined");
        alert("Authentication token is missing. Please log in again.");
        return;
      }

      // Show the modal
      $("#patientDetailsModal").removeClass("hidden");

      // Log before making AJAX call
      console.log("Initiating AJAX call...");

      // Fetch appointment details from API
      $.ajax({
        url: apiUrl,
        method: "GET",
        headers: {
          Authorization: `Bearer ${doctorToken}`,
        },
        beforeSend: function () {
          console.log("AJAX request is being sent...");
        },
        success: function (response) {
          console.log("API success response:", response);
          if (response.success && response.appointments.length > 0) {
            const appointment = response.appointments[0]; // Get the first appointment
            console.log("Appointment data:", appointment);

            // Update Patient Details in Modal using id selectors
            $("#patient-name").text(appointment.patientName);
            $("#patient-gender-age").text(`Male • Age Unknown`);
            $("#patient-medical-history").text(appointment.medicalHistory);
            $("#patient-email").text(appointment.patientEmail);
            $("#patient-phone").text(appointment.patientPhone);
            $("#patient-status").text(appointment.status);

            // Update Appointment History Table
            const tableBody = $("#patientDetailsModal tbody");
            tableBody.empty();
            tableBody.append(`
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">1</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${appointment.date} | ${appointment.slot}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <span class="w-2.5 h-2.5 rounded-full bg-teal-500 mr-1.5"></span>
                    <span class="text-gray-600">${appointment.status}</span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <button  class="text-gray-600 hover:text-gray-900 view-appointment-btn" data-appointment-id="${appointment._id}" data-patient-id="${appointment.patientId}" data-doctor-id="${appointment.doctorId._id}">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                </td>
              </tr>
            `);

            // region Prescription
            $("#prescriptionModal")
              .find("#closeModalBtn")
              .on("click", function () {
                $("#prescriptionModal").addClass("hidden");
              });

            // Add new prescription field set
            $("#addFieldBtn").on("click", function () {
              const newFieldSet = `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 prescription-field-set mb-4">
                  <div>
                    <label for="medicineName" class="block text-sm font-medium text-gray-700">Medicine Name</label>
                    <input type="text" class="medicineName mt-1 w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 />
                  </div>
                  <div>
                    <label for="duration" class="block text-sm font-medium text-gray-700">Duration</label>
                    <input type="text" class="duration mt-1 w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label for="dosage" class="block text-sm font-medium text-gray-700">Dosage</label>
                    <input type="text" class="dosage mt-1 w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 />
                  </div>
                  <div class="flex items-end">
                    <div class="w-full">
                      <label for="instructions" class="block text-sm font-medium text-gray-700">Directions</label>
                      <input type="text" class="instructions mt-1 w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500" />
                    </div>
                    <button type="button" class="removeFieldBtn ml-2 text-red-600 hover:text-red-800">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>`;
              $("#prescriptionFields").append(newFieldSet);
            });

            // Remove prescription field set
            $(document).on("click", ".removeFieldBtn", function () {
              if ($(".prescription-field-set").length > 1) {
                $(this).closest(".prescription-field-set").remove();
              }
            });

            $("tbody").on("click", ".view-button", function () {
              const patientId = $(this).attr("data-id");
              const doctorToken = localStorage.getItem("doctorToken");
              const patientApiUrl = `${window.appConfig.API_BASE_URL}/doctor/appointment/patient/${patientId}`;

              if (!doctorToken) {
                console.error("Error: doctorToken is missing");
                alert("Authentication token is missing. Please log in again.");
                return;
              }

              $("#patientDetailsModal").removeClass("hidden");

              $.ajax({
                url: patientApiUrl,
                method: "GET",
                headers: {
                  Authorization: `Bearer ${doctorToken}`,
                },
                success: function (response) {
                  if (response.success && response.appointments.length > 0) {
                    const appointment = response.appointments[0];
                    const tableBody = $("#patientDetailsModal tbody");
                    tableBody.empty();
                    tableBody.append(`
                      <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">1</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${appointment.date} | ${appointment.slot}</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="flex items-center">
                            <span class="w-2.5 h-2.5 rounded-full bg-teal-500 mr-1.5"></span>
                            <span class="text-gray-600">${appointment.status}</span>
                          </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <button class="text-gray-600 hover:text-gray-900 view-appointment-btn" data-status="${appointment.status}" data-appointment-id="${appointment._id}" data-patient-id="${appointment.patientId}" data-doctor-id="${appointment.doctorId._id}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    `);
                  } else {
                    console.error("No appointment data found");
                    alert("No appointment data available.");
                  }
                },
                error: function (xhr, status, error) {
                  console.error("Patient AJAX error:", {
                    status,
                    error,
                    responseText: xhr.responseText,
                  });
                  alert("Failed to fetch appointment details.");
                },
              });
            });

            $("tbody").on("click", ".view-appointment-btn", function () {
              const appointmentId = $(this).data("appointment-id");
              const patientId = $(this).data("patient-id");
              const doctorId = $(this).data("doctor-id");
              const apptStatus = $(this).data("status");
              console.log("status", apptStatus);
              const doctorToken = localStorage.getItem("doctorToken");
              // const getPrescriptionUrl = `http://localhost:8000/api/doctor/get-prescription/${appointmentId}`;
              const getPrescriptionUrl = `${window.appConfig.API_BASE_URL}/doctor/get-prescription/${appointmentId}`;

              if (!doctorToken) {
                console.error("Error: doctorToken is missing");
                alert("Authentication token is missing. Please log in again.");
                return;
              }

              $("#prescriptionModal").removeClass("hidden");

              $.ajax({
                url: getPrescriptionUrl,
                method: "GET",
                headers: {
                  Authorization: `Bearer ${doctorToken}`,
                },
                success: function (response) {
                  console.log("Prescription API response:", response);
                  const tableBody = $("#drugTableBody");
                  tableBody.empty();

                  if (
                    response.prescription &&
                    response.prescription.length > 0
                  ) {
                    response.prescription.forEach((item, index) => {
                      tableBody.append(`
                        <tr class="border-b">
                          <td class="px-4 py-3 text-sm text-gray-900">${
                            index + 1
                          }</td>
                          <td class="px-4 py-3 text-sm text-gray-900">${
                            item.medicineName || "Unknown"
                          }</td>
                          <td class="px-4 py-3 text-sm text-gray-900">${
                            item.dosage
                          }</td>
                          <td class="px-4 py-3 text-sm text-gray-900">${
                            item.duration || "N/A"
                          }</td>
                          <td class="px-4 py-3 text-sm text-gray-900">${
                            item.directions || "N/A"
                          }</td>
                        </tr>
                      `);
                    });
                  } else {
                    tableBody.append(`
                      <tr>
                        <td colspan="5" class="px-4 py-3 text-sm text-gray-900 text-center">No prescription data available</td>
                      </tr>
                    `);
                  }
                },
                error: function (xhr, status, error) {
                  console.error("Prescription AJAX error:", {
                    status,
                    error,
                    responseText: xhr.responseText,
                  });
                  alert("Failed to fetch prescription details.");
                },
              });

              $("#addPrescriptionForm").on("submit", function (e) {
                e.preventDefault();
                const prescriptions = [];
                let hasError = false;

                $(".prescription-field-set").each(function () {
                  const medicine = $(this).find(".medicineName").val();
                  const duration = $(this).find(".duration").val();
                  const dosage = $(this).find(".dosage").val();
                  const instructions = $(this).find(".instructions").val();

                  if (!medicine || !dosage) {
                    hasError = true;
                    return false; // Break the loop
                  }

                  prescriptions.push({
                    medicine,
                    duration,
                    dosage,
                    instructions,
                  });
                });

                if (hasError) {
                  alert(
                    "Medicine Name and Dosage are required for all entries."
                  );
                  return;
                }

                if (prescriptions.length === 0) {
                  alert("At least one prescription is required.");
                  return;
                }

                const payload = {
                  patient: patientId,
                  doctor: doctorId,
                  appointment: appointmentId,
                  prescription: prescriptions,
                };

                $.ajax({
                  url: `${window.appConfig.API_BASE_URL}/doctor/add-prescription`,
                  // url: `${window.appConfig.API_BASE_URL}/doctor/add-prescription`,
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${doctorToken}`,
                    "Content-Type": "application/json",
                  },
                  data: JSON.stringify(payload),
                  success: function (response) {
                    console.log("Add prescription success:", response);
                    alert("Prescriptions added successfully.");
                    $("#addPrescriptionForm")[0].reset();
                    $("#prescriptionFields").html(`
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 prescription-field-set mb-4">
                        <div>
                          <label for="medicineName" class="block text-sm font-medium text-gray-700">Medicine Name</label>
                          <input type="text" class="medicineName mt-1 w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 />
                        </div>
                        <div>
                          <label for="duration" class="block text-sm font-medium text-gray-700">Duration</label>
                          <input type="text" class="duration mt-1 w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500" />
                        </div>
                        <div>
                          <label for="dosage" class="block text-sm font-medium text-gray-700">Dosage</label>
                          <input type="text" class="dosage mt-1 w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 />
                        </div>
                        <div>
                          <label for="instructions" class="block text-sm font-medium text-gray-700">Directions</label>
                          <input type="text" class="instructions mt-1 w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500" />
                        </div>
                      </div>
                    `);
                    $.ajax({
                      url: getPrescriptionUrl,
                      method: "GET",
                      headers: {
                        Authorization: `Bearer ${doctorToken}`,
                      },
                      success: function (response) {
                        const tableBody = $("#drugTableBody");
                        tableBody.empty();
                        if (
                          response.prescription &&
                          response.prescription.length > 0
                        ) {
                          response.prescription.forEach((item, index) => {
                            tableBody.append(`
                              <tr class="border-b">
                                <td class="px-4 py-3 text-sm text-gray-900">${
                                  index + 1
                                }</td>
                                <td class="px-4 py-3 text-sm text-gray-900">${
                                  item.medicineName || "Unknown"
                                }</td>
                                <td class="px-4 py-3 text-sm text-gray-900">${
                                  item.dosage
                                }</td>
                                <td class="px-4 py-3 text-sm text-gray-900">${
                                  item.duration || "N/A"
                                }</td>
                                <td class="px-4 py-3 text-sm text-gray-900">${
                                  item.instructions || "N/A"
                                }</td>
                              </tr>
                            `);
                          });
                        }
                      },
                      error: function () {
                        alert("Failed to refresh prescription list.");
                      },
                    });
                  },
                  error: function (xhr, status, error) {
                    console.error("Add prescription error:", {
                      status,
                      error,
                      responseText: xhr.responseText,
                    });
                    alert("Failed to add prescriptions.");
                  },
                });
              });
            });
          } else {
            console.error("No appointment data found in response");
            alert("No appointment data available.");
          }
        },
        error: function (xhr, status, error) {
          console.error("AJAX error:", {
            status: status,
            error: error,
            responseText: xhr.responseText,
            statusCode: xhr.status,
          });
          alert(
            "Failed to fetch appointment details. Check console for details."
          );
        },
        complete: function () {
          console.log("AJAX call completed.");
        },
      });
    });

  // Function to update appointment status
  function updateAppointmentStatus(appointmentId, status, page) {
    console.log(`Updating appointment ${appointmentId} to status ${status}`);
    const doctorToken = localStorage.getItem("doctorToken");

    if (!doctorToken) {
      console.error("Doctor token not found in localStorage");
      alert("Doctor token not found. Please log in again.");
      return;
    }

    $.ajax({
      url: `${window.appConfig.API_BASE_URL}/doctor/update-appointment-status`,
      method: "PUT",
      headers: {
        Authorization: `Bearer ${doctorToken}`,
        "Content-Type": "application/json",
      },
      data: JSON.stringify({
        appointmentId: appointmentId,
        status: status,
      }),
      success: function (response) {
        console.log("Status Update Response:", response);
        alert(`Appointment status updated to ${status}.`);
        fetchAppointments(page);
      },
      error: function (xhr, status, error) {
        console.error("Status Update Error:", xhr.status, xhr.responseText);
        let errorMsg = "Failed to update appointment status. Please try again.";
        if (xhr.status === 401) errorMsg = "Unauthorized. Please log in again.";
        else if (xhr.status === 400)
          errorMsg = "Invalid request. Please check the appointment ID.";
        else if (xhr.status === 404) errorMsg = "Appointment not found.";
        alert(errorMsg);
      },
    });
  }

  // Format date (YYYY-MM-DD to MM/DD/YYYY)
  function formatDate(dateString) {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  }

  // Get status color
  function getStatusColor(status) {
    switch (status?.toLowerCase()) {
      case "pending":
        return "pending";
      case "reject":
        return "rejected";
      case "booked":
        return "booked";
      case "completed":
        return "completed";
      default:
        return "gray-500";
    }
  }

  // Update pagination UI
  function updatePagination(currentPage, totalPages) {
    const paginationContainer = $(".flex.items-center.space-x-1");

    // Clear existing pagination buttons
    paginationContainer.find("button:not(:first,:last)").remove();
    paginationContainer.find("span").remove();

    // Generate page buttons (show up to 5 pages)
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage < maxButtons - 1) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      const button = `
        <button class="w-8 h-8 flex items-center justify-center border border-gray-300 rounded text-sm page-button ${
          i === currentPage ? "bg-primary text-white border-primary" : ""
        }" data-page="${i}">
          ${i}
        </button>
      `;
      paginationContainer.find("button:last").before(button);
    }

    if (endPage < totalPages) {
      paginationContainer
        .find("button:last")
        .before('<span class="px-2">...</span>');
      paginationContainer.find("button:last").before(`
        <button class="w-8 h-8 flex items-center justify-center border border-gray-300 rounded text-sm page-button" data-page="${totalPages}">
          ${totalPages}
        </button>
      `);
    }

    // Attach click event for page buttons
    paginationContainer
      .off("click", ".page-button")
      .on("click", ".page-button", function () {
        const page = parseInt($(this).attr("data-page"));
        console.log(`Page button clicked: ${page}`);
        fetchAppointments(page);
      });

    // Attach click event for action buttons
    $("tbody")
      .off("click", ".action-button")
      .on("click", ".action-button", function () {
        if ($(this).prop("disabled")) return;
        const appointmentId = $(this).attr("data-id");
        const action = $(this).attr("data-action");
        const currentPage = parseInt($("select").val()) || 1;
        console.log(
          `Action button clicked: ID=${appointmentId}, Action=${action}, page=${currentPage}`
        );
        updateAppointmentStatus(appointmentId, action, currentPage);
      });

    // Update Previous/Next buttons
    $(".flex.items-center.space-x-1 button:first")
      .prop("disabled", currentPage === 1)
      .off("click")
      .on("click", () => {
        console.log("Previous button clicked");
        fetchAppointments(currentPage - 1);
      });
    $(".flex.items-center.space-x-1 button:last")
      .prop("disabled", currentPage === totalPages)
      .off("click")
      .on("click", () => {
        console.log("Next button clicked");
        fetchAppointments(currentPage + 1);
      });

    // Update page select
    $("select").empty();
    for (let i = 1; i <= totalPages; i++) {
      $("select").append(
        `<option ${i === currentPage ? "selected" : ""}>${i}</option>`
      );
    }
    $("select")
      .off("change")
      .on("change", function () {
        const page = parseInt(this.value);
        console.log(`Select changed to page: ${page}`);
        fetchAppointments(page);
      });
    $(".text-sm.text-gray-500.ml-2").text(`of ${totalPages}`);
  }

  // Fetch appointments on page load
  fetchAppointments();
});
