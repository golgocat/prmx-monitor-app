require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cron = require('node-cron');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');

// --- Configuration ---
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const ACCUWEATHER_API_KEY = process.env.ACCUWEATHER_API_KEY || 'your-api-key-here';
const USE_MOCK_WEATHER = false;

// --- Database Connection ---
mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

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