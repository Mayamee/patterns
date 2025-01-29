const makeSpoon = () => {
  console.log("Making spoon");
};

// Может использоваться для идендификации обработчиков
const identityHash = String(makeSpoon);

console.log(identityHash);
