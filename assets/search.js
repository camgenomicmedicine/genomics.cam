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

  // Staff edit knowledgebase.html directly. Read its published text on each
  // search-page visit, so a normal GitHub edit needs no separate index update.
  async function refreshKnowledgebase() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch('knowledgebase.html', {cache:'no-store', signal:controller.signal});
      if (!response.ok) throw new Error('Knowledgebase unavailable');
      const page = new DOMParser().parseFromString(await response.text(), 'text/html');
      const article = page.getElementById('knowledgebase-content');
      if (!article) throw new Error('Knowledgebase content missing');
      // Ignore non-teaching content; never execute fetched markup or scripts.
      article.querySelectorAll('script,style,[aria-hidden="true"]').forEach(node => node.remove());
      const fresh = Array.from(article.querySelectorAll('section')).map(section => {
        const heading = section.querySelector('h2[id]');
        if (!heading) return null;
        return {
          path: `knowledgebase.html#${encodeURIComponent(heading.id)}`,
          title: `Knowledgebase · ${heading.textContent.trim()}`,
          text: section.textContent.replace(/\s+/g,' ').trim()
        };
      }).filter(Boolean);
      if (!fresh.length) throw new Error('Knowledgebase sections missing');
      data = data.filter(item => !/^knowledgebase\.html(?:#|$)/.test(item.path)).concat(fresh);
      search(input.value);
    } catch (_) {
      const note = document.createElement('p');
      note.className = 'source-note';
      note.append('Search is using a saved knowledgebase snapshot. ');
      const link = document.createElement('a');
      link.href = 'knowledgebase.html';
      link.textContent = 'Open the knowledgebase for its latest text.';
      note.append(link);
      status.after(note);
    } finally {
      clearTimeout(timeout);
    }
  }
  refreshKnowledgebase();
})();
