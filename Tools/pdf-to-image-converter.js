// Set the worker path for PDF.js
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.12.313/pdf.worker.min.js';
        
        // DOM elements
        const pdfUpload = document.getElementById('pdf-upload');
        const uploadTrigger = document.getElementById('upload-trigger');
        const gallery = document.getElementById('gallery');
        const downloadAllBtn = document.getElementById('download-all');
        const qualityBtns = document.querySelectorAll('.quality-btn');
        const statusElement = document.getElementById('status');
        const loadingElement = document.getElementById('loading');
        const modal = document.getElementById('image-modal');
        const modalImg = document.getElementById('modal-image');
        const closeBtn = document.querySelector('.close');
        
        // Variables
        let currentQuality = 'low';
        let convertedImages = [];
        
        // Event listeners
        uploadTrigger.addEventListener('click', () => pdfUpload.click());
        pdfUpload.addEventListener('change', handleFileUpload);
        downloadAllBtn.addEventListener('click', downloadAllImages);
        closeBtn.addEventListener('click', () => modal.style.display = 'none');
        
        // Set up drag and drop
        const uploadSection = document.querySelector('.upload-section');
        uploadSection.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadSection.style.borderColor = '#3498db';
            uploadSection.style.backgroundColor = '#eaf2f8';
        });
        
        uploadSection.addEventListener('dragleave', () => {
            uploadSection.style.borderColor = '#ccc';
            uploadSection.style.backgroundColor = '#f9f9f9';
        });
        
        uploadSection.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadSection.style.borderColor = '#ccc';
            uploadSection.style.backgroundColor = '#f9f9f9';
            
            if (e.dataTransfer.files.length) {
                pdfUpload.files = e.dataTransfer.files;
                handleFileUpload();
            }
        });
        
        // Quality selector
        qualityBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                qualityBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentQuality = btn.dataset.quality;
            });
        });
        
        // Handle file upload
        function handleFileUpload() {
            const file = pdfUpload.files[0];
            if (!file) return;
            
            // Reset
            gallery.innerHTML = '';
            downloadAllBtn.style.display = 'none';
            convertedImages = [];
            
            // Show loading
            loadingElement.style.display = 'block';
            statusElement.textContent = '';
            
            // Process PDF
            processPDF(file);
        }
        
        // Process PDF file
        async function processPDF(file) {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
                
                statusElement.textContent = `Processing ${pdf.numPages} page(s)...`;
                
                // Determine scale based on quality
                let scale;
                switch(currentQuality) {
                    case 'high':
                        scale = 2.0;
                        break;
                    case 'medium':
                        scale = 1.5;
                        break;
                    case 'low':
                    default:
                        scale = 1.0;
                }
                
                // Convert each page to image
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale });
                    
                    // Create canvas
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    
                    // Render PDF page to canvas
                    await page.render({
                        canvasContext: context,
                        viewport: viewport
                    }).promise;
                    
                    // Convert canvas to image
                    const imageData = canvas.toDataURL('image/jpeg', 0.8);
                    convertedImages.push({
                        data: imageData,
                        pageNumber: i
                    });
                    
                    // Update status
                    statusElement.textContent = `Processed ${i} of ${pdf.numPages} pages...`;
                    
                    // Add to gallery
                    addImageToGallery(imageData, i);
                }
                
                // Show download all button
                if (convertedImages.length > 0) {
                    downloadAllBtn.style.display = 'block';
                }
                
                statusElement.textContent = `Successfully converted ${pdf.numPages} page(s) to images.`;
            } catch (error) {
                console.error('Error processing PDF:', error);
                statusElement.textContent = 'Error processing PDF: ' + error.message;
            } finally {
                loadingElement.style.display = 'none';
            }
        }
        
        // Add image to gallery
        function addImageToGallery(imageData, pageNumber) {
            const container = document.createElement('div');
            container.className = 'image-container';
            
            const img = document.createElement('img');
            img.src = imageData;
            img.className = 'thumbnail';
            img.alt = `Page ${pageNumber}`;
            img.onclick = () => openModal(imageData);
            
            const infoDiv = document.createElement('div');
            infoDiv.className = 'image-info';
            infoDiv.innerHTML = `
                <p>Page ${pageNumber}</p>
                <button class="download-btn" data-index="${convertedImages.length - 1}">Download</button>
            `;
            
            container.appendChild(img);
            container.appendChild(infoDiv);
            gallery.appendChild(container);
            
            // Add download event to the button
            const downloadBtn = container.querySelector('.download-btn');
            downloadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                downloadImage(convertedImages[downloadBtn.dataset.index]);
            });
        }
        
        // Open image in modal
        function openModal(imageData) {
            modal.style.display = 'block';
            modalImg.src = imageData;
        }
        
        // Close modal when clicking outside image
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // Download single image
        function downloadImage(image) {
            const link = document.createElement('a');
            link.href = image.data;
            link.download = `page_${image.pageNumber}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        
        // Download all images as ZIP
        async function downloadAllImages() {
            if (convertedImages.length === 0) return;
            
            loadingElement.style.display = 'block';
            statusElement.textContent = 'Preparing download...';
            
            try {
                const zip = new JSZip();
                const imgFolder = zip.folder('pdf_images');
                
                // Add each image to the ZIP
                convertedImages.forEach((image, index) => {
                    const base64Data = image.data.split(',')[1];
                    imgFolder.file(`page_${image.pageNumber}.jpg`, base64Data, { base64: true });
                });
                
                // Generate the ZIP file
                const content = await zip.generateAsync({ type: 'blob' });
                saveAs(content, 'pdf_images.zip');
                
                statusElement.textContent = 'Download prepared successfully.';
            } catch (error) {
                console.error('Error creating ZIP:', error);
                statusElement.textContent = 'Error creating download: ' + error.message;
            } finally {
                loadingElement.style.display = 'none';
            }
        }