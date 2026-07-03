document.addEventListener("DOMContentLoaded", () => {
  const currentYear = new Date().getFullYear();

  const calendarContainer = document.getElementById("calendar-container");
  const vacationDaysInput = document.getElementById("vacation-days-input");
  const suggestButton = document.getElementById("suggest-button");
  const suggestionsList = document.getElementById("suggestions-list");
  const remainingDaysSpan = document.getElementById("remaining-days");
  const currentYearSpan = document.getElementById("current-year");
  const pageTitleText = document.getElementById("page-title-text");
  const languageToggle = document.getElementById("language-toggle");
  const controlsLabel = document.getElementById("vacation-days-label");
  const suggestionsHeading = document.getElementById("suggestions-heading");
  const remainingLabel = document.getElementById("remaining-label");
  const legendWeekendLabel = document.getElementById("legend-weekend-label");
  const legendHolidayLabel = document.getElementById("legend-holiday-label");
  const legendVacationLabel = document.getElementById("legend-vacation-label");

  const translations = {
    sr: {
      title: "Optimizator Godišnjeg Odmora",
      controlsLabel: "Unesite broj dana godišnjeg odmora:",
      suggestButton: "Prikaži Predloge",
      remainingLabel: "Preostalo dana:",
      suggestionsHeading: "Predlozi:",
      legendWeekend: "Vikend",
      legendHoliday: "Praznik",
      legendVacation: "Godišnji odmor",
      languageToggle: "English",
      errorHolidayLoad:
        "Greška pri učitavanju praznika. Molimo pokušajte ponovo kasnije.",
      invalidVacationDays: "Unesite validan broj dana odmora.",
      noDaysUsed: "Već ste iskoristili sve dostupne dane odmora.",
      noDaysAvailable: "Nemate dostupnih dana za generisanje predloga.",
      noPlans: "Nije moguće generisati planove za preostale dane odmora.",
      alertNotEnoughDays:
        "Nemate dovoljno preostalih dana godišnjeg odmora.",
      alertOverLimit:
        "Dodavanjem ovog plana biste prekoračili ukupan broj dana odmora. Preostalo: {remaining}, Potrebno za ovaj plan: {needed}",
      planEfficiency: "Plan Efikasnosti",
      planMaxFreeDays: "Plan Max Slobodnih Dana",
      planShorterVacations: "Plan Kraćih Odmora",
      previewPlan: "Pregled",
      applyPlan: "Primeni",
      dismissPlan: "Odbaci",
      vacationDaysWord: "dana odmora",
      totalConnectedDays: "ukupno spojenih slobodnih dana",
      holidayWord: "Praznik",
    },
    en: {
      title: "Vacation Optimizer",
      controlsLabel: "Enter the number of vacation days:",
      suggestButton: "Show Suggestions",
      remainingLabel: "Days remaining:",
      suggestionsHeading: "Suggestions:",
      legendWeekend: "Weekend",
      legendHoliday: "Holiday",
      legendVacation: "Vacation",
      languageToggle: "Srpski",
      errorHolidayLoad:
        "There was an error loading public holidays. Please try again later.",
      invalidVacationDays: "Enter a valid number of vacation days.",
      noDaysUsed: "You have already used all available vacation days.",
      noDaysAvailable: "You do not have any days available for suggestions.",
      noPlans: "It is not possible to generate plans for the remaining vacation days.",
      alertNotEnoughDays:
        "You do not have enough remaining vacation days.",
      alertOverLimit:
        "Adding this plan would exceed your total vacation days. Remaining: {remaining}, Needed for this plan: {needed}",
      planEfficiency: "Efficiency Plan",
      planMaxFreeDays: "Maximum Free Days Plan",
      planShorterVacations: "Short Vacation Plan",
      previewPlan: "Preview",
      applyPlan: "Apply",
      dismissPlan: "Dismiss",
      vacationDaysWord: "vacation days",
      totalConnectedDays: "total connected free days",
      holidayWord: "Holiday",
    },
  };

  const dayNamesByLanguage = {
    sr: ["Pon", "Uto", "Sre", "Čet", "Pet", "Sub", "Ned"],
    en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  };

  const monthNamesByLanguage = {
    sr: [
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
    ],
    en: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
  };

  let publicHolidays = [];
  let totalVacationDays = 0;
  let selectedVacationDates = new Set();
  let previewVacationDates = new Set();
  let currentLanguage = translations[localStorage.getItem("language")]
    ? localStorage.getItem("language")
    : "sr";

  const getText = (key, language = currentLanguage) =>
    translations[language]?.[key] || translations.sr[key];

  const translate = (key, params = {}) => {
    let text = getText(key) || key;
    Object.keys(params).forEach((paramKey) => {
      text = text.replaceAll(`{${paramKey}}`, params[paramKey]);
    });
    return text;
  };

  const getDayNames = () => dayNamesByLanguage[currentLanguage];
  const getMonthNames = () => monthNamesByLanguage[currentLanguage];

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const countUsedVacationWorkdays = () =>
    Array.from(selectedVacationDates).filter((dateStr) => {
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 6 || dayOfWeek === 0;
      const isHoliday = publicHolidays.some((holiday) => holiday.date === dateStr);
      return !isWeekend && !isHoliday;
    }).length;

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
  };

  const saveToLocalStorage = () => {
    localStorage.setItem("totalVacationDays", totalVacationDays.toString());
    localStorage.setItem(
      "selectedVacationDates",
      JSON.stringify(Array.from(selectedVacationDates))
    );
    localStorage.setItem("language", currentLanguage);
  };

  const updateRemainingDays = () => {
    const usedDays = countUsedVacationWorkdays();
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
      publicHolidays = holidays.map((holiday) => ({
        date: holiday.date,
        name: holiday.localName,
      }));
    } catch (error) {
      console.error("Failed to fetch public holidays:", error);
      calendarContainer.innerHTML = `<p>${translate("errorHolidayLoad")}</p>`;
    }
  };

  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 6 || day === 0;
  };

  const isHoliday = (dateStr) =>
    publicHolidays.some((holiday) => holiday.date === dateStr);

  const clearPreview = () => {
    previewVacationDates = new Set();
  };

  const setPreviewPlan = (planDatesArray) => {
    previewVacationDates = new Set(planDatesArray);
    renderCalendar();
  };

  const updateStaticText = () => {
    const texts = translations[currentLanguage];
    document.documentElement.lang = currentLanguage;
    document.title = texts.title;
    pageTitleText.textContent = texts.title;
    currentYearSpan.textContent = currentYear;
    controlsLabel.textContent = texts.controlsLabel;
    suggestButton.textContent = texts.suggestButton;
    remainingLabel.textContent = texts.remainingLabel;
    suggestionsHeading.textContent = texts.suggestionsHeading;
    legendWeekendLabel.textContent = texts.legendWeekend;
    legendHolidayLabel.textContent = texts.legendHoliday;
    legendVacationLabel.textContent = texts.legendVacation;
    languageToggle.textContent = texts.languageToggle;
  };

  const renderCalendar = () => {
    calendarContainer.innerHTML = "";
    const monthNames = getMonthNames();
    const dayNames = getDayNames();

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
        if (selectedVacationDates.has(dateStr)) dayDiv.classList.add("vacation");
        if (
          previewVacationDates.has(dateStr) &&
          !selectedVacationDates.has(dateStr)
        ) {
          dayDiv.classList.add("preview-vacation");
        }

        if (!isWeekend(currentDate) && !isHoliday(dateStr)) {
          dayDiv.classList.add("selectable");
          dayDiv.addEventListener("click", () => toggleVacationDay(dateStr, dayDiv));
        } else if (isHoliday(dateStr)) {
          dayDiv.title =
            publicHolidays.find((holiday) => holiday.date === dateStr)?.name ||
            translate("holidayWord");
        }

        daysGrid.appendChild(dayDiv);
      }

      monthDiv.appendChild(daysGrid);
      calendarContainer.appendChild(monthDiv);
    }

    updateRemainingDays();
  };

  const getSuggestions = () => {
    suggestionsList.innerHTML = "";
    const availableDaysTotal = parseInt(vacationDaysInput.value, 10);

    const manuallyUsedWorkDays = countUsedVacationWorkdays();
    const remainingAvailableDays = availableDaysTotal - manuallyUsedWorkDays;

    if (isNaN(availableDaysTotal) || availableDaysTotal <= 0) {
      suggestionsList.innerHTML = `<li>${translate("invalidVacationDays")}</li>`;
      return;
    }

    if (remainingAvailableDays <= 0 && availableDaysTotal > 0) {
      suggestionsList.innerHTML = `<li>${translate("noDaysUsed")}</li>`;
      return;
    }

    if (remainingAvailableDays <= 0) {
      suggestionsList.innerHTML = `<li>${translate("noDaysAvailable")}</li>`;
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
      const periodDates = [];
      const vacationDatesInPeriod = [];
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
            (period) =>
              period.start === periodDates[0] &&
              period.end === periodDates[periodDates.length - 1] &&
              period.vacationDaysNeeded === currentVacationDays
          );

          if (!exists) {
            let holidaysInPeriod = 0;
            let weekendsInPeriod = 0;

            periodDates.forEach((dateString) => {
              const dayInfoForDate = freeDaysMap.get(dateString);
              if (!vacationDatesInPeriod.includes(dateString)) {
                if (dayInfoForDate.isHoliday) holidaysInPeriod++;
                if (dayInfoForDate.isWeekend) weekendsInPeriod++;
              }
            });

            potentialPeriods.push({
              start: periodDates[0],
              end: periodDates[periodDates.length - 1],
              vacationDaysNeeded: currentVacationDays,
              totalFreeDaysInPeriod: consecutiveFreeDays,
              holidays: holidaysInPeriod,
              weekends: weekendsInPeriod,
              efficiency,
              vacationDates: [...vacationDatesInPeriod],
            });
          }
        }
      }

      if (overlapsManualSelection) {
        continue;
      }
    }

    const generatedPlans = [];

    const generatePlan = (periods, daysLimit, sortFn) => {
      const sortedPeriods = [...periods].sort(sortFn);
      const planDates = new Set();
      let daysUsed = 0;

      for (const period of sortedPeriods) {
        if (daysUsed >= daysLimit) break;

        const periodOverlaps = period.vacationDates.some((dateStr) =>
          selectedVacationDates.has(dateStr)
        );
        if (periodOverlaps) continue;

        const newVacationDays = period.vacationDates;
        const cost = newVacationDays.length;

        if (cost > 0 && daysUsed + cost <= daysLimit) {
          const alreadyAddedInPlan = newVacationDays.some((dateStr) =>
            planDates.has(dateStr)
          );
          if (!alreadyAddedInPlan) {
            newVacationDays.forEach((dateStr) => planDates.add(dateStr));
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
    if (plan1.size > 0) {
      generatedPlans.push({ name: translate("planEfficiency"), dates: plan1 });
    }

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
      generatedPlans.push({
        name: translate("planMaxFreeDays"),
        dates: plan2,
      });
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
      (plan) => plan.name === translate("planMaxFreeDays")
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
      generatedPlans.push({
        name: translate("planShorterVacations"),
        dates: plan3,
      });
    }

    if (generatedPlans.length === 0) {
      suggestionsList.innerHTML = `<li>${translate("noPlans")}</li>`;
      return;
    }

    generatedPlans.forEach((plan) => {
      const li = document.createElement("li");
      const planRow = document.createElement("div");
      planRow.classList.add("suggestion-row");

      const planText = document.createElement("span");
      const planDatesArray = Array.from(plan.dates);
      const usedDaysInPlan = planDatesArray.length;
      const uniqueFreeDaysAdded = new Set([...planDatesArray]);

      planDatesArray.forEach((planDateStr) => {
        [-1, 1].forEach((offset) => {
          const adjacentDate = new Date(planDateStr);
          adjacentDate.setDate(adjacentDate.getDate() + offset);
          const checkDate = adjacentDate;

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

      const totalAchievedFreeDays = uniqueFreeDaysAdded.size;
      planText.textContent = `${plan.name}: ${usedDaysInPlan} ${translate(
        "vacationDaysWord"
      )} -> ${totalAchievedFreeDays} ${translate("totalConnectedDays")}.`;
      li.dataset.planDates = JSON.stringify(planDatesArray);

      const actions = document.createElement("div");
      actions.classList.add("suggestion-actions");

      const previewButton = document.createElement("button");
      previewButton.type = "button";
      previewButton.textContent = translate("previewPlan");

      const applyButton = document.createElement("button");
      applyButton.type = "button";
      applyButton.textContent = translate("applyPlan");

      const dismissButton = document.createElement("button");
      dismissButton.type = "button";
      dismissButton.textContent = translate("dismissPlan");

      planRow.addEventListener("click", () => {
        setPreviewPlan(planDatesArray);
      });

      previewButton.addEventListener("click", (event) => {
        event.stopPropagation();
        setPreviewPlan(planDatesArray);
      });

      applyButton.addEventListener("click", (event) => {
        event.stopPropagation();
        clearPreview();
        applyPlanSelection(planDatesArray, li);
      });

      dismissButton.addEventListener("click", (event) => {
        event.stopPropagation();
        clearPreview();
        renderCalendar();
      });

      actions.appendChild(previewButton);
      actions.appendChild(applyButton);
      actions.appendChild(dismissButton);

      planRow.appendChild(planText);
      planRow.appendChild(actions);

      const arePlanDatesSelected =
        planDatesArray.length > 0 &&
        planDatesArray.every((date) => selectedVacationDates.has(date));
      if (arePlanDatesSelected) {
        li.classList.add("selected-suggestion");
      }

      li.appendChild(planRow);
      suggestionsList.appendChild(li);
    });
  };

  const toggleVacationDay = (dateStr, dayDiv) => {
    clearPreview();
    const date = new Date(dateStr);
    const isWorkDay = !isWeekend(date) && !isHoliday(dateStr);
    const usedDays = countUsedVacationWorkdays();

    if (selectedVacationDates.has(dateStr)) {
      selectedVacationDates.delete(dateStr);
      dayDiv.classList.remove("vacation");
    } else {
      if (isWorkDay && usedDays >= totalVacationDays) {
        alert(translate("alertNotEnoughDays"));
        return;
      }
      selectedVacationDates.add(dateStr);
      dayDiv.classList.add("vacation");
    }

    updateRemainingDays();
    saveToLocalStorage();
    renderCalendar();

    if (suggestionsList.children.length > 0) {
      getSuggestions();
    }
  };

  const applyPlanSelection = (planDatesArray, listItemElement) => {
    const newWorkdaysToAdd = planDatesArray.length;
    const currentTotalUsedWorkdays = countUsedVacationWorkdays();

    if (currentTotalUsedWorkdays + newWorkdaysToAdd > totalVacationDays) {
      alert(
        translate("alertOverLimit", {
          remaining: totalVacationDays - currentTotalUsedWorkdays,
          needed: newWorkdaysToAdd,
        })
      );
      return;
    }

    planDatesArray.forEach((dateStr) => {
      selectedVacationDates.add(dateStr);
    });

    listItemElement.classList.add("selected-suggestion");

    renderCalendar();
    saveToLocalStorage();
    updateRemainingDays();

    if (suggestionsList.children.length > 0) {
      getSuggestions();
    }
  };

  const setLanguage = (language) => {
    currentLanguage = language;
    saveToLocalStorage();
    updateStaticText();
    renderCalendar();

    if (suggestionsList.children.length > 0) {
      getSuggestions();
    }
  };

  vacationDaysInput.addEventListener("change", (event) => {
    totalVacationDays = parseInt(event.target.value, 10) || 0;
    updateRemainingDays();
    saveToLocalStorage();
    suggestionsList.innerHTML = "";
  });

  suggestButton.addEventListener("click", getSuggestions);
  languageToggle.addEventListener("click", () => {
    setLanguage(currentLanguage === "sr" ? "en" : "sr");
  });

  const initializeApp = async () => {
    loadFromLocalStorage();
    updateStaticText();
    await fetchHolidays(currentYear);
    renderCalendar();
    updateRemainingDays();
  };

  initializeApp();
});