// One world pack. New themes supply their own art and tokens, sharing app behavior.
const base='/habit-hero/app/v3/assets/';
export const worldPack={
 id:'playful',name:'Ο μαγικός κήπος',
 ambient:{kind:'clouds',description:'Drifting sky clouds and gentle daylight, background only'},
 art:{background:base+'world-reference.webp',foreground:base+'foreground-reference.webp',heroes:{girl:base+'hero-girl-reference.webp',boy:base+'hero-boy-reference.webp'}},
 missions:{bed:base+'mission-bed-action.webp',read:base+'mission-read-action.webp',brush:base+'mission-brush-action.webp'},
 depth:{landscape:{x:-5,y:-3,scroll:8},hero:{x:9,y:5,scroll:-5},foreground:{x:-16,y:-8,scroll:-11}}
};
