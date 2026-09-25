import { Container, Filter, GlProgram, Graphics } from "pixi.js";
import type { AudioBands } from "@graph1ks/emo-audio-web";
import { clamp, type QualityMode, type VisualPalette } from "@graph1ks/emo-engine-core";

const vertex = `
in vec2 aPosition;
out vec2 vTextureCoord;
uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;
vec4 filterVertexPosition(void){
  vec2 p=aPosition*uOutputFrame.zw+uOutputFrame.xy;
  p.x=p.x*(2.0/uOutputTexture.x)-1.0;
  p.y=p.y*(2.0*uOutputTexture.z/uOutputTexture.y)-uOutputTexture.z;
  return vec4(p,0.0,1.0);
}
void main(void){
  gl_Position=filterVertexPosition();
  vTextureCoord=aPosition*(uOutputFrame.zw*uInputSize.zw);
}
`;

const fragment = `
precision highp float;
in vec2 vTextureCoord;
uniform vec4 uInputSize;
uniform float uTime,uPower,uDetail,uQuality,uEnergy,uTreble;
uniform vec3 uBackground,uSurface,uAccentA,uAccentB,uGlow,uMuted;

float hash21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise2(vec2 p){
  vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
  return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x),f.y);
}
float sdBox(vec2 p,vec2 b){vec2 d=abs(p)-b;return length(max(d,vec2(0)))+min(max(d.x,d.y),0.0);}
float rule(float d,float w){return 1.0-smoothstep(w,w*2.5,abs(d));}

void main(void){
  float aspect=uInputSize.x/max(1.0,uInputSize.y);
  vec2 p=(vTextureCoord-.5)*vec2(aspect,1.0);
  float detail=clamp(uDetail,0.0,1.0),t=uTime*.10;

  // Precision composition: negative space, one material plane and one optical aperture.
  vec2 q=p-vec2(-.19+sin(t*.21)*.012,.015);q.x+=q.y*.028;
  float box=sdBox(q,vec2(.265+detail*.035,.335));
  float body=1.0-smoothstep(-.018,.024,box);
  float edge=rule(box,mix(.0025,.0013,detail));
  float mist=smoothstep(.34,.82,noise2(p*vec2(.72,1.35)+vec2(t*.045,-t*.025)));

  float slitX=.285+p.y*.042+sin(t*.37)*.018;
  float slitD=p.x-slitX;
  float slitCore=exp(-abs(slitD)*mix(155.0,235.0,detail));
  float slitBloom=exp(-abs(slitD)*mix(12.0,18.0,detail))*exp(-abs(p.y+.015)*1.25);

  float horizonY=-.255+p.x*.018;
  float horizon=rule(p.y-horizonY,mix(.0018,.0010,detail));
  float horizonGlow=exp(-abs(p.y-horizonY)*28.0);

  float precision=0.0;
  if(uQuality>.5){
    precision+=rule(p.y-(.196+sin(t*.17)*.004),.00075)*(1.0-smoothstep(.08,.54,abs(p.x+.12)));
    precision+=rule(p.x-(-.505+cos(t*.13)*.004),.00075)*(1.0-smoothstep(.05,.39,abs(p.y-.04)));
    precision*=detail;
  }

  vec2 focus=p-vec2(.295,-.02);
  float optical=exp(-dot(focus*vec2(.75,1.0),focus*vec2(.75,1.0))*7.2);
  float light=.88+uEnergy*.10+uTreble*.08;

  vec3 color=uBackground;
  color+=mix(uBackground,uSurface,.72)*body*(.13+mist*.045);
  color+=uMuted*edge*(.075+detail*.055);
  color+=mix(uAccentA,uGlow,.64)*slitBloom*.045*light;
  color+=uGlow*slitCore*.34*light;
  color+=mix(uSurface,uAccentB,.34)*horizonGlow*.028;
  color+=mix(uAccentA,uGlow,.40)*horizon*.15;
  color+=uMuted*precision*.11;
  color+=mix(uAccentB,uGlow,.24)*optical*.025*light;

  vec2 cell=floor((p+vec2(2))*mix(38.0,68.0,detail));
  vec2 local=fract((p+vec2(2))*mix(38.0,68.0,detail))-.5;
  float speck=step(.9965-detail*.0015,hash21(cell))*(1.0-smoothstep(0.0,.035,length(local)));
  color+=uGlow*speck*(.045+uTreble*.035);

  float vignette=1.0-smoothstep(.38,1.08,length(p*vec2(.72,1.0)));
  color*=.78+vignette*.24;
  color=vec3(1.0)-exp(-max(color,vec3(0))*(.96+uPower*.42));
  color+=(hash21(gl_FragCoord.xy+vec2(uTime*13.0,-uTime*9.0))-.5)*mix(.0025,.0075,detail);
  gl_FragColor=vec4(clamp(pow(max(color,vec3(0)),vec3(.955)),0.0,1.0),1.0);
}
`;

