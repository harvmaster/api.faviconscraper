export const removeDuplicates = <T extends object>(arr: T[], fn: (item: T) => any): T[] => {
  const seen = new Set();
  return arr.filter(item => {
    const key = fn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export default removeDuplicates;