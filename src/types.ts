export type Icon = {
  size: { width: number; height: number };
  type: string;
  mime: string;
  src: string;
}

export type RawIcon = {
  src: string;
  source: 'desktop' | 'mobile';
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