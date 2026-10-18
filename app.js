const appState = {
  lang: 'hi'
};

const { translations, events, venues, family, couple, familyLine } = invitationData;
const weddingEvent = events.find((event) => event.id === 'baraat-welcome');
const receptionEvent = events.find((event) => event.id === 'reception-dinner');

function formatDisplayDate(dateString, lang = appState.lang, options = {}) {
  const date = new Date(`${dateString}T12:00:00+05:30`);
  return new Intl.DateTimeFormat(lang === 'hi' ? 'hi-IN' : 'en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options
  }).format(date);
}

function getText(value, lang = appState.lang) {
  if (typeof value === 'string') return localizeDigits(value, lang);
  if (!value) return '';
  return localizeDigits(value[lang] || value.en || '', lang);
}

function localizeDigits(text, lang = appState.lang) {
  if (lang !== 'hi') return text;
  const digits = '०१२३४५६७८९';
  return text.replace(/https?:\/\/\S+|\bAM\b|\bPM\b|\d/g, (part) => {
    if (part.startsWith('http')) return part;
    if (part === 'AM') return 'पूर्वाह्न';
    if (part === 'PM') return 'अपराह्न';
    return digits[Number(part)];
  });
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function formatEventTime(time) {
  const [hour, minute] = time.split(':').map(Number);
  if (appState.lang === 'hi') {
    const period = hour < 12 ? 'प्रातः' : hour === 12 ? 'दोपहर' : hour < 17 ? 'अपराह्न' : hour < 21 ? 'सायंकाल' : 'रात्रि';
    const formatNumber = (value) => localizeDigits(String(value).padStart(2, '0'), 'hi');
    return `${period} ${formatNumber(hour % 12 || 12)}:${formatNumber(minute)} बजे`;
  }
  const suffix = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${suffix}`;
}

function formatEventRange(event) {
  const start = formatEventTime(event.start);
  if (event.end) return `${start}–${formatEventTime(event.end)}`;
  return appState.lang === 'hi' ? `${start} से आगे` : `${start} onwards`;
}

function safePhoneLink(number) {
  return 'tel:' + number.replace(/[^\d+]/g, '');
}

function directionsIcon() {
  return '<svg class="directions-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"></path><circle cx="12" cy="10" r="2.25"></circle></svg>';
}

function setLanguage(lang) {
  appState.lang = lang;

  document.documentElement.lang = lang;
  document.title = getText(translations[lang].pageTitle);
  document.querySelector('meta[name="description"]').setAttribute('content', getText(translations[lang].description));
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', getText(translations[lang].pageTitle));
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', getText(translations[lang].description));
  document.querySelector('meta[property="og:url"]')?.setAttribute('content', invitationData.siteUrl);
  document.querySelector('meta[property="og:image"]')?.setAttribute('content', `${invitationData.siteUrl}${invitationData.primaryHero}`);
  document.querySelector('meta[name="twitter:image"]')?.setAttribute('content', `${invitationData.siteUrl}${invitationData.primaryHero}`);
  const brand = document.querySelector('.brand');
  if (brand) {
    brand.textContent = getText(couple, lang);
    brand.setAttribute('aria-label', getText(couple, lang));
  }
  document.querySelector('.main-nav')?.setAttribute('aria-label', lang === 'hi' ? 'मुख्य नेविगेशन' : 'Main navigation');
  document.querySelectorAll('[aria-label="Invitation actions"], [aria-label="Wedding details"], [aria-label="Wedding invitation"]').forEach((element) => {
    element.setAttribute('aria-label', lang === 'hi' ? 'विवाह का निमंत्रण' : element.getAttribute('aria-label'));
  });

  const t = translations[lang];
  const textById = {
    introTag: t.introTag,
    introName: getText(couple, lang),
    introInvite: t.invitationLine,
    introDate: t.weddingMeta,
    eventDateLabel: t.eventDateLabel,
    ritualsLabel: t.ritualsLabel,
    receptionLabel: t.receptionLabel,
    venueLabel: t.venueLabel,
    scheduleTitle: t.scheduleHeading,
    venueTitle: t.venueHeading,
    familyTitle: t.familyHeading,
    familyLine: getText(familyLine, lang),
    shareTitle: t.shareHeading,
    downloadCalendarCaption: t.calendarDescription,
    downloadCalendarLabel: t.downloadCalendar,
    callActionLabel: t.call,
    contactDialogTitle: t.contactSheetTitle,
    contactDialogDescription: t.contactSheetAria,
    footerText: t.footerText
  };

  Object.entries(textById).forEach(([id, value]) => setText(id, localizeDigits(value, lang)));
  const closeContactsButton = document.getElementById('closeContacts');
  if (closeContactsButton) closeContactsButton.setAttribute('aria-label', localizeDigits(t.contactSheetClose, lang));
  document.querySelectorAll('[data-copy]').forEach((element) => {
    element.textContent = localizeDigits(t[element.dataset.copy], lang);
  });

  const calendarButton = document.getElementById('downloadCalendar');
  if (calendarButton) calendarButton.setAttribute('aria-label', localizeDigits(t.downloadCalendar, lang));
  const whatsappButton = document.getElementById('whatsappShare');
  if (whatsappButton) {
    whatsappButton.setAttribute('aria-label', localizeDigits(t.shareWhatsApp, lang));
    whatsappButton.setAttribute('title', localizeDigits(t.shareWhatsApp, lang));
  }
  const countdown = document.getElementById('countdown');
  if (countdown) countdown.setAttribute('aria-label', localizeDigits(t.countdownAria, lang));
  renderWeddingDetails(lang);
  renderFamilies(lang);
  renderSchedule(lang);
  renderVenues(lang);
  renderContacts(lang);
  renderWhatsAppText(lang);
  updateCountdown();
}

function renderFamilies(lang) {
  const familyContent = document.getElementById('familyGrid');
  if (!familyContent) return;

  familyContent.innerHTML = '';
  const groom = family[lang].groom;
  const bride = family[lang].bride;

  [groom, bride].forEach((section, index) => {
    const block = document.createElement('article');
    block.className = 'family-group';
    const label = document.createElement('p');
    label.className = 'family-role';
    label.textContent = section.label;
    const divider = document.createElement('span');
    divider.className = 'family-divider';
    divider.setAttribute('aria-hidden', 'true');
    const names = document.createElement('div');
    names.className = 'family-names';
    section.parents.forEach((person) => {
      const name = document.createElement('p');
      name.textContent = person;
      names.appendChild(name);
    });
    block.dataset.family = index === 0 ? 'groom' : 'bride';
    block.append(label, divider, names);
    familyContent.appendChild(block);
  });
}

function renderWeddingDetails(lang) {
  const weddingDate = document.getElementById('weddingDateDetail');
  const ritualsTime = document.getElementById('ritualsTimeDetail');
  const receptionTime = document.getElementById('receptionTimeDetail');
  const venueName = document.getElementById('weddingVenueDetail');
  const directions = document.getElementById('mainDirections');
  const hotel = venues[weddingEvent.venueId];

  if (weddingDate) {
    weddingDate.textContent = localizeDigits(formatDisplayDate(weddingEvent.date, lang, { weekday: 'long' }), lang);
  }
  if (ritualsTime) ritualsTime.textContent = formatEventRange(weddingEvent);
  if (receptionTime) receptionTime.textContent = formatEventRange(receptionEvent);
  if (venueName) venueName.textContent = `${getText(hotel.name, lang)}, ${lang === 'hi' ? 'जबलपुर' : 'Jabalpur'}`;
  if (directions) {
    directions.href = hotel.mapsUrl;
    directions.innerHTML = `${directionsIcon()}<span>${translations[lang].viewDirections}</span>`;
    directions.setAttribute('aria-label', localizeDigits(`${translations[lang].directionsTo} ${getText(hotel.name, lang)}`, lang));
  }
}

function renderSchedule(lang) {
  const schedule = document.getElementById('scheduleList');
  if (!schedule) return;

  schedule.innerHTML = '';

  const groupedEvents = events.reduce((groups, event) => {
    const dayEvents = groups.get(event.date) || [];
    dayEvents.push(event);
    groups.set(event.date, dayEvents);
    return groups;
  }, new Map());

  Array.from(groupedEvents.entries()).forEach(([dateString, dayEvents], index) => {
    const daySection = document.createElement('section');
    daySection.className = 'schedule-day';
    daySection.style.setProperty('--day-index', index);

    const dayHeading = document.createElement('h3');
    dayHeading.className = 'schedule-day-heading';
    dayHeading.textContent = `${getText(dayEvents[0].day, lang)}, ${localizeDigits(formatDisplayDate(dateString, lang), lang)}`;
    daySection.appendChild(dayHeading);

    const timeline = document.createElement('ol');
    timeline.className = 'event-timeline';
    dayEvents.forEach((event) => {
      const venue = venues[event.venueId];
      const item = document.createElement('li');
      item.className = 'event-item';

      const time = document.createElement('p');
      time.className = 'event-time';
      time.textContent = formatEventRange(event);

      const title = document.createElement('h4');
      title.textContent = getText(event.title, lang);

      const venueLink = document.createElement('a');
      venueLink.className = 'event-venue';
      venueLink.href = venue.mapsUrl;
      venueLink.target = '_blank';
      venueLink.rel = 'noopener noreferrer';
      venueLink.innerHTML = `${directionsIcon()}<span>${getText(venue.name, lang)}</span>`;
      venueLink.setAttribute('aria-label', localizeDigits(`${translations[lang].directionsTo} ${getText(venue.name, lang)}`, lang));

      item.append(time, title, venueLink);
      if (event.guestNote) {
        const note = document.createElement('p');
        note.className = 'event-note';
        note.textContent = getText(event.guestNote, lang);
        item.appendChild(note);
      }
      timeline.appendChild(item);
    });
    daySection.appendChild(timeline);
    schedule.appendChild(daySection);
  });
}

function renderVenues(lang) {
  const venueGrid = document.getElementById('venueGrid');
  if (!venueGrid) return;

  venueGrid.innerHTML = '';

  Object.values(venues).forEach((venue) => {
    const card = document.createElement('article');
    card.className = 'venue-card';
    card.innerHTML = `
      <h3>${getText(venue.name, lang)}</h3>
      <p>${getText(venue.address, lang)}</p>
      <div class="venue-links">
        <a class="button-link directions-link" href="${venue.mapsUrl}" target="_blank" rel="noopener noreferrer" aria-label="${translations[lang].directionsTo} ${getText(venue.name, lang)}">${directionsIcon()}<span>${translations[lang].viewDirections}</span></a>
      </div>
    `;
    venueGrid.appendChild(card);
  });
}

function renderContacts(lang) {
  const contactGroups = document.getElementById('contactGroups');
  if (!contactGroups) return;

  contactGroups.innerHTML = '';

  Object.values(invitationData.contacts).forEach((contact) => {
    const venue = contact.venueId ? venues[contact.venueId] : null;
    const group = document.createElement('section');
    group.className = 'contact-group';

    const heading = document.createElement('h3');
    heading.textContent = contact.label ? getText(contact.label, lang) : getText(venue.name, lang);
    group.appendChild(heading);

    const numberList = document.createElement('ul');
    const entries = contact.people || contact.numbers.map((number) => ({ number }));
    entries.forEach(({ name, number }) => {
      const item = document.createElement('li');
      const link = document.createElement('a');
      const personName = getText(name, lang);
      link.href = safePhoneLink(number);
      link.textContent = personName ? `${localizeDigits(personName, lang)}: ${number}` : number;
      link.setAttribute('aria-label', `${localizeDigits(translations[lang].callNow, lang)} ${localizeDigits(personName, lang)} ${number}`.trim());
      item.appendChild(link);
      numberList.appendChild(item);
    });
    group.appendChild(numberList);
    contactGroups.appendChild(group);
  });
}

function renderWhatsAppText(lang) {
  const shareText = getText(translations[lang].whatsappShare, lang);
  const shareButton = document.getElementById('whatsappShare');
  if (shareButton) {
    shareButton.onclick = () => {
      const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      window.open(url, '_blank', 'noopener');
    };
  }
}

function updateCountdown() {
  const targetDate = new Date(`${weddingEvent.date}T${weddingEvent.start}:00+05:30`);
  const now = new Date();
  const delta = Math.max(targetDate.getTime() - now.getTime(), 0);

  const days = Math.floor(delta / (1000 * 60 * 60 * 24));
  const hours = Math.floor((delta / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((delta / (1000 * 60)) % 60);
  const seconds = Math.floor((delta / 1000) % 60);

  setText('daysValue', localizeDigits(String(days).padStart(2, '0')));
  setText('hoursValue', localizeDigits(String(hours).padStart(2, '0')));
  setText('minutesValue', localizeDigits(String(minutes).padStart(2, '0')));
  setText('secondsValue', localizeDigits(String(seconds).padStart(2, '0')));
  setText('daysLabel', translations[appState.lang].countDownDays);
  setText('hoursLabel', translations[appState.lang].countDownHours);
  setText('minutesLabel', translations[appState.lang].countDownMinutes);
  setText('secondsLabel', translations[appState.lang].countDownSeconds);
}

function createIcsContent() {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Aditya & Siddhibala Wedding//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VTIMEZONE',
    'TZID:Asia/Kolkata',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0530',
    'TZOFFSETTO:+0530',
    'TZNAME:IST',
    'END:STANDARD',
    'END:VTIMEZONE'
  ];

  events.forEach((event) => {
    const startDate = event.date.replace(/-/g, '') + 'T' + event.start.replace(':', '') + '00';
    const venue = venues[event.venueId];
    const eventTitle = getText(event.title);
    const note = getText(event.note || event.guestNote);
    const venueName = getText(venue.name);
    const description = [note, `${appState.lang === 'hi' ? 'स्थान' : 'Venue'}: ${venueName}`].filter(Boolean).join('; ');

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${event.id}@adisiddhi`);
    lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')}`);
    lines.push(`DTSTART;TZID=Asia/Kolkata:${startDate}`);
    if (event.end) {
      const endDate = event.date.replace(/-/g, '') + 'T' + event.end.replace(':', '') + '00';
      lines.push(`DTEND;TZID=Asia/Kolkata:${endDate}`);
    }
    lines.push(`SUMMARY:${eventTitle}`);
    lines.push(`DESCRIPTION:${description.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')}`);
    lines.push(`LOCATION:${`${venueName}, ${getText(venue.address)}`.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,')}`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function downloadCalendar() {
  const blob = new Blob([createIcsContent()], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'aditya-siddhibala-wedding-invitation.ics';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function init() {
  const calendarButton = document.getElementById('downloadCalendar');
  const contactDialog = document.getElementById('contactDialog');
  const openContactsButton = document.getElementById('openContacts');
  const closeContactsButton = document.getElementById('closeContacts');

  if (calendarButton) {
    calendarButton.addEventListener('click', downloadCalendar);
  }

  if (contactDialog && openContactsButton && closeContactsButton) {
    openContactsButton.addEventListener('click', () => contactDialog.showModal());
    closeContactsButton.addEventListener('click', () => contactDialog.close());
    contactDialog.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        contactDialog.close();
      }
    });
    contactDialog.addEventListener('click', (event) => {
      if (event.target === contactDialog) contactDialog.close();
    });
  }

  setLanguage(appState.lang);
  setInterval(updateCountdown, 1000);
}

document.addEventListener('DOMContentLoaded', init);
