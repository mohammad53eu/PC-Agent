import fs, { writeFile } from "fs/promises";
import puppeteer from "puppeteer";

export async function createPdf(
    title: string, 
    html: string,
    pdfPath: string,
    htmlPath: string 
) {   

    html = html.replace(/^```html\s*/gm, '').replace(/^```\s*$/gm, '')
    html = html.trim()

    if (!html.toLowerCase().startsWith('<!doctype')) {
    html = `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8">\n<title>${title}</title>\n</head>\n<body>\n${html}\n</body>\n</html>`;
    }

    console.log('HTML content length:', html.length)
    console.log('HTML starts with:', html.substring(0, 100))
    console.log('HTML ends with:', html.substring(html.length - 100))

    // await writeFile(htmlPath, html, 'utf-8')
    // console.log('HTML saved to:', htmlPath)

    try {
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage();
    

    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 10000
    })
    

    const pdfBuffer = await page.pdf({ 
      format: "A4",
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    })

    await browser.close();
    
    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('Generated PDF buffer is empty')
    }
    
    await writeFile(pdfPath, pdfBuffer);
    console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes')
    
    const stats = await fs.stat(pdfPath)

    return stats
  } catch (error) {
    console.error('PDF generation failed:', error)
    throw error
  }
}