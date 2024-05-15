import fs from 'fs'

export type ImageInfo = {
  size: {
    width: number;
    height: number;
  };
  type: string;
  mime: string;
  src: string;
}

export type ScraperResult = ImageInfo[]

export type ScraperEvent = {
  id: string;
  createdAt: Date;

  ip: string;
  domain: string;
  cache: boolean;
  
  completed?: Date;
  result?: ScraperResult;
  errors?: string[];
  data?: any;
}

class Analytics {
  public events: ScraperEvent[] = [];

  public track(event: ScraperEvent) {
    this.events.push(event);
  }
  
  public getEvents() {
    return this.events;
  }

  public createEvent(ip: string, domain: string): ScraperEvent {
    const event = {
      id: Math.random().toString(36).substring(7),
      createdAt: new Date(),
      ip,
      domain,
      cache: false,
    }
    this.events.push(event);
    if (this.events.length%250 == 0) {
      this.saveEvents();
    }
    return event;
  }

  public saveEvents() {
    fs.writeFileSync(`analytics-${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}.json`, JSON.stringify(this.events, null, 2));
  }
}

const analytics = new Analytics();

export default analytics;