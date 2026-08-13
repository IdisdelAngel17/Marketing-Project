import { zoomAt } from "@/lib/editor/zoom";
import { SUBTITLE_FONTS, type CaptionCue, type CaptionStyle, type SubtitleFontId, type ZoomCut } from "@/lib/editor/types";

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

export function drawEditorFrame(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  options: {
    captions: CaptionCue[];
    zooms: ZoomCut[];
    fontId: SubtitleFontId;
    style: CaptionStyle;
    time: number;
  },
) {
  const { width, height } = ctx.canvas;
  const zoom = zoomAt(options.zooms, options.time);
  ctx.fillStyle = "#0b0b0f";
  ctx.fillRect(0, 0, width, height);

  const vw = video.videoWidth || width;
  const vh = video.videoHeight || height;
  const cover = Math.max(width / vw, height / vh) * zoom.scale;
  const dw = vw * cover;
  const dh = vh * cover;
  const dx = (width - dw) * (zoom.x / 100);
  const dy = (height - dh) * (zoom.y / 100);
  ctx.drawImage(video, dx, dy, dw, dh);

  const cue = options.captions.find((c) => options.time >= c.start && options.time <= c.end);
  if (!cue?.text) return;

  const font = SUBTITLE_FONTS[options.fontId];
  const size = Math.max(22, Math.round(height * 0.045));
  ctx.font = `${font.weight} ${size}px ${font.family}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  const lines = wrapText(ctx, cue.text.toUpperCase(), width * 0.82);
  const lineHeight = size * 1.18;
  const blockHeight = lines.length * lineHeight + 18;
  const yBase = height * 0.88;

  if (options.style === "boxed") {
    ctx.fillStyle = "rgba(0,0,0,0.72)";
    const blockWidth = Math.min(
      width * 0.9,
      Math.max(...lines.map((l) => ctx.measureText(l).width)) + 36,
    );
    ctx.beginPath();
    const x = (width - blockWidth) / 2;
    const y = yBase - blockHeight;
    const r = 14;
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + blockWidth, y, x + blockWidth, y + blockHeight, r);
    ctx.arcTo(x + blockWidth, y + blockHeight, x, y + blockHeight, r);
    ctx.arcTo(x, y + blockHeight, x, y, r);
    ctx.arcTo(x, y, x + blockWidth, y, r);
    ctx.closePath();
    ctx.fill();
  }

  lines.forEach((line, i) => {
    const y = yBase - (lines.length - 1 - i) * lineHeight;
    if (options.style === "outline" || options.style === "minimal") {
      ctx.lineWidth = Math.max(4, size / 8);
      ctx.strokeStyle = "rgba(0,0,0,0.85)";
      ctx.strokeText(line, width / 2, y);
    }
    ctx.fillStyle = "#fff";
    ctx.fillText(line, width / 2, y);
  });
}

export async function exportEditedVideo(input: {
  video: HTMLVideoElement;
  captions: CaptionCue[];
  zooms: ZoomCut[];
  fontId: SubtitleFontId;
  style: CaptionStyle;
  onProgress?: (value: number) => void;
}) {
  const source = input.video;
  const width = source.videoWidth || 1080;
  const height = source.videoHeight || 1920;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo crear el canvas de exportación.");

  const stream = canvas.captureStream(30);
  const audioTracks = (source as HTMLVideoElement & { captureStream?: () => MediaStream }).captureStream?.().getAudioTracks() ?? [];
  audioTracks.forEach((track) => stream.addTrack(track));

  const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
    ? "video/webm;codecs=vp9,opus"
    : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
      ? "video/webm;codecs=vp8,opus"
      : "video/webm";

  const chunks: BlobPart[] = [];
  const recorder = new MediaRecorder(stream, { mimeType: mime });
  recorder.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };

  const done = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mime }));
    recorder.onerror = () => reject(new Error("Falló la grabación del video editado."));
  });

  source.pause();
  await new Promise<void>((resolve) => {
    const done = () => {
      source.removeEventListener("seeked", done);
      resolve();
    };
    source.addEventListener("seeked", done);
    source.currentTime = 0;
    window.setTimeout(done, 400);
  });

  recorder.start(200);
  await source.play();

  const draw = () => {
    if (source.paused || source.ended) return;
    drawEditorFrame(ctx, source, {
      captions: input.captions,
      zooms: input.zooms,
      fontId: input.fontId,
      style: input.style,
      time: source.currentTime,
    });
    input.onProgress?.(Math.min(99, (source.currentTime / Math.max(0.1, source.duration)) * 100));
    requestAnimationFrame(draw);
  };
  draw();

  await new Promise<void>((resolve) => {
    source.onended = () => resolve();
  });
  recorder.stop();
  input.onProgress?.(100);
  return done;
}
