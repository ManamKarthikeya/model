/**
 * Code generator for Node.js + Express + MongoDB (Mongoose) stack
 * based on parsed HTML form metadata.
 */

export function generateCodeFiles(parsedForm, stack = 'nodejs-mongodb') {
  const { formId, modelName, collectionName, fields } = parsedForm;

  const endpointPath = `/api/${collectionName}`;

  // 1. Generate Mongoose Model (models/ModelName.js)
  const schemaFields = fields.map(f => {
    let line = `  ${f.name}: { type: ${f.dataType}, required: ${f.required} `;
    if (f.name.toLowerCase().includes('email')) {
      line += `, unique: true, lowercase: true `;
    }
    line += `}`;
    return line;
  }).join(',\n');

  const modelCode = `// models/${modelName}.js
const mongoose = require('mongoose');

const ${modelName}Schema = new mongoose.Schema(
  {
${schemaFields}
  },
  { timestamps: true }
);

module.exports = mongoose.model('${modelName}', ${modelName}Schema);
`;

  // 2. Generate Express Server (server.js)
  const destructuring = fields.map(f => f.name).join(', ');
  const validationChecks = fields
    .filter(f => f.required)
    .map(f => `!${f.name}`)
    .join(' || ');

  const serverCode = `// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const ${modelName} = require('./models/${modelName}');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/${collectionName}_db';

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Database'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: '${modelName} Backend API' });
});

// POST Endpoint for HTML Form Submission
app.post('${endpointPath}', async (req, res) => {
  try {
    const data = { ...req.body };

    // 🔒 Security: Delete confirmation fields & hash password with bcrypt
    Object.keys(data).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('confirmpassword') || lowerKey.includes('confirm_password') || lowerKey.includes('confirmpass')) {
        delete data[key];
      }
    });

    for (const key of Object.keys(data)) {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('password') || lowerKey === 'pass') {
        if (typeof data[key] === 'string' && data[key].trim().length > 0) {
          if (!data[key].startsWith('$2a$') && !data[key].startsWith('$2b$')) {
            data[key] = await bcrypt.hash(data[key], 10);
          }
        }
      }
    }

    // Save Record to MongoDB
    const newRecord = await ${modelName}.create(data);

    console.log('📥 Saved document to MongoDB:', newRecord);

    return res.status(201).json({
      success: true,
      message: '${modelName} record created successfully!',
      data: newRecord
    });
  } catch (error) {
    console.error('Error saving to MongoDB:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save record to database',
      error: error.message
    });
  }
});

// GET Endpoint to list records
app.get('${endpointPath}', async (req, res) => {
  try {
    const records = await ${modelName}.find().sort({ createdAt: -1 });
    res.json({ success: true, count: records.length, data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(\`🚀 Server running on http://localhost:\${PORT}\`);
});
`;

  // 3. Generate Frontend Script (public/script.js)
  const formPayloadObj = fields
    .map(f => `      ${f.name}: formData.get('${f.name}')`)
    .join(',\n');

  const scriptCode = `// public/script.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('${formId}');
  const statusMsg = document.createElement('div');
  statusMsg.id = 'formStatus';
  statusMsg.style.marginTop = '15px';
  statusMsg.style.padding = '10px';
  statusMsg.style.borderRadius = '6px';
  statusMsg.style.display = 'none';

  if (form) {
    form.appendChild(statusMsg);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerText : 'Submit';
      if (submitBtn) submitBtn.innerText = 'Sending...';

      const formData = new FormData(form);
      const payload = {
${formPayloadObj}
      };

      try {
        const response = await fetch('${endpointPath}', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok && result.success) {
          statusMsg.style.display = 'block';
          statusMsg.style.background = '#d1fae5';
          statusMsg.style.color = '#065f46';
          statusMsg.innerText = '✅ Saved successfully to MongoDB!';
          form.reset();
        } else {
          throw new Error(result.message || 'Server returned error');
        }
      } catch (err) {
        statusMsg.style.display = 'block';
        statusMsg.style.background = '#fee2e2';
        statusMsg.style.color = '#991b1b';
        statusMsg.innerText = '❌ Error: ' + err.message;
      } finally {
        if (submitBtn) submitBtn.innerText = originalText;
      }
    });
  }
});
`;

  // 4. Generate Full HTML file (public/index.html)
  const inputTagsHtml = fields.map(f => {
    return `      <div class="field-group">
        <label for="${f.name}">${f.name.toUpperCase()}</label>
        <input type="${f.type}" id="${f.name}" name="${f.name}" placeholder="${f.placeholder}" ${f.required ? 'required' : ''} />
      </div>`;
  }).join('\n');

  const htmlCode = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${modelName} Form - BackendFlow AI</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8fafc; color: #1e293b; padding: 40px 20px; }
    .container { max-width: 500px; margin: 0 auto; background: #ffffff; padding: 32px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
    h2 { margin-top: 0; color: #0f172a; }
    .field-group { margin-bottom: 20px; }
    label { display: block; font-weight: 600; font-size: 13px; margin-bottom: 6px; text-transform: uppercase; color: #64748b; }
    input { width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; font-size: 15px; }
    input:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2); }
    button { width: 100%; background: #6366f1; color: white; padding: 12px; border: none; border-radius: 6px; font-weight: 600; font-size: 16px; cursor: pointer; transition: background 0.2s; }
    button:hover { background: #4f46e5; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Submit ${modelName} Information</h2>
    <form id="${formId}">
${inputTagsHtml}
      <button type="submit">${parsedForm.submitText || 'Submit'}</button>
    </form>
  </div>
  <script src="/script.js"></script>
</body>
</html>
`;

  // 5. Generate package.json
  const packageJsonCode = JSON.stringify({
    name: `${collectionName}-backend`,
    version: "1.0.0",
    description: `Auto-generated Node.js + Express + MongoDB backend for ${formId}`,
    main: "server.js",
    scripts: {
      "start": "node server.js",
      "dev": "nodemon server.js"
    },
    dependencies: {
      "express": "^4.19.2",
      "mongoose": "^8.3.1",
      "cors": "^2.8.5",
      "dotenv": "^16.4.5"
    },
    devDependencies: {
      "nodemon": "^3.1.0"
    }
  }, null, 2);

  // 6. Generate .env
  const envCode = `PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/${collectionName}_db
`;

  // 7. Generate README.md
  const readmeCode = `# ${modelName} Backend API

Generated by **BackendFlow AI** for \`<form id="${formId}">\`.

## Stack
- **Server**: Node.js + Express
- **Database**: MongoDB (Mongoose)
- **Frontend**: HTML5 + Vanilla JS Fetch API

## Quick Start Instructions

1. **Install Dependencies**:
   \`\`\`bash
   npm install
   \`\`\`

2. **Ensure MongoDB is running locally**:
   Ensure MongoDB service is active on \`mongodb://127.0.0.1:27017\`.

3. **Start Backend Server**:
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Open Frontend**:
   Open \`http://localhost:5000\` in your browser!
`;

  return [
    { name: 'server.js', language: 'javascript', code: serverCode },
    { name: `models/${modelName}.js`, language: 'javascript', code: modelCode },
    { name: 'public/script.js', language: 'javascript', code: scriptCode },
    { name: 'public/index.html', language: 'html', code: htmlCode },
    { name: 'package.json', language: 'json', code: packageJsonCode },
    { name: '.env', language: 'ini', code: envCode },
    { name: 'README.md', language: 'markdown', code: readmeCode }
  ];
}
