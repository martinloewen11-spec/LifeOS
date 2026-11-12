(() => {
"use strict";
const KEY="lifeos-stylefood-v1";
const load=()=>{try{return Object.assign({clothes:[],recipes:[],shopping:[]},JSON.parse(localStorage.getItem(KEY)||"{}"))}catch(e){return {clothes:[],recipes:[],shopping:[]}}};
let data=load();
const save=()=>localStorage.setItem(KEY,JSON.stringify(data));
const esc=v=>String(v||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
const makeId=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
function render(){
 const clothes=document.getElementById("styleList"),recipes=document.getElementById("recipeList"),shopping=document.getElementById("shoppingList");
 if(clothes)clothes.innerHTML=data.clothes.length?data.clothes.map(x=>'<article class="lifestyle-card"><h3>'+esc(x.name)+'</h3><p>'+esc(x.category)+(x.color?" · "+esc(x.color):"")+'</p>'+(x.note?'<p>'+esc(x.note)+'</p>':"")+'<div class="lifestyle-actions"><button data-life-delete="clothes" data-id="'+x.id+'">Entfernen</button></div></article>').join(""):'<p class="empty-state">Noch keine Einträge. Füge oben dein erstes Kleidungsstück oder eine Outfit-Idee hinzu.</p>';
 if(recipes)recipes.innerHTML=data.recipes.length?data.recipes.map(x=>'<article class="lifestyle-card"><h3>'+esc(x.name)+'</h3>'+(x.ingredients?'<p><b>Zutaten</b><br>'+esc(x.ingredients)+'</p>':"")+(x.steps?'<p><b>Zubereitung / Notizen</b><br>'+esc(x.steps)+'</p>':"")+'<div class="lifestyle-actions"><button data-life-delete="recipes" data-id="'+x.id+'">Entfernen</button></div></article>').join(""):'<p class="empty-state">Noch keine Rezepte gespeichert.</p>';
 if(shopping)shopping.innerHTML=data.shopping.map(x=>'<div class="shopping-row '+(x.done?"done":"")+'"><input type="checkbox" data-shop-toggle="'+x.id+'" '+(x.done?"checked":"")+' aria-label="Erledigt"><span>'+esc(x.name)+'</span><button data-life-delete="shopping" data-id="'+x.id+'">Entfernen</button></div>').join("");
}
document.getElementById("styleForm")?.addEventListener("submit",e=>{e.preventDefault();const name=document.getElementById("styleName").value.trim();if(!name)return;data.clothes.unshift({id:makeId(),name,category:document.getElementById("styleCategory").value,color:document.getElementById("styleColor").value.trim(),note:document.getElementById("styleNote").value.trim()});save();e.target.reset();render()});
document.getElementById("recipeForm")?.addEventListener("submit",e=>{e.preventDefault();const name=document.getElementById("recipeName").value.trim();if(!name)return;data.recipes.unshift({id:makeId(),name,ingredients:document.getElementById("recipeIngredients").value.trim(),steps:document.getElementById("recipeSteps").value.trim()});save();e.target.reset();render()});
document.getElementById("shoppingForm")?.addEventListener("submit",e=>{e.preventDefault();const input=document.getElementById("shoppingItem"),name=input.value.trim();if(!name)return;data.shopping.push({id:makeId(),name,done:false});save();input.value="";render()});
document.addEventListener("click",e=>{const b=e.target.closest("[data-life-delete]");if(!b)return;const key=b.dataset.lifeDelete;data[key]=data[key].filter(x=>x.id!==b.dataset.id);save();render()});
document.addEventListener("change",e=>{const b=e.target.closest("[data-shop-toggle]");if(!b)return;const x=data.shopping.find(i=>i.id===b.dataset.shopToggle);if(x){x.done=b.checked;save();render()}});
render();
})();