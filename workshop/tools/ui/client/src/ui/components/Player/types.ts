export interface IReplayApi {
  api?: IReplayApi;
  cache?: any;
  pending?: any;

  init?(replayrendererDataSourceApi: IReplayApi): void;
  events<T>(sessionId: string, view: { end: any; start: any }): Promise<T>;
  timeline<T>(sessionId: string): Promise<T>;
}

type onError = (e: any) => void;
export interface IRenderer {
  time: number;
  speed: number;
  visitId?: any;
  init(nativeElement: HTMLElement | null, dataSourceApi: Partial<IReplayApi>, errorCallback: onError): void;
  load(sessionId: string): void;
  play(): void;
  pause(): void;
  reset(): void;
  addListener(eventName: string, callback: (value: number | boolean) => void): void;
  removeListener(eventName: string, callback: (value: number | boolean) => void): void;
  onStall(callback: (unStallNotifier: Promise<null>) => void): void;
  removeStallListeners(): void;
}