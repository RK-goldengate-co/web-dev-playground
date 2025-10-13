// Display stored HTML when popup opens
window.addEventListener('DOMContentLoaded', function() {
  document.getElementById('status').textContent = 'Ready!';
});

// Analyze HTML function
function analyzeHTML(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;

  const stats = {
    totalElements: body.querySelectorAll('*').length,
    divs: body.querySelectorAll('div').length,
    imgs: body.querySelectorAll('img').length,
    links: body.querySelectorAll('a').length,
    scripts: body.querySelectorAll('script').length,
    styles: body.querySelectorAll('style').length,
    headings: body.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
    paragraphs: body.querySelectorAll('p').length,
    deprecated: body.querySelectorAll('font, center, marquee, blink').length,
    forms: body.querySelectorAll('form').length,
    inputs: body.querySelectorAll('input, select, textarea').length
  };

  return stats;
}

// Update analytics (simplified, no tab switching)
function updateAnalytics(stats) {
  // For simplicity, just log to console or show in status
  console.log('Analytics:', stats);
  document.getElementById('status').textContent = `Analyzed: ${stats.totalElements} elements, ${stats.divs} divs, ${stats.links} links.`;
}

document.getElementById('fetchFromURL').addEventListener('click', function() {
  const url = document.getElementById('urlInput').value.trim();
  if (url) {
    document.getElementById('status').textContent = 'Fetching HTML from URL...';
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch page');
        }
        return response.text();
      })
      .then(html => {
        document.getElementById('htmlOutput').value = html;
        document.getElementById('htmlPreview').style.display = 'block';
        document.getElementById('status').textContent = 'HTML fetched from URL successfully!';
        
        // Analyze the fetched HTML
        const stats = analyzeHTML(html);
        updateAnalytics(stats);
      })
      .catch(error => {
        document.getElementById('status').textContent = 'Error: ' + error.message;
      });
  } else {
    document.getElementById('status').textContent = 'Please enter a valid URL.';
  }
});

document.getElementById('pasteFromTab').addEventListener('click', function() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs[0]) {
      const url = tabs[0].url;
      document.getElementById('urlInput').value = url;
      document.getElementById('status').textContent = `URL from current tab pasted: ${url}`;
    } else {
      document.getElementById('status').textContent = 'Error: Could not get current tab URL.';
    }
  });
});

document.getElementById('downloadHTML').addEventListener('click', function() {
  const html = document.getElementById('htmlOutput').value;
  if (html) {
    const status = document.getElementById('status');
    status.textContent = 'Downloading';
    status.classList.add('loading');
    
    // Add loading dots animation
    let dots = 0;
    const loadingInterval = setInterval(() => {
      dots = (dots + 1) % 4;
      status.textContent = 'Downloading' + '.'.repeat(dots);
    }, 500);
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    chrome.downloads.download({
      url: url,
      filename: 'page.html',
      saveAs: false
    }, function(downloadId) {
      clearInterval(loadingInterval);
      if (chrome.runtime.lastError) {
        status.textContent = 'Error: ' + chrome.runtime.lastError.message;
        status.classList.remove('loading');
      } else {
        status.textContent = 'Download started!';
        status.classList.remove('loading');
      }
      URL.revokeObjectURL(url);
    });
  } else {
    document.getElementById('status').textContent = 'No HTML to download.';
  }
});
