import JSZip from 'jszip';
import { validateAndParseHtmlForm } from './htmlParser';

/**
 * Extracts and parses all <form> tags from all .html / .htm files in a ZIP archive.
 * @param {File} zipFile - The uploaded .zip file
 * @returns {Promise<Array>} List of detected forms with file source and parsed metadata
 */
export async function extractFormsFromZip(zipFile) {
  const zip = await JSZip.loadAsync(zipFile);
  const detectedForms = [];

  for (const filename of Object.keys(zip.files)) {
    const fileObj = zip.files[filename];
    if (!fileObj.dir && (filename.toLowerCase().endsWith('.html') || filename.toLowerCase().endsWith('.htm'))) {
      const htmlContent = await fileObj.async('text');
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      const formElements = Array.from(doc.querySelectorAll('form'));

      if (formElements.length > 0) {
        formElements.forEach((formEl, idx) => {
          const formId = formEl.getAttribute('id') || `form_${filename.replace(/[^a-zA-Z0-9]/g, '_')}_${idx + 1}`;
          const outerHtml = formEl.outerHTML;
          const parsed = validateAndParseHtmlForm(outerHtml);

          detectedForms.push({
            id: `${filename}-${formId}-${idx}`,
            filename,
            formId,
            rawHtml: outerHtml,
            parsed,
            fieldCount: parsed.fields ? parsed.fields.length : 0
          });
        });
      }
    }
  }

  return detectedForms;
}
