// ===== INIT DATABASE DI LOCALSTORAGE =====
const defaultUsers = [
  { username: 'admin', password: '123', name: 'Dr. Utama', initials: 'AD', role: 'admin', program: 'all' },
  { username: 'drsari', password: '123', name: 'dr. Sari', initials: 'DS', role: 'nakes', program: 'kia' },
  { username: 'bidanrani', password: '123', name: 'Bidan Rani', initials: 'BR', role: 'nakes', program: 'imun' }
];

// Target Sasaran disesuaikan dengan file Excel yang dilampirkan
const defaultProgData = {
  kia: { id: 'kia', title: 'Pelayanan kesehatan Ibu Hamil', color: '#16a34a', monthsVal: [0,0,0,0,0,0,0,0,0,0,0,0], target: 502, actual: 0, pct: 0 },
  imun: { id: 'imun', title: 'Pelayanan Kesehatan Ibu Bersalin', color: '#2563eb', monthsVal: [0,0,0,0,0,0,0,0,0,0,0,0], target: 479, actual: 0, pct: 0 },
  gizi: { id: 'gizi', title: 'Pelayanan Kesehatan Bayi Baru Lahir', color: '#ea580c', monthsVal: [0,0,0,0,0,0,0,0,0,0,0,0], target: 457, actual: 0, pct: 0 },
  ptm: { id: 'ptm', title: 'Pelayanan Kesehatan Balita', color: '#7c3aed', monthsVal: [0,0,0,0,0,0,0,0,0,0,0,0], target: 1959, actual: 0, pct: 0 },
  tb: { id: 'tb', title: 'Pelayanan Kesehatan Terduga TB', color: '#dc2626', monthsVal: [0,0,0,0,0,0,0,0,0,0,0,0], target: 1000, actual: 0, pct: 0 }
};

const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

if (!localStorage.getItem('syncHealth_users')) { localStorage.setItem('syncHealth_users', JSON.stringify(defaultUsers)); }
if (!localStorage.getItem('syncHealth_progData')) { localStorage.setItem('syncHealth_progData', JSON.stringify(defaultProgData)); }

let currentUser = null;
let progData = JSON.parse(localStorage.getItem('syncHealth_progData'));

// ===== SISTEM LOGIN & LOGOUT =====
function checkLoginState() {
  const sessionUser = sessionStorage.getItem('syncHealth_loggedIn');
  if (sessionUser) {
    currentUser = JSON.parse(sessionUser);
    document.getElementById('login-view').style.display = 'none';
    document.getElementById('app-view').style.display = 'flex';
    initApp();
  } else {
    document.getElementById('login-view').style.display = 'flex';
    document.getElementById('app-view').style.display = 'none';
  }
}

function handleLogin() {
  const u = document.getElementById('login-username').value;
  const p = document.getElementById('login-password').value;
  const users = JSON.parse(localStorage.getItem('syncHealth_users'));
  
  const foundUser = users.find(user => user.username === u && user.password === p);
  if (foundUser) {
    sessionStorage.setItem('syncHealth_loggedIn', JSON.stringify(foundUser));
    checkLoginState();
  } else {
    alert("Username atau Password salah!");
  }
}

function handleLogout() {
  sessionStorage.removeItem('syncHealth_loggedIn');
  window.location.reload();
}

// ===== INISIALISASI APLIKASI =====
function initApp() {
  document.getElementById('sidebar-name').textContent = currentUser.name;
  document.getElementById('sidebar-role').textContent = currentUser.role === 'admin' ? 'Kepala Puskesmas' : 'Penanggung Jawab Program';
  document.getElementById('sidebar-avatar').textContent = currentUser.initials;
  document.getElementById('topbar-avatar').textContent = currentUser.initials;
  
  if (currentUser.role === 'admin') { document.getElementById('btn-tambah-manual').style.display = 'flex'; }

  const currentMonthIdx = new Date().getMonth();
  document.getElementById('dash-current-month').textContent = monthNames[currentMonthIdx];

  renderDashboardStats();
  autoGenerateMonthlyTask();
  goPage('dash');
}

// ===== NAVIGASI HALAMAN =====
const pages = ['dash', 'tugas', 'eval'];
function goPage(p) {
  pages.forEach(x => {
    document.getElementById('page-' + x).classList.toggle('active', x === p);
    const n = document.getElementById('nav-' + x);
    if (x === p) {
      n.classList.add('active');
      n.style.background = 'linear-gradient(135deg,#16a34a,#0d9488)';
      n.style.color = '#fff';
    } else {
      n.classList.remove('active');
      n.style.background = '';
      n.style.color = '';
    }
  });
  if (p === 'eval') renderEvaluasi();
}

