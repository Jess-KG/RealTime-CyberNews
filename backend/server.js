const express = require('express');
const dotenv = require('dotenv');
const { GoogleGenAI } = require('@google/genai');
const Parser = require('rss-parser');
const Groq = require('groq-sdk');
const WebSocket = require('ws');

dotenv.config();

const app = express();
const wss = new WebSocket.Server({ port: 3001 });

wss.on('connection', (socket) => {
    console.log("Frontend connected");
})

const parser = new Parser();

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

async function getNews() {
    const response = await parser.parseURL("https://feeds.feedburner.com/TheHackersNews");
    const feed = response.items;

    const articles = feed.map(item => ({
        title: item.title,
        link: item.link,
        content: item.content,
        pubDate: item.pubDate,
        image: item.enclosure?.url ?? null

    }));

    return articles;
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function analyseArticle(article) {
    while (true) {
        try {
            const response = await groq.chat.completions.create({
                model: 'openai/gpt-oss-20b',
                messages: [
                    {
                        role: 'user',
                        content: `
            Extract cybersecurity intelligence from this article. Return ONLY valid JSON with these fields.
            Return machine readable JSON directly. No MD. Nothing.

            event_type must be one of:
                INCIDENT = a specific cyberattack or security breach affecting an organization or system
                VULNERABILITY = a security flaw or weakness, especially when discussing a CVE
                MALWARE = research or reporting primarily about malware
                THREAT_ACTOR = information primarily about a threat actor/group
                CAMPAIGN = a coordinated or ongoing cyberattack campaign
                SECURITY_RESEARCH = technical security research or analysis
                GENERAL = cybersecurity news that does not fit the above

            Provide a country/city when you can infer
            the location of the affected organization, victim, infrastructure, or incident.

            location_type possible values:
                CITY
                COUNTRY
                REGION
                UNKNOWN

            {
                "country": null,
                "city": null,
                "location_type": null,
                "threat": null,
                "sector": null,
                "threat_actor": null,
                "cve": null,
                "severity": null,
                "event_type": null
            }

            Article title:
            ${article.title}

            Article content:
            ${article.content}
            `
                    }
                ]
            });

            return JSON.parse(response.choices[0].message.content);
        } catch (error) {
            console.log(error);
            console.log("API error. Retrying in 10 seconds...");

            await wait(10000);
        }
    }
}

async function geocodeLocation(city, country) {

    // If we don't have a location, don't try to geocode it
    if (!city && !country) {
        return null;
    }

    // Build the place we're searching for
    const location = city
        ? `${city}, ${country}`
        : country;

    // Convert the location into a URL-safe format
    const query = encodeURIComponent(location);

    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;

    try {

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'CyberSentinel/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`Geocoding request failed: ${response.status}`);
        }

        const results = await response.json();

        // No location found
        if (results.length === 0) {
            return null;
        }

        // Return only the information CyberSentinel needs
        return {
            latitude: Number(results[0].lat),
            longitude: Number(results[0].lon)
        };

    } catch (error) {

        console.error("Geocoding error:", error);

        return null;
    }
}

async function processNews(onArticleReady) {
    const articles = await getNews();
    for (const article of articles) {
        const intelligence = await analyseArticle(article);
        const coordinates = await geocodeLocation(
            intelligence.city,
            intelligence.country
        );

        if (coordinates) {
            intelligence.coordinates = [
                coordinates.longitude,
                coordinates.latitude
            ];
        }
        onArticleReady({ article: article, intelligence: intelligence });
    }
}

function onArticleReady(articleData) {
    console.log(articleData.intelligence);
    wss.clients.forEach(client => {
        client.send(JSON.stringify(articleData));
    });
}
app.get('/analyse', async (req, res) => {
    try {
        const response = await ai.models.generateContent({
            model: 'openai/gpt-oss-20b',
            contents: `
            Extract cybersecurity intelligence from this article. Return ONLY valid JSON with these fields.
            Return machine readable JSON directly. No MD. Nothing.
            event_type must be one of:
                INCIDENT = a specific cyberattack or security breach affecting an organization or system
                VULNERABILITY = a security flaw or weakness, especially when discussing a CVE
                MALWARE = research or reporting primarily about malware
                THREAT_ACTOR = information primarily about a threat actor/group
                CAMPAIGN = a coordinated or ongoing cyberattack campaign
                SECURITY_RESEARCH = technical security research or analysis
                GENERAL = cybersecurity news that does not fit the above
            Where affected organisation is mentioned or the organisation who researched something,
            and country not mentioned, search and add its country by yourself.
            {"country": null,
            "city": null,
            "threat": null,
            "sector": null,
            "threat_actor": null,
            "cve": null,
            "severity": null,
            "event_type" : null
            }
            
            Article:
            ${article}`
        });

        const intelligence = JSON.parse(response.choices[0].message.content);

        res.json({
            intelligence: intelligence
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Groq request failed'
        });
    }
});

app.get('/news', async (req, res) => {
    try {
        const response = await parser.parseURL("https://feeds.feedburner.com/TheHackersNews");
        const feed = response.items;

        const articles = feed.map(item => ({
            title: item.title,
            link: item.link,
            content: item.content,
            pubDate: item.pubDate,
            image: item.enclosure.url || null

        }));


        res.json({
            news: articles
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'News fetching failed'
        });
    }
});

app.get('/news/process', async (req, res) => {
    try {

        await processNews(onArticleReady);

        res.json({
            message: 'News processing complete'
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: 'News processing failed'
        });
    }
});
app.listen(3000, () => {
    console.log('CyberSentinel backend running on http://localhost:3000');
});