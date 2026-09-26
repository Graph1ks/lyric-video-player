declare module "butterchurn" {
  export interface ButterchurnVisualizer {
    connectAudio(node: AudioNode): void;
    loadPreset(preset: unknown, blendTime?: number): void;
    loadExtraImages(images: Record<string, { data: string; width: number; height: number }>): void;
    setRendererSize(
      width: number,
      height: number,
      options?: {
        meshWidth?: number;
        meshHeight?: number;
        pixelRatio?: number;
        textureRatio?: number;
      },
    ): void;
    setOutputAA(useAA: boolean): void;
    render(): void;
  }

  const butterchurn: {
    createVisualizer(
      audioContext: AudioContext,
      canvas: HTMLCanvasElement,
      options?: {
        width?: number;
        height?: number;
        meshWidth?: number;
        meshHeight?: number;
        pixelRatio?: number;
        textureRatio?: number;
        outputFXAA?: boolean;
      },
    ): ButterchurnVisualizer;
  };

  export default butterchurn;
}
