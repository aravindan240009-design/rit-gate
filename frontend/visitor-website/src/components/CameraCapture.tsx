import React, { useCallback, useEffect, useRef, useState } from 'react';
import { theme } from '../theme';

interface CameraCaptureProps {
  value: string | null;
  onChange: (dataUri: string | null) => void;
}

type Stage = 'idle' | 'opening' | 'live' | 'preview';

const MAX_DIMENSION = 800;
const JPEG_QUALITY = 0.7;

/** Downscale + JPEG-compress a captured frame so the upload payload stays small. */
function captureFrameToDataUri(video: HTMLVideoElement): string {
  const { videoWidth, videoHeight } = video;
  const scale = Math.min(1, MAX_DIMENSION / Math.max(videoWidth, videoHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(videoWidth * scale);
  canvas.height = Math.round(videoHeight * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ value, onChange }) => {
  const [stage, setStage] = useState<Stage>(value ? 'preview' : 'idle');
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => stopStream(), [stopStream]);

  const openCamera = async () => {
    setError('');
    setStage('opening');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStage('live');
    } catch (err: any) {
      setStage('idle');
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setError('Camera access was denied. Please allow camera permission to continue.');
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        setError('No camera was found on this device.');
      } else {
        setError('Could not open the camera. Please try again.');
      }
    }
  };

  const capture = () => {
    if (!videoRef.current) return;
    const dataUri = captureFrameToDataUri(videoRef.current);
    if (!dataUri) {
      setError('Could not capture the photo. Please try again.');
      return;
    }
    stopStream();
    onChange(dataUri);
    setStage('preview');
  };

  const retake = () => {
    onChange(null);
    openCamera();
  };

  const remove = () => {
    onChange(null);
    setStage('idle');
  };

  const c = theme.color;
  const frame: React.CSSProperties = {
    width: '100%',
    maxWidth: 360,
    aspectRatio: '4 / 3',
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    background: c.surfaceSunken,
    border: `1px solid ${c.line}`,
    margin: '0 auto',
    position: 'relative',
  };
  const btn = (primary: boolean): React.CSSProperties => ({
    padding: '11px 20px',
    fontSize: 14,
    fontWeight: 600,
    borderRadius: theme.radius.sm,
    border: primary ? 'none' : `1px solid ${c.line}`,
    background: primary ? c.brandDark : c.surface,
    color: primary ? '#fff' : c.body,
    cursor: 'pointer',
    fontFamily: 'inherit',
  });

  return (
    <div>
      {error && (
        <div role="alert" style={{ background: c.dangerSoft, color: '#991b1b', padding: '10px 14px', borderRadius: theme.radius.sm, fontSize: 13.5, fontWeight: 500, marginBottom: 12, border: '1px solid #fecaca' }}>
          {error}
        </div>
      )}

      {stage === 'idle' && (
        <div style={{ ...frame, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button type="button" onClick={openCamera} style={btn(true)}>
            Open Camera
          </button>
        </div>
      )}

      {stage === 'opening' && (
        <div style={{ ...frame, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.muted, fontSize: 14 }}>
          Requesting camera access…
        </div>
      )}

      <div style={{ ...frame, display: stage === 'live' ? 'block' : 'none' }}>
        <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
      </div>
      {stage === 'live' && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 12 }}>
          <button type="button" onClick={capture} style={btn(true)}>
            Capture Photo
          </button>
        </div>
      )}

      {stage === 'preview' && value && (
        <>
          <div style={frame}>
            <img src={value} alt="Captured visitor" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 12 }}>
            <button type="button" onClick={retake} style={btn(false)}>
              Retake
            </button>
            <button type="button" onClick={remove} style={btn(false)}>
              Remove
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CameraCapture;
