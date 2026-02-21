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
            // Only check source files and markdown/json
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

    // Replacements
    content = content.replace(/NathanKanaeru/g, 'NathanKanaeru');
    content = content.replace(/NathanKanaeru/g, 'NathanKanaeru');
    content = content.replace(/NathanKanaeru/gi, 'NathanKanaeru');
    // Wait, if it's NathanKanaeru we should also replace it since it's the GitHub username and they want to fully rebrand.
    content = content.replace(/NathanKanaeru/gi, 'NathanKanaeru');

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        changedFiles++;
        console.log(`Updated: ${file}`);
    }
}

console.log(`Done! Updated ${changedFiles} files with NathanKanaeru.`);
