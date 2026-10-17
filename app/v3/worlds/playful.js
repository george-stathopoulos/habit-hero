// One world pack. New themes supply their own art and tokens, sharing app behavior.
const base='/habit-hero/app/v3/assets/';
export const worldPack={
 id:'playful',name:'Ο μαγικός κήπος',
 art:{background:base+'world.webp',foreground:base+'foreground.webp',heroes:{girl:base+'hero-girl.webp',boy:base+'hero-boy.webp'}},
 missions:{bed:base+'mission-bed.webp',read:base+'mission-read.webp',brush:base+'mission-brush.webp'},
 depth:{landscape:{x:-5,y:-3,scroll:8},hero:{x:9,y:5,scroll:-5},foreground:{x:-16,y:-8,scroll:-11}}
};
