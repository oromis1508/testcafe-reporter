const fs = require('fs');
const path = require('path');
const configData = require('../lib/config-reader');
const configPath = path.join(process.cwd(), configData.ConfigFileName);
const hasForce = process.argv.includes('--force');

if (!fs.existsSync(configPath) || hasForce) {
    fs.writeFileSync(
        configPath,
        JSON.stringify(configData.DefaultConfig, null, 2)
    );

    console.log(`✔ Config file ${configData.ConfigFileName} created. You can change its values or use console arguments. Console arguments have higher priority`);
}
else
    console.log(`ℹ Config file ${configData.ConfigFileName} already exists. You can change its values or use console arguments. Console arguments have higher priority`);
