// Target country
export const incidents = [
    {
        id: 1,
        country: 'Australia',
        coordinates: [133.7751, -25.2744],
        threat: 'RANSOMWARE',
        severity: 'HIGH',
        sector: 'Healthcare',
        status: 'ACTIVE',
        source: 'CISA'
    },

    {
        id: 2,
        country: 'Japan',
        coordinates: [138.2529, 36.2048],
        threat: 'PHISHING',
        severity: 'LOW',
        sector: 'Finance',
        status: 'ACTIVE',
        source: 'CISA'
    },
    {
        id: 3,
        country: 'Germany',
        coordinates: [10.4515, 51.1657],
        threat: 'MALWARE',
        severity: 'CRITICAL',
        sector: 'Manufacturing',
        status: 'ACTIVE',
        source: 'TEST'
    },

    {
        id: 4,
        country: 'United States',
        coordinates: [-100.0, 38.0],
        threat: 'PHISHING',
        severity: 'HIGH',
        sector: 'Finance',
        status: 'ACTIVE',
        source: 'TEST'
    },

    {
        id: 5,
        country: 'United Kingdom',
        coordinates: [-3.4360, 55.3781],
        threat: 'DATA BREACH',
        severity: 'HIGH',
        sector: 'Healthcare',
        status: 'INVESTIGATING',
        source: 'TEST'
    },

    {
        id: 6,
        country: 'Brazil',
        coordinates: [-51.9253, -14.2350],
        threat: 'RANSOMWARE',
        severity: 'CRITICAL',
        sector: 'Government',
        status: 'ACTIVE',
        source: 'TEST'
    },

    {
        id: 7,
        country: 'Singapore',
        coordinates: [103.8198, 1.3521],
        threat: 'CREDENTIAL THEFT',
        severity: 'MEDIUM',
        sector: 'Technology',
        status: 'INVESTIGATING',
        source: 'TEST'
    },

    {
        id: 8,
        country: 'India',
        coordinates: [78.9629, 20.5937],
        threat: 'DDoS',
        severity: 'LOW',
        sector: 'Telecommunications',
        status: 'RESOLVED',
        source: 'TEST'
    }
];

export const severities = {
    'CRITICAL': '#FF3B5C', // red
    'HIGH': '#FF8A3D',     // orange
    'MEDIUM': '#FFC857',   // yellow
    'LOW': '#35E68A'       // green
};