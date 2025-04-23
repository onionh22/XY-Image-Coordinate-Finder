const body = document.body;
const themeToggleBtn = document.getElementById('theme-toggle-btn'); 
const unifiedInputBox = document.getElementById('unified-input-box');
const fileInput = document.getElementById('file-input');
const uploadContainer = document.getElementById('upload-container');
const imageWorkspace = document.getElementById('image-workspace');
const imageContainer = document.getElementById('image-container');
const image = document.getElementById('image');
const coordXValue = document.getElementById('coord-x-value');
const coordYValue = document.getElementById('coord-y-value');
const imageSizeText = document.getElementById('image-size');
const clearBtn = document.getElementById('clear-btn');
const copyInfoBtn = document.getElementById('copy-info-btn');
const loadingIndicator = document.getElementById('loading-indicator');
const fileName = document.getElementById('file-name');
const fileType = document.getElementById('file-type');
const fileSize = document.getElementById('file-size');
const dimensions = document.getElementById('dimensions');
const aspectRatio = document.getElementById('aspect-ratio');

let currentFile = null;
let lastCoordinates = { x: null, y: null };

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(savedTheme || (prefersDark ? 'dark' : 'light')); 
}

function setTheme(theme) {

    document.documentElement.setAttribute('data-theme', theme);

    if (theme === 'dark') {

        themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
        themeToggleBtn.title = 'Switch to Light Mode';
    } else {

        themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
        themeToggleBtn.title = 'Switch to Dark Mode';
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    processFile(file);
}
function handleDragOver(e) {
    e.preventDefault();
    unifiedInputBox.classList.add('active');
}
function handleDragLeave(e) {
    e.preventDefault();
    unifiedInputBox.classList.remove('active');
}
function handleDrop(e) {
    e.preventDefault();
    unifiedInputBox.classList.remove('active');
    const file = e.dataTransfer.files[0];
    processFile(file);
}
function handlePaste(e) {

    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
        return;
    }
    const items = (e.clipboardData || window.clipboardData).items;
    let foundImage = false;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();

            const pastedFile = new File([blob], `pasted-image.${blob.type.split('/')[1] || 'png'}`, { type: blob.type });
            processFile(pastedFile);
            foundImage = true;
            break; 
        }
    }

    if (!foundImage && uploadContainer.style.display !== 'none') {
         showNotification('No image found in clipboard.');
    }
}
 function processFile(file) {
    if (file && file.type.startsWith('image/')) {
        showLoading();
        currentFile = file; 
        loadImage(file);
    } else if (file) {
         showNotification('Invalid file type. Please upload an image.');
    }

     fileInput.value = '';
}

 function showLoading() {
    loadingIndicator.style.display = 'flex';
}
function hideLoading() {
    loadingIndicator.style.display = 'none';
}
function loadImage(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        image.src = e.target.result;
        image.onload = function() {
            hideLoading();
            uploadContainer.style.display = 'none';
            imageWorkspace.style.display = 'flex'; 
            imageSizeText.textContent = `Image dimensions: ${image.naturalWidth} × ${image.naturalHeight} pixels`;
            resetCoordinatesDisplay(); 
            updateImageDetails(currentFile, image.naturalWidth, image.naturalHeight); 
            showNotification('Image loaded! Click anywhere to get coordinates.');
        };

         image.onerror = function() {
             hideLoading();
             showNotification('Error loading image. Please try a different file.');
             clearImage(); 
         };
    };

     reader.onerror = function() {
         hideLoading();
         showNotification('Error reading file.');
         clearImage(); 
     };
    reader.readAsDataURL(file);
}

function handleImageClick(e) {

    document.querySelectorAll('.click-marker').forEach(marker => marker.remove());

    const rect = image.getBoundingClientRect();

    if (image.naturalWidth === 0 || image.naturalHeight === 0) {
        console.error("Image natural dimensions are zero. Cannot calculate coordinates.");
        showNotification("Error: Could not get image dimensions.");
        return; 
    }

    const scaleX = image.naturalWidth / rect.width;
    const scaleY = image.naturalHeight / rect.height;

    const clickXRelative = e.clientX - rect.left;
    const clickYRelative = e.clientY - rect.top;

    const x = Math.max(0, Math.min(image.naturalWidth, Math.round(clickXRelative * scaleX)));
    const y = Math.max(0, Math.min(image.naturalHeight, Math.round(clickYRelative * scaleY)));

    coordXValue.classList.remove('coordinate-value-updated');
    coordYValue.classList.remove('coordinate-value-updated');
    void coordXValue.offsetWidth; 
    void coordYValue.offsetWidth; 

    coordXValue.textContent = ` ${x}`; 
    coordYValue.textContent = ` ${y}`;
    lastCoordinates = { x, y }; 

    coordXValue.classList.add('coordinate-value-updated');
    coordYValue.classList.add('coordinate-value-updated');

    setTimeout(() => {
        coordXValue.classList.remove('coordinate-value-updated');
        coordYValue.classList.remove('coordinate-value-updated');
    }, 400); 

    const marker = document.createElement('div');
    marker.className = 'click-marker';
    marker.style.left = `${clickXRelative}px`; 
    marker.style.top = `${clickYRelative}px`;
    imageContainer.appendChild(marker); 
}

