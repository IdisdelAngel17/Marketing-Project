import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Download,
  Film,
  Loader2,
  Pause,
  Play,
  Scan,
  Sparkles,
  Subtitles,
  Trash2,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/app-shell";
import { ClientPicker, ClientWorkBanner, useAgencyClients } from "@/components/crm/client-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { clientSearchSchema } from "@/lib/crm/search";
import {
  captionsFromSegments,
  captionsFromWhisper,
  decodeVideoAudio,
  detectSpeechSegments,
  fileToBase64,
} from "@/lib/editor/audio";
import { analyzeEditedVideo } from "@/lib/editor/feedback";
import { drawEditorFrame, exportEditedVideo } from "@/lib/editor/render";
import { transcribeAudio } from "@/lib/editor/transcribe";
import {
  SUBTITLE_FONTS,
  formatTimecode,
  type CaptionCue,
  type CaptionStyle,
  type SubtitleFontId,
  type VideoFeedback,
  type ZoomCut,
  type ZoomKind,
} from "@/lib/editor/types";
import { suggestZoomCuts } from "@/lib/editor/zoom";

export const Route = createFileRoute("/app/editor")({
  validateSearch: clientSearchSchema,
  head: () => ({
    meta: [{ title: "Editor de video | Community Manager IA" }],
  }),
  component: EditorPage,
});

