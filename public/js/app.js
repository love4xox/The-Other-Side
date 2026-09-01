// 프리셋 클릭 시 자동 입력 함수
window.quickFill = function(villain, work, note) {
  document.getElementById('villainName').value = villain;
  document.getElementById('workTitle').value = work;
  document.getElementById('details').value = note;

  const profilerBtn = document.querySelector('[data-tab="profilerTab"]');
  if (profilerBtn) profilerBtn.click();

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

document.addEventListener('DOMContentLoaded', () => {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const analyzeForm = document.getElementById('analyzeForm');
  const submitBtn = document.getElementById('submitBtn');
  const loadingBox = document.getElementById('loadingBox');
  const resultCard = document.getElementById('resultCard');
  const resultContent = document.getElementById('resultContent');
  const archiveList = document.getElementById('archiveList');

  let archives = JSON.parse(localStorage.getItem('the_other_side_archives') || '[]');

  // 5개 탭 전환
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(targetTab).classList.add('active');

      if (targetTab === 'archiveTab') {
        renderArchives();
      }
    });
  });

  // 분석 의뢰 제출
  analyzeForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const villainName = document.getElementById('villainName').value.trim();
    const workTitle = document.getElementById('workTitle').value.trim();
    const details = document.getElementById('details').value.trim();

    if (!villainName) {
      alert('분석할 빌런 또는 안티히어로의 이름을 입력해 주세요.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = '프로파일링 진행 중...';
    loadingBox.classList.remove('hidden');
    resultCard.classList.add('hidden');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          villain_name: villainName,
          work_title: workTitle,
          details: details
        })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || '분석 파일 생성에 실패했습니다.');
      }

      renderReport(data.reply);

      archives.unshift({
        id: Date.now(),
        villain: villainName,
        work: workTitle || '작품 미지정',
        content: data.reply,
        date: new Date().toLocaleDateString()
      });
      localStorage.setItem('the_other_side_archives', JSON.stringify(archives));

    } catch (err) {
      alert(`오류: ${err.message}`);
    } finally {
      loadingBox.classList.add('hidden');
      submitBtn.disabled = false;
      submitBtn.textContent = '서사 프로파일링 시작';
    }
  });

  function renderReport(markdownText) {
    let html = markdownText
      // 대제목 (#)
      .replace(/^# (.*$)/gim, '<h1 style="color:#ff3333; margin-bottom:15px; font-size:1.4rem;">$1</h1>')
      // 소제목 (###)
      .replace(/^### (.*$)/gim, '<h3 style="color:#ff4d4d; margin-top:20px; margin-bottom:8px; font-size:1.1rem;">$1</h3>')
      // 리스트 + 볼드 (* **텍스트**)
      .replace(/^\* \*\*(.*?)\*\*:(.*$)/gim, '<li style="margin-bottom:6px;"><strong>$1:</strong>$2</li>')
      .replace(/^\* (.*$)/gim, '<li style="margin-bottom:6px;">$1</li>')
      // 일반 볼드 (**텍스트**)
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      // 한글 파라미터가 포함된 URL 링크 처리 (유튜브 링크 클릭 가능하도록 변환)
      .replace(/\[(.*?)\]\((https?:\/\/[^\s\)]+)\)/gim, (match, label, url) => {
        return `<a href="${encodeURI(url)}" target="_blank" rel="noopener noreferrer" style="color: #4da3ff; text-decoration: underline;">${label}</a>`;
      })
      // 구분선 (---)
      .replace(/^---$/gim, '<hr style="border: 0; border-top: 1px solid var(--border-color, #333); margin: 20px 0;">')
      // 줄바꿈 처리
      .replace(/\n\n/g, '<p style="margin-bottom:12px;"></p>')
      .replace(/\n/g, '<br>');

    resultContent.innerHTML = html;
    resultCard.classList.remove('hidden');
    resultCard.scrollIntoView({ behavior: 'smooth' });
  }

  function renderArchives() {
    if (!archiveList) return;
    if (archives.length === 0) {
      archiveList.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:30px;">아직 편철된 빌런 서사 파일이 없습니다.</p>';
      return;
    }

    archiveList.innerHTML = archives.map(item => `
      <div class="dossier-card" style="margin-bottom: 20px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
          <span class="badge">[CASE #${item.id.toString().slice(-4)}]</span>
          <span style="color:var(--text-muted); font-size:0.8rem; font-family:var(--font-mono);">${item.date}</span>
        </div>
        <h2 style="color:#fff; font-size:1.2rem; margin-bottom:5px;">${item.villain} <small style="color:var(--text-muted); font-size:0.85rem;">(${item.work})</small></h2>
        <div style="margin-top:15px;">${item.content.replace(/\n/g, '<br>')}</div>
      </div>
    `).join('');
  }
});

// 다크 / 라이트 모드 토글 로직
const themeToggleBtn = document.getElementById('themeToggleBtn');
const savedTheme = localStorage.getItem('tos_theme') || 'dark';

// 초기 테마 적용
if (savedTheme === 'light') {
  document.documentElement.setAttribute('data-theme', 'light');
  if (themeToggleBtn) themeToggleBtn.textContent = '🌙 다크 모드';
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme === 'light') {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('tos_theme', 'dark');
      themeToggleBtn.textContent = '☀️ 라이트 모드';
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('tos_theme', 'light');
      themeToggleBtn.textContent = '🌙 다크 모드';
    }
  });
}