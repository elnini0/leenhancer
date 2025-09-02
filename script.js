const storageKey = 'leEnhancerImages';
const urlInput = document.getElementById('url');
const addBtn = document.getElementById('addBtn');
const clearBtn = document.getElementById('clearBtn');
const toast = document.getElementById('toast');

// Left viewer elements
const viewer1 = document.getElementById('viewer1');
const mainImg1 = document.getElementById('mainImg1');
const lens1 = document.getElementById('lens1');
const empty1 = document.getElementById('empty1');
const zoom1 = document.getElementById('zoom1');
const zoomVal1 = document.getElementById('zoomVal1');

// Right viewer elements
const viewer2 = document.getElementById('viewer2');
const mainImg2 = document.getElementById('mainImg2');
const lens2 = document.getElementById('lens2');
const empty2 = document.getElementById('empty2');
const zoom2 = document.getElementById('zoom2');
const zoomVal2 = document.getElementById('zoomVal2');

const thumbs = document.getElementById('thumbs');

let imageNatural1 = { w: 0, h: 0 };
let imageNatural2 = { w: 0, h: 0 };
let currentUrl1 = '';
let currentUrl2 = '';
let zoomFactor1 = parseFloat(zoom1.value);
let zoomFactor2 = parseFloat(zoom2.value);

function showToast(msg) {
  toast.textContent = msg; 
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1400);
}

function getList() {
  try { 
    return JSON.parse(localStorage.getItem(storageKey)) || []; 
  } catch { 
    return []; 
  }
}

function setList(list) {
  localStorage.setItem(storageKey, JSON.stringify(list));
}

function renderThumbs() {
  const list = getList();
  thumbs.innerHTML = '';
  if (!list.length) return;
  
  list.forEach(u => {
    const el = document.createElement('div');
    el.className = 'thumb' + (u === currentUrl1 || u === currentUrl2 ? ' active' : '');
    el.title = u;
    
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.src = u;
    
    const del = document.createElement('button');
    del.className = 'x';
    del.textContent = '×';
    del.addEventListener('click', e => {
      e.stopPropagation();
      const filtered = getList().filter(x => x !== u);
      setList(filtered); 
      renderThumbs();
      if (u === currentUrl1) {
        if (filtered[0]) loadImage1(filtered[0]); 
        else resetViewer1();
      }
      if (u === currentUrl2) {
        if (filtered[0]) loadImage2(filtered[0]); 
        else resetViewer2();
      }
    });
    
    el.addEventListener('click', () => {
      // If left viewer is empty, load there first, otherwise right viewer
      if (!currentUrl1) {
        loadImage1(u);
      } else if (!currentUrl2) {
        loadImage2(u);
      } else {
        // Replace the right viewer (most recent)
        loadImage2(u);
      }
    });
    
    el.appendChild(img); 
    el.appendChild(del);
    thumbs.appendChild(el);
  });
}

function resetViewer1() {
  currentUrl1 = '';
  mainImg1.src = '';
  viewer1.classList.remove('loaded');
  empty1.style.display = 'block';
}

function resetViewer2() {
  currentUrl2 = '';
  mainImg2.src = '';
  viewer2.classList.remove('loaded');
  empty2.style.display = 'block';
}

async function loadImage1(url) {
  empty1.style.display = 'none';
  viewer1.classList.remove('loaded');
  currentUrl1 = url;

  mainImg1.onload = () => {
    imageNatural1 = { w: mainImg1.naturalWidth, h: mainImg1.naturalHeight };
    viewer1.classList.add('loaded');
    lens1.style.backgroundImage = `url('${currentUrl1}')`;
    lens1.style.backgroundSize = `${imageNatural1.w * zoomFactor1}px ${imageNatural1.h * zoomFactor1}px`;
    addUnique(url);
    renderThumbs();
  };
  
  mainImg1.onerror = () => showToast('Could not load image');
  mainImg1.removeAttribute('crossorigin');
  mainImg1.src = url;
}

async function loadImage2(url) {
  empty2.style.display = 'none';
  viewer2.classList.remove('loaded');
  currentUrl2 = url;

  mainImg2.onload = () => {
    imageNatural2 = { w: mainImg2.naturalWidth, h: mainImg2.naturalHeight };
    viewer2.classList.add('loaded');
    lens2.style.backgroundImage = `url('${currentUrl2}')`;
    lens2.style.backgroundSize = `${imageNatural2.w * zoomFactor2}px ${imageNatural2.h * zoomFactor2}px`;
    addUnique(url);
    renderThumbs();
  };
  
  mainImg2.onerror = () => showToast('Could not load image');
  mainImg2.removeAttribute('crossorigin');
  mainImg2.src = url;
}

function addUnique(url) {
  let list = getList();
  list = [url, ...list.filter(x => x !== url)];
  setList(list);
}

addBtn.addEventListener('click', () => {
  const url = urlInput.value.trim();
  if (!/^https?:\/\//i.test(url)) { 
    showToast('Enter a valid image URL'); 
    return; 
  }
  
  // Load to the first empty viewer, or replace the right one if both are full
  if (!currentUrl1) {
    loadImage1(url);
  } else if (!currentUrl2) {
    loadImage2(url);
  } else {
    // Replace right viewer
    loadImage2(url);
  }
  
  urlInput.value = '';
});

urlInput.addEventListener('keydown', e => { 
  if (e.key === 'Enter') addBtn.click(); 
});

clearBtn.addEventListener('click', () => {
  localStorage.removeItem(storageKey);
  resetViewer1();
  resetViewer2();
  renderThumbs();
  showToast('Cleared');
});

