        document.addEventListener('DOMContentLoaded', function() {
            // Set current year in footer
            document.getElementById('year').textContent = new Date().getFullYear();
            
            // Store uploaded files
            let uploadedFiles = [];
            const fileList = document.getElementById('fileList');
            const emptyMessage = document.getElementById('emptyMessage');
            const pdfFilesInput = document.getElementById('pdfFiles');
            const mergeBtn = document.getElementById('mergeBtn');
            const statusElement = document.getElementById('status');
            const spinner = document.getElementById('spinner');
            
            // Initialize sortable list
            new Sortable(fileList, {
                animation: 150,
                handle: '.drag-handle',
                onEnd: function() {
                    // Update the files array to match the new order
                    const items = fileList.querySelectorAll('.file-item');
                    const newOrder = Array.from(items).map(item => {
                        return uploadedFiles.find(file => file.id === item.dataset.id);
                    });
                    uploadedFiles = newOrder;
                }
            });
            
            // Handle file selection
            pdfFilesInput.addEventListener('change', function() {
                if (this.files.length > 0) {
                    emptyMessage.style.display = 'none';
                    
                    // Add new files to the list
                    Array.from(this.files).forEach(file => {
                        // Check if file is already added
                        if (!uploadedFiles.some(f => f.name === file.name && f.size === file.size)) {
                            const fileId = 'file-' + Math.random().toString(36).substr(2, 9);
                            uploadedFiles.push({
                                id: fileId,
                                file: file,
                                name: file.name,
                                size: file.size
                            });
                            
                            addFileToList(fileId, file.name, file.size);
                        }
                    });
                    
                    // Reset file input
                    this.value = '';
                }
            });
            
            // Add file to the visual list
            function addFileToList(id, name, size) {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';
                fileItem.dataset.id = id;
                fileItem.innerHTML = `
                    <span class="drag-handle">☰</span>
                    <span class="file-name">${name}</span>
                    <span class="file-size">${formatFileSize(size)}</span>
                    <button class="remove-btn" data-id="${id}">×</button>
                `;
                fileList.appendChild(fileItem);
                
                // Add remove event
                fileItem.querySelector('.remove-btn').addEventListener('click', function() {
                    removeFile(id);
                });
            }
            
            // Remove file from list
            function removeFile(id) {
                // Remove from array
                uploadedFiles = uploadedFiles.filter(file => file.id !== id);
                
                // Remove from DOM
                const itemToRemove = fileList.querySelector(`[data-id="${id}"]`);
                if (itemToRemove) {
                    fileList.removeChild(itemToRemove);
                }
                
                // Show empty message if no files left
                if (uploadedFiles.length === 0) {
                    emptyMessage.style.display = 'block';
                }
            }
            
            // Merge PDFs button click
            mergeBtn.addEventListener('click', async function() {
                if (uploadedFiles.length < 2) {
                    statusElement.textContent = 'Please select at least 2 PDF files to merge.';
                    statusElement.className = 'error';
                    return;
                }
                
                // Show loading spinner
                spinner.style.display = 'block';
                mergeBtn.disabled = true;
                statusElement.className = '';
                statusElement.textContent = '';
                
                try {
                    // Create a new PDF document
                    const mergedPdf = await PDFLib.PDFDocument.create();
                    
                    // Process each file in order
                    for (const fileInfo of uploadedFiles) {
                        const file = fileInfo.file;
                        const fileArrayBuffer = await file.arrayBuffer();
                        
                        try {
                            // Try to load the PDF
                            const pdfDoc = await PDFLib.PDFDocument.load(fileArrayBuffer);
                            
                            // Copy pages to merged PDF
                            const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                            pages.forEach(page => mergedPdf.addPage(page));
                        } catch (error) {
                            console.error(`Error processing ${file.name}:`, error);
                            throw new Error(`Failed to process "${file.name}". It may not be a valid PDF file.`);
                        }
                    }
                    
                    // Save the merged PDF
                    const mergedPdfBytes = await mergedPdf.save();
                    
                    // Create a blob and download it
                    const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
                    const fileName = 'merged-document.pdf';
                    saveAs(blob, fileName);
                    
                    // Show success message
                    statusElement.textContent = 'PDFs merged successfully! Your file is downloading now.';
                    statusElement.className = 'success';
                } catch (error) {
                    console.error('Merge error:', error);
                    statusElement.textContent = 'Error merging PDFs: ' + error.message;
                    statusElement.className = 'error';
                } finally {
                    // Hide loading spinner
                    spinner.style.display = 'none';
                    mergeBtn.disabled = false;
                }
            });
            
            // Format file size
            function formatFileSize(bytes) {
                if (bytes === 0) return '0 Bytes';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
            }
        });