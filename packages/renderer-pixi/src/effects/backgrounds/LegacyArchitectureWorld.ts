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
float lineMask(float d,float width){return 1.-smoothstep(width,width*1.75,abs(d));}
float band(float v,float center,float width){return 1.-smoothstep(width,width*1.8,abs(v-center));}

void main(void){
  float aspect=uInputSize.x/max(1.,uInputSize.y);
  vec2 p=(vTextureCoord-.5)*vec2(aspect,1.);
  float detail=clamp(uDetail,0.,1.);
  float t=uTime*.10;

  // Architecture identity: a full perspective nave/corridor. Camera travel is
  // strictly time-owned; audio can illuminate surfaces but cannot move depth.
  float horizon=-.015+sin(t*.21)*.008;
  float py=p.y-horizon;
  float absY=max(abs(py),.045);
  float inv=1./absY;
  float travel=fract(uTime*.055);
  float worldZ=inv+travel*1.75;
  float worldX=p.x*worldZ;

  vec3 color=uBackground;

  // Floor and ceiling perspective structure.
  float floorMask=smoothstep(.015,.11,py);
  float ceilingMask=smoothstep(.015,.11,-py);
  float depthGrid=pow(.5+.5*cos(worldZ*6.28318),mix(12.,28.,detail));
  float majorDepth=pow(.5+.5*cos(worldZ*3.14159),mix(18.,42.,detail));
  float laneFreq=mix(1.6,3.2,detail);
  float laneGrid=pow(.5+.5*cos(worldX*laneFreq*3.14159),mix(18.,44.,detail));

  color+=uSurface*(floorMask+ceilingMask)*.030;
  color+=uAccentA*depthGrid*(floorMask*.070+ceilingMask*.030);
  color+=uAccentB*majorDepth*(floorMask*.060+ceilingMask*.022);
  color+=uMuted*laneGrid*floorMask*.035;

  // Repeating projected structural frames. Each depth slice maps to the same
  // world-space corridor, producing real perspective compression.
  float frameGlow=0.;
  float pillarGlow=0.;
  float archGlow=0.;
  for(int i=0;i<9;i++){
    float fi=float(i);
    float enabled=step(fi+.5,mix(5.,9.,detail));
    float z=.85+fi*.78+travel*.78;
    float scale=1./z;
    float halfW=aspect*(.44*scale+.035);
    float halfH=.40*scale+.035;
    float xEdge=abs(abs(p.x)-halfW);
    float yEdge=abs(abs(py)-halfH);
    float frame=min(xEdge,yEdge);
    frameGlow+=lineMask(frame,.0012+.0011*scale)*enabled;

    // Side pillars have visible thickness and stronger near-field presence.
    float pillar=lineMask(abs(p.x)-halfW,.0020+.0016*scale)
      * (1.-smoothstep(halfH-.03,halfH+.02,abs(py)));
    pillarGlow+=pillar*enabled*(.55+.45*scale);

    // Pointed/arched crown gives the space an authored architectural silhouette.
    float nx=clamp(abs(p.x)/max(halfW,.001),0.,1.);
    float archY=halfH-(.11*scale)*pow(nx,mix(.62,.48,detail));
    float crown=lineMask(py+archY,.0013+.0010*scale)*step(0.,-py);
    archGlow+=crown*enabled;
  }

  // Side wall recesses/windows create parallax and relief.
  float side=abs(p.x);
  float wallMask=smoothstep(aspect*.24,aspect*.49,side);
  float recessZ=fract(worldZ*.42);
  float recess=pow(.5+.5*cos((recessZ+.13)*6.28318),mix(10.,24.,detail));
  float slit=pow(.5+.5*cos(worldX*2.3+1.2),mix(16.,34.,detail));
  float windows=wallMask*recess*slit*(1.-smoothstep(.12,.42,abs(py)));

  float lightResponse=.80+uEnergy*.13+uMid*.08+uTreble*.04;
  color+=mix(uAccentA,uGlow,.34)*frameGlow*.055*lightResponse;
  color+=uSurface*pillarGlow*.11;
  color+=uAccentB*archGlow*.070*lightResponse;
  color+=mix(uAccentB,uGlow,.55)*windows*.045*lightResponse;

  // Central vanishing glow and depth haze anchor the room without breathing.
  float vanish=exp(-dot(p/vec2(aspect*.24,.16),p/vec2(aspect*.24,.16)));
  float haze=exp(-abs(py)*5.4)*(1.-smoothstep(aspect*.1,aspect*.55,abs(p.x)));
  color+=uGlow*vanish*.040*lightResponse;
  color+=uSurface*haze*.030;

  if(uQuality>.5){
    vec2 cell=floor((p+vec2(3.))*vec2(80.,60.));
    float dust=step(.995-detail*.002,hash21(cell));
    vec2 local=fract((p+vec2(3.))*vec2(80.,60.))-.5;
    dust*=1.-smoothstep(0.,.05,length(local));
    color+=uGlow*dust*.028*(.65+uTreble*.2);
  }

  float vig=1.-smoothstep(.46,1.10,length(p*vec2(.70,1.)));
  color*=.78+vig*.24;
  color=vec3(1.)-exp(-max(color,vec3(0.))*(1.+uPower*.46));
  gl_FragColor=vec4(clamp(pow(max(color,vec3(0.)),vec3(.95)),0.,1.),1.);
}
`;

type U={uTime:number;uPower:number;uDetail:number;uQuality:number;uEnergy:number;uMid:number;uTreble:number;uBackground:Float32Array;uSurface:Float32Array;uAccentA:Float32Array;uAccentB:Float32Array;uGlow:Float32Array;uMuted:Float32Array;};

export class LegacyArchitectureWorld{
  readonly container=new Container();
  private readonly surface=new Graphics();
  private readonly filter:Filter;
  private intensity=1;
  constructor(){
    this.filter=new Filter({glProgram:GlProgram.from({vertex,fragment}),resources:{architectureUniforms:{
      uTime:{value:0,type:"f32"},uPower:{value:1/3,type:"f32"},uDetail:{value:1/3,type:"f32"},uQuality:{value:1,type:"f32"},
      uEnergy:{value:0,type:"f32"},uMid:{value:0,type:"f32"},uTreble:{value:0,type:"f32"},
      uBackground:{value:new Float32Array([.004,.009,.015]),type:"vec3<f32>"},uSurface:{value:new Float32Array([.035,.055,.075]),type:"vec3<f32>"},
      uAccentA:{value:new Float32Array([.22,.78,.88]),type:"vec3<f32>"},uAccentB:{value:new Float32Array([.54,.36,.96]),type:"vec3<f32>"},
      uGlow:{value:new Float32Array([.94,.98,1.]),type:"vec3<f32>"},uMuted:{value:new Float32Array([.18,.26,.32]),type:"vec3<f32>"}
    }}});
    this.filter.padding=0;this.surface.filters=[this.filter];this.container.addChild(this.surface);this.container.visible=false;
  }
  setPalette(p:VisualPalette){this.color("uBackground",p.background);this.color("uSurface",p.surface);this.color("uAccentA",p.accentA);this.color("uAccentB",p.accentB);this.color("uGlow",p.glow);this.color("uMuted",p.muted);}
  setIntensity(v:number){this.intensity=clamp(v,0,3);this.num("uPower",clamp(this.intensity/3));}
  setDetail(v:number){this.num("uDetail",clamp(v/3));}
  setQuality(v:QualityMode){this.num("uQuality",v==="cinema"?1:0);}
  resize(w:number,h:number){this.surface.clear().rect(0,0,Math.max(1,w),Math.max(1,h)).fill({color:0xffffff,alpha:1});}
  update(time:number,a:AudioBands){if(!this.container.visible)return;this.num("uTime",time);this.num("uEnergy",a.energy);this.num("uMid",a.mid);this.num("uTreble",a.treble);this.container.alpha=clamp(this.intensity,0,1);}
  private u(){return(this.filter.resources.architectureUniforms as{uniforms:U}).uniforms;}
  private num(n:"uTime"|"uPower"|"uDetail"|"uQuality"|"uEnergy"|"uMid"|"uTreble",v:number){this.u()[n]=v;}
  private color(n:"uBackground"|"uSurface"|"uAccentA"|"uAccentB"|"uGlow"|"uMuted",c:number){const a=this.u()[n];a[0]=((c>>16)&255)/255;a[1]=((c>>8)&255)/255;a[2]=(c&255)/255;}
}
