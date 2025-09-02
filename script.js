// ============================================================================
// LE ENHANCER - COMPARISON TOOL
// ============================================================================

// Storage and DOM elements
const STORAGE_KEY = 'leEnhancerImages';
const urlInput = document.getElementById('url');
const addLeftBtn = document.getElementById('addLeftBtn');
const addRightBtn = document.getElementById('addRightBtn');
const clearBtn = document.getElementById('clearBtn');
const toast = document.getElementById('toast');
const leftThumbs = document.getElementById('leftThumbs');
const rightThumbs = document.getElementById('rightThumbs');

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

// State variables
let imageNatural1 = { w: 0, h: 0 };
let imageNatural2 = { w: 0, h: 0 };
let currentUrl1 = '';
let currentUrl2 = '';
let zoomFactor1 = parseFloat(zoom1.value);
let zoomFactor2 = parseFloat(zoom2.value);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1400);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// ============================================================================
// STORAGE MANAGEMENT - ARRAYS FOR LEFT AND RIGHT
// ============================================================================

function getSavedImages() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    return {
      left: saved.left || [],
      right: saved.right || []
    };
  } catch {
    return { left: [], right: [] };
  }
}

function saveImages(images) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(images));
}

function addLeftImage(url) {
  const images = getSavedImages();
  if (!images.left.includes(url)) {
    images.left.push(url);
    saveImages(images);
  }
}

function addRightImage(url) {
  const images = getSavedImages();
  if (!images.right.includes(url)) {
    images.right.push(url);
    saveImages(images);
  }
}

function removeLeftImage(url) {
  const images = getSavedImages();
  images.left = images.left.filter(img => img !== url);
  saveImages(images);
}

function removeRightImage(url) {
  const images = getSavedImages();
  images.right = images.right.filter(img => img !== url);
  saveImages(images);
}

// ============================================================================
// VIEWER MANAGEMENT
// ============================================================================

function resetViewer1() {
  currentUrl1 = '';
  imageNatural1 = { w: 0, h: 0 };
  mainImg1.src = '';
  viewer1.classList.remove('loaded');
  empty1.style.display = 'block';
  lens1.style.display = 'none';
}

function resetViewer2() {
  currentUrl2 = '';
  imageNatural2 = { w: 0, h: 0 };
  mainImg2.src = '';
  viewer2.classList.remove('loaded');
  empty2.style.display = 'block';
  lens2.style.display = 'none';
}

function resetAll() {
  // Clear storage
  localStorage.removeItem(STORAGE_KEY);
  
  // Reset both viewers
  resetViewer1();
  resetViewer2();
  
  // Clear input
  urlInput.value = '';
  
  // Update thumbnails
  renderThumbnails();
  
  showToast('All images cleared');
}

async function loadImage1(url) {
  try {
    empty1.style.display = 'none';
    viewer1.classList.remove('loaded');
    currentUrl1 = url;

    mainImg1.onload = () => {
      imageNatural1 = { w: mainImg1.naturalWidth, h: mainImg1.naturalHeight };
      viewer1.classList.add('loaded');
      
      // Setup magnifier
      updateMagnifier1();
      
      // Save to left storage
      addLeftImage(url);
      
      // Update thumbnails
      renderThumbnails();
    };
    
    mainImg1.onerror = () => {
      showToast('Could not load image');
      resetViewer1();
    };
    
    mainImg1.removeAttribute('crossorigin');
    mainImg1.src = url;
  } catch (error) {
    showToast('Error loading image');
    resetViewer1();
  }
}

async function loadImage2(url) {
  try {
    empty2.style.display = 'none';
    viewer2.classList.remove('loaded');
    currentUrl2 = url;

    mainImg2.onload = () => {
      imageNatural2 = { w: mainImg2.naturalWidth, h: mainImg2.naturalHeight };
      viewer2.classList.add('loaded');
      
      // Setup magnifier
      updateMagnifier2();
      
      // Save to right storage
      addRightImage(url);
      
      // Update thumbnails
      renderThumbnails();
    };
    
    mainImg2.onerror = () => {
      showToast('Could not load image');
      resetViewer2();
    };
    
    mainImg2.removeAttribute('crossorigin');
    mainImg2.src = url;
  } catch (error) {
    showToast('Error loading image');
    resetViewer2();
  }
}

// ============================================================================
// THUMBNAIL MANAGEMENT - EXACTLY 2 THUMBNAILS
// ============================================================================

function renderThumbnails() {
  const images = getSavedImages();
  leftThumbs.innerHTML = '';
  rightThumbs.innerHTML = '';
  
  // Create left thumbnails
  images.left.forEach(url => {
    const leftThumb = createThumbnail(url, 'left', url === currentUrl1);
    leftThumbs.appendChild(leftThumb);
  });
  
  // Create right thumbnails
  images.right.forEach(url => {
    const rightThumb = createThumbnail(url, 'right', url === currentUrl2);
    rightThumbs.appendChild(rightThumb);
  });
}

function createThumbnail(url, side, isActive) {
  const el = document.createElement('div');
  el.className = `thumb${isActive ? ' active' : ''}`;
  el.title = `${side.toUpperCase()}: ${url}`;
  
  // Thumbnail image
  const img = document.createElement('img');
  img.loading = 'lazy';
  img.src = url;
  
  // Delete button
  const delBtn = document.createElement('button');
  delBtn.className = 'x';
  delBtn.textContent = '×';
  delBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteThumbnail(side, url);
  });
  
  // Click to load to appropriate side
  el.addEventListener('click', () => {
    if (side === 'left') {
      loadImage1(url);
    } else {
      loadImage2(url);
    }
  });
  
  el.appendChild(img);
  el.appendChild(delBtn);
  return el;
}

