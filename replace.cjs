const fs = require('fs');
const glob = fs.readdirSync('./src/panels');
for(let file of glob) {
  if(file.endsWith('.jsx')) {
    let content = fs.readFileSync('./src/panels/' + file, 'utf8');
    if(content.includes('<h1') && !content.includes('import StyledText')) {
      content = content.replace(/(import .*?;)\n/, '$1\nimport StyledText from \'../components/StyledText\';\n');
      content = content.replace(/<h1[^>]*>([^<]+)<\/h1>/g, '<StyledText text="$1" style={{ fontSize: \'2rem\', display: \'block\', marginBottom: \'1rem\' }} />');
      fs.writeFileSync('./src/panels/' + file, content);
    }
  }
}