function resetCoordinatesDisplay() {
    coordXValue.textContent = ' --';
    coordYValue.textContent = ' --';
    lastCoordinates = { x: null, y: null };
    imageSizeText.textContent = 'Click on the image to get coordinates'; 
    document.querySelectorAll('.click-marker').forEach(marker => marker.remove()); 

     coordXValue.classList.remove('coordinate-value-updated');
     coordYValue.classList.remove('coordinate-value-updated');
}

 function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function gcd(a, b) {
    return b === 0 ? a : gcd(b, a % b);
}

function calculateAspectRatio(width, height) {
    if (width === 0 || height === 0) return '--'; 
    const divisor = gcd(width, height);
    return `${width / divisor}:${height / divisor}`;
}
function updateImageDetails(file, imgWidth, imgHeight) {
    fileName.textContent = file?.name || 'Pasted Image'; 
    fileType.textContent = file?.type || 'Unknown'; 
    fileSize.textContent = file?.size ? formatFileSize(file.size) : '--'; 
    dimensions.textContent = `${imgWidth} × ${imgHeight} px`;
    aspectRatio.textContent = calculateAspectRatio(imgWidth, imgHeight);
}
function resetImageDetails() {
    fileName.textContent = '--';
    fileType.textContent = '--';
    fileSize.textContent = '--';
    dimensions.textContent = '--';
    aspectRatio.textContent = '--';
}

 function copyImageInfo() {
     if (!currentFile) {
         showNotification('No image loaded to copy details from.');
         return;
     }

    let imageInfoText = `Image Details:\n`;
    imageInfoText += `- File Name: ${fileName.textContent}\n`;
    imageInfoText += `- File Type: ${fileType.textContent}\n`;
    imageInfoText += `- File Size: ${fileSize.textContent}\n`;
    imageInfoText += `- Dimensions: ${dimensions.textContent}\n`;
    imageInfoText += `- Aspect Ratio: ${aspectRatio.textContent}`;

    if (lastCoordinates.x !== null && lastCoordinates.y !== null) {
        imageInfoText += `\n\nLast Clicked Coordinates:\n`;
        imageInfoText += `- X: ${lastCoordinates.x}\n`;
        imageInfoText += `- Y: ${lastCoordinates.y}`;
    }

    navigator.clipboard.writeText(imageInfoText.trim())
        .then(() => {
            showNotification('Image details copied to clipboard!');
        })
        .catch(err => {
            console.error('Failed to copy text: ', err);
            showNotification('Error copying details.');
        });
}
function clearImage() {

    image.src = '';
    image.onload = null;
    image.onerror = null;

    imageWorkspace.style.display = 'none';
    uploadContainer.style.display = 'block'; 

    fileInput.value = ''; 
    resetCoordinatesDisplay();
    resetImageDetails();
    currentFile = null; 
    document.querySelectorAll('.click-marker').forEach(marker => marker.remove()); 
}
function showNotification(message) {

    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = 'notification';

    notification.innerHTML = `<span class="icon" style="font-size: 18px;">ℹ️</span> ${message}`;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0'; 

        setTimeout(() => notification.remove(), 300); 
    }, 3000); 
}

themeToggleBtn.addEventListener('click', toggleTheme); 
unifiedInputBox.addEventListener('click', () => fileInput.click()); 
fileInput.addEventListener('change', handleFileUpload); 

unifiedInputBox.addEventListener('dragover', handleDragOver);
unifiedInputBox.addEventListener('dragleave', handleDragLeave);
unifiedInputBox.addEventListener('drop', handleDrop);

document.addEventListener('paste', handlePaste);

image.addEventListener('click', handleImageClick);

clearBtn.addEventListener('click', clearImage);
copyInfoBtn.addEventListener('click', copyImageInfo);

if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {

        if (!localStorage.getItem('theme')) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });
}

initTheme(); 