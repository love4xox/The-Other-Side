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
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^\* \*\*(.*?)\*\*(.*$)/gim, '<li><strong>$1</strong>$2</li>')
        .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank">$1</a>')
        .replace(/\n\n/g, '<p></p>')
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