'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
for(const file of ['assets/config.js','assets/app.js']){new vm.Script(fs.readFileSync(file,'utf8'),{filename:file});}
const html=fs.readFileSync('index.html','utf8');
for(const token of ['Gefahrstoffkataster','Kataster-Nr.','Mengenbereich','SDB-Verweis','Substitutionsprüfung'])assert(html.includes(token),`missing ${token}`);
const sql=fs.readFileSync('supabase/001_core_and_kataster.sql','utf8');
for(const token of ['enable row level security','hazardous_substances','quantity_range','work_area_description','sds_reference'])assert(sql.includes(token),`missing SQL ${token}`);
// runtime selector guard: $ returns one element and must never be iterated
const core=fs.readFileSync('assets/app-core.js','utf8');
assert(!/\$\([^\n;]+\)\.forEach\(/.test(core.replace(/\$\$/g,'QQ')),'single-element $ selector must not use forEach');
console.log('Kataster smoke tests passed');
