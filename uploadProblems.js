const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();
const CodingProblemSchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true },
    description: String,
    exampleInput: String,
    exampleOutput: String,
    topic: String
});
const CodingProblem = mongoose.model('CodingProblem', CodingProblemSchema);

const uploadProblems = async () => {
    const filePath = process.argv[2];
    if (!filePath) { console.error('ERROR: Please provide the path to the JSON file.'); return; }

    try {
        await mongoose.connect(process.env.DATABASE_URL);
        console.log('✅ MongoDB Connected for problem upload.');

        const data = fs.readFileSync(filePath, 'utf-8');
        const problems = JSON.parse(data);
        console.log('Clearing existing problems...');
        await CodingProblem.deleteMany({});
        
        console.log('Uploading new problems...');
        await CodingProblem.insertMany(problems);
        
        console.log(`✅ Successfully uploaded ${problems.length} coding problems.`);

    } catch (error) {
        console.error('❌ Error during upload:', error);
    } finally {
        mongoose.connection.close();
    }
};

uploadProblems();