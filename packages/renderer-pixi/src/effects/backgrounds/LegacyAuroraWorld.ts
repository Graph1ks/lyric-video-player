import { Container, Filter, GlProgram, Graphics } from "pixi.js";
import type { AudioBands } from "@graph1ks/emo-audio-web";
import { clamp, type QualityMode, type VisualPalette } from "@graph1ks/emo-engine-core";

const vertex=`
in vec2 aPosition;out vec2 vTextureCoord;
uniform vec4 uInputSize,uOutputFrame,uOutputTexture;
vec4 filterVertexPosition(void){vec2 p=aPosition*uOutputFrame.zw+uOutputFrame.xy;p.x=p.x*(2.0/uOutputTexture.x)-1.0;p.y=p.y*(2.0*uOutputTexture.z/uOutputTexture.y)-uOutputTexture.z;return vec4(p,0,1);}
void main(void){gl_Position=filterVertexPosition();vTextureCoord=aPosition*(uOutputFrame.zw*uInputSize.zw);}
`;

const fragment=`
precision highp float;
in vec2 vTextureCoord;
uniform vec4 uInputSize;
uniform float uTime,uPower,uDetail,uQuality,uEnergy,uMid,uTreble;
uniform vec3 uBackground,uSurface,uAccentA,uAccentB,uGlow,uMuted;

float hash21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float noise2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.52;for(int i=0;i<5;i++){v+=a*noise2(p);p=rot(.48)*p*2.03+vec2(4.2,1.7);a*=.48;}return v;}

float curtain(vec2 p,float seed,float layer,float t){
  float warp=fbm(vec2(p.x*1.35+seed,t*.055+seed*2.7))-.5;
  float fold=sin(p.x*(2.4+layer*.22)+seed*4.1+t*(.17+layer*.015));
  fold+=sin(p.x*(5.1+layer*.31)-t*.11+seed)*.34;
  float center=.18-layer*.085+fold*.075+warp*.11;
  float width=.055+layer*.008;
  float body=exp(-abs(p.y-center)/width);
  float striation=.62+.38*pow(.5+.5*sin(p.x*(24.+layer*5.)+warp*8.+seed*13.),4.);
  float vertical=1.-smoothstep(.16,.72,abs(p.y-.08));
  return body*striation*vertical;
}

void main(void){
  float aspect=uInputSize.x/max(1.,uInputSize.y);
  vec2 p=(vTextureCoord-.5)*vec2(aspect,1.);
  float detail=clamp(uDetail,0.,1.),t=uTime*.10;
  vec2 warp=vec2(fbm(p*1.05+vec2(t*.04,3.1)),fbm(rot(.7)*p*1.17+vec2(-2.2,-t*.03)))-.5;
  vec2 q=p+warp*mix(.025,.072,detail);

  vec3 color=uBackground;
  float haze=fbm(q*.82+vec2(t*.025,-1.4));
  color+=mix(uSurface,uMuted,.42)*smoothstep(.38,.78,haze)*.055;

  float emission=.84+uEnergy*.12+uMid*.08+uTreble*.055;
  float maxLayers=mix(3.,6.,detail);
  for(int i=0;i<6;i++){
    float fi=float(i);
    if(fi+.5>maxLayers)continue;
    float c=curtain(q,fi*.731+1.2,fi,t);
    float edge=curtain(q+vec2(.006,-.008),fi*.731+1.2,fi,t)-c;
    vec3 ink=mix(uAccentA,uAccentB,fract(fi*.47+.18));
    ink=mix(ink,uGlow,clamp(abs(edge)*3.8,0.,.46));
    color+=ink*c*(.055+fi*.007)*emission;
  }

  // Folded-volume highlight: local density gradient reads as lit translucent gas.
  float c0=curtain(q,1.2,0.,t);
  float cx=curtain(q+vec2(.008,0),1.2,0.,t);
  float cy=curtain(q+vec2(0,.008),1.2,0.,t);
  float folded=clamp((c0-cx)*7.+(c0-cy)*5.,0.,1.);
  color+=uGlow*folded*c0*.12*emission;

  float horizon=exp(-abs(p.y+.33)*25.);
  color+=mix(uSurface,uAccentB,.28)*horizon*.035;

  vec2 cell=floor((p+vec2(2.))*mix(70.,115.,detail));
  vec2 local=fract((p+vec2(2.))*mix(70.,115.,detail))-.5;
  float star=step(.996-detail*.0015,hash21(cell))*(1.-smoothstep(0.,.045,length(local)));
  color+=uGlow*star*(.035+uTreble*.03);

  float vig=1.-smoothstep(.42,1.12,length(p*vec2(.7,1.)));
  color*=.76+vig*.27;
  color=vec3(1.)-exp(-max(color,vec3(0.))*(1.+uPower*.5));
  color+=(hash21(gl_FragCoord.xy+vec2(uTime*17.,-uTime*11.))-.5)*mix(.002,.007,detail);
  gl_FragColor=vec4(clamp(pow(max(color,vec3(0.)),vec3(.95)),0.,1.),1.);
}
`;

