// projects.js

async function listRepos() {
  const container = document.getElementById('repoGroups');
  if (!container) return;
  container.innerHTML = '';

  try {
    // Try GitHub API first
    const res = await fetch('https://api.github.com/users/barbrickdesign/repos?per_page=100');
    if (!res.ok) throw new Error('GitHub API error: ' + res.status);
    const repos = await res.json();

    repos.sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));

    repos.forEach(repo => {
      const repoName = repo.name;
      const repoURL = repo.html_url;
      const liveURL = `https://barbrickdesign.github.io/${repoName}/index.html`;

      const row = document.createElement('div');
      row.className = 'item';
      row.innerHTML = `
        <div>
          <div class="link"><a href="${repoURL}" target="_blank">${repoName}</a></div>
          <div class="note">${repo.description || 'No description'}</div>
        </div>
        <a class="btn ghost" href="${repoURL}" target="_blank">Repo</a>
        <a class="btn" href="${liveURL}" target="_blank">View index.html</a>
      `;
      container.appendChild(row);
    });
  } catch (e) {
    console.warn('GitHub API failed, using fallback projects.json', e);

    try {
      const res = await fetch('./projects.json');
      const projects = await res.json();

      projects.forEach(p => {
        const row = document.createElement('div');
        row.className = 'item';
        row.innerHTML = `
          <div>
            <div class="link"><a href="${p.repo_url}" target="_blank">${p.name}</a></div>
            <div class="note">${p.description}</div>
          </div>
          <a class="btn ghost" href="${p.repo_url}" target="_blank">Repo</a>
          <a class="btn" href="${p.live_url}" target="_blank">View index.html</a>
        `;
        container.appendChild(row);
      });
    } catch (fallbackErr) {
      container.innerHTML = `<div class="note">Failed to load projects from both GitHub API and fallback.</div>`;
    }
  }
}

// Run once DOM is ready
document.addEventListener('DOMContentLoaded', listRepos);
