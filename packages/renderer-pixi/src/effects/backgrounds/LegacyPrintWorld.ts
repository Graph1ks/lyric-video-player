import { Container, Filter, GlProgram, Graphics } from "pixi.js";
import type { AudioBands } from "@graph1ks/emo-audio-web";
import { clamp, type QualityMode, type VisualPalette } from "@graph1ks/emo-engine-core";

const vertex = `
in vec2 aPosition;
out vec2 vTextureCoord;
uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;
vec4 filterVertexPosition(void){vec2 p=aPosition*uOutputFrame.zw+uOutputFrame.xy;p.x=p.x*(2.0/uOutputTexture.x)-1.0;p.y=p.y*(2.0*uOutputTexture.z/uOutputTexture.y)-uOutputTexture.z;return vec4(p,0,1);}
void main(void){gl_Position=filterVertexPosition();vTextureCoord=aPosition*(uOutputFrame.zw*uInputSize.zw);}
`;

const fragment = `
precision highp float;
in vec2 vTextureCoord;
uniform vec4 uInputSize;
uniform float uTime,uPower,uDetail,uQuality,uEnergy,uMid,uTreble,uLineIndex;
uniform vec3 uBackground,uSurface,uAccentA,uAccentB,uGlow,uMuted;

float hash21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}

float halftone(vec2 p,float angle,float freq,float radius,vec2 offset){
  vec2 q=rot(angle)*(p+offset)*freq;
  vec2 local=fract(q)-.5;
  float d=length(local);
  return 1.-smoothstep(radius,radius+.055,d);
}

float lineMask(vec2 p,vec2 a,vec2 b,float width){
  vec2 pa=p-a,ba=b-a;
  float h=clamp(dot(pa,ba)/max(dot(ba,ba),.0001),0.,1.);
  return 1.-smoothstep(width,width*1.8,length(pa-ba*h));
}

void main(void){
  float aspect=uInputSize.x/max(1.,uInputSize.y);
  vec2 p=(vTextureCoord-.5)*vec2(aspect,1.);
  float detail=clamp(uDetail,0.,1.);
  float t=uTime*.08;
  float variant=mod(floor(max(0.,uLineIndex)),5.);

  // Print identity: layered rotated screens with deterministic mechanical
  // misregistration. Audio changes ink response only, never dot coordinates.
  float freq=mix(34.,62.,detail);
  vec2 driftA=vec2(sin(t*.47+variant)*.006,cos(t*.39+variant*.7)*.004);
  vec2 driftB=vec2(cos(t*.41+variant*.3)*.005,-sin(t*.53+variant)*.004);
  float screenA=halftone(p,.31,freq,.20+detail*.035,driftA);
  float screenB=halftone(p,-.38,freq*1.07,.17+detail*.030,driftB);
  float screenC=halftone(p,1.02,freq*.82,.14+detail*.025,-driftA*.7);

  // Central lyric-safe window attenuates ink rather than cutting a hard hole.
  vec2 safe=(p-vec2(0.,-.025))/vec2(aspect*.31,.255);
  float safeMask=1.-smoothstep(.72,1.08,max(abs(safe.x),abs(safe.y)));
  float outside=1.-safeMask*.88;

  float substrate=hash21(floor(gl_FragCoord.xy*mix(.17,.28,detail)));
  vec3 color=uBackground;
  color=mix(color,uSurface,.10+.035*(substrate-.5));

  float inkResponse=.78+uEnergy*.12+uMid*.07+uTreble*.05;
  color+=uAccentA*screenA*outside*.070*inkResponse;
  color+=uAccentB*screenB*outside*.058*inkResponse;
  color+=uMuted*screenC*outside*.048;

  // Offset ink bands and registration furniture sell the physical-print frame.
  float bandA=1.-smoothstep(.0,.006,abs(p.y-(-.34+sin(t*.27)*.006)));
  float bandB=1.-smoothstep(.0,.004,abs(p.y-(.38+cos(t*.23)*.005)));
  color+=uSurface*bandA*.24;
  color+=uAccentA*bandB*.075;

  float diagonal=0.;
  for(int i=0;i<10;i++){
    float fi=float(i);
    float enabled=step(fi+.5,mix(4.,10.,detail));
    float x=-aspect*.52+fi*(aspect*1.04/9.);
    diagonal+=lineMask(p,vec2(x,-.50),vec2(x-.16,.50),.00075)*enabled;
  }
  color+=uGlow*diagonal*.018*(.72+uTreble*.22);

  vec2 reg=p-vec2(aspect*.405,.365);
  float registration=lineMask(reg,vec2(-.022,0),vec2(.022,0),.0011)+lineMask(reg,vec2(0,-.022),vec2(0,.022),.0011);
  registration+=1.-smoothstep(.014,.017,abs(length(reg)-.016));
  color+=mix(uAccentB,uGlow,.36)*registration*.085;

  // Rare deterministic ink dropout and edge wear, not temporal noise.
  float wear=hash21(floor((p+vec2(3.))*vec2(41.,29.))+vec2(variant,2.));
  float edgeWear=smoothstep(.82,.98,wear)*smoothstep(.26,.56,max(abs(p.x)/max(aspect,.001),abs(p.y)));
  color=mix(color,uBackground,edgeWear*.11*detail);

  if(uQuality>.5){
    float fibre=hash21(vec2(floor(gl_FragCoord.x*.14),floor(gl_FragCoord.y*.055)));
    color+=uGlow*(fibre-.5)*.007*detail;
  }

  float vig=1.-smoothstep(.48,1.12,length(p*vec2(.72,1.)));
  color*=.84+vig*.18;
  color=vec3(1.)-exp(-max(color,vec3(0.))*(1.+uPower*.30));
  gl_FragColor=vec4(clamp(pow(max(color,vec3(0.)),vec3(.965)),0.,1.),1.);
}
`;

