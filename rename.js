const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const dirFile = path.join(dir, file);
        const dirent = fs.statSync(dirFile);
        if (dirent.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== 'session' && file !== 'temp' && file !== 'tmp' && file !== '.github') {
                filelist = walkSync(dirFile, filelist);
            }
        } else {
            if (dirFile.endsWith('.js') || dirFile.endsWith('.json') || dirFile.endsWith('.md')) {
                filelist.push(dirFile);
            }
        }
    }
    return filelist;
};

const files = walkSync(__dirname);

let changedFiles = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    // Safe replacements
    content = content.replace(/Nathan Bot/g, 'Nathan Bot');
    content = content.replace(/Nathan Bot/g, 'Nathan Bot');
    content = content.replace(/Nathan Bot/g, 'Nathan Bot');
    content = content.replace(/NATHAN BOT/g, 'NATHAN BOT');
    content = content.replace(/NATHAN BOT/g, 'NATHAN BOT');

    // Replace single words if they aren't part of a URL or github link
    // e.g. settings.packname || 'Nathan Bot' -> 'NathanBot'
    // But leave "github.com/NathanKanaeru/Knightbot" alone so it doesn't break.
    // We can just replace specifically known strings to avoid breaking things.
    content = content.replace(/'Nathan Bot'/g, "'Nathan Bot'");
    content = content.replace(/"Nathan Bot"/g, '"Nathan Bot"');
    content = content.replace(/NathanBot-Updater/g, 'NathanBot-Updater');
    content = content.replace(/'Nathan Bot'/g, "'Nathan Bot'");

    // Checking lowercase occurrences inside strings usually meant for output
    content = content.replace(/nathanbot/g, 'nathanbot');

    // Fix github links just in case they were altered? No, we didn't touch urls unless they had those exact cases.
    // Actually, wait, replacing `nathanbot` with `nathanbot` might change the package name in `package.json`. That is fine. 
    // Let's restore any github URLs back to original just to be absolutely safe
    content = content.replace(/github\.com\/NathanKanaeru\/nathanbot/gi, 'github.com/NathanKanaeru/Knightbot');
    content = content.replace(/refs\/heads\/main\.zip/gi, 'refs/heads/main.zip'); // untouched anyway

    // specific replacements
    content = content.replace(/Nathan Bot/g, 'Nathan Bot'); // just in case

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        changedFiles++;
        console.log(`Updated: ${file}`);
    }
}

console.log(`Done! Updated ${changedFiles} files.`);
