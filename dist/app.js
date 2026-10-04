(() => {
  const artists = [...window.BASS_ARTISTS, ...(window.BASS_ARTIST_ADDITIONS || [])];
  const connections = [...window.BASS_CONNECTIONS, ...(window.BASS_CONNECTION_ADDITIONS || [])];
  const byId = new Map(artists.map((artist) => [artist.id, artist]));
  const categories = ['All', 'Jungle', 'Drum & bass', 'Dubstep', 'UK garage', 'Grime', 'Breakbeat', 'Footwork'];
  const colors = { Jungle: 'var(--jungle)', 'Drum & bass': 'var(--dnb)', Dubstep: 'var(--dubstep)', 'UK garage': 'var(--garage)', Grime: 'var(--grime)', Breakbeat: 'var(--jungle)', Footwork: 'var(--footwork)' };
  const routes = [
    { title: 'Jungle, then and now', description: 'From rave breaks to a new generation of songwriters.', ids: ['4hero', 'goldie', 'nia-archives', 'pinkpantheress'] },
    { title: 'Garage after dark', description: 'Swinging 2-step becomes a wider club language.', ids: ['mj-cole', 'zed-bias', 'burial', 'joy-orbison', 'overmono'] },
    { title: 'Fast rhythm worlds', description: 'Chicago footwork meets the UK 160 scene.', ids: ['rp-boo', 'dj-rashad', 'sherelle', 'tim-reaper'] },
    { title: 'The dubstep circuit', description: 'Sound-system depth, Croydon clubs and global bass.', ids: ['mala', 'coki', 'benga', 'skream', 'skrillex'] }
  ];
  const state = { query: '', genre: 'All', era: 'all', selected: null, trail: [], navigationIndex: 0 };

  const el = (id) => document.getElementById(id);
  const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const artistLabel = (artist) => artist.genres[0] || 'Bass music';

  function visibleArtists() {
    const query = state.query.trim().toLocaleLowerCase();
    return artists.filter((artist) => {
      if (state.genre !== 'All' && !artist.genres.includes(state.genre)) return false;
      if (state.era !== 'all' && Math.floor(artist.year / 10) * 10 !== Number(state.era)) return false;
      if (!query) return true;
      return [artist.name, artist.track, ...artist.genres, ...artist.tags].join(' ').toLocaleLowerCase().includes(query);
    }).sort((a, b) => a.year - b.year || a.name.localeCompare(b.name));
  }

  function renderFilters() {
    el('genreFilters').innerHTML = categories.map((category) => `<button type="button" data-genre="${escapeHtml(category)}" aria-pressed="${state.genre === category}">${escapeHtml(category)}</button>`).join('');
  }

  function renderRoutes() {
    el('routeGrid').innerHTML = routes.map((route) => `<article class="route-card"><h4>${escapeHtml(route.title)}</h4><p>${escapeHtml(route.description)}</p><div class="route-steps">${route.ids.filter((id) => byId.has(id)).map((id, index) => `<span class="route-step">${index ? '<span class="route-arrow" aria-hidden="true">→</span>' : ''}<button type="button" data-artist="${escapeHtml(id)}">${escapeHtml(byId.get(id).name)}</button></span>`).join('')}</div></article>`).join('');
  }

  function renderResults() {
    const found = visibleArtists();
    el('catalogCount').textContent = `${artists.length} ARTISTS · 1990—2025`;
    el('resultCount').textContent = `${found.length} ${found.length === 1 ? 'artist' : 'artists'}`;
    el('artistResults').innerHTML = found.length ? found.map((artist) => `<button class="artist-result" type="button" data-artist="${escapeHtml(artist.id)}" aria-current="${state.selected === artist.id}"><span class="result-year">${artist.year}</span><span><span class="result-name">${escapeHtml(artist.name)}</span><span class="result-genre">${escapeHtml(artistLabel(artist))}</span></span></button>`).join('') : '<p class="empty-results">No matches for these filters.<button type="button" id="clearFilters">Clear filters</button></p>';
  }

  function neighborsOf(artist) {
    const direct = connections.filter((connection) => connection.a === artist.id || connection.b === artist.id).map((connection) => ({ ...connection, artist: byId.get(connection.a === artist.id ? connection.b : connection.a), suggested: false })).filter((entry) => entry.artist);
    const seen = new Set([artist.id, ...direct.map((entry) => entry.artist.id)]);
    const suggested = artists.filter((candidate) => !seen.has(candidate.id)).map((candidate) => {
      const sharedGenres = candidate.genres.filter((genre) => artist.genres.includes(genre));
      const sharedTags = candidate.tags.filter((tag) => artist.tags.includes(tag));
      const score = sharedGenres.length * 5 + sharedTags.length * 3 - Math.abs(candidate.year - artist.year) / 10;
      return { artist: candidate, score, type: 'Shared sound', reason: sharedGenres.length ? `Both explore ${sharedGenres[0].toLowerCase()}.` : `A nearby route through bass music.`, suggested: true };
    }).sort((a, b) => b.score - a.score).slice(0, Math.max(0, 5 - direct.length));
    return [...direct, ...suggested];
  }

  function renderMap(artist, neighbors) {
    const stage = el('mapStage');
    const positions = [[18, 24], [82, 24], [18, 76], [82, 76], [50, 17], [50, 83]];
    const mapped = neighbors.slice(0, positions.length);
    const lines = mapped.map((entry, index) => `<line class="${entry.suggested ? 'suggested' : ''}" x1="50%" y1="50%" x2="${positions[index][0]}%" y2="${positions[index][1]}%" style="--line-color:${entry.suggested ? 'var(--quiet)' : 'var(--accent)'}"></line>`).join('');
    const nodes = mapped.map((entry, index) => `<button class="map-node" type="button" data-artist="${escapeHtml(entry.artist.id)}" style="left:${positions[index][0]}%;top:${positions[index][1]}%;--node-color:${colors[artistLabel(entry.artist)] || 'var(--accent)'}">${escapeHtml(entry.artist.name)}</button>`).join('');
    stage.innerHTML = `<svg aria-hidden="true">${lines}</svg><div class="map-node center" style="left:50%;top:50%">${escapeHtml(artist.name)}</div>${nodes}`;
  }

  function renderConnections(neighbors) {
    el('connectionList').innerHTML = neighbors.map((entry) => `<div class="connection-card"><button class="connection-target" type="button" data-artist="${escapeHtml(entry.artist.id)}"><span class="connection-type">${escapeHtml(entry.type)}</span><span class="connection-name">${escapeHtml(entry.artist.name)}</span><span class="connection-reason">${escapeHtml(entry.reason)}</span></button>${entry.source ? `<a class="connection-source" href="${escapeHtml(entry.source)}" target="_blank" rel="noopener noreferrer">View evidence ↗</a>` : '<span class="connection-source">Suggested listening path</span>'}</div>`).join('');
  }

  function renderProfile() {
    const artist = byId.get(state.selected) || artists[0];
    if (!artist) return;
    el('profileYear').textContent = `${artist.year} / GATEWAY TRACK`;
    el('profileName').textContent = artist.name;
    el('profileGenres').innerHTML = artist.genres.map((genre) => `<span class="genre-pill" style="--pill-color:${colors[genre] || 'var(--accent)'}">${escapeHtml(genre)}</span>`).join('');
    el('profileTags').textContent = artist.tags.join(' · ');
    el('profileBio').textContent = artist.bio;
    el('gateway').innerHTML = `<div><span class="gateway-label">START LISTENING</span><span class="gateway-track">${escapeHtml(artist.track)}</span></div><a href="${escapeHtml(artist.source)}" target="_blank" rel="noopener noreferrer">Track and source</a>`;
    el('eraMarker').style.left = `${Math.max(0, Math.min(100, (artist.year - 1990) / 35 * 100))}%`;
    el('backButton').hidden = state.navigationIndex === 0;
    const neighbors = neighborsOf(artist);
    renderMap(artist, neighbors);
    renderConnections(neighbors);
    renderResults();
    document.title = `${artist.name} — Bass Atlas`;
  }

  function selectArtist(id, navigate = true, focus = true) {
    if (!byId.has(id)) return;
    if (navigate && state.selected === id) return;
    if (navigate) {
      state.trail = state.trail.slice(0, state.navigationIndex + 1);
      state.trail.push(id);
      state.navigationIndex = state.trail.length - 1;
      history.pushState({ bassIndex: state.navigationIndex }, '', `#${encodeURIComponent(id)}`);
    }
    state.selected = id;
    renderProfile();
    if (focus) el('profileName').focus({ preventScroll: true });
    if (window.innerWidth < 670) el('mainContent').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }

  el('artistSearch').addEventListener('input', (event) => { state.query = event.target.value; renderResults(); });
  el('artistResults').addEventListener('click', (event) => {
    if (event.target.id !== 'clearFilters') return;
    state.query = ''; state.genre = 'All'; state.era = 'all';
    el('artistSearch').value = '';
    el('eraFilter').value = 'all';
    el('genreFilters').querySelectorAll('button[data-genre]').forEach((chip) => chip.setAttribute('aria-pressed', String(chip.dataset.genre === 'All')));
    renderResults();
    el('artistSearch').focus();
  });
  el('genreFilters').addEventListener('click', (event) => { const button = event.target.closest('button[data-genre]'); if (!button) return; state.genre = button.dataset.genre; el('genreFilters').querySelectorAll('button[data-genre]').forEach((chip) => chip.setAttribute('aria-pressed', String(chip.dataset.genre === state.genre))); renderResults(); });
  el('eraFilter').addEventListener('change', (event) => { state.era = event.target.value; renderResults(); });
  document.addEventListener('click', (event) => { const button = event.target.closest('[data-artist]'); if (button) { if (button.tagName === 'A') event.preventDefault(); selectArtist(button.dataset.artist); } });
  el('surpriseButton').addEventListener('click', () => { const pool = visibleArtists(); if (!pool.length) return; const other = pool.filter((artist) => artist.id !== state.selected); selectArtist((other.length ? other : pool)[Math.floor(Math.random() * (other.length ? other : pool).length)].id); });
  el('backButton').addEventListener('click', () => { if (state.navigationIndex > 0) history.back(); });
  window.addEventListener('popstate', (event) => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!byId.has(id)) return;
    const index = event.state?.bassIndex;
    if (Number.isInteger(index) && state.trail[index] === id) state.navigationIndex = index;
    else { state.trail = [id]; state.navigationIndex = 0; }
    selectArtist(id, false);
  });
  window.addEventListener('hashchange', () => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (byId.has(id) && id !== state.selected) selectArtist(id, false);
  });

  renderFilters();
  renderRoutes();
  const initial = byId.has(decodeURIComponent(location.hash.slice(1))) ? decodeURIComponent(location.hash.slice(1)) : 'goldie';
  state.trail = [initial];
  history.replaceState({ bassIndex: 0 }, '', `#${encodeURIComponent(initial)}`);
  selectArtist(initial, false, false);
})();
