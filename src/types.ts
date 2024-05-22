export type Icon = {
  size: { width: number; height: number };
  type: string;
  mime: string;
  src: string;
  device: 'desktop' | 'mobile';
}

export type RawIcon = {
  src: string;
  device: 'desktop' | 'mobile';
}

export type PipelineEvent = {
  event: string;
  status: 'success' | 'error';
  data: any;
}

export type PipelineAction<T> = {
  event: PipelineEvent;
  data?: T;
}

export type ScrapingDevicesOptions = {
  desktop: boolean;
  mobile: boolean;
}

export type ScrapingOptions = {
  url: string;
  devices: ScrapingDevicesOptions;
}