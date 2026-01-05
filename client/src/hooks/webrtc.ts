export type IceCallback = (candidate: RTCIceCandidate) => void;

export class WebRtcPeer {
  private pc: RTCPeerConnection;
  private localStream: MediaStream | null = null;
  private onIceCandidate?: IceCallback;

  constructor(onIceCandidate?: IceCallback) {
    this.onIceCandidate = onIceCandidate;

    this.pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    // ICE
    this.pc.onicecandidate = (event) => {
      if (event.candidate && this.onIceCandidate) {
        this.onIceCandidate(event.candidate);
      }
    };

    // Remote track
    this.pc.ontrack = (event) => {
      if (this.onRemoteStream) {
        this.onRemoteStream(event.streams[0]);
      }
    };
  }

  /* ---------- Media ---------- */

  async initMedia(): Promise<MediaStream> {
    this.localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    this.localStream
      .getTracks()
      .forEach((track) => this.pc.addTrack(track, this.localStream!));

    return this.localStream;
  }

  /* ---------- Offer / Answer ---------- */

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    return offer;
  }

  async handleOffer(
    offer: RTCSessionDescriptionInit
  ): Promise<RTCSessionDescriptionInit> {
    await this.pc.setRemoteDescription(offer);

    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);

    return answer;
  }

  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (this.pc.signalingState !== "have-local-offer") {
      console.warn("Skipping answer, wrong state:", this.pc.signalingState);
      return;
    }

    await this.pc.setRemoteDescription(answer);
  }

  /* ---------- ICE ---------- */

  async handleIce(candidate: RTCIceCandidateInit): Promise<void> {
    await this.pc.addIceCandidate(candidate);
  }

  /* ---------- Remote Stream ---------- */

  private onRemoteStream?: (stream: MediaStream) => void;

  setOnRemoteStream(cb: (stream: MediaStream) => void) {
    this.onRemoteStream = cb;
  }

  /* ---------- Cleanup ---------- */

  close() {
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.pc.close();
  }
}