// Magnifier logic
function clamp(v, min, max) { 
  return Math.max(min, Math.min(max, v)); 
}

// Left viewer magnifier functions
function moveLens1(e) {
  if (!currentUrl1) return;
  
  const rect = viewer1.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const lensR = lens1.offsetWidth / 2;
  const lx = clamp(x - lensR, 0, rect.width - lens1.offsetWidth);
  const ly = clamp(y - lensR, 0, rect.height - lens1.offsetHeight);
  lens1.style.left = lx + 'px';
  lens1.style.top = ly + 'px';

  const imgRect = mainImg1.getBoundingClientRect();
  const imgX = clamp(e.clientX - imgRect.left, 0, imgRect.width);
  const imgY = clamp(e.clientY - imgRect.top, 0, imgRect.height);

  const bx = (imgX / imgRect.width) * (imageNatural1.w * zoomFactor1 - lens1.offsetWidth);
  const by = (imgY / imgRect.height) * (imageNatural1.h * zoomFactor1 - lens1.offsetHeight);
  lens1.style.backgroundPosition = `-${bx}px -${by}px`;
}

function showLens1(e) {
  if (!currentUrl1) return;
  lens1.style.display = 'block';
  lens1.style.backgroundImage = `url('${currentUrl1}')`;
  lens1.style.backgroundRepeat = 'no-repeat';
  lens1.style.backgroundSize = `${imageNatural1.w * zoomFactor1}px ${imageNatural1.h * zoomFactor1}px`;
  moveLens1(e);
}

function hideLens1() { 
  lens1.style.display = 'none'; 
}

// Right viewer magnifier functions
function moveLens2(e) {
  if (!currentUrl2) return;
  
  const rect = viewer2.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const lensR = lens2.offsetWidth / 2;
  const lx = clamp(x - lensR, 0, rect.width - lens2.offsetWidth);
  const ly = clamp(y - lensR, 0, rect.height - lens2.offsetHeight);
  lens2.style.left = lx + 'px';
  lens2.style.top = ly + 'px';

  const imgRect = mainImg2.getBoundingClientRect();
  const imgX = clamp(e.clientX - imgRect.left, 0, imgRect.width);
  const imgY = clamp(e.clientY - imgRect.top, 0, imgRect.height);

  const bx = (imgX / imgRect.width) * (imageNatural2.w * zoomFactor2 - lens2.offsetWidth);
  const by = (imgY / imgRect.height) * (imageNatural2.h * zoomFactor2 - lens2.offsetHeight);
  lens2.style.backgroundPosition = `-${bx}px -${by}px`;
}

function showLens2(e) {
  if (!currentUrl2) return;
  lens2.style.display = 'block';
  lens2.style.backgroundImage = `url('${currentUrl2}')`;
  lens2.style.backgroundRepeat = 'no-repeat';
  lens2.style.backgroundSize = `${imageNatural2.w * zoomFactor2}px ${imageNatural2.h * zoomFactor2}px`;
  moveLens2(e);
}

function hideLens2() { 
  lens2.style.display = 'none'; 
}

// Event listeners for left viewer
viewer1.addEventListener('mouseenter', showLens1);
viewer1.addEventListener('mousemove', moveLens1);
viewer1.addEventListener('mouseleave', hideLens1);

// Event listeners for right viewer
viewer2.addEventListener('mouseenter', showLens2);
viewer2.addEventListener('mousemove', moveLens2);
viewer2.addEventListener('mouseleave', hideLens2);

// Scroll to change zoom for left viewer
viewer1.addEventListener('wheel', e => {
  if (!currentUrl1) return;
  e.preventDefault();
  const step = e.deltaY > 0 ? -0.1 : 0.1;
  const next = clamp(parseFloat(zoom1.value) + step, parseFloat(zoom1.min), parseFloat(zoom1.max));
  if (next !== parseFloat(zoom1.value)) {
    zoom1.value = next.toFixed(1);
    zoom1.dispatchEvent(new Event('input'));
  }
}, { passive: false });

// Scroll to change zoom for right viewer
viewer2.addEventListener('wheel', e => {
  if (!currentUrl2) return;
  e.preventDefault();
  const step = e.deltaY > 0 ? -0.1 : 0.1;
  const next = clamp(parseFloat(zoom2.value) + step, parseFloat(zoom2.min), parseFloat(zoom2.max));
  if (next !== parseFloat(zoom2.value)) {
    zoom2.value = next.toFixed(1);
    zoom2.dispatchEvent(new Event('input'));
  }
}, { passive: false });

// Zoom controls for left viewer
zoom1.addEventListener('input', () => {
  zoomFactor1 = parseFloat(zoom1.value);
  zoomVal1.textContent = zoomFactor1.toFixed(1) + '×';
  if (currentUrl1) {
    lens1.style.backgroundSize = `${imageNatural1.w * zoomFactor1}px ${imageNatural1.h * zoomFactor1}px`;
  }
});

// Zoom controls for right viewer
zoom2.addEventListener('input', () => {
  zoomFactor2 = parseFloat(zoom2.value);
  zoomVal2.textContent = zoomFactor2.toFixed(1) + '×';
  if (currentUrl2) {
    lens2.style.backgroundSize = `${imageNatural2.w * zoomFactor2}px ${imageNatural2.h * zoomFactor2}px`;
  }
});

// Restore from storage on load
(function init() {
  renderThumbs();
  const list = getList();
  if (list[0]) loadImage1(list[0]);
  if (list[1]) loadImage2(list[1]);
})();
