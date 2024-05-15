import { Request, Response } from "express";
import analytics from "../../services/Analytics";

export const getAnalytics = (req: Request, res: Response) => {
  // console.log('analytics.getEvents()', analytics.getEvents())
  res.json(analytics.getEvents());
};

export default getAnalytics;