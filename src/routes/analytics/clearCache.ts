import { Request, Response } from "express";
import cacheManager from "../../services/CacheManager";

export const clearCache = (req: Request, res: Response) => {
  cacheManager.clearCache();
  res.json({ message: "Cache cleared" });
}

export default clearCache