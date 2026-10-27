const appState = {
  lang: 'hi'
};

const { translations, events, venues, couple, familyLine } = invitationData;
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
  if (appState.lang === 'hi') return event.timeText;
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

  const whatsappButton = document.getElementById('whatsappShare');
  if (whatsappButton) {
    whatsappButton.setAttribute('aria-label', localizeDigits(t.shareWhatsApp, lang));
    whatsappButton.setAttribute('title', localizeDigits(t.shareWhatsApp, lang));
  }
  const countdown = document.getElementById('countdown');
  if (countdown) countdown.setAttribute('aria-label', localizeDigits(t.countdownAria, lang));
  renderWeddingDetails(lang);
  renderSourceInvitation();
  renderSchedule(lang);
  renderVenues(lang);
  renderContacts(lang);
  renderWhatsAppText(lang);
  updateCountdown();
}

function appendSourceLines(container, lines) {
  lines.forEach((text) => {
    const element = document.createElement(/^(सौभाग्य-कांक्षिणी|चिरंजीव)/.test(text) ? 'h3' : 'p');
    element.className = 'source-paragraph';
    element.textContent = text;
    container.appendChild(element);
  });
}

function renderSourceInvitation() {
  const source = invitationData.sourceDocument;
  const story = document.getElementById('sourceInvitation');
  story.replaceChildren();
  appendSourceLines(story, [...source.invocation, ...source.invitation]);
  const greetings = document.getElementById('sourceGreetings') || document.getElementById('familyGrid');
  greetings.replaceChildren();
  source.greetings.forEach((lines) => {
    const block = document.createElement('article');
    block.className = 'family-group';
    const heading = document.createElement('h3');
    heading.className = 'family-role source-paragraph';
    heading.textContent = lines[0];
    const names = document.createElement('div');
    names.className = 'family-names';
    appendSourceLines(names, lines.slice(1));
    block.append(heading, names);
    greetings.appendChild(block);
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
  schedule.replaceChildren();
  const groupedEvents = events.reduce((groups, event) => {
    const dayEvents = groups.get(event.date) || [];
    dayEvents.push(event);
    groups.set(event.date, dayEvents);
    return groups;
  }, new Map());
  let program = '';
  Array.from(groupedEvents.values()).forEach((dayEvents, index) => {
    const first = dayEvents[0];
    if (program !== first.programTitle) {
      program = first.programTitle;
      if (first.programPrelude) appendSourceLines(schedule, [first.programPrelude]);
      const heading = document.createElement('h3');
      heading.className = 'section-heading source-paragraph program-heading';
      heading.textContent = program;
      schedule.appendChild(heading);
    }
    const daySection = document.createElement('section');
    daySection.className = 'schedule-day';
    daySection.style.setProperty('--day-index', index);
    const dayHeading = document.createElement('h3');
    dayHeading.className = 'schedule-day-heading source-paragraph';
    dayHeading.textContent = first.day.hi;
    daySection.appendChild(dayHeading);
    const timeline = document.createElement('ol');
    timeline.className = 'event-timeline';
    dayEvents.forEach((event) => {
      const venue = venues[event.venueId];
      const item = document.createElement('li');
      item.className = 'event-item';
      const time = document.createElement('p');
      time.className = 'event-time source-paragraph';
      time.textContent = event.timeText;
      const title = document.createElement('h4');
      title.className = 'source-paragraph';
      title.textContent = event.title.hi;
      const venueLink = document.createElement('a');
      venueLink.className = 'event-venue';
      venueLink.href = venue.mapsUrl;
      venueLink.target = '_blank';
      venueLink.rel = 'noopener noreferrer';
      venueLink.innerHTML = directionsIcon();
      const name = document.createElement('span');
      name.textContent = venue.name.hi;
      venueLink.appendChild(name);
      venueLink.setAttribute('aria-label', translations[lang].directionsTo + ' ' + venue.name.hi);
      item.append(time, title, venueLink);
      timeline.appendChild(item);
    });
    daySection.appendChild(timeline);
    schedule.appendChild(daySection);
  });
}

function renderVenues(lang) {
  const venueGrid = document.getElementById('venueGrid');
  venueGrid.replaceChildren();
  Object.values(venues).forEach((venue) => {
    const card = document.createElement('article');
    card.className = 'venue-card';
    const heading = document.createElement('h3');
    heading.className = 'source-paragraph';
    heading.textContent = venue.sourceLines[0];
    card.appendChild(heading);
    appendSourceLines(card, venue.sourceLines.slice(1));
    const links = document.createElement('div');
    links.className = 'venue-links';
    const link = document.createElement('a');
    link.className = 'button-link directions-link';
    link.href = venue.mapsUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', translations[lang].directionsTo + ' ' + venue.name.hi);
    link.innerHTML = directionsIcon();
    const label = document.createElement('span');
    label.textContent = translations[lang].viewDirections;
    link.appendChild(label);
    links.appendChild(link);
    card.appendChild(links);
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

function initMusic() {
  const audio = document.getElementById('backgroundMusic');
  const toggle = document.getElementById('musicToggle');
  const status = document.getElementById('musicStatus');
  let playbackPending = false;

  function updateMusicControl() {
    const enabled = !audio.muted;
    toggle.setAttribute('aria-label', enabled ? 'संगीत बंद करें' : 'संगीत चालू करें');
    toggle.setAttribute('aria-pressed', String(enabled));
    toggle.title = enabled ? 'संगीत बंद करें' : 'संगीत चालू करें';
  }

  async function startMusic() {
    if (audio.muted || playbackPending || !audio.paused) return;
    playbackPending = true;
    try {
      await audio.play();
      status.textContent = '';
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        status.textContent = 'संगीत शुरू करने के लिए स्क्रीन पर टैप करें या कीबोर्ड का उपयोग करें।';
        addInteractionListeners();
      } else {
        console.warn('संगीत शुरू नहीं हो सका।', error);
        status.textContent = 'संगीत अभी उपलब्ध नहीं है।';
      }
    } finally {
      playbackPending = false;
      updateMusicControl();
    }
  }

  audio.loop = true;
  toggle.hidden = false;
  audio.addEventListener('playing', removeInteractionListeners, { once: true });
  audio.addEventListener('play', updateMusicControl);
  audio.addEventListener('pause', updateMusicControl);
  audio.addEventListener('volumechange', updateMusicControl);
  audio.addEventListener('error', () => {
    console.warn('निमंत्रण का संगीत लोड नहीं हो सका।', audio.error);
    status.textContent = 'संगीत उपलब्ध नहीं है।';
    updateMusicControl();
  });
  toggle.addEventListener('click', () => {
    audio.muted = !audio.muted;
    if (!audio.muted) {
      if (audio.error) audio.load();
      startMusic();
    }
    updateMusicControl();
  });

  function onInteraction(event) {
    if (toggle.contains(event.target)) return;
    if (event.type === 'keydown' && (event.repeat || !['Enter', ' ', 'ArrowDown', 'PageDown'].includes(event.key))) return;
    startMusic();
  }
  function removeInteractionListeners() {
    document.removeEventListener('pointerup', onInteraction, true);
    document.removeEventListener('click', onInteraction, true);
    document.removeEventListener('keydown', onInteraction, true);
  }
  function addInteractionListeners() {
    document.addEventListener('pointerup', onInteraction, { capture: true, passive: true });
    document.addEventListener('click', onInteraction, { capture: true, passive: true });
    document.addEventListener('keydown', onInteraction, { capture: true, passive: true });
  }
  addInteractionListeners();
  window.addEventListener('pagehide', () => audio.pause());
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) startMusic();
  });

  updateMusicControl();
  startMusic();
}

function init() {
  const contactDialog = document.getElementById('contactDialog');
  const openContactsButton = document.getElementById('openContacts');
  const closeContactsButton = document.getElementById('closeContacts');

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
  initMusic();
  setInterval(updateCountdown, 1000);
}

document.addEventListener('DOMContentLoaded', init);
