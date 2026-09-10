(() => {
  const form = document.querySelector('.search-form');
  if (!form) return;
  const input = form.querySelector('input');
  const results = document.getElementById('search-results');
  const status = document.getElementById('search-status');
  let data = [...(window.GENOMICS_SEARCH || [])];
  function search(value) {
    const query = value.trim();
    results.replaceChildren();
    if (!query) { status.textContent = 'Search the modules, preparation material and knowledgebase.'; return; }
    const words = query.toLowerCase().split(/\s+/);
    const matches = data.filter(item => words.every(word => `${item.title} ${item.text}`.toLowerCase().includes(word)))
      .sort((a,b) => Number(b.title.toLowerCase().includes(query.toLowerCase())) - Number(a.title.toLowerCase().includes(query.toLowerCase())));
    status.textContent = `${matches.length} ${matches.length === 1 ? 'result' : 'results'} found for “${query}”.`;
    for (const item of matches) {
      const article = document.createElement('article'); article.className = 'search-result';
      const heading = document.createElement('h2'); const a = document.createElement('a');
      a.href = item.path; a.textContent = item.title; heading.append(a);
      const p = document.createElement('p');
      const pos = item.text.toLowerCase().indexOf(words[0]);
      const start = Math.max(0, pos - 60); p.textContent = `${start ? '…' : ''}${item.text.slice(start,start+240)}${item.text.length > start+240 ? '…' : ''}`;
      article.append(heading,p); results.append(article);
    }
  }
  input.value = new URLSearchParams(location.search).get('q') || '';
  search(input.value);
  form.addEventListener('submit',e => {
    e.preventDefault();
    const q = input.value.trim();
    // File previews can disallow history changes; the search still works.
    try { history.replaceState(null,'', q ? `?q=${encodeURIComponent(q)}` : location.pathname); } catch (_) {}
    search(q);
  });

  // Read the published teaching pages so a GitHub text edit also updates search.
  const pages = window.GENOMICS_EDITABLE_PAGES || [{path:'knowledgebase.html', title:'Knowledgebase'}];
  async function refreshPage(item) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(item.path, {cache:'no-store', signal:controller.signal});
      if (!response.ok) throw new Error('Page unavailable');
      const page = new DOMParser().parseFromString(await response.text(), 'text/html');
      const article = page.getElementById('teaching-content') || page.getElementById('knowledgebase-content');
      if (!article) throw new Error('Teaching content missing');
      // Fetched scripts are never executed and source markup is never rendered.
      article.querySelectorAll('script,style,[aria-hidden="true"]').forEach(node => node.remove());
      const fresh = Array.from(article.querySelectorAll('section')).map(section => {
        const heading = section.querySelector('h2[id]');
        if (!heading) return null;
        return {path: item.path + '#' + encodeURIComponent(heading.id),
          title: item.title + ' · ' + heading.textContent.trim(),
          text: section.textContent.replace(/\s+/g,' ').trim()};
      }).filter(Boolean);
      if (!fresh.length) throw new Error('Teaching sections missing');
      data = data.filter(entry => entry.path.split('#')[0] !== item.path).concat(fresh);
    } finally { clearTimeout(timeout); }
  }
  Promise.allSettled(pages.map(refreshPage)).then(outcomes => {
    search(input.value);
    if (outcomes.some(outcome => outcome.status === 'rejected')) {
      const note = document.createElement('p');
      note.className = 'source-note';
      note.append('Some teaching pages could not be refreshed. Search uses a saved snapshot for those pages; open a result to read its latest text.');
      status.after(note);
    }
  });
})();
