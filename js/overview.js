$(document).ready(function () {
  // Add CSS for styling
  $("<style>")
    .prop("type", "text/css")
    .html(
      `
      #availability-slots-container {
        min-height: 150px;
      }
      .slot-item.edit-mode .bg-\\[\\#405570\\] {
        cursor: pointer;
        position: relative;
      }
      .slot-item.edit-mode .bg-\\[\\#405570\\]:hover {
        background-color: #2d3e50;
      }
      .slot-checkbox:checked + .slot-time {
        text-decoration: line-through;
      }
      .slot-item.edit-mode .bg-\\[\\#405570\\] .slot-checkbox {
        cursor: pointer;
        height: 16px;
        width: 16px;
      }
    `
    )
    .appendTo("head");
  // Check authentication first
  if (!auth.requireAuth()) return;

  // Global variables
  let currentSlots = [];
  let selectedDate = new Date().toISOString().split("T")[0]; // Default to today
  const doctorData = JSON.parse(localStorage.getItem("doctorData"));
  const doctorToken = localStorage.getItem("doctorToken");
  const doctorId = doctorData?._id;

  // Initialize doctor info
  if (doctorData?.name && doctorData?.specialization) {
    $("#doctor-name").text(doctorData.name);
    $("#doctor-name1").text(doctorData.name);
    $("#doctor-specialization").text(doctorData.specialization);
  }

  // Make sure the slots container has an ID
  // Assuming the original container is the div with class "grid grid-cols-2 sm:grid-cols-4 gap-2"
  $(".grid.grid-cols-2.sm\\:grid-cols-4.gap-2").attr(
    "id",
    "availability-slots-container"
  );

  // Initialize UI
  initializeDatePicker();
  loadDashboardStats();

  /**
   * DASHBOARD STATS SECTION
   */
  function loadDashboardStats() {
    $.ajax({
      url: `${window.appConfig.API_BASE_URL}/doctor/appointment-stat`,
      method: "GET",
      headers: { Authorization: `Bearer ${doctorToken}` },
      success: function (response) {
        updateDashboardCards(response);
      },
      error: function (xhr) {
        console.error(
          "Failed to load statistics:",
          xhr.responseJSON?.message || xhr.statusText
        );
        displayToast("Failed to load appointment statistics", "error");
      },
    });
  }

  function updateDashboardCards(data) {
    const cards = $(".grid.grid-cols-1.md\\:grid-cols-3.gap-4 > div");
    $(cards[0])
      .find(".text-2xl")
      .text(data.totalAppointments || 0);
    $(cards[1])
      .find(".text-2xl")
      .text(data.completedAppointments || 0);
    $(cards[2])
      .find(".text-2xl")
      .text(data.cancelledAppointments || 0);
  }

  /**
   * DATE PICKER SECTION
   */
  function initializeDatePicker() {
    // Set initial date
    $('input[type="date"]').val(selectedDate);
    $("#selectedDateDisplay").text(formatDisplayDate(selectedDate));

    // Load slots for initial date
    fetchAvailabilitySlots(selectedDate);

    // Set up event listeners
    $('input[type="date"]').change(function () {
      selectedDate = $(this).val();
      $("#selectedDateDisplay").text(formatDisplayDate(selectedDate));
      fetchAvailabilitySlots(selectedDate);
    });

    $('button:contains("Today")').click(function () {
      selectedDate = new Date().toISOString().split("T")[0];
      $('input[type="date"]').val(selectedDate);
      $("#selectedDateDisplay").text(formatDisplayDate(selectedDate));
      fetchAvailabilitySlots(selectedDate);
    });
  }

  /**
   * SLOT MANAGEMENT SECTION - COMPLETELY REDESIGNED
   */

  // Fetch slots from API
  function fetchAvailabilitySlots(date) {
    // Show loading state
    const slotsContainer = $("#availability-slots-container");
    slotsContainer.html(`
      <div class="col-span-4 text-center py-6">
        <div class="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
        <p class="mt-2">Loading slots...</p>
      </div>
    `);

    // API call
    $.ajax({
      url: `${window.appConfig.API_BASE_URL}/doctor/get-availability`,
      method: "GET",
      data: { doctorId, date },
      headers: { Authorization: `Bearer ${doctorToken}` },
      success: function (response) {
        currentSlots = response.slots || [];
        displaySlots();
      },
      error: function (xhr) {
        console.error(
          "Error loading slots:",
          xhr.responseJSON?.message || xhr.statusText
        );
        currentSlots = [];
        displaySlots();
        displayToast("Failed to load availability slots", "error");
      },
    });
  }

  // Display slots UI
  function displaySlots() {
    // Use a specific ID for the slots container instead of a generic class selector
    const slotsContainer = $("#availability-slots-container");
    slotsContainer.empty();

    // Show empty state if no slots
    if (currentSlots.length === 0) {
      slotsContainer.html(`
        <div class="col-span-4 text-center py-8 text-gray-500">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p class="mt-2 text-base">No availability slots for this date</p>
        </div>
      `);
      return;
    }

    // Sort slots
    currentSlots.sort();

    // Add a master delete mode checkbox
    slotsContainer.append(`
      <div class="col-span-4 mb-4 flex justify-between items-center">
        <div class="flex items-center">
          <input type="checkbox" id="edit-mode-toggle" class="mr-2">
          <label for="edit-mode-toggle">Toggle Edit Mode</label>
        </div>
        <button id="save-changes-btn" class="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded text-sm hidden">
          Save Changes
        </button>
      </div>
    `);

    // Create a slot container
    const slotsList = $(
      '<div class="col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-2"></div>'
    );
    slotsContainer.append(slotsList);

    // Add each slot
    currentSlots.forEach((slot) => {
      slotsList.append(`
        <div class="slot-item" data-slot="${slot}">
          <div class="bg-[#405570] hover:bg-blue-700 text-white text-sm py-2 px-3 rounded relative group">
            <span class="slot-time">${formatSlotTime(slot)}</span>
            <input type="checkbox" class="slot-checkbox absolute top-2 right-2 opacity-0 pointer-events-none">
          </div>
        </div>
      `);
    });

    // Set up edit mode toggle behavior
    $("#edit-mode-toggle").change(function () {
      const isEditMode = $(this).is(":checked");
      if (isEditMode) {
        $(".slot-item").addClass("edit-mode");
        $(".slot-checkbox").removeClass("opacity-0 pointer-events-none");
        $("#save-changes-btn").removeClass("hidden");
      } else {
        $(".slot-item").removeClass("edit-mode");
        $(".slot-checkbox")
          .addClass("opacity-0 pointer-events-none")
          .prop("checked", false);
        $("#save-changes-btn").addClass("hidden");
      }
    });

    // Make entire slot clickable in edit mode
    // Handle slot clicking in edit mode (event delegation)
    $(document).on(
      "click",
      "#availability-slots-container .slot-item.edit-mode .bg-\\[\\#405570\\]",
      function () {
        const checkbox = $(this).find(".slot-checkbox");
        checkbox.prop("checked", !checkbox.prop("checked"));
      }
    );

    // Save changes button handler
    $("#save-changes-btn").click(function () {
      const slotsToDelete = [];

      // Collect all checked slots
      $(".slot-checkbox:checked").each(function () {
        const slotValue = $(this).closest(".slot-item").data("slot");
        slotsToDelete.push(slotValue);
      });

      if (slotsToDelete.length === 0) {
        displayToast("No slots selected for deletion", "info");
        return;
      }

      // Confirm before deletion
      if (confirm(`Delete ${slotsToDelete.length} selected slot(s)?`)) {
        saveSlotChanges(slotsToDelete);
      }
    });
  }

  // Handle saving slot changes
  function saveSlotChanges(slotsToDelete) {
    // Show loading state
    $("#save-changes-btn").prop("disabled", true).text("Saving...");

    // Calculate remaining slots
    const remainingSlots = currentSlots.filter(
      (slot) => !slotsToDelete.includes(slot)
    );

    // Call API with direct PUT/POST request
    $.ajax({
      url: `${window.appConfig.API_BASE_URL}/doctor/update-availability`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${doctorToken}`,
        "Content-Type": "application/json",
      },
      data: JSON.stringify({
        doctorId,
        date: selectedDate,
        slots: remainingSlots,
      }),
      success: function () {
        // Update current slots and refresh display
        currentSlots = remainingSlots;

        // Exit edit mode
        $("#edit-mode-toggle").prop("checked", false).trigger("change");

        // Show success message and refresh the display
        displayToast(
          `Successfully deleted ${slotsToDelete.length} slot(s)`,
          "success"
        );
        displaySlots();
      },
      error: function (xhr) {
        console.error(
          "Failed to update slots:",
          xhr.responseJSON?.message || xhr.statusText
        );
        displayToast("Failed to update availability slots", "error");
        $("#save-changes-btn").prop("disabled", false).text("Save Changes");
      },
    });
  }

  /**
   * HELPER FUNCTIONS
   */
  function formatDisplayDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  function formatSlotTime(slot) {
    return slot.replace(
      /(\d{2})(\d{2})-(\d{2})(\d{2})/,
      (_, h1, m1, h2, m2) => `${h1}:${m1} - ${h2}:${m2}`
    );
  }

  function displayToast(message, type = "info") {
    // Create toast container if it doesn't exist
    if ($("#toast-container").length === 0) {
      $("body").append(
        '<div id="toast-container" class="fixed bottom-4 right-4 z-50"></div>'
      );
    }

    // Determine toast color
    const bgColor =
      {
        success: "bg-green-500",
        error: "bg-red-500",
        info: "bg-blue-500",
        warning: "bg-yellow-500",
      }[type] || "bg-blue-500";

    // Create toast
    const toastId = `toast-${Date.now()}`;
    const toast = $(`
      <div id="${toastId}" class="${bgColor} text-white rounded px-4 py-3 mb-3 shadow-lg flex items-center justify-between"
           style="min-width: 280px; transform: translateX(400px); opacity: 0; transition: all 0.3s ease-out;">
        <span>${message}</span>
        <button class="ml-4 text-white hover:text-gray-200 font-bold">×</button>
      </div>
    `);

    // Add to container
    $("#toast-container").append(toast);

    // Animate in
    setTimeout(() => {
      $(`#${toastId}`).css({
        transform: "translateX(0)",
        opacity: 1,
      });
    }, 10);

    // Set up dismissal
    $(`#${toastId} button`).click(function () {
      dismissToast(toastId);
    });

    // Auto dismiss
    setTimeout(() => {
      dismissToast(toastId);
    }, 5000);
  }

  function dismissToast(toastId) {
    const toast = $(`#${toastId}`);
    if (toast.length) {
      toast.css({
        transform: "translateX(400px)",
        opacity: 0,
      });
      setTimeout(() => {
        toast.remove();
      }, 300);
    }
  }

  // Styles moved to the top of the document
});