// ===== TUGAS OTOMATIS BERDASARKAN BULAN =====
function autoGenerateMonthlyTask() {
  const currentMonthIdx = new Date().getMonth(); 
  const currentMonthName = monthNames[currentMonthIdx];
  const colProgress = document.querySelector('#col-progress .task-list-container');
  const colDone = document.querySelector('#col-done .task-list-container');
  
  colProgress.innerHTML = '';
  colDone.innerHTML = '';

  const userPrograms = currentUser.role === 'admin' ? Object.keys(progData) : [currentUser.program];

  userPrograms.forEach(key => {
    const data = progData[key];
    const isDone = data.monthsVal[currentMonthIdx] > 0;

    if (!isDone) {
      colProgress.insertAdjacentHTML('beforeend', `
        <div class="task-card">
          <div class="prio-bar" style="background:var(--amber)"><div style="width:100%;height:3px;background:currentColor;border-radius:3px"></div></div>
          <div class="task-card-title">Input Realisasi ${data.title}</div>
          <div class="task-card-meta">
            <span class="tag" style="background:var(--blue-l);color:var(--blue-d)">Bulan ${currentMonthName}</span>
          </div>
          <div class="task-footer" style="margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--border);">
            <button onclick="openAutoReport('${key}', ${currentMonthIdx})" style="background:var(--green-l); color:var(--green-d); border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:700; width:100%">Isi Laporan Sekarang</button>
          </div>
        </div>`);
    } else {
      colDone.insertAdjacentHTML('beforeend', `
        <div class="task-card">
          <div class="prio-bar" style="background:var(--green)"><div style="width:100%;height:3px;background:currentColor;border-radius:3px"></div></div>
          <div class="task-card-title">Realisasi ${data.title} Selesai</div>
          <div class="task-card-meta">
            <span class="tag" style="background:var(--green-l);color:var(--green-d)">Input: ${data.monthsVal[currentMonthIdx]}</span>
          </div>
        </div>`);
    }
  });

  const progressCount = colProgress.children.length;
  const doneCount = colDone.children.length;
  document.querySelector('#col-progress .col-count').textContent = progressCount;
  document.querySelector('#col-done .col-count').textContent = doneCount;
  document.getElementById('badge-tugas-total').textContent = progressCount;
  document.getElementById('dash-total-tugas').textContent = progressCount + doneCount;
}

// ===== INPUT & SIMPAN LAPORAN =====
function openAutoReport(programKey, monthIdx) {
  const data = progData[programKey];
  document.getElementById('task-name').value = data.title;
  document.getElementById('report-month-name').value = monthNames[monthIdx];
  document.getElementById('task-program').value = programKey;
  document.getElementById('report-month').value = monthIdx;
  document.getElementById('report-actual').value = '';
  document.getElementById('task-modal').style.display = 'flex';
}

function closeTaskModal() { document.getElementById('task-modal').style.display = 'none'; }

function saveReport(event) {
  event.preventDefault();
  const programKey = document.getElementById('task-program').value;
  const monthIdx = parseInt(document.getElementById('report-month').value);
  const actualVal = parseInt(document.getElementById('report-actual').value);

  progData[programKey].monthsVal[monthIdx] = actualVal;
  
  let totalActual = 0;
  progData[programKey].monthsVal.forEach(v => totalActual += v);
  progData[programKey].actual = totalActual;
  progData[programKey].pct = Math.min(100, (totalActual / progData[programKey].target) * 100);

  localStorage.setItem('syncHealth_progData', JSON.stringify(progData));
  closeTaskModal();
  initApp();

  // ALUR EXPORT: POPUP UNDUH EXCEL SETELAH SIMPAN
  if (confirm(`Laporan ${progData[programKey].title} bulan ${monthNames[monthIdx]} berhasil disimpan!\n\nApakah Anda ingin mengunduh (export) format file Excel/CSV nya sekarang?`)) {
    exportToCSV(monthIdx);
  }
}

