const inputSchema = require('../../INPUT_SCHEMA.json');

const {getInputModel} = require('./tools');
const {writeFileSync} = require('fs');
const {join} = require('path');

function writeInputModel() {
    const path = join(__dirname, 'input.json');
    const input = getInputModel(inputSchema);
    writeFileSync(path, JSON.stringify(input));

    console.log('File saved:', path);
}

writeInputModel();