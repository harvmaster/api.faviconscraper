import { AxiosResponse } from "axios";

export const getResponseDomain = (response: AxiosResponse) => {
  const url = response.request.res.responseUrl;
  const domain = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n?]+)/img);
  return domain ? domain[0] : response.request.res.responseUrl;
}