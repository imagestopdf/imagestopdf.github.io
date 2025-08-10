 document.addEventListener('DOMContentLoaded', function() {
            // Set current year in footer
            document.getElementById('year').textContent = new Date().getFullYear();
            
            // File input change handler
            document.getElementById('wordFile').addEventListener('change', function() {
                const file = this.files[0];
                if (file) {
                    document.getElementById('fileInfo').textContent = `Selected file: ${file.name} (${formatFileSize(file.size)})`;
                }
            });
            
            // Form submission
            document.getElementById('converterForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const fileInput = document.getElementById('wordFile');
                const statusElement = document.getElementById('status');
                const spinner = document.getElementById('spinner');
                const convertBtn = document.getElementById('convertBtn');
                
                // Validate input
                if (!fileInput.files || fileInput.files.length === 0) {
                    statusElement.textContent = 'Please select a Word file.';
                    statusElement.className = 'error';
                    return;
                }
                
                const file = fileInput.files[0];
                const fileName = file.name;
                const fileExt = fileName.split('.').pop().toLowerCase();
                
                if (!['docx', 'doc'].includes(fileExt)) {
                    statusElement.textContent = 'Please select a .docx or .doc file.';
                    statusElement.className = 'error';
                    return;
                }
                
                // Show loading spinner
                spinner.style.display = 'block';
                convertBtn.disabled = true;
                statusElement.className = '';
                statusElement.textContent = '';
                
                try {
                    // Read the file as array buffer
                    const arrayBuffer = await file.arrayBuffer();
                    
                    // Convert Word to HTML using mammoth.js
                    const result = await mammoth.extractRawText({arrayBuffer: arrayBuffer});
                    const text = result.value; // The raw text
                    const messages = result.messages; // Any messages, such as warnings during conversion
                    
                    // Create a new PDF document
                    const pdfDoc = await PDFLib.PDFDocument.create();
                    const page = pdfDoc.addPage([550, 750]);
                    
                    // Add the text to the PDF
                    const helveticaFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
                    const textSize = 12;
                    const lineHeight = 14;
                    const margin = 50;
                    let y = page.getHeight() - margin;
                    
                    // Split text into lines and add to PDF
                    const lines = text.split('\n');
                    for (const line of lines) {
                        if (y < margin) {
                            // Add new page if we run out of space
                            y = page.getHeight() - margin;
                            pdfDoc.addPage([550, 750]);
                        }
                        
                        page.drawText(line, {
                            x: margin,
                            y: y,
                            size: textSize,
                            font: helveticaFont,
                            color: PDFLib.rgb(0, 0, 0),
                        });
                        
                        y -= lineHeight;
                    }
                    
                    // Save the PDF
                    const pdfBytes = await pdfDoc.save();
                    
                    // Create a blob and download it
                    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                    const pdfFileName = fileName.replace(/\.[^/.]+$/, "") + '.pdf';
                    saveAs(blob, pdfFileName);
                    
                    // Show success message
                    statusElement.textContent = 'Conversion successful! Your PDF is downloading now.';
                    statusElement.className = 'success';
                    
                    // Show any conversion warnings
                    if (messages.length > 0) {
                        const warnings = messages.map(m => m.message).join('\n');
                        console.log('Conversion warnings:', warnings);
                    }
                } catch (error) {
                    console.error('Conversion error:', error);
                    statusElement.textContent = 'Error converting document: ' + error.message;
                    statusElement.className = 'error';
                } finally {
                    // Hide loading spinner
                    spinner.style.display = 'none';
                    convertBtn.disabled = false;
                }
            });
        });
        
        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }