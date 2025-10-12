/**
 * This combines two operations:
 *
 * 1. Shallow assign props from `from` into `target`
 * 2. Returns whether mutation occured
 */
export const shallowAssignAndDiff = (
  target: Record<string, unknown>,
  from: Record<string, unknown>,
) => {
  const fromKeys = Object.keys(from);
  const length = fromKeys.length;
  let mutation = false;

  for (let i = 0; i < length; i++) {
    const key = fromKeys[i];
    if (key && target[key] !== from[key]) {
      target[key] = from[key];
      mutation = true;
    }
  }

  return mutation;
};
