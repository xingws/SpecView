export interface Track {
  id: number;
  name: string;
  buffer: AudioBuffer;
  loaded: boolean;             // false when track is a lazy placeholder
  duration: number;
  nyquist: number;
  sr: number;
  nativeSR: number;
  renderSR: number;
  canvas: HTMLCanvasElement | null;
  wrapper: HTMLElement | null;
  ph: HTMLElement | null;
  laneLabel: HTMLElement | null;
  analysisStrip: HTMLElement | null;
  analyzeBtn: HTMLButtonElement | null;
  rulerEl: HTMLElement | null;
  playing: boolean;
  startTime: number;
  offset: number;
  source: AudioBufferSourceNode | null;
  groupId: number | null;
  el: HTMLElement | null;
  meta?: string | null;         // paired .json raw text (metadata panel)
  metaPanel?: { aside: HTMLElement; body: HTMLElement; head: HTMLElement } | null;
  analysisResults: AnalysisSpan[] | null;
  analysisCollapsed?: boolean;  // when true the analysis tag strip is hidden
  filePath?: string;   // full path, for same-name different-directory grouping
  lazyUri?: string;    // webview-accessible URI for lazy-loaded tracks
  _loading?: boolean;  // prevents concurrent load requests
  _pendingRender?: (() => void) | null;
  // Zoom state
  viewStart: number;   // visible region start (seconds), default 0
  viewEnd: number;     // visible region end (seconds), default duration
  // Cached STFT data for fast zoom/scroll redraws
  specData: Float32Array | null;   // column-major dB values [nFrames * specH]
  specFrames: number;              // number of STFT frames computed
  specHop: number;                 // hop size used for computation
  specH: number;                   // height (rows) of cached data
  specMaxBin: number;              // max frequency bin used
  specGlobalPeak: number;          // global peak dB across entire spectrogram
  // Waveform state
  waveformCanvas: HTMLCanvasElement | null;
  waveformWrapper: HTMLElement | null;
  waveformRow: HTMLElement | null;
  waveformPh: HTMLElement | null;
  // Multichannel expansion: when this track is displayed as per-channel lanes
  // (numberOfChannels in [2..8] and not part of a diff group), chViews holds one
  // entry per channel with its own canvas + spec cache + DOM refs. Empty [] for
  // mono/single-view tracks (the fields above remain the single-view lane).
  isMulti: boolean;
  chViews: ChannelView[];
  // Per-channel listen controls (multichannel tracks only): mutedCh = set of
  // muted channel indices. activeCh = last clicked channel (used only for
  // highlight).
  mutedCh: Set<number>;
  activeCh: number | null;
  // DOM buttons for the label row's M controls, per channel.
  muteBtn: (HTMLButtonElement | null)[];
}

/** One channel lane of a multichannel track. Mirrors the single-view fields so
 *  the render pipeline can treat it interchangeably with a Track. */
export interface ChannelView {
  chIndex: number;
  canvas: HTMLCanvasElement | null;
  wrapper: HTMLElement | null;
  ph: HTMLElement | null;
  waveformCanvas: HTMLCanvasElement | null;
  waveformWrapper: HTMLElement | null;
  waveformRow: HTMLElement | null;
  waveformPh: HTMLElement | null;
  // Cached STFT data for this channel
  specData: Float32Array | null;
  specFrames: number;
  specHop: number;
  specH: number;
  specMaxBin: number;
  specGlobalPeak: number;
  // label row DOM (channel tag + mute control)
  labelEl: HTMLElement | null;
}

export interface Group {
  id: number;
  baseName: string;
  trackIds: number[];
  el: HTMLElement;
  metaPanel?: { aside: HTMLElement; body: HTMLElement; head: HTMLElement } | null;
}

export interface AnalysisSpan {
  label: string;
  labelIdx: number;
  startSec: number;
  endSec: number;
  maxProb: number;
}

export interface DecodedItem {
  name: string;        // basename, used for grouping key
  filePath?: string;   // full path, used for cross-directory display
  buffer: AudioBuffer | null;  // null for lazy tracks not yet loaded
  nativeSR: number;
  suffix?: string;
  lazyUri?: string;    // for lazy tracks that haven't been loaded yet
  meta?: string | null; // paired .json raw text
}

export interface GroupResult {
  baseName: string;
  items: DecodedItem[];
}
