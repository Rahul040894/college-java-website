// uploadUsns.js
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();

// Define the schema for a single allowed USN
const AllowedUsnSchema = new mongoose.Schema({
    usn: { type: String, required: true, unique: true }
});
const AllowedUsn = mongoose.model('AllowedUsn', AllowedUsnSchema);

const uploadUsns = async () => {
    const filePath = process.argv[2];
    if (!filePath) { console.error('ERROR: Please provide the path to the USN JSON file.'); return; }

    try {
        await mongoose.connect(process.env.DATABASE_URL);
        console.log('✅ MongoDB Connected for USN upload.');

        const data = fs.readFileSync(filePath, 'utf-8');
        const usnArray = JSON.parse(data);

        // Transform the simple array of strings into the object format Mongoose needs
        const usnObjects = usnArray.map(usn => ({ usn: usn }));

        console.log('Clearing existing USN whitelist...');
        await AllowedUsn.deleteMany({});
        
        console.log(`Uploading ${usnObjects.length} new USNs...`);
        await AllowedUsn.insertMany(usnObjects);
        
        console.log(`✅ Successfully uploaded ${usnObjects.length} USNs to the whitelist.`);

    } catch (error) {
        console.error('❌ Error during USN upload:', error);
    } finally {
        mongoose.connection.close();
    }
};

uploadUsns();