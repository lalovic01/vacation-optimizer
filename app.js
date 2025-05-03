document.addEventListener("DOMContentLoaded", () => {
  const currentYear = new Date().getFullYear();
  document.getElementById("current-year").textContent = currentYear;

  const calendarContainer = document.getElementById("calendar-container");
  const vacationDaysInput = document.getElementById("vacation-days-input");
  const suggestButton = document.getElementById("suggest-button");
  const suggestionsList = document.getElementById("suggestions-list");
  const remainingDaysSpan = document.getElementById("remaining-days");

  const dayNames = ["Pon", "Uto", "Sre", "Čet", "Pet", "Sub", "Ned"];
  const monthNames = [
    "Januar",
    "Februar",
    "Mart",
    "April",
    "Maj",
    "Jun",
    "Jul",
    "Avgust",
    "Septembar",
    "Oktobar",
    "Novembar",
    "Decembar",
  ];

  let publicHolidays = [];
  let totalVacationDays = 0;
  let selectedVacationDates = new Set();

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const loadFromLocalStorage = () => {
    const savedDays = localStorage.getItem("totalVacationDays");
    if (savedDays) {
      vacationDaysInput.value = savedDays;
      totalVacationDays = parseInt(savedDays, 10);
    } else {
      totalVacationDays = parseInt(vacationDaysInput.value, 10);
    }

    const savedSelection = localStorage.getItem("selectedVacationDates");
    if (savedSelection) {
      selectedVacationDates = new Set(JSON.parse(savedSelection));
    }
    updateRemainingDays();
  };

  const saveToLocalStorage = () => {
    localStorage.setItem("totalVacationDays", totalVacationDays.toString());
    localStorage.setItem(
      "selectedVacationDates",
      JSON.stringify(Array.from(selectedVacationDates))
    );
  };

  const updateRemainingDays = () => {
    const usedDays = Array.from(selectedVacationDates).filter((dateStr) => {
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 6 || dayOfWeek === 0;
      const isHoliday = publicHolidays.some((h) => h.date === dateStr);
      return !isWeekend && !isHoliday;
    }).length;
    remainingDaysSpan.textContent = totalVacationDays - usedDays;
  };

  const fetchHolidays = async (year) => {
    try {
      const response = await fetch(
        `https://date.nager.at/api/v3/PublicHolidays/${year}/RS`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const holidays = await response.json();
      publicHolidays = holidays.map((h) => ({
        date: h.date,
        name: h.localName,
      }));
    } catch (error) {
      console.error("Failed to fetch public holidays:", error);
      calendarContainer.innerHTML =
        "<p>Greška pri učitavanju praznika. Molimo pokušajte ponovo kasnije.</p>";
    }
  };

  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 6 || day === 0;
  };

  const isHoliday = (dateStr) => {
    return publicHolidays.some((h) => h.date === dateStr);
  };

  const renderCalendar = () => {
    calendarContainer.innerHTML = "";
    for (let month = 0; month < 12; month++) {
      const monthDiv = document.createElement("div");
      monthDiv.classList.add("month");

      const monthHeader = document.createElement("div");
      monthHeader.classList.add("month-header");
      monthHeader.textContent = monthNames[month];
      monthDiv.appendChild(monthHeader);

      const daysGrid = document.createElement("div");
      daysGrid.classList.add("days-grid");

      dayNames.forEach((name) => {
        const dayNameDiv = document.createElement("div");
        dayNameDiv.classList.add("day-name");
        dayNameDiv.textContent = name;
        daysGrid.appendChild(dayNameDiv);
      });

      const date = new Date(currentYear, month, 1);
      const firstDayOfMonth = (date.getDay() + 6) % 7;
      const daysInMonth = new Date(currentYear, month + 1, 0).getDate();

      for (let i = 0; i < firstDayOfMonth; i++) {
        const emptyDay = document.createElement("div");
        emptyDay.classList.add("day", "empty");
        daysGrid.appendChild(emptyDay);
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement("div");
        dayDiv.classList.add("day");
        dayDiv.textContent = day;
        const currentDate = new Date(currentYear, month, day);
        const dateStr = formatDate(currentDate);
        dayDiv.dataset.date = dateStr;

        if (isWeekend(currentDate)) dayDiv.classList.add("weekend");
        if (isHoliday(dateStr)) dayDiv.classList.add("holiday");
        if (selectedVacationDates.has(dateStr))
          dayDiv.classList.add("vacation");

        if (!isWeekend(currentDate) && !isHoliday(dateStr)) {
          dayDiv.classList.add("selectable");
          dayDiv.addEventListener("click", () =>
            toggleVacationDay(dateStr, dayDiv)
          );
        } else if (isHoliday(dateStr)) {
          dayDiv.title =
            publicHolidays.find((h) => h.date === dateStr)?.name || "Praznik";
        }

        daysGrid.appendChild(dayDiv);
      }
      monthDiv.appendChild(daysGrid);
      calendarContainer.appendChild(monthDiv);
    }
    updateRemainingDays();
  };

  const toggleVacationDay = (dateStr, dayDiv) => {
    const date = new Date(dateStr);
    const isWorkDay = !isWeekend(date) && !isHoliday(dateStr);
    const usedDays = Array.from(selectedVacationDates).filter((d) => {
      const dt = new Date(d);
      return !isWeekend(dt) && !isHoliday(d);
    }).length;

    if (selectedVacationDates.has(dateStr)) {
      selectedVacationDates.delete(dateStr);
      dayDiv.classList.remove("vacation");
    } else {
      if (isWorkDay && usedDays >= totalVacationDays) {
        alert("Nemate dovoljno preostalih dana godišnjeg odmora.");
        return;
      }
      selectedVacationDates.add(dateStr);
      dayDiv.classList.add("vacation");
    }
    updateRemainingDays();
    saveToLocalStorage();
  };

  const getSuggestions = () => {
    suggestionsList.innerHTML = "";
    const availableDaysTotal = parseInt(vacationDaysInput.value, 10);

    const manuallyUsedWorkDays = Array.from(selectedVacationDates).filter(
      (d) => {
        const dt = new Date(d);
        return !isWeekend(dt) && !isHoliday(d);
      }
    ).length;

    const remainingAvailableDays = availableDaysTotal - manuallyUsedWorkDays;

    if (isNaN(availableDaysTotal) || availableDaysTotal <= 0) {
      suggestionsList.innerHTML = "<li>Unesite validan broj dana odmora.</li>";
      return;
    }
    if (remainingAvailableDays <= 0 && availableDaysTotal > 0) {
      suggestionsList.innerHTML =
        "<li>Već ste iskoristili sve dostupne dane odmora.</li>";
      return;
    }
    if (remainingAvailableDays <= 0) {
      suggestionsList.innerHTML =
        "<li>Nemate dostupnih dana za generisanje predloga.</li>";
      return;
    }

    const potentialPeriods = [];
    const allDates = [];
    for (let month = 0; month < 12; month++) {
      const daysInMonth = new Date(currentYear, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        allDates.push(new Date(currentYear, month, day));
      }
    }

    const freeDaysMap = new Map();
    allDates.forEach((date) => {
      const dateStr = formatDate(date);
      freeDaysMap.set(dateStr, {
        isWeekend: isWeekend(date),
        isHoliday: isHoliday(dateStr),
      });
    });

    for (let i = 0; i < allDates.length; i++) {
      let currentVacationDays = 0;
      let consecutiveFreeDays = 0;
      let periodDates = [];
      let vacationDatesInPeriod = [];
      let overlapsManualSelection = false;

      for (let j = i; j < allDates.length; j++) {
        const currentDate = allDates[j];
        const currentDateStr = formatDate(currentDate);

        if (selectedVacationDates.has(currentDateStr)) {
          overlapsManualSelection = true;
          break;
        }

        const dayInfo = freeDaysMap.get(currentDateStr);
        const isFree = dayInfo.isWeekend || dayInfo.isHoliday;

        if (isFree) {
          consecutiveFreeDays++;
          periodDates.push(currentDateStr);
        } else {
          if (currentVacationDays < remainingAvailableDays) {
            currentVacationDays++;
            consecutiveFreeDays++;
            periodDates.push(currentDateStr);
            vacationDatesInPeriod.push(currentDateStr);
          } else {
            break;
          }
        }

        if (
          currentVacationDays > 0 &&
          currentVacationDays <= remainingAvailableDays
        ) {
          const efficiency = consecutiveFreeDays / currentVacationDays;
          const exists = potentialPeriods.some(
            (p) =>
              p.start === periodDates[0] &&
              p.end === periodDates[periodDates.length - 1] &&
              p.vacationDaysNeeded === currentVacationDays
          );

          if (!exists) {
            let holidaysInPeriod = 0;
            let weekendsInPeriod = 0;
            periodDates.forEach((dStr) => {
              const dInfo = freeDaysMap.get(dStr);
              if (!vacationDatesInPeriod.includes(dStr)) {
                if (dInfo.isHoliday) holidaysInPeriod++;
                if (dInfo.isWeekend) weekendsInPeriod++;
              }
            });

            potentialPeriods.push({
              start: periodDates[0],
              end: periodDates[periodDates.length - 1],
              vacationDaysNeeded: currentVacationDays,
              totalFreeDaysInPeriod: consecutiveFreeDays,
              holidays: holidaysInPeriod,
              weekends: weekendsInPeriod,
              efficiency: efficiency,
              vacationDates: [...vacationDatesInPeriod],
            });
          }
        }
      }
      if (overlapsManualSelection) {
      }
    }
    const generatedPlans = [];

    const generatePlan = (periods, daysLimit, sortFn) => {
      const sortedPeriods = [...periods].sort(sortFn);
      const planDates = new Set();
      let daysUsed = 0;

      for (const period of sortedPeriods) {
        if (daysUsed >= daysLimit) break;

        const periodOverlaps = period.vacationDates.some((d) =>
          selectedVacationDates.has(d)
        );
        if (periodOverlaps) continue;

        const newVacationDays = period.vacationDates;
        const cost = newVacationDays.length;

        if (cost > 0 && daysUsed + cost <= daysLimit) {
          const alreadyAddedInPlan = newVacationDays.some((d) =>
            planDates.has(d)
          );
          if (!alreadyAddedInPlan) {
            newVacationDays.forEach((d) => planDates.add(d));
            daysUsed += cost;
          }
        }
      }
      return planDates;
    };

    const plan1 = generatePlan(
      potentialPeriods,
      remainingAvailableDays,
      (a, b) =>
        b.efficiency - a.efficiency ||
        b.totalFreeDaysInPeriod - a.totalFreeDaysInPeriod
    );
    if (plan1.size > 0)
      generatedPlans.push({ name: "Plan Efikasnosti", dates: plan1 });

    const plan2 = generatePlan(
      potentialPeriods,
      remainingAvailableDays,
      (a, b) =>
        b.totalFreeDaysInPeriod - a.totalFreeDaysInPeriod ||
        b.efficiency - a.efficiency
    );
    if (
      plan2.size > 0 &&
      JSON.stringify([...plan1].sort()) !== JSON.stringify([...plan2].sort())
    ) {
      generatedPlans.push({ name: "Plan Max Slobodnih Dana", dates: plan2 });
    }

    const plan3 = generatePlan(
      potentialPeriods,
      remainingAvailableDays,
      (a, b) =>
        a.vacationDaysNeeded - b.vacationDaysNeeded ||
        b.efficiency - a.efficiency
    );
    const plan1SortedJSON = JSON.stringify([...plan1].sort());
    const plan2ExistsAndDifferent = generatedPlans.some(
      (p) => p.name === "Plan Max Slobodnih Dana"
    );
    const plan2SortedJSON = plan2ExistsAndDifferent
      ? JSON.stringify([...plan2].sort())
      : null;
    const plan3SortedJSON = JSON.stringify([...plan3].sort());

    if (
      plan3.size > 0 &&
      plan3SortedJSON !== plan1SortedJSON &&
      (!plan2SortedJSON || plan3SortedJSON !== plan2SortedJSON)
    ) {
      generatedPlans.push({ name: "Plan Kraćih Odmora", dates: plan3 });
    }

    if (generatedPlans.length === 0) {
      suggestionsList.innerHTML =
        "<li>Nije moguće generisati planove za preostale dane odmora.</li>";
      return;
    }

    generatedPlans.forEach((plan) => {
      const li = document.createElement("li");
      const planDatesArray = Array.from(plan.dates);
      const usedDaysInPlan = planDatesArray.length;

      let totalAchievedFreeDays = 0;
      let uniqueFreeDaysAdded = new Set([...planDatesArray]);

      planDatesArray.forEach((planDateStr) => {
        [-1, 1].forEach((offset) => {
          let adjacentDate = new Date(planDateStr);
          adjacentDate.setDate(adjacentDate.getDate() + offset);
          let checkDate = adjacentDate;

          while (true) {
            const checkDateStr = formatDate(checkDate);
            const dayInfo = freeDaysMap.get(checkDateStr);
            if (
              dayInfo &&
              (dayInfo.isWeekend || dayInfo.isHoliday) &&
              !plan.dates.has(checkDateStr)
            ) {
              uniqueFreeDaysAdded.add(checkDateStr);
              checkDate.setDate(checkDate.getDate() + offset);
            } else {
              break;
            }
          }
        });
      });
      totalAchievedFreeDays = uniqueFreeDaysAdded.size;

      li.textContent = `${plan.name}: ${usedDaysInPlan} dana odmora -> ${totalAchievedFreeDays} ukupno spojenih slobodnih dana.`;
      li.style.cursor = "pointer";
      li.dataset.planDates = JSON.stringify(planDatesArray);

      const arePlanDatesSelected =
        planDatesArray.length > 0 &&
        planDatesArray.every((date) => selectedVacationDates.has(date));
      if (arePlanDatesSelected) {
        li.classList.add("selected-suggestion");
      }

      li.addEventListener("click", () =>
        togglePlanSelection(planDatesArray, li)
      );
      suggestionsList.appendChild(li);
    });
  };

  const togglePlanSelection = (planDatesArray, listItemElement) => {
    const isCurrentlySelected = listItemElement.classList.contains(
      "selected-suggestion"
    );

    if (isCurrentlySelected) {
      listItemElement.classList.remove("selected-suggestion");
      planDatesArray.forEach((dateStr) => {
        selectedVacationDates.delete(dateStr);
      });
    } else {
      const newWorkdaysToAdd = planDatesArray.length;
      const currentTotalUsedWorkdays = Array.from(selectedVacationDates).filter(
        (d) => {
          const dt = new Date(d);
          return !isWeekend(dt) && !isHoliday(d);
        }
      ).length;

      if (currentTotalUsedWorkdays + newWorkdaysToAdd > totalVacationDays) {
        alert(
          `Dodavanjem ovog plana biste prekoračili ukupan broj dana odmora. Preostalo: ${
            totalVacationDays - currentTotalUsedWorkdays
          }, Potrebno za ovaj plan: ${newWorkdaysToAdd}`
        );
        return;
      }

      planDatesArray.forEach((dateStr) => {
        selectedVacationDates.add(dateStr);
      });

      listItemElement.classList.add("selected-suggestion");
    }

    renderCalendar();
    saveToLocalStorage();
    updateRemainingDays();
  };

  vacationDaysInput.addEventListener("change", (e) => {
    totalVacationDays = parseInt(e.target.value, 10) || 0;
    updateRemainingDays();
    saveToLocalStorage();
    suggestionsList.innerHTML = "";
  });

  suggestButton.addEventListener("click", getSuggestions);

  const initializeApp = async () => {
    loadFromLocalStorage();
    await fetchHolidays(currentYear);
    renderCalendar();
  };

  initializeApp();
});
