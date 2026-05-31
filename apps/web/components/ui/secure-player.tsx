'use client';

import { useRef, useEffect, useCallback } from 'react';
import type { SecurePlayerProps } from '@/lib/video/types';

const WATERMARK_INTERVAL = 8000;
const DEVTOOL_CHECK_INTERVAL = 4000;

export default function SecurePlayer({
  videoUrl,
  posterUrl,
  userName,
  userPhone,
  userIp,
  onEnded,
  onError,
}: SecurePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const watermarkPosRef = useRef({ x: 20, y: 40 });
  const watermarkAnimRef = useRef<number>(0);

  const getWatermarkText = useCallback(
    () => `${userName}${userPhone ? ` - ${userPhone}` : ''}${userIp ? ` - ${userIp}` : ''}`,
    [userName, userPhone, userIp],
  );

  const randomizePosition = useCallback((ctx: CanvasRenderingContext2D) => {
    const text = getWatermarkText();
    ctx.font = '16px Arial';
    const metrics = ctx.measureText(text);
    const tw = metrics.width;
    const th = 20;
    const p = 20;
    watermarkPosRef.current = {
      x: p + Math.random() * Math.max(0, ctx.canvas.width - tw - p * 2),
      y: p + th + Math.random() * Math.max(0, ctx.canvas.height - th - p * 2),
    };
  }, [getWatermarkText]);

  const drawWatermark = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = video.clientWidth || video.width || 640;
    const h = video.clientHeight || video.height || 360;
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '16px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.textAlign = 'left';

    const pos = watermarkPosRef.current;
    ctx.fillText(getWatermarkText(), pos.x, pos.y);

    watermarkAnimRef.current = requestAnimationFrame(drawWatermark);
  }, [getWatermarkText]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    randomizePosition(ctx);

    const moveInterval = setInterval(() => {
      const c = canvasRef.current?.getContext('2d');
      if (c) randomizePosition(c);
    }, WATERMARK_INTERVAL);

    watermarkAnimRef.current = requestAnimationFrame(drawWatermark);

    return () => {
      clearInterval(moveInterval);
      cancelAnimationFrame(watermarkAnimRef.current);
    };
  }, [drawWatermark, randomizePosition]);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const observer = new ResizeObserver(() => {
      canvas.width = video.clientWidth || video.width || 640;
      canvas.height = video.clientHeight || video.height || 360;
    });
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  // Anti-piracy event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
        (e.ctrlKey && e.key.toUpperCase() === 'U') ||
        e.key === 'PrintScreen'
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const blockEvent = (e: Event) => { e.preventDefault(); e.stopPropagation(); };

    container.addEventListener('contextmenu', blockEvent);
    container.addEventListener('copy', blockEvent);
    container.addEventListener('cut', blockEvent);
    document.addEventListener('keydown', handleKeyDown);

    const handleVisChange = () => {
      if (document.hidden && videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    };
    const handleBlur = () => {
      if (videoRef.current && !videoRef.current.paused) videoRef.current.pause();
    };
    document.addEventListener('visibilitychange', handleVisChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      container.removeEventListener('contextmenu', blockEvent);
      container.removeEventListener('copy', blockEvent);
      container.removeEventListener('cut', blockEvent);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // DevTools dimension check
  useEffect(() => {
    const check = setInterval(() => {
      const diff =
        window.outerWidth - window.innerWidth > 160 ||
        window.outerHeight - window.innerHeight > 160;
      if (diff && videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    }, DEVTOOL_CHECK_INTERVAL);
    return () => clearInterval(check);
  }, []);

  // Block Picture-in-Picture
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handler = () => {
      if (document.pictureInPictureElement) document.exitPictureInPicture();
    };
    video.addEventListener('enterpictureinpicture', handler);
    return () => video.removeEventListener('enterpictureinpicture', handler);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-lg bg-black"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
      }}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        poster={posterUrl}
        className="w-full"
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        playsInline
        onEnded={onEnded}
        onError={onError}
        controls
      />
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      />
    </div>
  );
}
