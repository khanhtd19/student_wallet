const fs=require('node:fs');const path=require('node:path');const {spawnSync}=require('node:child_process');
const root=path.join(__dirname,'..','src');const files=[];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())walk(full);else if(entry.isFile()&&entry.name.endsWith('.js'))files.push(full);}}
walk(root);let failed=0;
for(const file of files){const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(result.status!==0){failed++;process.stderr.write(`FAIL ${path.relative(process.cwd(),file)}\n${result.stderr}`);}else process.stdout.write(`OK ${path.relative(process.cwd(),file)}\n`);}
process.stdout.write(`\nChecked ${files.length} JavaScript files; failures: ${failed}\n`);process.exitCode=failed?1:0;
