/**
 * Parser & Strict Validator for HTML form code snippets.
 * Checks for opening <form> and closing </form> tags, input elements, and attributes.
 */
export function validateAndParseHtmlForm(htmlString) {
  const trimmed = (htmlString || '').trim();

  // 1. Check empty input
  if (!trimmed) {
    return {
      success: false,
      error: 'Please paste an HTML form code snippet to generate your backend.',
      fields: [],
      modelName: 'User',
      collectionName: 'users'
    };
  }

  // 2. Strict check for opening <form> tag
  const hasOpeningFormTag = /<form[\s>]/i.test(trimmed);
  if (!hasOpeningFormTag) {
    return {
      success: false,
      error: 'Invalid HTML: Missing opening <form> tag. Please wrap your inputs inside <form id="...">.',
      fields: [],
      modelName: 'User',
      collectionName: 'users'
    };
  }

  // 3. Strict check for closing </form> tag
  const hasClosingFormTag = /<\/form>/i.test(trimmed);
  if (!hasClosingFormTag) {
    return {
      success: false,
      error: 'Invalid HTML: Missing closing </form> tag. Please close your form with </form>.',
      fields: [],
      modelName: 'User',
      collectionName: 'users'
    };
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(trimmed, 'text/html');
    const formEl = doc.querySelector('form');

    if (!formEl) {
      return {
        success: false,
        error: 'Unable to parse <form> element. Check your HTML syntax.',
        fields: [],
        modelName: 'User',
        collectionName: 'users'
      };
    }

    const formId = formEl.getAttribute('id') || 'userForm';
    const formAction = formEl.getAttribute('action') || '/api/users';
    const formMethod = (formEl.getAttribute('method') || 'POST').toUpperCase();

    // Find all input elements inside the form
    const inputElements = Array.from(formEl.querySelectorAll('input, select, textarea'));

    const seenNames = new Set();
    const fields = [];

    inputElements.forEach((el, index) => {
      const type = (el.getAttribute('type') || '').toLowerCase();
      if (type === 'submit' || type === 'button' || type === 'hidden') return;

      const name = el.getAttribute('name') || el.getAttribute('id') || `field_${index + 1}`;
      
      // Prevent duplicate input fields (e.g. multiple radio options sharing name="gender")
      if (seenNames.has(name)) return;
      seenNames.add(name);

      const rawType = el.getAttribute('type') || el.tagName.toLowerCase();
      const placeholder = el.getAttribute('placeholder') || name;
      const required = el.hasAttribute('required');

      // Infer MongoDB / JS Data Type
      let dataType = 'String';
      let sampleVal = `${name}_value`;
      let options = [];
      let labelText = '';

      if (rawType === 'radio') {
        dataType = 'String';
        const radioEls = Array.from(formEl.querySelectorAll(`input[type="radio"][name="${name}"]`));
        options = radioEls.map(rEl => {
          const val = rEl.getAttribute('value') || 'option';
          let lbl = val.charAt(0).toUpperCase() + val.slice(1);
          
          const parentLabel = rEl.closest('label');
          if (parentLabel && parentLabel.textContent.trim()) {
            lbl = parentLabel.textContent.trim();
          } else if (rEl.nextSibling && rEl.nextSibling.nodeType === 3 && rEl.nextSibling.textContent.trim()) {
            lbl = rEl.nextSibling.textContent.trim();
          }
          return { value: val, label: lbl };
        });
        if (options.length > 0) {
          sampleVal = options[0].value;
        }
      } else if (rawType === 'checkbox') {
        dataType = 'Boolean';
        sampleVal = 'true';
        const parentLabel = el.closest('label');
        if (parentLabel && parentLabel.textContent.trim()) {
          labelText = parentLabel.textContent.trim();
        } else if (el.nextSibling && el.nextSibling.nodeType === 3 && el.nextSibling.textContent.trim()) {
          labelText = el.nextSibling.textContent.trim();
        }
      } else if (rawType === 'number') {
        dataType = 'Number';
        sampleVal = '25';
      } else if (rawType === 'email') {
        dataType = 'String';
        sampleVal = 'user@example.com';
      } else if (rawType === 'date') {
        dataType = 'Date';
        sampleVal = new Date().toISOString().split('T')[0];
      } else if (name.toLowerCase().includes('name')) {
        sampleVal = 'Alex Morgan';
      } else if (name.toLowerCase().includes('address')) {
        sampleVal = '742 Evergreen Terrace';
      } else if (name.toLowerCase().includes('age')) {
        dataType = 'Number';
        sampleVal = '28';
      }

      fields.push({
        id: `field-${name}-${index}`,
        name,
        type: rawType,
        placeholder,
        required,
        dataType,
        sampleVal,
        options,
        labelText
      });
    });

    // 4. Check if any input fields exist inside the form
    if (fields.length === 0) {
      return {
        success: false,
        error: 'No input fields detected inside <form>. Please include at least one <input name="..."> or <textarea>.',
        fields: [],
        modelName: 'User',
        collectionName: 'users'
      };
    }

    // Find submit button
    const submitBtn = formEl.querySelector('button[type="submit"], input[type="submit"], button:not([type="button"])');
    const submitText = submitBtn ? (submitBtn.innerText || submitBtn.getAttribute('value') || 'Submit') : 'Submit';

    // Model / Collection Name inference
    let modelName = 'User';
    if (formId.toLowerCase().includes('contact')) modelName = 'Contact';
    else if (formId.toLowerCase().includes('product')) modelName = 'Product';
    else if (formId.toLowerCase().includes('order')) modelName = 'Order';
    else if (formId.toLowerCase().includes('feedback')) modelName = 'Feedback';

    const collectionName = modelName.toLowerCase() + 's';

    return {
      success: true,
      formId,
      formAction,
      formMethod,
      modelName,
      collectionName,
      fields,
      submitText,
      rawHtml: htmlString
    };
  } catch (err) {
    return {
      success: false,
      error: 'HTML Parser Error: ' + err.message,
      fields: [],
      modelName: 'User',
      collectionName: 'users'
    };
  }
}

// Retain alias for backward compatibility
export const parseHtmlForm = validateAndParseHtmlForm;