function deleteThumbnail(side, url) {
  if (side === 'left') {
    removeLeftImage(url);
    if (currentUrl1 === url) resetViewer1();
  } else {
    removeRightImage(url);
    if (currentUrl2 === url) resetViewer2();
  }
  
  renderThumbnails();
  showToast(`${side} image removed`);
}

// ============================================================================
// BUTTON EVENT HANDLERS
// ============================================================================

addLeftBtn.addEventListener('click', () => {
  const url = urlInput.value.trim();
  
  if (!/^https?:\/\//i.test(url)) {
    showToast('Enter a valid image URL');
    return;
  }
  
  // Always load to left viewer (replacing if necessary)
  loadImage1(url);
  urlInput.value = '';
});

addRightBtn.addEventListener('click', () => {
  const url = urlInput.value.trim();
  
  if (!/^https?:\/\//i.test(url)) {
    showToast('Enter a valid image URL');
    return;
  }
  
  // Always load to right viewer (replacing if necessary)
  loadImage2(url);
  urlInput.value = '';
});

urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    addLeftBtn.click();
  }
});

clearBtn.addEventListener('click', resetAll);

// ============================================================================
// MAGNIFIER SYSTEM
// ============================================================================

function updateMagnifier1() {
  if (currentUrl1 && imageNatural1.w > 0) {
    lens1.style.backgroundImage = `url('${currentUrl1}')`;
    lens1.style.backgroundSize = `${imageNatural1.w * zoomFactor1}px ${imageNatural1.h * zoomFactor1}px`;
  }
}

function updateMagnifier2() {
  if (currentUrl2 && imageNatural2.w > 0) {
    lens2.style.backgroundImage = `url('${currentUrl2}')`;
    lens2.style.backgroundSize = `${imageNatural2.w * zoomFactor2}px ${imageNatural2.h * zoomFactor2}px`;
  }
}

function setupMagnifier(viewer, lens, mainImg, imageNatural, zoomFactor, moveLensFunc) {
  viewer.addEventListener('mouseenter', (e) => {
    if (!mainImg.src) return;
    
    lens.style.display = 'block';
    moveLensFunc(e);
  });
  
  viewer.addEventListener('mousemove', moveLensFunc);
  viewer.addEventListener('mouseleave', () => {
    lens.style.display = 'none';
  });
}

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
  
  // Calculate background position for magnified view
  const imgRect = mainImg1.getBoundingClientRect();
  const imgX = clamp(e.clientX - imgRect.left, 0, imgRect.width);
  const imgY = clamp(e.clientY - imgRect.top, 0, imgRect.height);
  
  const bx = (imgX / imgRect.width) * (imageNatural1.w * zoomFactor1 - lens1.offsetWidth);
  const by = (imgY / imgRect.height) * (imageNatural1.h * zoomFactor1 - lens1.offsetHeight);
  
  lens1.style.backgroundPosition = `-${bx}px -${by}px`;
}

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
  
  // Calculate background position for magnified view
  const imgRect = mainImg2.getBoundingClientRect();
  const imgX = clamp(e.clientX - imgRect.left, 0, imgRect.width);
  const imgY = clamp(e.clientY - imgRect.top, 0, imgRect.height);
  
  const bx = (imgX / imgRect.width) * (imageNatural2.w * zoomFactor2 - lens2.offsetWidth);
  const by = (imgY / imgRect.height) * (imageNatural2.h * zoomFactor2 - lens2.offsetHeight);
  
  lens2.style.backgroundPosition = `-${bx}px -${by}px`;
}

// ============================================================================
// ZOOM CONTROLS
// ============================================================================

function setupZoomControl(zoomSlider, zoomValue, setZoomFactor, imageNatural, lens, currentUrl, updateMagnifierFunc) {
  // Wheel zoom
  zoomSlider.parentElement.parentElement.parentElement.addEventListener('wheel', (e) => {
    if (!currentUrl) return;
    
    e.preventDefault();
    const step = e.deltaY > 0 ? -0.1 : 0.1;
    const next = clamp(parseFloat(zoomSlider.value) + step, parseFloat(zoomSlider.min), parseFloat(zoomSlider.max));
    
    if (next !== parseFloat(zoomSlider.value)) {
      zoomSlider.value = next.toFixed(1);
      zoomSlider.dispatchEvent(new Event('input'));
    }
  }, { passive: false });
  
  // Slider input
  zoomSlider.addEventListener('input', () => {
    const factor = parseFloat(zoomSlider.value);
    setZoomFactor(factor);
    zoomValue.textContent = factor.toFixed(1) + '×';
    updateMagnifierFunc();
  });
}

// ============================================================================
// INITIALIZATION
// ============================================================================

function initialize() {
  // Setup magnifiers
  setupMagnifier(viewer1, lens1, mainImg1, imageNatural1, zoomFactor1, moveLens1);
  setupMagnifier(viewer2, lens2, mainImg2, imageNatural2, zoomFactor2, moveLens2);
  
  // Setup zoom controls
  setupZoomControl(zoom1, zoomVal1, (f) => { zoomFactor1 = f; }, imageNatural1, lens1, currentUrl1, updateMagnifier1);
  setupZoomControl(zoom2, zoomVal2, (f) => { zoomFactor2 = f; }, imageNatural2, lens2, currentUrl2, updateMagnifier2);
  
  // Load saved images
  renderThumbnails();
  const savedImages = getSavedImages();
  
  if (savedImages.left.length > 0) {
    loadImage1(savedImages.left[0]);
  }
  if (savedImages.right.length > 0) {
    loadImage2(savedImages.right[0]);
  }
}

// Start the application
initialize();
