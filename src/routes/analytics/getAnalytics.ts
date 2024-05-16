import { Request, Response } from "express";
import analytics from "../../services/Analytics";
import config from '../../../config'

export const getAnalytics = (req: Request, res: Response) => {
  if (config.admin.password != req.query.password) return res.status(401).json({ message: "Unauthorized" });
  res.json(analytics.getEvents());
};

export default getAnalytics;