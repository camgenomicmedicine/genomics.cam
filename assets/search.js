(() => {
  const form = document.querySelector('.search-form');
  if (!form) return;
  const input = form.querySelector('input');
  const results = document.getElementById('search-results');
  const status = document.getElementById('search-status');
  const data = window.GENOMICS_SEARCH || [];
  function search(value) {
    const query = value.trim();
    results.replaceChildren();
    if (!query) { status.textContent = 'Search the modules, preparation material and knowledgebase.'; return; }
    const words = query.toLowerCase().split(/\s+/);
    const matches = data.filter(item => words.every(word => `${item.title} ${item.text}`.toLowerCase().includes(word)))
      .sort((a,b) => Number(b.title.toLowerCase().includes(query.toLowerCase())) - Number(a.title.toLowerCase().includes(query.toLowerCase())));
    status.textContent = `${matches.length} ${matches.length === 1 ? 'page' : 'pages'} found for “${query}”.`;
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
  form.addEventListener('submit',e => { e.preventDefault(); const q = input.value.trim(); history.replaceState(null,'', q ? `?q=${encodeURIComponent(q)}` : location.pathname); search(q); });
})();