type U={uTime:number;uPower:number;uDetail:number;uQuality:number;uEnergy:number;uMid:number;uTreble:number;uLineIndex:number;uBackground:Float32Array;uSurface:Float32Array;uAccentA:Float32Array;uAccentB:Float32Array;uGlow:Float32Array;uMuted:Float32Array;};

export class LegacyPrintWorld{
  readonly container=new Container();
  private readonly surface=new Graphics();
  private readonly filter:Filter;
  private intensity=1;
  constructor(){
    this.filter=new Filter({glProgram:GlProgram.from({vertex,fragment}),resources:{printUniforms:{
      uTime:{value:0,type:"f32"},uPower:{value:1/3,type:"f32"},uDetail:{value:1/3,type:"f32"},uQuality:{value:1,type:"f32"},
      uEnergy:{value:0,type:"f32"},uMid:{value:0,type:"f32"},uTreble:{value:0,type:"f32"},uLineIndex:{value:0,type:"f32"},
      uBackground:{value:new Float32Array([.012,.012,.014]),type:"vec3<f32>"},uSurface:{value:new Float32Array([.08,.075,.072]),type:"vec3<f32>"},
      uAccentA:{value:new Float32Array([.88,.24,.20]),type:"vec3<f32>"},uAccentB:{value:new Float32Array([.22,.58,.92]),type:"vec3<f32>"},
      uGlow:{value:new Float32Array([.92,.94,.98]),type:"vec3<f32>"},uMuted:{value:new Float32Array([.25,.25,.26]),type:"vec3<f32>"}
    }}});
    this.filter.padding=0;this.surface.filters=[this.filter];this.container.addChild(this.surface);this.container.visible=false;
  }
  setPalette(p:VisualPalette){this.color("uBackground",p.background);this.color("uSurface",p.surface);this.color("uAccentA",p.accentA);this.color("uAccentB",p.accentB);this.color("uGlow",p.glow);this.color("uMuted",p.muted);}
  setIntensity(v:number){this.intensity=clamp(v,0,3);this.num("uPower",clamp(this.intensity/3));}
  setDetail(v:number){this.num("uDetail",clamp(v/3));}
  setQuality(v:QualityMode){this.num("uQuality",v==="cinema"?1:0);}
  setLineIndex(v:number){this.num("uLineIndex",Math.max(0,v));}
  resize(w:number,h:number){this.surface.clear().rect(0,0,Math.max(1,w),Math.max(1,h)).fill({color:0xffffff,alpha:1});}
  update(time:number,a:AudioBands){if(!this.container.visible)return;this.num("uTime",time);this.num("uEnergy",a.energy);this.num("uMid",a.mid);this.num("uTreble",a.treble);this.container.alpha=clamp(this.intensity,0,1);}
  private u(){return(this.filter.resources.printUniforms as{uniforms:U}).uniforms;}
  private num(n:"uTime"|"uPower"|"uDetail"|"uQuality"|"uEnergy"|"uMid"|"uTreble"|"uLineIndex",v:number){this.u()[n]=v;}
  private color(n:"uBackground"|"uSurface"|"uAccentA"|"uAccentB"|"uGlow"|"uMuted",c:number){const a=this.u()[n];a[0]=((c>>16)&255)/255;a[1]=((c>>8)&255)/255;a[2]=(c&255)/255;}
}
