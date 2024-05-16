export type RawIcon = {
  src: string;
  source: 'desktop' | 'mobile';
}

export type Icon = {
  src: string;
  size: {
    width: number;
    height: number;
  };
  type: string;
  mime: string;
  source: 'desktop' | 'mobile';
}