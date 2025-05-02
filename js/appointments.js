// admin/overview.js and admin/appointments.js
$(document).ready(function () {
  // Check authentication
  if (!auth.requireAuth()) return;

  $(document).ready(function () {
    const itemsPerPage = 10; // Handle 10 items per page
    let allAppointments = []; // Store all appointments for client-side pagination

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
            const pageAppointments = allAppointments.slice(
              startIndex,
              endIndex
            );

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
                  <td class="py-3 px-4">${
                    appointment.patientEmail || "N/A"
                  }</td>
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
                      appointment._id
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
            $("tbody").append(
              '<tr><td colspan="6" class="py-3 px-4 text-center">No appointments found.</td></tr>'
            );
            updatePagination(1, 1);
          }
        },
        error: function (xhr, status, error) {
          console.error("AJAX Error:", xhr.status, xhr.responseText);
          let errorMsg = "Failed to fetch appointments. Please try again.";
          if (xhr.status === 401)
            errorMsg = "Unauthorized. Please log in again.";
          else if (xhr.status === 404) errorMsg = "Appointments not found.";
          alert(errorMsg);
          $("tbody").append(
            '<tr><td colspan="6" class="py-3 px-4 text-center">Error loading appointments.</td></tr>'
          );
          updatePagination(1, 1);
        },
      });
    }

    // Function to update appointment status
    function updateAppointmentStatus(appointmentId, status, page) {
      console.log(`Updating appointment ${appointmentId} to status ${status}`); // Debug
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
          console.log("Status Update Response:", response); // Debug
          alert(`Appointment status updated to ${status}.`);
          fetchAppointments(page); // Refresh table with current page
        },
        error: function (xhr, status, error) {
          console.error("Status Update Error:", xhr.status, xhr.responseText);
          let errorMsg =
            "Failed to update appointment status. Please try again.";
          if (xhr.status === 401)
            errorMsg = "Unauthorized. Please log in again.";
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
          console.log(`Page button clicked: ${page}`); // Debug
          fetchAppointments(page);
        });

      // Attach click event for action buttons
      $("tbody")
        .off("click", ".action-button")
        .on("click", ".action-button", function () {
          if ($(this).prop("disabled")) return; // Skip if button is disabled
          const appointmentId = $(this).attr("data-id");
          const action = $(this).attr("data-action");
          const currentPage = parseInt($("select").val()) || 1;
          console.log(
            `Action button clicked: ID=${appointmentId}, Action=${action}, page=${currentPage}`
          ); // Debug
          updateAppointmentStatus(appointmentId, action, currentPage);
        });

      // Update Previous/Next buttons
      $(".flex.items-center.space-x-1 button:first")
        .prop("disabled", currentPage === 1)
        .off("click")
        .on("click", () => {
          console.log("Previous button clicked"); // Debug
          fetchAppointments(currentPage - 1);
        });
      $(".flex.items-center.space-x-1 button:last")
        .prop("disabled", currentPage === totalPages)
        .off("click")
        .on("click", () => {
          console.log("Next button clicked"); // Debug
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
          console.log(`Select changed to page: ${page}`); // Debug
          fetchAppointments(page);
        });
      $(".text-sm.text-gray-500.ml-2").text(`of ${totalPages}`);
      // Attach click event for view buttons
      $("tbody")
        .off("click", ".view-button")
        .on("click", ".view-button", function () {
          console.log(`View button clicked: ID=${$(this).attr("data-id")}`); // Debug
          $("#patientDetailsModal").removeClass("hidden");
        });
    }

    // Fetch appointments on page load
    fetchAppointments();
  });
});
