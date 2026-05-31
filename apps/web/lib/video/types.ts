export interface SignedVideoUrl {
  url: string;
  expiresAt: number;
  token: string;
}

export interface VideoTokenRequest {
  videoPath: string;
  userIp?: string;
  expiresInSeconds?: number;
}

export interface SecurePlayerProps {
  videoUrl: string;
  posterUrl?: string;
  userName: string;
  userPhone?: string;
  userIp?: string;
  onEnded?: () => void;
  onError?: () => void;
}
