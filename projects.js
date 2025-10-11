// projects.js

function renderProjects(container, items, from = 'api') {
  if (!Array.isArray(items) || items.length === 0) {
    container.innerHTML = `
      <div class="note">No projects found${from === 'fallback' ? ' (fallback)' : ''}. Add entries to projects.json or ensure repos are public.</div>
    `;
    return;
  }
  container.innerHTML = '';
  items.forEach(item => {
    const name = item.name || '(unnamed)';
    const description = item.description || 'No description';
    const repoUrl = item.repo_url || item.html_url || '#';
    const liveUrl = item.live_url || `https://barbrickdesign.github.io/${name}/index.html`;

    const row = document.createElement('div');
    row.className = 'item';
    row.innerHTML = `
      <div>
        <div class="link"><a href="${repoUrl}" target="_blank" rel="noopener">${name}</a></div>
        <div class="note">${description}</div>
      </div>
      <a class="btn ghost" href="${repoUrl}" target="_blank" rel="noopener">Repo</a>
      <a class="btn" href="${liveUrl}" target="_blank" rel="noopener">View index.html</a>
    `;
    container.appendChild(row);
  });
}

async function fetchGitHubRepos() {
  const res = await fetch('https://api.github.com/users/barbrickdesign/repos?per_page=100', {
    headers: { 'Accept': 'application/vnd.github+json' }
  });
  if (!res.ok) throw new Error('GitHub API error: ' + res.status);
  const repos = await res.json();
  if (!Array.isArray(repos)) throw new Error('Unexpected API response');
  repos.sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));
  return repos.map(r => ({
    name: r.name,
    description: r.description,
    repo_url: r.html_url,
    live_url: `https://barbrickdesign.github.io/${r.name}/index.html`
  }));
}

async function fetchFallbackProjects() {
  const res = await fetch('./projects.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error('Fallback projects.json missing or unreachable');
  return res.json();
}

async function listRepos() {
  const container = document.getElementById('repoGroups');
  if (!container) return;

  // Show a lightweight loading state
  container.innerHTML = '<div class="note">Loading projects…</div>';

  try {
    const apiItems = await fetchGitHubRepos();
    renderProjects(container, apiItems, 'api');
  } catch (apiErr) {
    console.warn('GitHub API failed, using fallback projects.json:', apiErr);
    try {
      const fallbackItems = await fetchFallbackProjects();
      renderProjects(container, fallbackItems, 'fallback');
    } catch (fallbackErr) {
      container.innerHTML = `
        <div class="note">Failed to load projects from both GitHub API and fallback.</div>
      `;
    }
  }
}

document.addEventListener('DOMContentLoaded', listRepos);
