    function toggleMenu() {
    const menu = document.getElementById('menu');
    const hamburger = document.querySelector('.hamburger-icon');
    menu.classList.toggle('active');
    
    if (menu.classList.contains('active')) {
        hamburger.innerHTML = '&#10006;'; // Cross icon (X)
    } else {
        hamburger.innerHTML = '&#9776;'; // Three lines icon
    }
}
  
  // Set current year in footer
   document.getElementById('year').textContent = new Date().getFullYear();
    
    
      // Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    const imageUpload = document.getElementById('image-upload');
    const fileInfo = document.getElementById('file-info');
    const imageList = document.getElementById('image-list');
    const previewCanvas = document.getElementById('preview-canvas');
    const ctx = previewCanvas.getContext('2d');
    const generatePdfBtn = document.getElementById('generate-pdf');
    const clearAllBtn = document.getElementById('clear-all');
    
    // Toolbar buttons
    const cropBtn = document.getElementById('crop-btn');
    const rotateLeftBtn = document.getElementById('rotate-left-btn');
    const rotateRightBtn = document.getElementById('rotate-right-btn');
    const flipHBtn = document.getElementById('flip-h-btn');
    const flipVBtn = document.getElementById('flip-v-btn');
    const filterSelect = document.getElementById('filter-select');
    const resetBtn = document.getElementById('reset-btn');
    
    // Crop elements
    const cropOverlay = document.getElementById('crop-overlay');
    const cropArea = document.getElementById('crop-area');
    const applyCropBtn = document.getElementById('apply-crop');
    const cancelCropBtn = document.getElementById('cancel-crop');
    
    // State variables
    let images = [];
    let currentImageIndex = 0;
    let isCropping = false;
    let cropStartX, cropStartY, cropEndX, cropEndY;
    let isDragging = false;
    
    // Initialize canvas
    function initCanvas() {
        previewCanvas.width = 800;
        previewCanvas.height = 600;
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#666';
        ctx.font = '20px Arial';
        ctx.fillText('Upload an image to start editing', previewCanvas.width / 2, previewCanvas.height / 2);
    }
    
    // Handle file upload
    imageUpload.addEventListener('change', function(e) {
        const files = e.target.files;
        if (files.length === 0) return;
        
        images = [];
        imageList.innerHTML = '';
        
        Array.from(files).forEach((file, index) => {
            if (!file.type.match('image.*')) return;
            
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    images.push({
                        element: img,
                        file: file,
                        filters: {
                            grayscale: false,
                            sepia: false,
                            invert: false,
                            blur: false,
                            brightness: 100,
                            contrast: 100
                        },
                        rotation: 0,
                        flip: {
                            horizontal: false,
                            vertical: false
                        },
                        crop: null
                    });
                    
                    // Create thumbnail
                    const thumbnail = document.createElement('img');
                    thumbnail.src = event.target.result;
                    thumbnail.className = 'thumbnail';
                    thumbnail.dataset.index = index;
                    thumbnail.addEventListener('click', function() {
                        currentImageIndex = index;
                        updatePreview();
                        document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                        this.classList.add('active');
                    });
                    
                    imageList.appendChild(thumbnail);
                    
                    // If first image, display it
                    if (index === 0) {
                        currentImageIndex = 0;
                        thumbnail.classList.add('active');
                        updatePreview();
                    }
                    
                    // Enable generate PDF button
                    if (images.length > 0) {
                        generatePdfBtn.disabled = false;
                    }
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
        
        fileInfo.textContent = `${files.length} file(s) selected`;
    });
    
    // Update the preview canvas with the current image and applied filters
    function updatePreview() {
        if (images.length === 0) {
            initCanvas();
            return;
        }
        
        const currentImage = images[currentImageIndex];
        const img = currentImage.element;
        
        // Calculate dimensions based on rotation
        let width = img.width;
        let height = img.height;
        
        if (currentImage.rotation % 180 !== 0) {
            [width, height] = [height, width];
        }
        
        // Set canvas size to fit the image (with max dimensions)
        const maxWidth = 800;
        const maxHeight = 600;
        let scale = Math.min(maxWidth / width, maxHeight / height);
        
        previewCanvas.width = width * scale;
        previewCanvas.height = height * scale;
        
        ctx.save();
        ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        
        // Apply transformations
        ctx.translate(previewCanvas.width / 2, previewCanvas.height / 2);
        ctx.rotate(currentImage.rotation * Math.PI / 180);
        
        // Apply flip
        let scaleX = currentImage.flip.horizontal ? -1 : 1;
        let scaleY = currentImage.flip.vertical ? -1 : 1;
        ctx.scale(scaleX, scaleY);
        
        // Draw image
        ctx.drawImage(
            img,
            -width * scale / 2,
            -height * scale / 2,
            width * scale,
            height * scale
        );
        
        // Apply filters
        if (currentImage.filters.grayscale) {
            applyGrayscale();
        }
        if (currentImage.filters.sepia) {
            applySepia();
        }
        if (currentImage.filters.invert) {
            applyInvert();
        }
        if (currentImage.filters.blur) {
            applyBlur();
        }
        if (currentImage.filters.brightness !== 100) {
            applyBrightness(currentImage.filters.brightness);
        }
        if (currentImage.filters.contrast !== 100) {
            applyContrast(currentImage.filters.contrast);
        }
        
        ctx.restore();
    }
    
    // Filter functions
    function applyGrayscale() {
        const imageData = ctx.getImageData(0, 0, previewCanvas.width, previewCanvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = avg; // R
            data[i + 1] = avg; // G
            data[i + 2] = avg; // B
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
    
    function applySepia() {
        const imageData = ctx.getImageData(0, 0, previewCanvas.width, previewCanvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
            data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
            data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
    
    function applyInvert() {
        const imageData = ctx.getImageData(0, 0, previewCanvas.width, previewCanvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i]; // R
            data[i + 1] = 255 - data[i + 1]; // G
            data[i + 2] = 255 - data[i + 2]; // B
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
    
    function applyBlur() {
        // Simple box blur implementation
        const imageData = ctx.getImageData(0, 0, previewCanvas.width, previewCanvas.height);
        const data = imageData.data;
        const tempData = new Uint8ClampedArray(data.length);
        
        const radius = 2;
        const width = previewCanvas.width;
        const height = previewCanvas.height;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let r = 0, g = 0, b = 0, a = 0, count = 0;
                
                for (let dy = -radius; dy <= radius; dy++) {
                    for (let dx = -radius; dx <= radius; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;
                        
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            const i = (ny * width + nx) * 4;
                            r += data[i];
                            g += data[i + 1];
                            b += data[i + 2];
                            a += data[i + 3];
                            count++;
                        }
                    }
                }
                
                const i = (y * width + x) * 4;
                tempData[i] = r / count;
                tempData[i + 1] = g / count;
                tempData[i + 2] = b / count;
                tempData[i + 3] = a / count;
            }
        }
        
        ctx.putImageData(new ImageData(tempData, width, height), 0, 0);
    }
    
    function applyBrightness(value) {
        const imageData = ctx.getImageData(0, 0, previewCanvas.width, previewCanvas.height);
        const data = imageData.data;
        const factor = value / 100;
        
        for (let i = 0; i < data.length; i += 4) {
            data[i] = data[i] * factor;
            data[i + 1] = data[i + 1] * factor;
            data[i + 2] = data[i + 2] * factor;
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
    
    function applyContrast(value) {
        const imageData = ctx.getImageData(0, 0, previewCanvas.width, previewCanvas.height);
        const data = imageData.data;
        const factor = (259 * (value + 255)) / (255 * (259 - value));
        
        for (let i = 0; i < data.length; i += 4) {
            data[i] = factor * (data[i] - 128) + 128;
            data[i + 1] = factor * (data[i + 1] - 128) + 128;
            data[i + 2] = factor * (data[i + 2] - 128) + 128;
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
    
    // Toolbar button event listeners
    cropBtn.addEventListener('click', function() {
        if (images.length === 0) return;
        
        isCropping = true;
        cropOverlay.classList.remove('hidden');
        
        // Initialize crop area
        const canvasRect = previewCanvas.getBoundingClientRect();
        const cropSize = Math.min(canvasRect.width, canvasRect.height) * 0.6;
        
        cropArea.style.width = `${cropSize}px`;
        cropArea.style.height = `${cropSize}px`;
        cropArea.style.left = `${(canvasRect.width - cropSize) / 2}px`;
        cropArea.style.top = `${(canvasRect.height - cropSize) / 2}px`;
        
        cropStartX = (canvasRect.width - cropSize) / 2;
        cropStartY = (canvasRect.height - cropSize) / 2;
        cropEndX = cropStartX + cropSize;
        cropEndY = cropStartY + cropSize;
    });
    
    rotateLeftBtn.addEventListener('click', function() {
        if (images.length === 0) return;
        images[currentImageIndex].rotation -= 90;
        updatePreview();
    });
    
    rotateRightBtn.addEventListener('click', function() {
        if (images.length === 0) return;
        images[currentImageIndex].rotation += 90;
        updatePreview();
    });
    
    flipHBtn.addEventListener('click', function() {
        if (images.length === 0) return;
        images[currentImageIndex].flip.horizontal = !images[currentImageIndex].flip.horizontal;
        updatePreview();
    });
    
    flipVBtn.addEventListener('click', function() {
        if (images.length === 0) return;
        images[currentImageIndex].flip.vertical = !images[currentImageIndex].flip.vertical;
        updatePreview();
    });
    
    filterSelect.addEventListener('change', function() {
        if (images.length === 0) return;
        
        const currentImage = images[currentImageIndex];
        const filter = this.value;
        
        // Reset all filters first
        currentImage.filters = {
            grayscale: false,
            sepia: false,
            invert: false,
            blur: false,
            brightness: 100,
            contrast: 100
        };
        
        // Apply selected filter
        switch (filter) {
            case 'grayscale':
                currentImage.filters.grayscale = true;
                break;
            case 'sepia':
                currentImage.filters.sepia = true;
                break;
            case 'invert':
                currentImage.filters.invert = true;
                break;
            case 'blur':
                currentImage.filters.blur = true;
                break;
            case 'brightness':
                currentImage.filters.brightness = 150; // Default brightness value
                break;
            case 'contrast':
                currentImage.filters.contrast = 150; // Default contrast value
                break;
        }
        
        updatePreview();
    });
    
    resetBtn.addEventListener('click', function() {
        if (images.length === 0) return;
        
        images[currentImageIndex].filters = {
            grayscale: false,
            sepia: false,
            invert: false,
            blur: false,
            brightness: 100,
            contrast: 100
        };
        images[currentImageIndex].rotation = 0;
        images[currentImageIndex].flip = {
            horizontal: false,
            vertical: false
        };
        images[currentImageIndex].crop = null;
        
        filterSelect.value = 'none';
        updatePreview();
    });
    
    // Crop functionality
    cropArea.addEventListener('mousedown', function(e) {
        isDragging = true;
        const rect = cropArea.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        
        document.addEventListener('mousemove', dragCropArea);
        document.addEventListener('mouseup', stopDragCropArea);
        
        function dragCropArea(e) {
            if (!isDragging) return;
            
            const canvasRect = previewCanvas.getBoundingClientRect();
            const newLeft = e.clientX - canvasRect.left - offsetX;
            const newTop = e.clientY - canvasRect.top - offsetY;
            
            // Constrain to canvas bounds
            const maxLeft = canvasRect.width - rect.width;
            const maxTop = canvasRect.height - rect.height;
            
            cropArea.style.left = `${Math.max(0, Math.min(maxLeft, newLeft))}px`;
            cropArea.style.top = `${Math.max(0, Math.min(maxTop, newTop))}px`;
            
            cropStartX = parseInt(cropArea.style.left);
            cropStartY = parseInt(cropArea.style.top);
            cropEndX = cropStartX + rect.width;
            cropEndY = cropStartY + rect.height;
        }
        
        function stopDragCropArea() {
            isDragging = false;
            document.removeEventListener('mousemove', dragCropArea);
            document.removeEventListener('mouseup', stopDragCropArea);
        }
    });
    
    applyCropBtn.addEventListener('click', function() {
        if (images.length === 0) return;
        
        const currentImage = images[currentImageIndex];
        const canvasRect = previewCanvas.getBoundingClientRect();
        const scaleX = currentImage.element.width / canvasRect.width;
        const scaleY = currentImage.element.height / canvasRect.height;
        
        currentImage.crop = {
            x: cropStartX * scaleX,
            y: cropStartY * scaleY,
            width: (cropEndX - cropStartX) * scaleX,
            height: (cropEndY - cropStartY) * scaleY
        };
        
        // Create a new image with the cropped area
        const canvas = document.createElement('canvas');
        canvas.width = currentImage.crop.width;
        canvas.height = currentImage.crop.height;
        const cropCtx = canvas.getContext('2d');
        
        cropCtx.drawImage(
            currentImage.element,
            currentImage.crop.x,
            currentImage.crop.y,
            currentImage.crop.width,
            currentImage.crop.height,
            0,
            0,
            currentImage.crop.width,
            currentImage.crop.height
        );
        
        const croppedImg = new Image();
        croppedImg.onload = function() {
            currentImage.element = croppedImg;
            currentImage.crop = null;
            isCropping = false;
            cropOverlay.classList.add('hidden');
            updatePreview();
        };
        croppedImg.src = canvas.toDataURL();
    });
    
    cancelCropBtn.addEventListener('click', function() {
        isCropping = false;
        cropOverlay.classList.add('hidden');
    });
    
    // Generate PDF
    generatePdfBtn.addEventListener('click', async function() {
        if (images.length === 0) return;
        
        // Use jsPDF to create PDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        
        for (let i = 0; i < images.length; i++) {
            const img = images[i].element;
            
            // Calculate dimensions to fit PDF page (A4 size: 210x297mm)
            const pdfWidth = pdf.internal.pageSize.getWidth() - 20; // 20mm margin
            const pdfHeight = pdf.internal.pageSize.getHeight() - 20;
            
            let imgWidth = img.width;
            let imgHeight = img.height;
            
            // Account for rotation
            if (images[i].rotation % 180 !== 0) {
                [imgWidth, imgHeight] = [imgHeight, imgWidth];
            }
            
            // Calculate scaling factor
            const scale = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const scaledWidth = imgWidth * scale;
            const scaledHeight = imgHeight * scale;
            
            // Create a canvas to apply all transformations and filters
            const canvas = document.createElement('canvas');
            canvas.width = imgWidth;
            canvas.height = imgHeight;
            const tempCtx = canvas.getContext('2d');
            
            // Apply transformations
            tempCtx.save();
            tempCtx.translate(canvas.width / 2, canvas.height / 2);
            tempCtx.rotate(images[i].rotation * Math.PI / 180);
            
            // Apply flip
            const scaleX = images[i].flip.horizontal ? -1 : 1;
            const scaleY = images[i].flip.vertical ? -1 : 1;
            tempCtx.scale(scaleX, scaleY);
            
            // Draw image
            tempCtx.drawImage(
                img,
                -imgWidth / 2,
                -imgHeight / 2,
                imgWidth,
                imgHeight
            );
            
            // Apply filters
            if (images[i].filters.grayscale) {
                const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                for (let j = 0; j < data.length; j += 4) {
                    const avg = (data[j] + data[j + 1] + data[j + 2]) / 3;
                    data[j] = avg;
                    data[j + 1] = avg;
                    data[j + 2] = avg;
                }
                
                tempCtx.putImageData(imageData, 0, 0);
            }
            
            if (images[i].filters.sepia) {
                const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                for (let j = 0; j < data.length; j += 4) {
                    const r = data[j];
                    const g = data[j + 1];
                    const b = data[j + 2];
                    
                    data[j] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
                    data[j + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
                    data[j + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
                }
                
                tempCtx.putImageData(imageData, 0, 0);
            }
            
            if (images[i].filters.invert) {
                const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                for (let j = 0; j < data.length; j += 4) {
                    data[j] = 255 - data[j];
                    data[j + 1] = 255 - data[j + 1];
                    data[j + 2] = 255 - data[j + 2];
                }
                
                tempCtx.putImageData(imageData, 0, 0);
            }
            
            tempCtx.restore();
            
            // Add image to PDF
            if (i > 0) {
                pdf.addPage();
            }
            
            pdf.addImage(
                canvas.toDataURL('image/jpeg', 0.8),
                'JPEG',
                10,
                10,
                scaledWidth,
                scaledHeight
            );
        }
        
        // Save PDF
        pdf.save('images.pdf');
    });
    
    // Clear all images
    clearAllBtn.addEventListener('click', function() {
        images = [];
        imageList.innerHTML = '';
        fileInfo.textContent = 'No files selected';
        generatePdfBtn.disabled = true;
        initCanvas();
    });
    
    // Initialize the app
    initCanvas();
});