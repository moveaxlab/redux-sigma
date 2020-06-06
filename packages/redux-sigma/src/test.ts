type ReactionMap<T = unknown> = {
  [key in keyof T]: (event: { type: key }) => void;
};

function reaction(e: { type: 'bbb' }) {
  console.log(e.type);
}

const reactions: ReactionMap = {
  test: reaction,
};