// ===== EXPORT KE EXCEL / CSV (FORMAT SPM PUSKESMAS) =====
function exportToCSV(inputMonthIdx = null) {
  const currentYear = new Date().getFullYear();
  // Jika diexport setelah input tugas spesifik, tampilkan header bulan tsb. Jika dari tombol export Evaluasi, tampilkan nama bulan saat ini.
  const idx = inputMonthIdx !== null ? inputMonthIdx : new Date().getMonth();
  const monthLabel = monthNames[idx].toUpperCase();
  
  // Format khusus untuk mensimulasikan Excel menggunakan CSV UTF-8
  let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
  
  // KOP SURAT PUSKESMAS
  csvContent += ",,,,,,\n";
  csvContent += ",,,,,,\n";
  csvContent += ",PEMERINTAH KOTA MAKASSAR,,,,,\n";
  csvContent += ",DINAS KESEHATAN,,,,,\n";
  csvContent += ",PUSKESMAS JUMPANDANG BARU,,,,,\n";
  csvContent += ",Jl. Ir. H. Juanda No. 1 Kode Pos : 900211,,,,,\n";
  csvContent += ",Telp. (0411) 421154. Email : pkmjumpandangbarutallo@gmail.com,,,,,\n";
  csvContent += ",,,,,,\n";
  csvContent += ",CAPAIAN JENIS LAYANAN DASAR STANDAR PELAYANAN MINIMAL BIDANG KESEHATAN,,,,,\n";
  csvContent += ",PUSKESMAS JUMPANDANG BARU,,,,,\n";
  csvContent += `,TAHUN ${currentYear},,,,,\n`;
  csvContent += ",,,,,,\n";
  
  // HEADER TABEL
  csvContent += `,NO,JENIS PELAYANAN DASAR,SASARAN,${monthLabel},REALISASI,PERSENTASE\n`;

  // ISI DATA TABEL
  let no = 1;
  Object.keys(progData).forEach(key => {
    const data = progData[key];
    const sasaran = data.target;
    const realisasi = data.actual;
    const bulanInput = data.monthsVal[idx]; // Input riil pada bulan bersangkutan
    const persentase = sasaran > 0 ? (realisasi / sasaran) : 0;
    
    // .toFixed(4) agar menghasilkan desimal seperti 0.0796 layaknya lampiran
    csvContent += `,${no},${data.title},${sasaran},${bulanInput},${realisasi},${persentase.toFixed(4)}\n`;
    no++;
  });

  // DOWNLOAD TRIGGER
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Laporan_Capaian_Puskesmas_${monthNames[idx]}_${currentYear}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ===== RENDER DASHBOARD & EVALUASI =====
function renderDashboardStats() {
  const container = document.getElementById('dash-capaian-program-list');
  container.innerHTML = '';
  let totalPct = 0;
  
  Object.keys(progData).forEach(key => {
    const data = progData[key];
    totalPct += data.pct;
    container.insertAdjacentHTML('beforeend', `
      <div class="prog-item">
        <div class="prog-header"><span>${data.title}</span><span style="color:${data.color}" class="prog-pct-text">${Math.round(data.pct)}%</span></div>
        <div class="prog-bar"><div class="prog-fill" style="width:${data.pct}%;background:${data.color}"></div></div>
      </div>`);
  });
  document.getElementById('dash-avg-capaian').textContent = Math.round(totalPct / 5) + '%';
}

function renderEvaluasi() {
  const container = document.getElementById('eval-cards-container');
  container.innerHTML = '';
  
  Object.keys(progData).forEach(key => {
    const data = progData[key];
    container.insertAdjacentHTML('beforeend', `
      <div class="prog-card" style="background:${data.color}20; color:${data.color}" onclick="selectProgEval('${key}')">
        <div class="prog-card-title">${data.title}</div>
        <div class="prog-card-pct">${Math.round(data.pct)}%</div>
        <div class="prog-card-mini">Target: ${data.target} · Tercapai: ${data.actual}</div>
      </div>`);
  });
  selectProgEval('kia');
}

function selectProgEval(key) {
  const data = progData[key];
  document.getElementById('detail-title').textContent = data.title;
  document.getElementById('sum-target').textContent = data.target.toLocaleString('id-ID');
  document.getElementById('sum-actual').textContent = data.actual.toLocaleString('id-ID');
  
  const tbody = document.getElementById('detail-tbody');
  tbody.innerHTML = '';
  
  const currentMonthIdx = new Date().getMonth();
  for(let i = 0; i <= currentMonthIdx; i++) {
    const val = data.monthsVal[i];
    const status = val > 0 ? `<span style="color:var(--green)">Selesai</span>` : `<span style="color:var(--red)">Belum</span>`;
    tbody.insertAdjacentHTML('beforeend', `<tr><td>${monthNames[i]}</td><td>${val.toLocaleString('id-ID')}</td><td>${status}</td></tr>`);
  }
}

// Jalankan saat load
document.addEventListener("DOMContentLoaded", checkLoginState);