const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const root=path.join(__dirname,'..','src','views');let checked=0,failed=0;
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())walk(file);else if(file.endsWith('.ejs'))check(file);}}
function check(file){checked++;const source=fs.readFileSync(file,'utf8');const tags=[...source.matchAll(/<%([\s\S]*?)%>/g)];let code='';let exprIndex=0;
 for(const match of tags){let body=match[1];if(body.startsWith('=' )||body.startsWith('-')){const expression=body.slice(1).trim();try{new vm.Script(`(${expression})`,{filename:file});}catch(error){failed++;console.error(`FAIL expression ${path.relative(root,file)}: ${expression}\n${error.message}`);}}else{body=body.replace(/^_?/,'').replace(/_?$/,'');code+=`\n${body}\n`;}}
 try{new vm.Script(`(function template(locals){${code}\n})`,{filename:file});console.log(`OK ${path.relative(root,file)} (${tags.length} EJS tags)`);}catch(error){failed++;console.error(`FAIL ${path.relative(root,file)}\n${error.message}\n${code}`);}}
walk(root);console.log(`\nChecked ${checked} EJS templates; failures: ${failed}`);process.exitCode=failed?1:0;
