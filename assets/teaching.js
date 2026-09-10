// The contents list follows section headings when staff edit the page in GitHub.
(() => {
  const list = document.getElementById('teaching-toc');
  const headings = document.querySelectorAll('#teaching-content > section > h2[id]');
  if (!list || !headings.length) return;
  list.replaceChildren();
  headings.forEach(heading => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = '#' + encodeURIComponent(heading.id);
    link.textContent = heading.textContent;
    item.append(link); list.append(item);
  });
})();
