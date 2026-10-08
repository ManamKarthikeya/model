import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dns from 'dns';
import bcrypt from 'bcryptjs';

// Fix Node.js Windows SRV DNS resolution
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  console.warn('DNS server override notice:', e.message);
}

const app = express();
app.use(cors());
app.use(express.json());

const ATLAS_URI = process.env.MONGODB_URI || 'mongodb+srv://manam-karthikeya:Karthik1704@cluster0.rejcn0i.mongodb.net/user_db?retryWrites=true&w=majority';

// Connect to MongoDB Atlas
mongoose.connect(ATLAS_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas Cloud Successfully!'))
  .catch(err => console.error('❌ MongoDB Atlas Connection Error:', err));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend Flow Live API Server is healthy' });
});

// Dynamic API Endpoint to insert documents directly into MongoDB Atlas
app.post('/api/insert-data', async (req, res) => {
  try {
    const { dbName = 'user_db', tableName = 'users', data } = req.body;

    if (!data || typeof data !== 'object') {
      return res.status(400).json({ success: false, error: 'Data object is required' });
    }

    const docToInsert = {
      ...data,
      createdAt: new Date().toISOString()
    };

    // 🔒 Security: Remove confirmPassword fields & hash passwords with bcrypt
    Object.keys(docToInsert).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('confirmpassword') || lowerKey.includes('confirm_password') || lowerKey.includes('confirmpass')) {
        delete docToInsert[key];
      }
    });

    for (const key of Object.keys(docToInsert)) {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('password') || lowerKey === 'pass') {
        if (typeof docToInsert[key] === 'string' && docToInsert[key].trim().length > 0) {
          if (!docToInsert[key].startsWith('$2a$') && !docToInsert[key].startsWith('$2b$')) {
            docToInsert[key] = await bcrypt.hash(docToInsert[key], 10);
          }
        }
      }
    }

    // Get dynamic database and collection handle
    const db = mongoose.connection.useDb(dbName);
    const collection = db.collection(tableName);

    const result = await collection.insertOne(docToInsert);

    console.log(`📥 Inserted document into db.${dbName}.${tableName}:`, result.insertedId);

    return res.status(201).json({
      success: true,
      statusText: 'Created in MongoDB Atlas',
      record: {
        _id: result.insertedId.toString(),
        ...docToInsert
      }
    });
  } catch (error) {
    console.error('Error inserting document:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Live Backend Server listening on http://localhost:${PORT}`);
});
