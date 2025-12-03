const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cron = require('node-cron');
const bodyParser = require('body-parser');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- Configuration ---
const PORT = process.env.PORT || 3000;
const ACCUWEATHER_API_KEY = process.env.ACCUWEATHER_API_KEY || 'your-api-key-here';
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://hooks.zapier.com/hooks/catch/12327209/uka14fj/';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const USE_MOCK_WEATHER = false;

// Initialize Gemini AI
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// --- Database Connection ---
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL || process.env.DATABASE_URL;

if (!MONGODB_URI) {
    console.error('❌ FATAL: No MongoDB connection string found.');
    console.error('   Please set MONGODB_URI, MONGO_URL, or DATABASE_URL in your environment variables.');
    process.exit(1);
}

mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected');
});

mongoose.connect(MONGODB_URI)
    .catch(err => console.error('❌ Initial MongoDB Connection Error:', err));

const monitorSchema = new mongoose.Schema({
    regionName: { type: String, required: true },
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    radiusKm: { type: Number, default: 10 },
    locationKey: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    cumulativeRainfall: { type: Number, default: 0 },
    current24hRainfall: { type: Number, default: 0 },
    triggerRainfall: { type: Number, required: true },
    status: { type: String, enum: ['instantiated', 'monitoring', 'triggered', 'completed'], default: 'instantiated' },
    logs: [{ date: String, amount: Number, cumulative: Number }]
}, { timestamps: true });

monitorSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) { ret.id = ret._id; delete ret._id; }
});

const Monitor = mongoose.model('Monitor', monitorSchema);

// --- API Helper Functions ---

async function fetchLocationKey(lat, lon) {
    if (USE_MOCK_WEATHER) return `MOCK_${Math.floor(lat)}_${Math.floor(lon)}`;
    try {
        const url = `http://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=${ACCUWEATHER_API_KEY}&q=${lat},${lon}`;
        console.log(`fetching location key: ${url}`);
        // Add timeout to prevent hanging
        const res = await axios.get(url, { timeout: 5000 });
        return res.data.Key;
    } catch (e) {
        console.error("LocKey Error:", e.response?.data || e.message);
        // Fallback for demo if API fails
        return `FALLBACK_${Math.floor(lat)}_${Math.floor(lon)}`;
    }
}

async function getHourlyRainfall(locationKey) {
    if (USE_MOCK_WEATHER) {
        const isStorm = Math.random() > 0.95;
        const rain = isStorm ? (Math.random() * 20) : (Math.random() * 2);
        return parseFloat(rain.toFixed(1));
    }
    try {
        const url = `http://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${ACCUWEATHER_API_KEY}&details=true`;
        console.log(`fetching rainfall: ${url}`);
        const res = await axios.get(url, { timeout: 5000 });

        if (res.data && res.data[0] && res.data[0].PrecipitationSummary && res.data[0].PrecipitationSummary.PastHour) {
            const rainValue = res.data[0].PrecipitationSummary.PastHour.Metric.Value;
            return rainValue;
        }
        return 0;
    } catch (e) {
        console.error("Weather API Error:", e.response?.data || e.message);
        return 0;
    }
}

// --- Webhook Notification ---
async function sendWebhookNotification(monitor) {
    try {
        const payload = {
            event: 'monitor_triggered',
            timestamp: new Date().toISOString(),
            monitor: {
                id: monitor._id.toString(),
                regionName: monitor.regionName,
                lat: monitor.lat,
                lon: monitor.lon,
                radiusKm: monitor.radiusKm,
                locationKey: monitor.locationKey,
                startDate: monitor.startDate,
                endDate: monitor.endDate,
                triggerRainfall: monitor.triggerRainfall,
                current24hRainfall: monitor.current24hRainfall,
                cumulativeRainfall: monitor.cumulativeRainfall,
                status: monitor.status,
                triggeredAt: new Date().toISOString()
            }
        };

        console.log(`   [📤 WEBHOOK] Sending notification for ${monitor.regionName}...`);
        const response = await axios.post(WEBHOOK_URL, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000
        });
        console.log(`   [✅ WEBHOOK] Notification sent successfully (${response.status})`);
    } catch (e) {
        console.error(`   [❌ WEBHOOK] Failed to send notification:`, e.message);
    }
}

