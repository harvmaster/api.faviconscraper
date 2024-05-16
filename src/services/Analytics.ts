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

export type ScraperHitoryEvent = {
  name: string;
  count?: number;
  icons?: string[];
  errors?: any[];
}

export type ScraperEvent = {
  id: string;
  createdAt: Date;

  ip: string;
  domain: string;
  cache: boolean;
  
  history?: ScraperHitoryEvent[]
  completed?: Date;
  result?: ScraperResult;
  errors?: string[];
  data?: any;
}

class Analytics {
  public fileName = `logs/analytics/analytics-${Date.now()}.json`;
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
      history: [],
    }
    this.events.push(event);
    if (this.events.length%100 == 0) {
      this.saveEvents();
    }
    return event;
  }

  public saveEvents() {
    try {
      fs.writeFileSync(this.fileName, JSON.stringify(this.events, null, 2));
      // fs.writeFileSync(`analytics-${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}.json`, JSON.stringify(this.events, null, 2));
    } catch (err) {
      console.error('Failed to save analytics:', err)
    }
  }

  public createAnalyticsFolder () {
    if (!fs.existsSync('logs/analytics')) {
      fs.mkdirSync('logs/analytics', { recursive: true });
    }
  }
}

const analytics = new Analytics();
analytics.createAnalyticsFolder();

export default analytics;