import { Request, Response } from "express";

import cacheManager from "../../services/CacheManager";

export const getCache = (req: Request, res: Response) => {
  res.json(cacheManager.getCache());
};

export default getCache;