// --- Periodic Check Logic (Hourly) ---
async function runHourlyCheck() {
    const now = new Date();
    const timeStr = now.toISOString().replace(/T/, ' ').replace(/\..+/, '').substring(0, 13) + ":00";

    console.log(`\n--- 🕐 Hourly Check: ${timeStr} ---`);

    try {
        const monitors = await Monitor.find({ status: { $ne: 'completed' } });
        for (const monitor of monitors) {
            let changed = false;

            if (monitor.status !== 'triggered' && monitor.status !== 'completed') {
                if (now > monitor.endDate) {
                    monitor.status = 'completed';
                    changed = true;
                } else if (now >= monitor.startDate && monitor.status === 'instantiated') {
                    monitor.status = 'monitoring';
                    changed = true;
                }
            }

            if (monitor.status === 'monitoring') {
                const rainfall = await getHourlyRainfall(monitor.locationKey);

                monitor.cumulativeRainfall += rainfall;
                monitor.logs.push({
                    date: timeStr,
                    amount: rainfall,
                    cumulative: parseFloat(monitor.cumulativeRainfall.toFixed(2))
                });
                changed = true;

                // Calculate rolling 24h sum
                const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                const recentLogs = monitor.logs.filter(log => new Date(log.date) >= twentyFourHoursAgo);
                const rolling24hSum = recentLogs.reduce((sum, log) => sum + log.amount, 0);
                monitor.current24hRainfall = parseFloat(rolling24hSum.toFixed(2));

                console.log(`   [UPDATE] ${monitor.regionName}: +${rainfall}mm | 24h Total: ${monitor.current24hRainfall.toFixed(1)}mm (Cumulative: ${monitor.cumulativeRainfall.toFixed(1)}mm)`);

                if (monitor.current24hRainfall >= monitor.triggerRainfall) {
                    monitor.status = 'triggered';
                    console.log(`   [⚠️ ALERT] ${monitor.regionName} TRIGGERED! 24h Rainfall: ${monitor.current24hRainfall.toFixed(1)}mm exceeded ${monitor.triggerRainfall}mm`);

                    // Send webhook notification
                    await sendWebhookNotification(monitor);
                }
            }
            if (changed) await monitor.save();
        }
    } catch (e) { console.error("Hourly check error:", e); }
}

cron.schedule('0 * * * *', runHourlyCheck);

// --- Express App ---
const app = express();
app.use(bodyParser.json());

// Enable CORS manually to avoid issues with separate frontend dev servers
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// API Routes
app.get('/api/monitors', async (req, res) => {
    try {
        const monitors = await Monitor.find().sort({ createdAt: -1 });
        res.json(monitors);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/monitors', async (req, res) => {
    try {
        const { lat, lon, regionName, radiusKm, startDate, endDate, triggerRainfall } = req.body;
        const locationKey = await fetchLocationKey(lat, lon);

        const newMonitor = new Monitor({
            regionName,
            lat,
            lon,
            radiusKm,
            startDate,
            endDate,
            triggerRainfall,
            locationKey
        });

        await newMonitor.save();
        res.status(201).json(newMonitor);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/monitors/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const monitor = await Monitor.findByIdAndUpdate(id, updates, { new: true });
        if (!monitor) {
            return res.status(404).json({ error: 'Monitor not found' });
        }

        res.json(monitor);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Debug endpoint to list available Gemini models
app.get('/api/debug/models', async (req, res) => {
    try {
        if (!genAI) {
            return res.status(503).json({ error: 'Gemini API not configured' });
        }
        const response = await axios.get(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`
        );
        res.json(response.data);
    } catch (e) {
        res.status(500).json({ error: e.message, details: e.response?.data });
    }
});

app.post('/api/monitors/:id/forecast', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if Gemini is configured
        if (!genAI) {
            return res.status(503).json({ error: 'Gemini API not configured. Please set GEMINI_API_KEY environment variable.' });
        }

        // Find the monitor
        const monitor = await Monitor.findById(id);
        if (!monitor) {
            return res.status(404).json({ error: 'Monitor not found' });
        }

        // Generate forecast using Gemini  
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `You are a weather forecasting assistant. Provide a detailed 24-hour weather forecast for the following location:

Latitude: ${monitor.lat}
Longitude: ${monitor.lon}
Region: ${monitor.regionName}

Focus on:
1. Temperature range (in Celsius)
2. Rainfall probability and expected amounts (in mm)
3. General weather conditions
4. Any weather warnings or recommendations for rainfall monitoring

Keep the forecast concise but informative, suitable for rainfall monitoring purposes. Format the response in clear sections.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const forecast = response.text();

        res.json({
            forecast,
            timestamp: new Date().toISOString(),
            location: {
                regionName: monitor.regionName,
                lat: monitor.lat,
                lon: monitor.lon
            }
        });
    } catch (e) {
        console.error('Gemini forecast error:', e);
        res.status(500).json({ error: 'Failed to generate forecast: ' + e.message });
    }
});

app.post('/api/debug/run-check', async (req, res) => {
    await runHourlyCheck();
    res.json(await Monitor.find().sort({ createdAt: -1 }));
});

// Serve static files from the frontend build directory
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`\n🚀 Rainfall Backend running on port ${PORT}`);
    console.log(`🔑 Using Key: ${ACCUWEATHER_API_KEY.substring(0, 5)}...`);
});