type Uniforms = {
  uTime:number;uPower:number;uDetail:number;uQuality:number;uEnergy:number;uTreble:number;
  uBackground:Float32Array;uSurface:Float32Array;uAccentA:Float32Array;uAccentB:Float32Array;
  uGlow:Float32Array;uMuted:Float32Array;
};

export class LegacyMinimalWorld {
  readonly container=new Container();
  private readonly surface=new Graphics();
  private readonly filter:Filter;
  private intensity=1;

  constructor(){
    this.filter=new Filter({
      glProgram:GlProgram.from({vertex,fragment}),
      resources:{minimalUniforms:{
        uTime:{value:0,type:"f32"},uPower:{value:1/3,type:"f32"},uDetail:{value:1/3,type:"f32"},
        uQuality:{value:1,type:"f32"},uEnergy:{value:0,type:"f32"},uTreble:{value:0,type:"f32"},
        uBackground:{value:new Float32Array([.004,.008,.012]),type:"vec3<f32>"},
        uSurface:{value:new Float32Array([.035,.05,.06]),type:"vec3<f32>"},
        uAccentA:{value:new Float32Array([.32,.88,.92]),type:"vec3<f32>"},
        uAccentB:{value:new Float32Array([.56,.48,.92]),type:"vec3<f32>"},
        uGlow:{value:new Float32Array([.96,.98,1]),type:"vec3<f32>"},
        uMuted:{value:new Float32Array([.22,.28,.31]),type:"vec3<f32>"},
      }}
    });
    this.filter.padding=0;
    this.surface.filters=[this.filter];
    this.container.addChild(this.surface);
    this.container.visible=false;
  }

  setPalette(p:VisualPalette){
    this.writeColor("uBackground",p.background);this.writeColor("uSurface",p.surface);
    this.writeColor("uAccentA",p.accentA);this.writeColor("uAccentB",p.accentB);
    this.writeColor("uGlow",p.glow);this.writeColor("uMuted",p.muted);
  }
  setIntensity(v:number){this.intensity=clamp(v,0,3);this.write("uPower",clamp(this.intensity/3));}
  setDetail(v:number){this.write("uDetail",clamp(v/3));}
  setQuality(v:QualityMode){this.write("uQuality",v==="cinema"?1:0);}
  resize(w:number,h:number){this.surface.clear().rect(0,0,Math.max(1,w),Math.max(1,h)).fill({color:0xffffff,alpha:1});}
  update(time:number,audio:AudioBands){
    if(!this.container.visible)return;
    this.write("uTime",time);this.write("uEnergy",audio.energy);this.write("uTreble",audio.treble);
    this.container.alpha=clamp(this.intensity,0,1);
  }
  private uniforms(){return (this.filter.resources.minimalUniforms as {uniforms:Uniforms}).uniforms;}
  private write(name:"uTime"|"uPower"|"uDetail"|"uQuality"|"uEnergy"|"uTreble",value:number){this.uniforms()[name]=value;}
  private writeColor(name:"uBackground"|"uSurface"|"uAccentA"|"uAccentB"|"uGlow"|"uMuted",color:number){
    const a=this.uniforms()[name];a[0]=((color>>16)&255)/255;a[1]=((color>>8)&255)/255;a[2]=(color&255)/255;
  }
}
