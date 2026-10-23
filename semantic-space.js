async function loadThree() {
 if (window.THREE) return window.THREE;
 const moduleUrls = [
  'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js',
  'https://unpkg.com/three@0.160.0/build/three.module.js'
 ];
 for (const url of moduleUrls) {
  try {
   const THREE = await import(url);
   window.THREE = THREE;
   return THREE;
  } catch (error) {
   console.warn('Three.js module load failed:', url, error);
  }
 }
 const scriptUrls = [
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js',
  'https://unpkg.com/three@0.128.0/build/three.min.js'
 ];
 for (const url of scriptUrls) {
  try {
   await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load ' + url));
    document.head.appendChild(script);
   });
   if (window.THREE) return window.THREE;
  } catch (error) {
   console.warn('Three.js script load failed:', url, error);
  }
 }
 throw new Error('Three.js could not be loaded from any configured CDN');
}

const axesNames=['テクノロジー','素材・技法','造形実験','身体性','職人性','概念性','前衛性','日常性'];
// 手作業で設計した説明用の特徴値（0〜1）。実測embeddingではない。
const base=[
{id:'issey',name:'三宅一生',color:0xfb923c,desc:'素材・技法、身体と衣服の関係、着用可能性を考えるための仮説ベクトル。',v:[.72,.94,.76,.88,.90,.72,.61,.91]},
{id:'morinaga',name:'森永邦彦',color:0xf97316,desc:'テクノロジー、造形実験、概念性を強調した仮説ベクトル。',v:[.96,.77,.96,.62,.58,.82,.87,.53]},
{id:'ninomiya',name:'二宮啓',color:0xea580c,desc:'構造的な造形、素材操作、前衛性を強調した仮説ベクトル。',v:[.57,.88,.94,.72,.79,.69,.96,.38]}
];
const candidates={
rei:{id:'rei',name:'川久保玲',color:0xfb923c,desc:'概念性・前衛性・造形実験を強めに置いた仮説ベクトル。人物選択は比較デモ用。',v:[.64,.76,.98,.65,.68,.99,.99,.29]},
yohji:{id:'yohji',name:'山本耀司',color:0xf97316,desc:'シルエット、身体性、概念性を強めに置いた仮説ベクトル。比較デモ用。',v:[.42,.77,.82,.91,.74,.90,.88,.44]},
jun:{id:'jun',name:'ジュンヤ・ワタナベ',color:0xea580c,desc:'素材構成、技術的実験、造形変化を強めに置いた仮説ベクトル。比較デモ用。',v:[.85,.92,.95,.66,.81,.72,.86,.55]}
};
let selected='issey',scene,camera,renderer,group,globeGroup,raycaster,mouse,threeReady=false,pointMeshes=[],dragState=null;
const host=document.getElementById('three');
function project3(v){return new THREE.Vector3((v[0]-.5)*7+(v[5]-.5)*1.8,(v[2]-.5)*6+(v[3]-.5)*1.2,(v[1]-.5)*6+(v[6]-.5)*1.8)}
function project2(v){return {x:(v[0]-.5)*1.2+(v[5]-.5)*.7+(v[7]-.5)*.5,y:(v[2]-.5)*1.2-(v[3]-.5)*.6+(v[4]-.5)*.4}}
function nodes(){
 const pool=[...base,candidates.rei];
 const count=Number(document.getElementById('peopleCount').value||4);
 return pool.slice(0,count);
}
function projectSelectedAxes(v){
 const xi=Number(document.getElementById('axisX').value),yi=Number(document.getElementById('axisY').value),zi=Number(document.getElementById('axisZ').value);
 return new THREE.Vector3((v[xi]-.5)*9,(v[yi]-.5)*7,(v[zi]-.5)*9);
}
function drawCurrentAxes(){
 // Globe displays two surface axes; cube displays all three spatial axes.
 const axisDefs=[
  {name:'X軸: '+axesNames[Number(document.getElementById('axisX').value)],color:0xa3e635,dir:new THREE.Vector3(1,0,0)},
  {name:'Y軸: '+axesNames[Number(document.getElementById('axisY').value)],color:0x65c466,dir:new THREE.Vector3(0,1,0)},
  {name:'Z軸: '+axesNames[Number(document.getElementById('axisZ').value)],color:0x34a853,dir:new THREE.Vector3(0,0,1)}
 ].filter((a,i)=>document.body.dataset.view==='cube'||i<2);
 const length=6.2;
 axisDefs.forEach(a=>{
  const end=a.dir.clone().multiplyScalar(length);
  const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([a.dir.clone().multiplyScalar(-length),end]),new THREE.LineBasicMaterial({color:a.color,transparent:true,opacity:.95}));
  group.add(line);
  const arrow=new THREE.ArrowHelper(a.dir,new THREE.Vector3(0,0,0),length,a.color,.65,.38);
  group.add(arrow);
  const sprite=makeAxisLabel(a.name,a.color);
  sprite.position.copy(end.clone().multiplyScalar(1.14));
  group.add(sprite);
 });
}
function makeAxisLabel(text,color){
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
 canvas.width=1024;canvas.height=256;
 ctx.font='bold 108px system-ui, sans-serif';
 ctx.lineWidth=12;ctx.strokeStyle='#0b0d12';ctx.strokeText(text,24,160);
 ctx.fillStyle='#'+color.toString(16).padStart(6,'0');ctx.fillText(text,24,160);
 const texture=new THREE.CanvasTexture(canvas);
 const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false}));
 // Existing person labels are ~27px; axis labels use ~108px (4x).
 sprite.scale.set(8.4,2.1,1);
 return sprite;
}
function initThree(){
 scene=new THREE.Scene();scene.background=new THREE.Color(0x0b0d12);
 camera=new THREE.PerspectiveCamera(55,host.clientWidth/host.clientHeight,.1,1000);camera.position.set(8,7,10);
 renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.setSize(host.clientWidth,host.clientHeight);host.appendChild(renderer.domElement);
 scene.add(new THREE.AmbientLight(0xffffff,1.7));const light=new THREE.PointLight(0xffffff,2);light.position.set(4,8,8);scene.add(light);
 group=new THREE.Group();scene.add(group);
 // View-specific spatial guide: globe surface or gridded cube.
 globeGroup=new THREE.Group();scene.add(globeGroup);
 if(document.body.dataset.view==='cube'){
  const cube=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(9.8,9.8,9.8)),new THREE.LineBasicMaterial({color:0x75c7ff,transparent:true,opacity:.62}));
  globeGroup.add(cube);
  const gridMat=new THREE.LineBasicMaterial({color:0x536174,transparent:true,opacity:.42});
  const half=4.9, divisions=10;
  for(let i=1;i<divisions;i++){
   const v=-half+(2*half*i/divisions);
   const paths=[[[v,-half,-half],[v,-half,half]],[[ -half,-half,v],[half,-half,v]],[[v,half,-half],[v,half,half]],[[-half,half,v],[half,half,v]],[[ -half,v,-half],[-half,v,half]],[[-half,v,-half],[half,v,-half]],[[half,v,-half],[half,v,half]],[[ -half,v,half],[half,v,half]],[[v,-half,-half],[v,half,-half]],[[ -half,-half,v],[-half,half,v]],[[v,-half,half],[v,half,half]],[[half,-half,v],[half,half,v]]];
   paths.forEach(pair=>globeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pair.map(p=>new THREE.Vector3(...p))),gridMat)));
  }
 }else{
  const globe=new THREE.Mesh(new THREE.SphereGeometry(4.9,32,24),new THREE.MeshBasicMaterial({color:0x75c7ff,wireframe:true,transparent:true,opacity:.11}));
  globeGroup.add(globe);
  const globeCore=new THREE.Mesh(new THREE.SphereGeometry(4.82,24,18),new THREE.MeshBasicMaterial({color:0x75c7ff,transparent:true,opacity:.025}));
  globeGroup.add(globeCore);
 }
 raycaster=new THREE.Raycaster();mouse=new THREE.Vector2();
 renderer.domElement.style.cursor='grab';
 renderer.domElement.style.touchAction='none';
 renderer.domElement.addEventListener('pointerdown',startDrag);
 renderer.domElement.addEventListener('pointermove',moveDrag);
 renderer.domElement.addEventListener('pointerup',endDrag);
 renderer.domElement.addEventListener('pointercancel',endDrag);
 threeReady=true;drawThree();animate();
}
function drawThree(){
 if(!threeReady)return;while(group.children.length) {const o=group.children[group.children.length-1];group.remove(o);if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose();}
 pointMeshes=[];drawCurrentAxes();const ns=nodes(),pos={};
 ns.forEach(n=>{pos[n.id]=projectSelectedAxes(n.v);});
 // 相関の強さは説明用の特徴ベクトル間距離で仮表示（実測統計ではない）
 // 強い相関＝近い距離は赤、弱い相関＝少し離れた距離は紫
 for(let i=0;i<ns.length;i++)for(let j=i+1;j<ns.length;j++){
  const d=dist(ns[i].v,ns[j].v);
  if(d<1.15){
   const strong=d<.65;
   const geo=new THREE.BufferGeometry().setFromPoints([pos[ns[i].id],pos[ns[j].id]]);
   const color=strong?0xef4444:0xa855f7;
   const opacity=strong?.85:.55;
   group.add(new THREE.Line(geo,new THREE.LineBasicMaterial({color,transparent:true,opacity})));
  }
 }
 ns.forEach(n=>{const p=pos[n.id],isSel=n.id===selected,geo=new THREE.SphereGeometry(isSel?.25:.18,24,18),mat=new THREE.MeshStandardMaterial({color:n.color,emissive:n.color,emissiveIntensity:isSel?.48:.12,roughness:.35});const mesh=new THREE.Mesh(geo,mat);mesh.position.copy(p);mesh.userData.nodeId=n.id;group.add(mesh);pointMeshes.push(mesh);
 const sprite=makeLabel(n.name,n.color);sprite.position.set(p.x,p.y+.42,p.z);group.add(sprite);
 const halo=new THREE.Mesh(new THREE.SphereGeometry(isSel?.34:.25,20,16),new THREE.MeshBasicMaterial({color:n.color,transparent:true,opacity:isSel?.2:.07,wireframe:true}));halo.position.copy(p);group.add(halo);
 });
}
function makeLabel(text,color){const c=document.createElement('canvas'),ctx=c.getContext('2d');c.width=256;c.height=64;ctx.font='bold 27px system-ui';ctx.fillStyle='#edf2fa';ctx.fillText(text,5,40);const tex=new THREE.CanvasTexture(c),mat=new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false});const s=new THREE.Sprite(mat);s.scale.set(2.1,.52,1);return s}
function startDrag(e){
 dragState={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false};
 renderer.domElement.setPointerCapture(e.pointerId);
 renderer.domElement.style.cursor='grabbing';
}
function moveDrag(e){
 if(!dragState)return;
 const dx=e.clientX-dragState.x,dy=e.clientY-dragState.y;
 if(Math.abs(e.clientX-dragState.startX)+Math.abs(e.clientY-dragState.startY)>4)dragState.moved=true;
 if(dragState.moved){
  const scale=10/Math.max(240,host.clientHeight);
  group.position.x+=dx*scale;group.position.y-=dy*scale;
  globeGroup.position.x+=dx*scale;globeGroup.position.y-=dy*scale;
 }
 dragState.x=e.clientX;dragState.y=e.clientY;
}
function endDrag(e){
 if(!dragState)return;
 const wasMoved=dragState.moved;dragState=null;
 renderer.domElement.style.cursor='grab';
 if(!wasMoved){
  const r=renderer.domElement.getBoundingClientRect();
  mouse.x=((e.clientX-r.left)/r.width)*2-1;mouse.y=-((e.clientY-r.top)/r.height)*2+1;
  raycaster.setFromCamera(mouse,camera);
  const hits=raycaster.intersectObjects(pointMeshes);
  if(hits.length){selected=hits[0].object.userData.nodeId;updateDetails();drawThree();}
 }
}
function animate(){requestAnimationFrame(animate);if(!threeReady)return;renderer.render(scene,camera)}
function resizeThree(){if(!threeReady)return;camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight)}
function dist(a,b){return Math.sqrt(a.reduce((s,x,i)=>s+(x-b[i])**2,0))}
function updateDetails(){
 const ns=nodes(),n=ns.find(x=>x.id===selected)||ns[0];if(!n)return;selected=n.id;
}
function syncSliderLabels(){
 ['axisX','axisY','axisZ'].forEach(id=>{
  document.getElementById(id+'Value').textContent=axesNames[Number(document.getElementById(id).value)];
 });
 document.getElementById('peopleCountValue').textContent=document.getElementById('peopleCount').value+'人';
}
window.addEventListener('resize',resizeThree);
['axisX','axisY','axisZ','peopleCount'].forEach(id=>document.getElementById(id).addEventListener('input',()=>{syncSliderLabels();drawThree();}));
syncSliderLabels();
loadThree().then(()=>initThree()).catch(err=>{
 host.innerHTML='<p style="padding:20px;color:#ffd58a">3Dライブラリを読み込めませんでした。ネットワークまたはCDNへのアクセスを確認して再読み込みしてください。</p>';
 console.error(err);
});