function slugId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function EditorPage() {
  const navigate = useNavigate();
  const { client: clientId } = Route.useSearch();
  const { selected } = useAgencyClients();
  const activeClient = selected(clientId);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  const [fileName, setFileName] = useState("");
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [captions, setCaptions] = useState<CaptionCue[]>([]);
  const [zooms, setZooms] = useState<ZoomCut[]>([]);
  const [fontId, setFontId] = useState<SubtitleFontId>("bebas");
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>("boxed");
  const [zoomKind, setZoomKind] = useState<ZoomKind>("in");
  const [zoomScale, setZoomScale] = useState(1.4);
  const [zoomDuration, setZoomDuration] = useState(1.4);
  const [subtitling, setSubtitling] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [feedback, setFeedback] = useState<VideoFeedback | null>(null);

  const activeCaption = useMemo(
    () => captions.find((c) => currentTime >= c.start && currentTime <= c.end),
    [captions, currentTime],
  );

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !fileName) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    const tick = () => {
      if (video.videoWidth && video.videoHeight) {
        const maxW = 420;
        const ratio = video.videoHeight / video.videoWidth;
        canvas.width = maxW;
        canvas.height = Math.round(maxW * ratio);
        drawEditorFrame(ctx, video, {
          captions,
          zooms,
          fontId,
          style: captionStyle,
          time: video.currentTime,
        });
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [captions, zooms, fontId, captionStyle, fileName]);

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Sube un archivo de video (mp4, webm, mov).");
      return;
    }
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setFileName(file.name);
    setCaptions([]);
    setZooms([]);
    setFeedback(null);
    setCurrentTime(0);
    const video = videoRef.current;
    if (video) {
      video.src = url;
      video.onloadedmetadata = () => {
        setDuration(video.duration || 0);
        setZooms(suggestZoomCuts(video.duration || 0));
      };
    }
    toast.success("Video cargado. Ya puedes subtitular y marcar zooms.");
  }

  function togglePlay() {
    const video = videoRef.current;
    if (!video?.src) return;
    if (video.paused) {
      void video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  }

  function seek(value: number) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = value;
    setCurrentTime(value);
  }

  async function autoSubtitle() {
    const video = videoRef.current;
    const src = objectUrlRef.current;
    if (!video?.src || !src) {
      toast.error("Sube un video primero.");
      return;
    }
    setSubtitling(true);
    try {
      const fileRes = await fetch(src);
      const blob = await fileRes.blob();
      const file = new File([blob], fileName || "video.mp4", { type: blob.type || "video/mp4" });
      let cues: CaptionCue[] = [];
      try {
        const audio = await decodeVideoAudio(file);
        const segments = detectSpeechSegments(audio);
        cues = captionsFromSegments(segments, topic || activeClient?.name);
      } catch {
        const chunk = Math.min(3, Math.max(1.6, (video.duration || 12) / 5));
        const total = video.duration || 12;
        const segments = [];
        for (let t = 0; t < total; t += chunk) {
          segments.push({ start: t, end: Math.min(total, t + chunk - 0.15) });
        }
        cues = captionsFromSegments(segments, topic || activeClient?.name);
      }

      try {
        const audioBlob = await extractAudioBlob(file);
        const result = await transcribeAudio({
          data: {
            filename: "clip.webm",
            mime: audioBlob.type || "audio/webm",
            audioBase64: await fileToBase64(audioBlob),
            language: "es",
          },
        });
        if (result.usedWhisper && result.words.length) {
          cues = captionsFromWhisper(result.words);
          toast.success("Subtítulos transcritos con Whisper.");
        } else {
          toast.success("Subtítulos automáticos por voz detectada. Edítalos si hace falta.");
        }
      } catch {
        toast.success("Subtítulos automáticos listos. Edita el texto de cada toma.");
      }

      setCaptions(cues);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudieron generar subtítulos");
    } finally {
      setSubtitling(false);
    }
  }

  function addCaption() {
    const start = Number(currentTime.toFixed(2));
    setCaptions((prev) => [
      ...prev,
      {
        id: slugId("cap"),
        start,
        end: Math.min(duration || start + 2, start + 2),
        text: "Nuevo subtítulo",
      },
    ]);
  }

  function updateCaption(id: string, patch: Partial<CaptionCue>) {
    setCaptions((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function addZoom(kind: ZoomKind = zoomKind) {
    setZooms((prev) => [
      ...prev,
      {
        id: slugId("zoom"),
        kind,
        start: Number(currentTime.toFixed(2)),
        duration: zoomDuration,
        scale: zoomScale,
        x: 50,
        y: kind === "in" ? 42 : 50,
      },
    ]);
  }

  function updateZoom(id: string, patch: Partial<ZoomCut>) {
    setZooms((prev) => prev.map((z) => (z.id === id ? { ...z, ...patch } : z)));
  }

  function runFeedback() {
    if (!duration) {
      toast.error("Sube un video para analizar el corte.");
      return;
    }
    const result = analyzeEditedVideo({
      duration,
      captions,
      zooms,
      topic: topic || activeClient?.name,
    });
    setFeedback(result);
    toast.success(`Feedback listo · score ${result.score}/100`);
  }

  async function exportVideo() {
    const video = videoRef.current;
    if (!video?.src) {
      toast.error("Sube un video primero.");
      return;
    }
    setExporting(true);
    setExportProgress(0);
    try {
      const wasPlaying = !video.paused;
      video.pause();
      const blob = await exportEditedVideo({
        video,
        captions,
        zooms,
        fontId,
        style: captionStyle,
        onProgress: setExportProgress,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `editado-${(fileName || "video").replace(/\.[^.]+$/, "")}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Video exportado con subtítulos y zoom.");
      if (wasPlaying) void video.play();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo exportar");
    } finally {
      setExporting(false);
    }
  }

  return (
    <AppShell
      title="Editor de video"
      description="Sube un clip, subtitúlalo, marca zooms y recorre feedback para el siguiente video."
    >
      <ClientWorkBanner client={activeClient} />
      <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)]">
        <section className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-sm">
          <ClientPicker
            value={clientId}
            onChange={(id) => void navigate({ to: "/app/editor", search: { client: id } })}
          />
          <div className="space-y-2">
            <Label htmlFor="topic">Tema del video</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ej. oferta de febrero, tip de Reels"
              key={activeClient?.id || "topic"}
            />
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={onFile}
          />
          <Button type="button" className="w-full rounded-full" onClick={() => fileRef.current?.click()}>
            <Upload />
            {fileName ? "Cambiar video" : "Subir video"}
          </Button>
          {fileName ? <p className="text-xs text-muted-foreground">{fileName}</p> : null}

          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" disabled={subtitling || !fileName} onClick={() => void autoSubtitle()}>
              {subtitling ? <Loader2 className="animate-spin" /> : <Subtitles />}
              Subtitular
            </Button>
            <Button type="button" variant="outline" disabled={!fileName} onClick={() => addZoom("in")}>
              <ZoomIn />
              Zoom in
            </Button>
            <Button type="button" variant="outline" disabled={!fileName} onClick={() => addZoom("out")}>
              <ZoomOut />
              Zoom out
            </Button>
            <Button type="button" variant="outline" disabled={!fileName} onClick={runFeedback}>
              <Sparkles />
              Feedback
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipografía</Label>
              <Select value={fontId} onValueChange={(v) => setFontId(v as SubtitleFontId)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(SUBTITLE_FONTS).map((font) => (
                    <SelectItem key={font.id} value={font.id}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estilo de subtítulo</Label>
              <Select value={captionStyle} onValueChange={(v) => setCaptionStyle(v as CaptionStyle)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boxed">Caja</SelectItem>
                  <SelectItem value="outline">Contorno</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo de zoom</Label>
              <Select value={zoomKind} onValueChange={(v) => setZoomKind(v as ZoomKind)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Zoom in</SelectItem>
                  <SelectItem value="out">Zoom out</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Escala {zoomScale.toFixed(2)}x</Label>
              <Slider
                min={1.1}
                max={2}
                step={0.05}
                value={[zoomScale]}
                onValueChange={([v]) => setZoomScale(v ?? 1.4)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Duración del zoom {zoomDuration.toFixed(1)}s</Label>
            <Slider
              min={0.4}
              max={3}
              step={0.1}
              value={[zoomDuration]}
              onValueChange={([v]) => setZoomDuration(v ?? 1.4)}
            />
          </div>

          <Button type="button" className="w-full rounded-full" disabled={exporting || !fileName} onClick={() => void exportVideo()}>
            {exporting ? <Loader2 className="animate-spin" /> : <Download />}
            {exporting ? `Exportando ${Math.round(exportProgress)}%` : "Exportar video final"}
          </Button>
        </section>

        <section className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-border bg-black shadow-sm">
            <div className="relative aspect-[9/16] max-h-[640px] w-full bg-black">
              <canvas ref={canvasRef} className="h-full w-full object-contain" />
              <video
                ref={videoRef}
                className="hidden"
                playsInline
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => setPlaying(false)}
              />
              {!fileName ? (
                <button
                  type="button"
                  className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-white/80"
                  onClick={() => fileRef.current?.click()}
                >
                  <Film className="h-8 w-8" />
                  Sube un vertical o horizontal para editar
                </button>
              ) : null}
            </div>
            <div className="space-y-3 bg-card p-4">
              <div className="flex items-center gap-3">
                <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={togglePlay} disabled={!fileName}>
                  {playing ? <Pause /> : <Play />}
                </Button>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {formatTimecode(currentTime)} / {formatTimecode(duration)}
                </span>
                {activeCaption ? <Badge variant="secondary">{activeCaption.text}</Badge> : null}
              </div>
              <Slider
                min={0}
                max={Math.max(0.1, duration)}
                step={0.05}
                value={[currentTime]}
                onValueChange={([v]) => seek(v ?? 0)}
                disabled={!fileName}
              />
              <div className="relative h-10 overflow-hidden rounded-xl bg-surface-2">
                {duration
                  ? captions.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        title={c.text}
                        className="absolute top-1 h-3 rounded-full bg-primary/70"
                        style={{
                          left: `${(c.start / duration) * 100}%`,
                          width: `${Math.max(1.2, ((c.end - c.start) / duration) * 100)}%`,
                        }}
                        onClick={() => seek(c.start)}
                      />
                    ))
                  : null}
                {duration
                  ? zooms.map((z) => (
                      <button
                        key={z.id}
                        type="button"
                        title={`${z.kind} ${z.scale}x`}
                        className="absolute bottom-1 h-3 rounded-full bg-accent"
                        style={{
                          left: `${(z.start / duration) * 100}%`,
                          width: `${Math.max(1.2, (z.duration / duration) * 100)}%`,
                        }}
                        onClick={() => seek(z.start)}
                      />
                    ))
                  : null}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Barra superior: subtítulos · inferior: zooms. El playhead es el tiempo actual.
              </p>
            </div>
          </div>

          <Tabs defaultValue="subtitulos">
            <TabsList className="mb-3 flex h-auto w-full flex-wrap justify-start gap-1">
              <TabsTrigger value="subtitulos">Subtítulos</TabsTrigger>
              <TabsTrigger value="zooms">Zooms</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
            </TabsList>

            <TabsContent value="subtitulos" className="space-y-3">
              <div className="flex justify-end">
                <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={addCaption} disabled={!fileName}>
                  Agregar subtítulo aquí
                </Button>
              </div>
              {captions.length === 0 ? (
                <p className="rounded-3xl border border-dashed border-border p-8 text-sm text-muted-foreground">
                  Subtitula en automático o agrega tomas a mano.
                </p>
              ) : (
                captions.map((cue, index) => (
                  <article key={cue.id} className="space-y-3 rounded-3xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-muted-foreground">Toma {index + 1}</p>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setCaptions((prev) => prev.filter((c) => c.id !== cue.id))}>
                        <Trash2 />
                      </Button>
                    </div>
                    <Textarea
                      value={cue.text}
                      onChange={(e) => updateCaption(cue.id, { text: e.target.value })}
                      className="min-h-16"
                      style={{ fontFamily: SUBTITLE_FONTS[fontId].family, fontWeight: SUBTITLE_FONTS[fontId].weight }}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>Inicio</Label>
                        <Input
                          type="number"
                          step={0.1}
                          value={cue.start}
                          onChange={(e) => updateCaption(cue.id, { start: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Fin</Label>
                        <Input
                          type="number"
                          step={0.1}
                          value={cue.end}
                          onChange={(e) => updateCaption(cue.id, { end: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </article>
                ))
              )}
            </TabsContent>

            <TabsContent value="zooms" className="space-y-3">
              {zooms.length === 0 ? (
                <p className="rounded-3xl border border-dashed border-border p-8 text-sm text-muted-foreground">
                  Marca un zoom in o out en el tiempo actual.
                </p>
              ) : (
                zooms.map((cut) => (
                  <article key={cut.id} className="space-y-3 rounded-3xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{cut.kind === "in" ? "Zoom in" : "Zoom out"}</Badge>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setZooms((prev) => prev.filter((z) => z.id !== cut.id))}>
                        <Trash2 />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="space-y-1">
                        <Label>Inicio</Label>
                        <Input
                          type="number"
                          step={0.1}
                          value={cut.start}
                          onChange={(e) => updateZoom(cut.id, { start: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Duración</Label>
                        <Input
                          type="number"
                          step={0.1}
                          value={cut.duration}
                          onChange={(e) => updateZoom(cut.id, { duration: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Escala</Label>
                        <Input
                          type="number"
                          step={0.05}
                          value={cut.scale}
                          onChange={(e) => updateZoom(cut.id, { scale: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Foco Y</Label>
                        <Input
                          type="number"
                          step={1}
                          value={cut.y}
                          onChange={(e) => updateZoom(cut.id, { y: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </article>
                ))
              )}
            </TabsContent>

            <TabsContent value="feedback">
              {!feedback ? (
                <p className="rounded-3xl border border-dashed border-border p-8 text-sm text-muted-foreground">
                  Genera feedback del corte final para saber qué mejorar en el siguiente video.
                </p>
              ) : (
                <div className="space-y-4 rounded-3xl border border-border bg-card p-5">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Score del corte</p>
                      <p className="font-display text-4xl font-bold">{feedback.score}/100</p>
                    </div>
                    <Badge variant="secondary">{feedback.metrics.hookWindow}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{feedback.summary}</p>
                  <div className="grid gap-3 sm:grid-cols-4">
                    {[
                      ["Duración", `${feedback.metrics.duration}s`],
                      ["Subtítulos", String(feedback.metrics.captions)],
                      ["Zooms", String(feedback.metrics.zooms)],
                      ["Lectura", `${feedback.metrics.readingSpeed} c/s`],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-2xl bg-surface-2 px-3 py-2">
                        <p className="text-[11px] uppercase text-muted-foreground">{label}</p>
                        <p className="font-semibold">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h3 className="font-semibold">Lo que sí funcionó</h3>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {feedback.strengths.map((s) => (
                        <li key={s}>• {s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold">Mejoras</h3>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {feedback.improvements.map((s) => (
                        <li key={s}>• {s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="inline-flex items-center gap-2 font-semibold">
                      <Scan className="h-4 w-4" />
                      Próximos videos
                    </h3>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {feedback.nextVideos.map((s) => (
                        <li key={s}>• {s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </AppShell>
  );
}

async function extractAudioBlob(file: File) {
  try {
    const audio = await decodeVideoAudio(file);
    const offline = new OfflineAudioContext(1, audio.length, audio.sampleRate);
    const source = offline.createBufferSource();
    source.buffer = audio;
    source.connect(offline.destination);
    source.start(0);
    const rendered = await offline.startRendering();
    return audioBufferToWavBlob(rendered);
  } catch {
    return file;
  }
}

function audioBufferToWavBlob(buffer: AudioBuffer) {
  const samples = buffer.getChannelData(0);
  const wav = encodeWav(samples, buffer.sampleRate);
  return new Blob([wav], { type: "audio/wav" });
}

function encodeWav(samples: Float32Array, sampleRate: number) {
  const downsampled = downsample(samples, sampleRate, 16000);
  const pcm = floatTo16BitPCM(downsampled);
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + pcm.byteLength, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 16000, true);
  view.setUint32(28, 16000 * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, pcm.byteLength, true);
  const out = new Uint8Array(44 + pcm.byteLength);
  out.set(new Uint8Array(header), 0);
  out.set(new Uint8Array(pcm), 44);
  return out.buffer;
}

function downsample(input: Float32Array, from: number, to: number) {
  if (from === to) return input;
  const ratio = from / to;
  const length = Math.round(input.length / ratio);
  const output = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(i * ratio);
    output[i] = input[idx] ?? 0;
  }
  return output;
}

function floatTo16BitPCM(input: Float32Array) {
  const buffer = new ArrayBuffer(input.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]!));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

function writeString(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
}
