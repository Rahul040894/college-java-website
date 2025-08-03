// uploadUsns.js (Final, Robust Version)

const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();

// Define the schema EXACTLY as it is in server.js
const AllowedUsnSchema = new mongoose.Schema({
    usn: { type: String, required: true, unique: true }
});
const AllowedUsn = mongoose.model('AllowedUsn', AllowedUsnSchema);

const uploadUsns = async () => {
    const filePath = process.argv[2];
    if (!filePath) {
        console.error('ERROR: Please provide the path to the USN JSON file. Usage: node uploadUsns.js allowed-usns.json');
        return;
    }

    let connection;
    try {
        connection = await mongoose.connect(process.env.DATABASE_URL);
        console.log('✅ MongoDB Connected for USN upload.');

        const data = fs.readFileSync(filePath, 'utf-8');
        const usnArray = JSON.parse(data);

        if (!Array.isArray(usnArray) || usnArray.length === 0) {
            console.error('ERROR: The JSON file is empty or not a valid array.');
            return;
        }

        console.log(`Preparing to upload ${usnArray.length} USNs...`);

        // We will use a robust method that updates or inserts each USN one by one.
        for (const usn of usnArray) {
            await AllowedUsn.findOneAndUpdate(
                { usn: usn }, // The filter to find the USN
                { usn: usn }, // The data to set
                { upsert: true, new: true } // 'upsert' means UPDATE if found, INSERT if not.
            );
        }
        
        console.log(`✅ Successfully synchronized ${usnArray.length} USNs to the whitelist.`);

    } catch (error) {
        console.error('❌ An error occurred during the USN upload process:', error);
    } finally {
        if (connection) {
            await mongoose.connection.close();
            console.log('Database connection closed.');
        }
    }
};

uploadUsns();