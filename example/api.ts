const possibleResults = ['result 1', 'result 2', 'result 3'];

export const API = {
  search: (input: string): string[] => {
    return possibleResults.filter(result => result.match(input));
  },
};