type U={uTime:number;uPower:number;uDetail:number;uQuality:number;uEnergy:number;uMid:number;uTreble:number;uBackground:Float32Array;uSurface:Float32Array;uAccentA:Float32Array;uAccentB:Float32Array;uGlow:Float32Array;uMuted:Float32Array;};

export class LegacyAuroraWorld{
  readonly container=new Container();
  private readonly surface=new Graphics();
  private readonly filter:Filter;
  private intensity=1;
  constructor(){
    this.filter=new Filter({glProgram:GlProgram.from({vertex,fragment}),resources:{auroraUniforms:{
      uTime:{value:0,type:"f32"},uPower:{value:1/3,type:"f32"},uDetail:{value:1/3,type:"f32"},uQuality:{value:1,type:"f32"},
      uEnergy:{value:0,type:"f32"},uMid:{value:0,type:"f32"},uTreble:{value:0,type:"f32"},
      uBackground:{value:new Float32Array([.003,.008,.015]),type:"vec3<f32>"},uSurface:{value:new Float32Array([.025,.055,.075]),type:"vec3<f32>"},
      uAccentA:{value:new Float32Array([.2,.9,.72]),type:"vec3<f32>"},uAccentB:{value:new Float32Array([.42,.42,.98]),type:"vec3<f32>"},
      uGlow:{value:new Float32Array([.9,1.,.98]),type:"vec3<f32>"},uMuted:{value:new Float32Array([.2,.32,.38]),type:"vec3<f32>"}
    }}});
    this.filter.padding=0;this.surface.filters=[this.filter];this.container.addChild(this.surface);this.container.visible=false;
  }
  setPalette(p:VisualPalette){this.color("uBackground",p.background);this.color("uSurface",p.surface);this.color("uAccentA",p.accentA);this.color("uAccentB",p.accentB);this.color("uGlow",p.glow);this.color("uMuted",p.muted);}
  setIntensity(v:number){this.intensity=clamp(v,0,3);this.num("uPower",clamp(this.intensity/3));}
  setDetail(v:number){this.num("uDetail",clamp(v/3));}
  setQuality(v:QualityMode){this.num("uQuality",v==="cinema"?1:0);}
  resize(w:number,h:number){this.surface.clear().rect(0,0,Math.max(1,w),Math.max(1,h)).fill({color:0xffffff,alpha:1});}
  update(time:number,a:AudioBands){if(!this.container.visible)return;this.num("uTime",time);this.num("uEnergy",a.energy);this.num("uMid",a.mid);this.num("uTreble",a.treble);this.container.alpha=clamp(this.intensity,0,1);}
  private u(){return(this.filter.resources.auroraUniforms as{uniforms:U}).uniforms;}
  private num(n:"uTime"|"uPower"|"uDetail"|"uQuality"|"uEnergy"|"uMid"|"uTreble",v:number){this.u()[n]=v;}
  private color(n:"uBackground"|"uSurface"|"uAccentA"|"uAccentB"|"uGlow"|"uMuted",c:number){const a=this.u()[n];a[0]=((c>>16)&255)/255;a[1]=((c>>8)&255)/255;a[2]=(c&255)/255;}
}
