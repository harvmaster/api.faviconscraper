import { Request, Response } from "express";
import cacheManager from "../../services/CacheManager";
import config from '../../../config'

export const clearCache = (req: Request, res: Response) => {
  if (config.admin.password != req.query.password) return res.status(401).json({ message: "Unauthorized" });

  cacheManager.clearCache();
  res.json({ message: "Cache cleared" });
}

export default clearCache